-- Script para criação da tabela de Orçamentos
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL NOT NULL,
  
  -- Dados do Cliente
  nome_cliente TEXT NOT NULL,
  contato TEXT NOT NULL,
  cpf TEXT,
  
  -- Serviços e Valores
  servicos JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { id, nome, detalhes, valor }
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Controle Padrão
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Aprovado', 'Recusado'
  
  -- Controle de Acesso e Metadados
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (O usuário só pode ver/modificar seus próprios orçamentos)
CREATE POLICY "Usuários podem ver seus próprios orçamentos" 
ON public.orcamentos FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir seus próprios orçamentos" 
ON public.orcamentos FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar seus próprios orçamentos" 
ON public.orcamentos FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar seus próprios orçamentos" 
ON public.orcamentos FOR DELETE 
USING (auth.uid() = usuario_id);

-- Trigger para atualizar of campo atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_orcamentos_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orcamentos_atualizado_em_trigger
BEFORE UPDATE ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION update_orcamentos_atualizado_em();
