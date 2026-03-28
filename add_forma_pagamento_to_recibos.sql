-- Adiciona a coluna forma_pagamento à tabela recibos
ALTER TABLE public.recibos
ADD COLUMN forma_pagamento TEXT DEFAULT 'PIX';

-- Comentário para identificar a coluna
COMMENT ON COLUMN public.recibos.forma_pagamento IS 'Forma de pagamento utilizada (PIX, Dinheiro, Cartão, etc)';
