-- Adiciona colunas para atividades apostiladas no CR e nível de atirador
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS cr_tiro_desportivo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cr_caca BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cr_colecionamento BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS atirador_nivel INTEGER DEFAULT NULL;
