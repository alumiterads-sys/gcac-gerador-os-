-- Tabela para Controle de Acesso e Whitelist de Usuários
CREATE TABLE IF NOT EXISTS public.usuarios_autorizados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cpf TEXT,
    contato TEXT,
    role TEXT DEFAULT 'colaborador', -- 'admin' ou 'colaborador'
    ativo BOOLEAN DEFAULT TRUE,
    permissoes JSONB DEFAULT '["ordens"]'::jsonb, -- Lista de slugs de módulos permitidos
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.usuarios_autorizados ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "usuarios_autorizados_admin_all" ON public.usuarios_autorizados;

-- 1. Permitir LEITURA para qualquer usuário autenticado
-- Necessário para que o sistema consiga verificar quem pode logar
CREATE POLICY "usuarios_autorizados_select" ON public.usuarios_autorizados
    FOR SELECT TO authenticated
    USING (true);

-- 2. Permitir INSERÇÃO/EDIÇÃO/EXCLUSÃO apenas para Administradores
-- Usamos uma checagem que evita recursão infinita
CREATE POLICY "usuarios_autorizados_admin_modify" ON public.usuarios_autorizados
    FOR ALL TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'gui.gomesassis@gmail.com' -- Master Admin sempre pode
        OR 
        EXISTS (
            SELECT 1 FROM public.usuarios_autorizados 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND ativo = TRUE
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' = 'gui.gomesassis@gmail.com'
        OR 
        EXISTS (
            SELECT 1 FROM public.usuarios_autorizados 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND ativo = TRUE
        )
    );

-- Trigger para atualizar o campo atualizado_em
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_autorizados_updated_at
    BEFORE UPDATE ON public.usuarios_autorizados
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Inserir o Administrador Mestre inicial (Se não existir)
INSERT INTO public.usuarios_autorizados (nome, email, role, ativo, permissoes)
VALUES ('Guilherme Gomes', 'gui.gomesassis@gmail.com', 'admin', TRUE, '["painel", "rotina", "agenda", "financeiro", "orcamentos", "ordens", "recibos", "agendamentos", "clientes", "config"]')
ON CONFLICT (email) DO NOTHING;

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios_autorizados;
