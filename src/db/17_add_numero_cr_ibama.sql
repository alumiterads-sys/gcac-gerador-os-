-- Adicionar campo para Número do CR IBAMA na tabela de clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS numero_cr_ibama TEXT;
