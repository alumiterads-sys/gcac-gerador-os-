-- Criar Tabela de Pareamento de Uploads via Celular
CREATE TABLE IF NOT EXISTS public.upload_sessoes (
    id UUID PRIMARY KEY,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'expirado')),
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Desabilitar RLS pois o upload via celular é feito em rota pública e anônima
ALTER TABLE public.upload_sessoes DISABLE ROW LEVEL SECURITY;
