-- ==========================================================
-- MIGRAÇÃO: REMOVER RECURSÃO E OTIMIZAR PERFORMANCE DE RLS
-- ==========================================================

-- 1. Criar função auxiliar para checar se o usuário logado é admin (Security Definer para evitar recursão)
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

-- 2. Recriar políticas da tabela `usuarios_autorizados` sem subconsultas diretas (evita recursão infinita)
DROP POLICY IF EXISTS "usuarios_autorizados_select_policy" ON public.usuarios_autorizados;
CREATE POLICY "usuarios_autorizados_select_policy" ON public.usuarios_autorizados
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "usuarios_autorizados_insert_policy" ON public.usuarios_autorizados;
CREATE POLICY "usuarios_autorizados_insert_policy" ON public.usuarios_autorizados
  FOR INSERT TO authenticated
  WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' 
    OR email = LOWER(auth.jwt() ->> 'email') 
    OR (empresa_id = public.get_auth_empresa_id() AND public.is_auth_user_admin())
  );

DROP POLICY IF EXISTS "usuarios_autorizados_update_policy" ON public.usuarios_autorizados;
CREATE POLICY "usuarios_autorizados_update_policy" ON public.usuarios_autorizados
  FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS "usuarios_autorizados_delete_policy" ON public.usuarios_autorizados;
CREATE POLICY "usuarios_autorizados_delete_policy" ON public.usuarios_autorizados
  FOR DELETE TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com' 
    OR (empresa_id = public.get_auth_empresa_id() AND public.is_auth_user_admin())
  );

-- 3. Otimizar políticas genéricas (colocando o check do Master Admin em primeiro lugar para short-circuit)
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
            DROP POLICY IF EXISTS %I_policy ON public.%I;
            CREATE POLICY %I_policy ON public.%I
            FOR ALL TO authenticated
            USING (LOWER(auth.jwt() ->> ''email'') = ''gui.gomesassis@gmail.com'' OR empresa_id = public.get_auth_empresa_id())
            WITH CHECK (LOWER(auth.jwt() ->> ''email'') = ''gui.gomesassis@gmail.com'' OR empresa_id = public.get_auth_empresa_id())
        ', tab, tab, tab, tab);
    END LOOP;
END $$;
