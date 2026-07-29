-- ==========================================================
-- MIGRAÇÃO: AJUSTE DE RLS PARA B2B (PARCERIAS) E RESPONSÁVEL
-- ==========================================================

-- 1. Criar a função get_auth_user_id() para buscar o ID do usuário logado de forma segura
CREATE OR REPLACE FUNCTION public.get_auth_user_id()
RETURNS UUID AS $$
  SELECT id 
  FROM public.usuarios_autorizados 
  WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email') 
  AND ativo = TRUE 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Atualizar get_auth_empresa_id() para usar comparação case-insensitive (LOWER)
CREATE OR REPLACE FUNCTION public.get_auth_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id 
  FROM public.usuarios_autorizados 
  WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email') 
  AND ativo = TRUE 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Liberar a leitura da tabela usuarios_autorizados para qualquer usuário autenticado (segurança simples)
DROP POLICY IF EXISTS "usuarios_autorizados_select_policy" ON public.usuarios_autorizados;
CREATE POLICY "usuarios_autorizados_select_policy" ON public.usuarios_autorizados
  FOR SELECT TO authenticated
  USING (true);

-- 4. Recriar política da tabela `clientes` com suporte a B2B (vínculos) e Responsável
DROP POLICY IF EXISTS clientes_policy ON public.clientes;
CREATE POLICY clientes_policy ON public.clientes
  FOR ALL TO authenticated
  USING (
    empresa_id = public.get_auth_empresa_id() 
    OR responsavel_id = public.get_auth_user_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.vinculos_despachante_cac v 
      WHERE v.status = 'ativo' 
      AND v.despachante_empresa_id = public.get_auth_empresa_id() 
      AND v.cac_empresa_id = empresa_id
    )
  )
  WITH CHECK (
    empresa_id = public.get_auth_empresa_id() 
    OR responsavel_id = public.get_auth_user_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.vinculos_despachante_cac v 
      WHERE v.status = 'ativo' 
      AND v.despachante_empresa_id = public.get_auth_empresa_id() 
      AND v.cac_empresa_id = empresa_id
    )
  );

-- 5. Recriar política da tabela `armas` com suporte a B2B (vínculos) e Responsável
DROP POLICY IF EXISTS armas_policy ON public.armas;
CREATE POLICY armas_policy ON public.armas
  FOR ALL TO authenticated
  USING (
    empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
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
    empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
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

-- 6. Recriar política da tabela `guias_trafego` com suporte a B2B (vínculos) e Responsável
DROP POLICY IF EXISTS guias_trafego_policy ON public.guias_trafego;
CREATE POLICY guias_trafego_policy ON public.guias_trafego
  FOR ALL TO authenticated
  USING (
    empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
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
    empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
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

-- 7. Recriar política da tabela `autorizacoes_manejo` com suporte a B2B (vínculos) e Responsável
DROP POLICY IF EXISTS autorizacoes_manejo_policy ON public.autorizacoes_manejo;
CREATE POLICY autorizacoes_manejo_policy ON public.autorizacoes_manejo
  FOR ALL TO authenticated
  USING (
    empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
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
    empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
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
