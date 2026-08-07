-- ==========================================================
-- MIGRAÇÃO: TABELA DE SOLICITAÇÕES DE SERVIÇO DO SITE
-- ==========================================================

-- 1. Criar a tabela de solicitações
CREATE TABLE IF NOT EXISTS public.solicitacoes_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL,
    email TEXT NOT NULL,
    contato TEXT NOT NULL,
    servicos_selecionados TEXT[] NOT NULL,
    detalhes TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'finalizado', 'cancelado')),
    empresa_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Habilitar Realtime para esta tabela
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'solicitacoes_servico'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes_servico;
    END IF;
END $$;

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.solicitacoes_servico ENABLE ROW LEVEL SECURITY;

-- 4. Limpar políticas antigas se existirem
DROP POLICY IF EXISTS solicitacoes_servico_insert_policy ON public.solicitacoes_servico;
DROP POLICY IF EXISTS solicitacoes_servico_select_policy ON public.solicitacoes_servico;
DROP POLICY IF EXISTS solicitacoes_servico_all_policy ON public.solicitacoes_servico;

-- 5. Criar Políticas de RLS
-- Qualquer visitante pode enviar uma solicitação (público)
CREATE POLICY solicitacoes_servico_insert_policy ON public.solicitacoes_servico
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Leitura permitida para o despachante dono da empresa ou Master Admin
CREATE POLICY solicitacoes_servico_select_policy ON public.solicitacoes_servico
  FOR SELECT TO authenticated
  USING (
    empresa_id = public.get_auth_empresa_id()
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  );

-- Gerenciamento completo pelo despachante dono ou Master Admin
CREATE POLICY solicitacoes_servico_all_policy ON public.solicitacoes_servico
  FOR ALL TO authenticated
  USING (
    empresa_id = public.get_auth_empresa_id()
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  )
  WITH CHECK (
    empresa_id = public.get_auth_empresa_id()
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  );

-- 6. Trigger para gerar notificações automaticamente no painel
CREATE OR REPLACE FUNCTION public.fn_notificar_nova_solicitacao()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notificacoes_sistema (titulo, mensagem, tipo, link, empresa_id)
    VALUES (
        'Novo Chamado do Site',
        'O cliente ' || NEW.nome || ' solicitou serviços de despachante pelo site.',
        'alerta',
        '/portal-admin?tab=chamados',
        NEW.empresa_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notificar_nova_solicitacao ON public.solicitacoes_servico;
CREATE TRIGGER trigger_notificar_nova_solicitacao
AFTER INSERT ON public.solicitacoes_servico
FOR EACH ROW
EXECUTE FUNCTION public.fn_notificar_nova_solicitacao();
