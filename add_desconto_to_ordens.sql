-- Script para adicionar a coluna desconto na tabela ordens no Supabase
-- Copie e cole este código no "SQL Editor" do seu painel do Supabase e clique em "Run"

ALTER TABLE public.ordens 
ADD COLUMN IF NOT EXISTS desconto NUMERIC(15, 2) DEFAULT 0;

COMMENT ON COLUMN public.ordens.desconto IS 'Valor do desconto aplicado sobre o total da Ordem de Serviço';
