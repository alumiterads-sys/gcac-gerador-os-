-- Adicionar campos de CR à tabela de clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS numero_cr TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS vencimento_cr DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS vencimento_cr_ibama DATE;

-- Tabela de Armas
CREATE TABLE IF NOT EXISTS armas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    modelo TEXT NOT NULL,
    calibre TEXT NOT NULL,
    fabricante TEXT NOT NULL,
    numero_serie TEXT NOT NULL,
    numero_sigma TEXT NOT NULL,
    acervo TEXT NOT NULL, -- Caça, Tiro Desportivo, Coleção
    vencimento_craf DATE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Guias de Tráfego
CREATE TABLE IF NOT EXISTS guias_trafego (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arma_id UUID REFERENCES armas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- Treino, Caça, Manutenção, Transferência, etc.
    vencimento DATE NOT NULL,
    destino TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Autorizações de Manejo (IBAMA)
CREATE TABLE IF NOT EXISTS autorizacoes_manejo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    numero_car TEXT NOT NULL,
    nome_fazenda TEXT NOT NULL,
    nome_proprietario TEXT NOT NULL,
    cidade TEXT NOT NULL,
    vencimento DATE NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Seguindo o padrão do projeto)
ALTER TABLE armas ENABLE ROW LEVEL SECURITY;
ALTER TABLE guias_trafego ENABLE ROW LEVEL SECURITY;
ALTER TABLE autorizacoes_manejo ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Acesso total para usuários autenticados)
CREATE POLICY "Acesso total armas para autenticados" ON armas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total guias para autenticados" ON guias_trafego FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total manejo para autenticados" ON autorizacoes_manejo FOR ALL USING (auth.role() = 'authenticated');
