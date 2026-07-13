-- ==========================================================
-- MIGRAÇÃO: ADICIONAR TIPO CLUBE À TABELA OPCOES_ARMAS
-- ==========================================================
-- Altera a restrição check para aceitar o tipo 'clube' (Clube de Tiro de Destino).

ALTER TABLE public.opcoes_armas DROP CONSTRAINT IF EXISTS opcoes_armas_tipo_check;
ALTER TABLE public.opcoes_armas ADD CONSTRAINT opcoes_armas_tipo_check CHECK (tipo IN ('modelo', 'calibre', 'fabricante', 'clube'));
