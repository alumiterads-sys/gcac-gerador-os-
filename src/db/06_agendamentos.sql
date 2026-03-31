-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo TEXT NOT NULL CHECK (tipo IN ('Psicológico', 'Tiro')),
    cliente_nome TEXT NOT NULL,
    cliente_cpf TEXT NOT NULL,
    cliente_contato TEXT NOT NULL,
    cliente_endereco TEXT NOT NULL,
    arma TEXT NOT NULL,
    data DATE NOT NULL,
    horario TEXT NOT NULL,
    local TEXT NOT NULL,
    profissional TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data_psicologico DATE,
    horario_psicologico TEXT,
    confirmado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Política de acesso total para usuários autenticados
CREATE POLICY "Acesso total para usuários autenticados" ON public.agendamentos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON public.agendamentos
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
