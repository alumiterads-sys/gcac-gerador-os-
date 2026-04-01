-- Adicionar suporte a pagamentos parciais e múltiplos métodos na tabela de Ordens de Serviço
ALTER TABLE public.ordens 
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS historico_pagamentos JSONB DEFAULT '[]';

-- Migração de dados legados:
-- Garante que ordens marcadas como 'Pago' tenham o valor_pago igual ao valor total
UPDATE public.ordens 
SET valor_pago = valor 
WHERE status = 'Pago' AND valor > 0;
