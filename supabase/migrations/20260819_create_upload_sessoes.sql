-- Criar Tabela de Pareamento de Uploads via Celular
CREATE TABLE IF NOT EXISTS public.upload_sessoes (
    id UUID PRIMARY KEY,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'expirado')),
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS e criar política pública para permitir fluxo desktop <-> mobile anônimo
ALTER TABLE public.upload_sessoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS upload_sessoes_public_policy ON public.upload_sessoes;
CREATE POLICY upload_sessoes_public_policy ON public.upload_sessoes
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
