-- 1. Tabela de Perfis (Gestão de Instrutores)
CREATE TABLE IF NOT EXISTS public.perfis (
    id TEXT PRIMARY KEY, -- Google sub (ID único do Google)
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cpf TEXT,
    contato TEXT,
    role TEXT DEFAULT 'instrutor', -- 'admin' ou 'instrutor'
    ativo BOOLEAN DEFAULT TRUE,
    status_pagamento TEXT DEFAULT 'em_dia', -- 'em_dia', 'pendente', 'atrasado'
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alterações na tabela de Agendamentos
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS usuario_id TEXT;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente'; -- 'pendente', 'realizado'

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario_id ON public.agendamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);

-- 4. Inserção de Usuários Iniciais (SEEDS)
-- IMPORTANTE: O campo 'id' será atualizado automaticamente pelo sistema no primeiro login.
INSERT INTO public.perfis (id, nome, email, role, ativo)
VALUES ('admin_seed', 'Administrador', 'gui.gomesassis@gmail.com', 'admin', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.perfis (id, nome, email, role, ativo)
VALUES ('keoma_seed', 'Keoma Marques', 'keomamarques@gmail.com', 'instrutor', true)
ON CONFLICT (email) DO NOTHING;

-- 5. Comentários
COMMENT ON COLUMN public.perfis.ativo IS 'Controla se o instrutor pode logar no sistema';
COMMENT ON COLUMN public.agendamentos.status IS 'Define se o laudo está pendente ou já foi realizado (Histórico)';
