-- ==========================================================
-- MIGRAÇÃO: HABILITAR RLS E POLÍTICAS DE MULTI-TENANCY SEGURAS
-- ==========================================================

-- 1. Criar a função get_auth_empresa_id() para buscar a empresa do usuário logado de forma segura
CREATE OR REPLACE FUNCTION public.get_auth_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id 
  FROM public.usuarios_autorizados 
  WHERE email = LOWER(auth.jwt() ->> 'email') 
  AND ativo = TRUE 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Habilitar RLS em todas as tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_autorizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guias_trafego ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_manejo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recibos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos_despachante_cac ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_pagamentos_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_declaracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites_cac ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_pre_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudo_site ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opcoes_armas ENABLE ROW LEVEL SECURITY;

-- 3. Limpar políticas antigas se existirem para evitar conflitos
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN (
            'empresas', 'usuarios_autorizados', 'clientes', 'armas', 'guias_trafego', 
            'autorizacoes_manejo', 'ordens', 'orcamentos', 'recibos', 'agendamentos', 
            'lembretes', 'despesas', 'creditos_cliente', 'servicos_config', 
            'notificacoes_sistema', 'vinculos_despachante_cac', 'push_subscriptions', 
            'historico_pagamentos_empresa', 'modelos_declaracao', 'convites_cac', 
            'leads_pre_cadastro', 'conteudo_site', 'opcoes_armas'
        )
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4. POLÍTICAS DA TABELA `empresas`
CREATE POLICY "empresas_select_policy" ON public.empresas
  FOR SELECT TO authenticated
  USING (id = public.get_auth_empresa_id() OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com');

CREATE POLICY "empresas_insert_policy" ON public.empresas
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Permite criação de empresas (ex. criação automática de CAC Individual)

CREATE POLICY "empresas_update_policy" ON public.empresas
  FOR UPDATE TO authenticated
  USING (id = public.get_auth_empresa_id() OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com')
  WITH CHECK (id = public.get_auth_empresa_id() OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com');

CREATE POLICY "empresas_delete_policy" ON public.empresas
  FOR DELETE TO authenticated
  USING (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com');

-- 5. POLÍTICAS DA TABELA `usuarios_autorizados`
CREATE POLICY "usuarios_autorizados_select_policy" ON public.usuarios_autorizados
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_auth_empresa_id() OR email = LOWER(auth.jwt() ->> 'email') OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com');

CREATE POLICY "usuarios_autorizados_insert_policy" ON public.usuarios_autorizados
  FOR INSERT TO authenticated
  WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' 
    OR email = LOWER(auth.jwt() ->> 'email') 
    OR (empresa_id = public.get_auth_empresa_id() AND EXISTS (
        SELECT 1 FROM public.usuarios_autorizados 
        WHERE email = LOWER(auth.jwt() ->> 'email') AND role = 'admin' AND ativo = TRUE
    ))
  );

CREATE POLICY "usuarios_autorizados_update_policy" ON public.usuarios_autorizados
  FOR UPDATE TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' 
    OR (empresa_id = public.get_auth_empresa_id() AND EXISTS (
        SELECT 1 FROM public.usuarios_autorizados 
        WHERE email = LOWER(auth.jwt() ->> 'email') AND role = 'admin' AND ativo = TRUE
    ))
  )
  WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' 
    OR (empresa_id = public.get_auth_empresa_id() AND EXISTS (
        SELECT 1 FROM public.usuarios_autorizados 
        WHERE email = LOWER(auth.jwt() ->> 'email') AND role = 'admin' AND ativo = TRUE
    ))
  );

CREATE POLICY "usuarios_autorizados_delete_policy" ON public.usuarios_autorizados
  FOR DELETE TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' 
    OR (empresa_id = public.get_auth_empresa_id() AND EXISTS (
        SELECT 1 FROM public.usuarios_autorizados 
        WHERE email = LOWER(auth.jwt() ->> 'email') AND role = 'admin' AND ativo = TRUE
    ))
  );

-- 6. POLÍTICAS GENÉRICAS PARA TABELAS COM `empresa_id`
-- Aplica-se a: clientes, armas, guias_trafego, autorizacoes_manejo, ordens, orcamentos, recibos, agendamentos, lembretes, despesas, creditos_cliente, servicos_config, notificacoes_sistema, push_subscriptions, historico_pagamentos_empresa, modelos_declaracao, opcoes_armas
DO $$
DECLARE
    tab text;
    tabelas_empresa text[] := ARRAY[
        'clientes', 'armas', 'guias_trafego', 'autorizacoes_manejo', 'ordens', 
        'orcamentos', 'recibos', 'agendamentos', 'lembretes', 'despesas', 
        'creditos_cliente', 'servicos_config', 'notificacoes_sistema', 
        'push_subscriptions', 'historico_pagamentos_empresa', 'modelos_declaracao', 
        'opcoes_armas'
    ];
BEGIN
    FOREACH tab IN ARRAY tabelas_empresa
    LOOP
        EXECUTE format('
            CREATE POLICY %I_policy ON public.%I
            FOR ALL TO authenticated
            USING (empresa_id = public.get_auth_empresa_id() OR LOWER(auth.jwt() ->> ''email'') = ''gui.gomesassis@gmail.com'')
            WITH CHECK (empresa_id = public.get_auth_empresa_id() OR LOWER(auth.jwt() ->> ''email'') = ''gui.gomesassis@gmail.com'')
        ', tab, tab);
    END LOOP;
END $$;

-- 7. POLÍTICAS DA TABELA `vinculos_despachante_cac`
CREATE POLICY "vinculos_despachante_cac_policy" ON public.vinculos_despachante_cac
  FOR ALL TO authenticated
  USING (
    despachante_empresa_id = public.get_auth_empresa_id() 
    OR cac_empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  )
  WITH CHECK (
    despachante_empresa_id = public.get_auth_empresa_id() 
    OR cac_empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  );

-- 8. POLÍTICAS DA TABELA `convites_cac`
CREATE POLICY "convites_cac_policy" ON public.convites_cac
  FOR ALL TO authenticated
  USING (
    despachante_empresa_id = public.get_auth_empresa_id() 
    OR cac_empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  )
  WITH CHECK (
    despachante_empresa_id = public.get_auth_empresa_id() 
    OR cac_empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  );

-- 9. RPC PARA PERMITIR CONSULTA PÚBLICA DE CONVITES DE FORMA SEGURA
CREATE OR REPLACE FUNCTION public.get_convite_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  despachante_nome TEXT,
  cliente_nome TEXT,
  status TEXT,
  expira_em TIMESTAMPTZ,
  cliente_cpf TEXT,
  cliente_id UUID,
  despachante_empresa_id UUID
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.despachante_nome, c.cliente_nome, c.status, c.expira_em, c.cliente_cpf, c.cliente_id, c.despachante_empresa_id
  FROM public.convites_cac c
  WHERE c.token = p_token;
END;
$$ LANGUAGE plpgsql;

-- 10. POLÍTICAS DA TABELA `leads_pre_cadastro` (Pública para insert, restrita para leitura)
CREATE POLICY "leads_pre_cadastro_insert_policy" ON public.leads_pre_cadastro
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "leads_pre_cadastro_all_policy" ON public.leads_pre_cadastro
  FOR ALL TO authenticated
  USING (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com');

-- 11. POLÍTICAS DA TABELA `conteudo_site` (Pública para leitura, restrita para edição)
CREATE POLICY "conteudo_site_select_policy" ON public.conteudo_site
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "conteudo_site_all_policy" ON public.conteudo_site
  FOR ALL TO authenticated
  USING (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com');
