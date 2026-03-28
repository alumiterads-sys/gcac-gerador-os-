-- Script para criação da tabela de recibos no Supabase
-- Copie e cole este código no "SQL Editor" do seu painel do Supabase e clique em "Run"

CREATE TABLE IF NOT EXISTS public.recibos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero BIGSERIAL NOT NULL,
    cliente_nome TEXT NOT NULL,
    cliente_cpf TEXT NOT NULL,
    servicos JSONB DEFAULT '[]'::jsonb,
    valor_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ordem_id UUID REFERENCES public.ordens(id) ON DELETE SET NULL,
    observacoes TEXT,
    emitente_nome TEXT NOT NULL,
    emitente_cnpj TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) se desejar
-- ALTER TABLE public.recibos ENABLE ROW LEVEL SECURITY;

-- Política simples para permitir tudo para usuários autenticados (ajuste conforme necessário)
-- CREATE POLICY "Permitir tudo para autenticados" ON public.recibos
-- FOR ALL USING (auth.role() = 'authenticated');

-- Comentário para o usuário:
-- Após executar este script, o sistema já será capaz de salvar e listar os recibos.
