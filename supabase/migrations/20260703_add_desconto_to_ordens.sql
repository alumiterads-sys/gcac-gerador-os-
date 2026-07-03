-- ==========================================================
-- MIGRAÇÃO: ADICIONAR COLUNA DESCONTO NA TABELA ORDENS
-- ==========================================================

ALTER TABLE public.ordens 
ADD COLUMN IF NOT EXISTS desconto NUMERIC(15, 2) DEFAULT 0;

-- Adiciona comentário explicativo à coluna
COMMENT ON COLUMN public.ordens.desconto IS 'Valor do desconto aplicado sobre o total da Ordem de Serviço';
