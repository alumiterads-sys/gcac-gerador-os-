-- ==========================================================
-- SCRIPT DE LIMPEZA E CONFIGURAÇÃO TOTAL DE ACESSOS
-- ==========================================================

-- 1. Garantir que a tabela existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.usuarios_autorizados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cpf TEXT,
    contato TEXT,
    role TEXT DEFAULT 'colaborador',
    ativo BOOLEAN DEFAULT TRUE,
    permissoes JSONB DEFAULT '["ordens"]'::jsonb,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ativar RLS (Row Level Security)
ALTER TABLE public.usuarios_autorizados ENABLE ROW LEVEL SECURITY;

-- 3. LIMPEZA TOTAL DE POLÍTICAS ANTIGAS (para evitar conflitos)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'usuarios_autorizados')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios_autorizados', pol.policyname);
    END LOOP;
END $$;

-- 4. CRIAÇÃO DE NOVAS POLÍTICAS ROBUSTAS

-- REGRA 1: Permite que QUALQUER usuário logado LEIA a lista.
-- (Essencial para o sistema carregar a whitelist e mostrar a lista na tela)
CREATE POLICY "usuarios_autorizados_read_v2" 
ON public.usuarios_autorizados FOR SELECT 
TO authenticated 
USING (true);

-- REGRA 2: Permite que o ADMINISTRADOR MESTRE faça QUALQUER coisa.
-- (Insert, Update, Delete)
CREATE POLICY "usuarios_autorizados_master_v2" 
ON public.usuarios_autorizados FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'email' = 'gui.gomesassis@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'gui.gomesassis@gmail.com');

-- REGRA 3: Permite que outros ADMINS também gerenciem usuários.
-- (Nota: Esta regra pode causar recursão se não houver a Regra 1 acima)
CREATE POLICY "usuarios_autorizados_admin_v2" 
ON public.usuarios_autorizados FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_autorizados 
        WHERE email = auth.jwt() ->> 'email' AND role = 'admin' AND ativo = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.usuarios_autorizados 
        WHERE email = auth.jwt() ->> 'email' AND role = 'admin' AND ativo = TRUE
    )
);

-- 5. Garantir que o Administrador Mestre está na tabela
INSERT INTO public.usuarios_autorizados (nome, email, role, ativo, permissoes)
VALUES (
    'Guilherme Gomes', 
    'gui.gomesassis@gmail.com', 
    'admin', 
    TRUE, 
    '["painel", "rotina", "agenda", "financeiro", "orcamentos", "ordens", "recibos", "agendamentos", "clientes", "config"]'
)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', ativo = TRUE; -- Garante que ele é admin se já existir

-- 6. Configurações de sistema (Trigger e Realtime)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_autorizados_updated_at ON public.usuarios_autorizados;
CREATE TRIGGER update_usuarios_autorizados_updated_at
    BEFORE UPDATE ON public.usuarios_autorizados
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'usuarios_autorizados'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios_autorizados;
    END IF;
END $$;
