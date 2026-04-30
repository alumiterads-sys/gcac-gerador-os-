-- Adiciona o controle explícito de GRU para os serviços
ALTER TABLE servicos_config 
ADD COLUMN exige_gru BOOLEAN DEFAULT true;

-- Serviços que sabemos que normalmente não tem GRU podem ser atualizados (opcional, despachante pode ajustar)
UPDATE servicos_config 
SET exige_gru = false 
WHERE nome ILIKE '%IBAMA%' 
   OR nome ILIKE '%Plastificação%' 
   OR categoria = 'Laudo';
