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
-- Apenas Administradores podem gerenciar a tabela de usuários
-- Outros usuários podem ver apenas seu próprio registro (opcional, mas seguro)
CREATE POLICY "usuarios_autorizados_admin_all" ON public.usuarios_autorizados
    FOR ALL TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'gui.gomesassis@gmail.com' -- Master Admin
        OR 
        EXISTS (
            SELECT 1 FROM public.usuarios_autorizados 
            WHERE email = auth.jwt() ->> 'email' AND role = 'admin' AND ativo = TRUE
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
