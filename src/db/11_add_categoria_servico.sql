-- Adicionar coluna categoria na tabela de configuração de serviços
ALTER TABLE public.servicos_config 
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Honorário';

-- Garantir que todos os serviços existentes tenham a categoria padrão
UPDATE public.servicos_config 
SET categoria = 'Honorário' 
WHERE categoria IS NULL;
