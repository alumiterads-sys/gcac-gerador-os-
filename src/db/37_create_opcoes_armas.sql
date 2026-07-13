-- ==========================================================
-- MIGRAÇÃO: CRIAR TABELA OPCOES_ARMAS
-- ==========================================================
-- Tabela para gerenciar modelos, calibres e fabricantes pré-cadastrados por empresa.

CREATE TABLE IF NOT EXISTS public.opcoes_armas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('modelo', 'calibre', 'fabricante')),
    nome TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (empresa_id, tipo, nome)
);

-- Desativar RLS para permitir escrita/leitura pelo frontend via chave anônima
ALTER TABLE public.opcoes_armas DISABLE ROW LEVEL SECURITY;
