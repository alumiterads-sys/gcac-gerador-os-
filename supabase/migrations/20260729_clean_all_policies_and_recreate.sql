-- ==========================================================
-- MIGRAÇÃO: LIMPEZA COMPLETA E RECRIÇÃO DE TODAS AS POLÍTICAS
-- ==========================================================

-- 1. Remover todas as políticas RLS existentes da pasta public de forma dinâmica (limpeza total)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename, schemaname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 2. Garantir que o RLS está habilitado em todas as tabelas operacionais
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
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_pagamentos_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_declaracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opcoes_armas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos_despachante_cac ENABLE ROW LEVEL SECURITY;

-- 3. Recriar funções auxiliares de segurança de forma otimizada
CREATE OR REPLACE FUNCTION public.get_auth_user_id()
RETURNS UUID AS $$
  SELECT id 
  FROM public.usuarios_autorizados 
  WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email') 
  AND ativo = TRUE 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id 
  FROM public.usuarios_autorizados 
  WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email') 
  AND ativo = TRUE 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_auth_user_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' 
     FROM public.usuarios_autorizados 
     WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email') 
     AND ativo = TRUE 
     LIMIT 1),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Criar políticas para a tabela `usuarios_autorizados` (sem recursão)
CREATE POLICY usuarios_autorizados_select ON public.usuarios_autorizados
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY usuarios_autorizados_write ON public.usuarios_autorizados
  FOR ALL TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' 
    OR email = LOWER(auth.jwt() ->> 'email') 
    OR (empresa_id = public.get_auth_empresa_id() AND public.is_auth_user_admin())
  )
  WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' 
    OR email = LOWER(auth.jwt() ->> 'email') 
    OR (empresa_id = public.get_auth_empresa_id() AND public.is_auth_user_admin())
  );

-- 5. Criar políticas para a tabela `empresas`
CREATE POLICY empresas_select ON public.empresas
  FOR SELECT TO authenticated
  USING (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' OR id = public.get_auth_empresa_id());

CREATE POLICY empresas_insert ON public.empresas
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY empresas_update ON public.empresas
  FOR UPDATE TO authenticated
  USING (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' OR id = public.get_auth_empresa_id())
  WITH CHECK (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' OR id = public.get_auth_empresa_id());

CREATE POLICY empresas_delete ON public.empresas
  FOR DELETE TO authenticated
  USING (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com');

-- 6. Criar políticas genéricas para tabelas com `empresa_id` (com Master Admin short-circuit)
DO $$
DECLARE
    tab text;
    tabelas_empresa text[] := ARRAY[
        'ordens', 'orcamentos', 'recibos', 'agendamentos', 'lembretes', 'despesas', 
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
            USING (LOWER(auth.jwt() ->> ''email'') = ''gui.gomesassis@gmail.com'' OR empresa_id = public.get_auth_empresa_id())
            WITH CHECK (LOWER(auth.jwt() ->> ''email'') = ''gui.gomesassis@gmail.com'' OR empresa_id = public.get_auth_empresa_id())
        ', tab, tab);
    END LOOP;
END $$;

-- 7. Criar políticas com suporte a B2B (Parcerias) e Responsabilidade
-- clientes
CREATE POLICY clientes_policy ON public.clientes
  FOR ALL TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR empresa_id = public.get_auth_empresa_id() 
    OR responsavel_id = public.get_auth_user_id() 
    OR EXISTS (
      SELECT 1 FROM public.vinculos_despachante_cac v 
      WHERE v.status = 'ativo' 
      AND v.despachante_empresa_id = public.get_auth_empresa_id() 
      AND v.cac_empresa_id = empresa_id
    )
  )
  WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR empresa_id = public.get_auth_empresa_id() 
    OR responsavel_id = public.get_auth_user_id() 
    OR EXISTS (
      SELECT 1 FROM public.vinculos_despachante_cac v 
      WHERE v.status = 'ativo' 
      AND v.despachante_empresa_id = public.get_auth_empresa_id() 
      AND v.cac_empresa_id = empresa_id
    )
  );

-- armas
CREATE POLICY armas_policy ON public.armas
  FOR ALL TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR empresa_id = public.get_auth_empresa_id() 
    OR EXISTS (
      SELECT 1 FROM public.clientes c 
      WHERE c.id = cliente_id 
      AND (
        c.responsavel_id = public.get_auth_user_id()
        OR EXISTS (
          SELECT 1 FROM public.vinculos_despachante_cac v 
          WHERE v.status = 'ativo' 
          AND v.despachante_empresa_id = public.get_auth_empresa_id() 
          AND v.cac_empresa_id = c.empresa_id
        )
      )
    )
  )
  WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR empresa_id = public.get_auth_empresa_id() 
    OR EXISTS (
      SELECT 1 FROM public.clientes c 
      WHERE c.id = cliente_id 
      AND (
        c.responsavel_id = public.get_auth_user_id()
        OR EXISTS (
          SELECT 1 FROM public.vinculos_despachante_cac v 
          WHERE v.status = 'ativo' 
          AND v.despachante_empresa_id = public.get_auth_empresa_id() 
          AND v.cac_empresa_id = c.empresa_id
        )
      )
    )
  );

-- guias_trafego
CREATE POLICY guias_trafego_policy ON public.guias_trafego
  FOR ALL TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR empresa_id = public.get_auth_empresa_id() 
    OR EXISTS (
      SELECT 1 FROM public.armas a
      JOIN public.clientes c ON c.id = a.cliente_id
      WHERE a.id = arma_id 
      AND (
        c.responsavel_id = public.get_auth_user_id()
        OR EXISTS (
          SELECT 1 FROM public.vinculos_despachante_cac v 
          WHERE v.status = 'ativo' 
          AND v.despachante_empresa_id = public.get_auth_empresa_id() 
          AND v.cac_empresa_id = c.empresa_id
        )
      )
    )
  )
  WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR empresa_id = public.get_auth_empresa_id() 
    OR EXISTS (
      SELECT 1 FROM public.armas a
      JOIN public.clientes c ON c.id = a.cliente_id
      WHERE a.id = arma_id 
      AND (
        c.responsavel_id = public.get_auth_user_id()
        OR EXISTS (
          SELECT 1 FROM public.vinculos_despachante_cac v 
          WHERE v.status = 'ativo' 
          AND v.despachante_empresa_id = public.get_auth_empresa_id() 
          AND v.cac_empresa_id = c.empresa_id
        )
      )
    )
  );

-- autorizacoes_manejo
CREATE POLICY autorizacoes_manejo_policy ON public.autorizacoes_manejo
  FOR ALL TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR empresa_id = public.get_auth_empresa_id() 
    OR EXISTS (
      SELECT 1 FROM public.clientes c 
      WHERE c.id = cliente_id 
      AND (
        c.responsavel_id = public.get_auth_user_id()
        OR EXISTS (
          SELECT 1 FROM public.vinculos_despachante_cac v 
          WHERE v.status = 'ativo' 
          AND v.despachante_empresa_id = public.get_auth_empresa_id() 
          AND v.cac_empresa_id = c.empresa_id
        )
      )
    )
  )
  WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR empresa_id = public.get_auth_empresa_id() 
    OR EXISTS (
      SELECT 1 FROM public.clientes c 
      WHERE c.id = cliente_id 
      AND (
        c.responsavel_id = public.get_auth_user_id()
        OR EXISTS (
          SELECT 1 FROM public.vinculos_despachante_cac v 
          WHERE v.status = 'ativo' 
          AND v.despachante_empresa_id = public.get_auth_empresa_id() 
          AND v.cac_empresa_id = c.empresa_id
        )
      )
    )
  );

-- vinculos_despachante_cac
CREATE POLICY vinculos_despachante_cac_policy ON public.vinculos_despachante_cac
  FOR ALL TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR despachante_empresa_id = public.get_auth_empresa_id() 
    OR cac_empresa_id = public.get_auth_empresa_id() 
  )
  WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR despachante_empresa_id = public.get_auth_empresa_id() 
    OR cac_empresa_id = public.get_auth_empresa_id() 
  );
