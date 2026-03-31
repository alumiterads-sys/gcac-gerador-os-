-- Adiciona o suporte a multidespachante e controle de e-mail PF
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS despachante TEXT DEFAULT 'GCAC / Guilherme';
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS enviado_pf BOOLEAN DEFAULT FALSE;
