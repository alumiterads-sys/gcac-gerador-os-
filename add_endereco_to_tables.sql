-- Script para adicionar o campo de endereço nas tabelas do sistema
-- Execute este script no SQL Editor do Supabase

-- Tabela de Clientes
ALTER TABLE IF EXISTS public.clientes 
ADD COLUMN IF NOT EXISTS endereco TEXT DEFAULT '';

-- Tabela de Ordens de Serviço
ALTER TABLE IF EXISTS public.ordens 
ADD COLUMN IF NOT EXISTS endereco TEXT DEFAULT '';

-- Tabela de Orçamentos
ALTER TABLE IF EXISTS public.orcamentos 
ADD COLUMN IF NOT EXISTS endereco TEXT DEFAULT '';

-- Tabela de Agendamentos (caso tenha sido criada sem o campo)
ALTER TABLE IF EXISTS public.agendamentos 
ADD COLUMN IF NOT EXISTS cliente_endereco TEXT DEFAULT '';

-- Comentários para documentação
COMMENT ON COLUMN public.clientes.endereco IS 'Endereço residencial ou comercial do cliente';
COMMENT ON COLUMN public.ordens.endereco IS 'Endereço do cliente no momento da abertura da OS';
COMMENT ON COLUMN public.orcamentos.endereco IS 'Endereço do cliente no momento do orçamento';
COMMENT ON COLUMN public.agendamentos.cliente_endereco IS 'Endereço do cliente para realização do agendamento';
