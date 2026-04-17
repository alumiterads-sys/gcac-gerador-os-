-- 14. Adição de campo de contato nos recibos
ALTER TABLE public.recibos 
ADD COLUMN IF NOT EXISTS cliente_contato TEXT;

COMMENT ON COLUMN public.recibos.cliente_contato IS 'Telefone de contato do cliente para envio de notificações';
