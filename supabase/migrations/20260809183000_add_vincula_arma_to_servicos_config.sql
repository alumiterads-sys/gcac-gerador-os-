-- Adiciona a coluna vincula_arma à tabela servicos_config
ALTER TABLE servicos_config ADD COLUMN IF NOT EXISTS vincula_arma BOOLEAN DEFAULT FALSE;
