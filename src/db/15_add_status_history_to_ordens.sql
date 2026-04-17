-- 15. Adição de histórico de status nas ordens de serviço
ALTER TABLE public.ordens 
ADD COLUMN IF NOT EXISTS historico_status JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.ordens.historico_status IS 'Lista de eventos e mudanças de status da OS (Timeline)';
