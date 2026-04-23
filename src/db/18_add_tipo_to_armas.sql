-- Adicionar coluna 'tipo' na tabela de armas
ALTER TABLE armas ADD COLUMN IF NOT EXISTS tipo TEXT;
