-- Tabela de Carteira Digital do Cliente (Créditos e Haver)
CREATE TABLE IF NOT EXISTS creditos_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor NUMERIC(10,2) NOT NULL,
    descricao TEXT NOT NULL,
    origem_id UUID, -- Pode ser o ID da OS, Recibo, etc.
    criado_por_nome TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE creditos_cliente ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Acesso total creditos_cliente para autenticados" ON creditos_cliente;
CREATE POLICY "Acesso total creditos_cliente para autenticados" ON creditos_cliente FOR ALL USING (auth.role() = 'authenticated');
