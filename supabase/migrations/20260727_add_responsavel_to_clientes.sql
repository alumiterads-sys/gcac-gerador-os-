-- Adicionar campos de controle de responsável e silenciamento de alertas nas tabelas de clientes e vínculos

-- 1. Tabela de Clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES usuarios_autorizados(id) ON DELETE SET NULL;

ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS ignorar_mensagens_alertas BOOLEAN DEFAULT FALSE;

-- 2. Tabela de Vínculos Despachante-CAC
ALTER TABLE vinculos_despachante_cac 
ADD COLUMN IF NOT EXISTS ignorar_mensagens_alertas BOOLEAN DEFAULT FALSE;

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN clientes.responsavel_id IS 'ID do colaborador responsável pelo atendimento do cliente';
COMMENT ON COLUMN clientes.ignorar_mensagens_alertas IS 'Se TRUE, oculta ou bloqueia botões de envio de mensagens de alerta (WhatsApp/SMS) para este cliente';
COMMENT ON COLUMN vinculos_despachante_cac.ignorar_mensagens_alertas IS 'Se TRUE, silencia/bloqueia mensagens automáticas de alertas para todos os clientes deste acervo vinculado';
