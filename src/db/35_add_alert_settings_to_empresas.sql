-- Migration: Adicionar colunas de configuração de prazos de alertas de vencimentos na tabela de empresas
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS alerta_cr INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS alerta_craf INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS alerta_gt INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS alerta_manejo INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS alerta_ibama_cr INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS ocultar_ibama BOOLEAN DEFAULT FALSE;
