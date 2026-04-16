-- 13. Adição de campos de Auditoria (Quem criou e quem concluiu)

-- Tabela de Ordens
ALTER TABLE public.ordens 
ADD COLUMN IF NOT EXISTS criado_por_nome TEXT,
ADD COLUMN IF NOT EXISTS concluido_por_nome TEXT,
ADD COLUMN IF NOT EXISTS usuario_id TEXT;

-- Tabela de Orçamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS criado_por_nome TEXT,
ADD COLUMN IF NOT EXISTS usuario_id TEXT;

-- Tabela de Recibos
ALTER TABLE public.recibos 
ADD COLUMN IF NOT EXISTS criado_por_nome TEXT,
ADD COLUMN IF NOT EXISTS usuario_id TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.ordens.criado_por_nome IS 'Nome do colaborador que emitiu a OS';
COMMENT ON COLUMN public.ordens.concluido_por_nome IS 'Nome do colaborador que marcou a OS como paga/concluída';
COMMENT ON COLUMN public.orcamentos.criado_por_nome IS 'Nome do colaborador que emitiu o orçamento';
COMMENT ON COLUMN public.recibos.criado_por_nome IS 'Nome do colaborador que emitiu o recibo';
