-- Script para adicionar o campo de observações na tabela de clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS observacoes TEXT DEFAULT '';
