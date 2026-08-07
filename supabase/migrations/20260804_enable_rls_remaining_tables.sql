-- ==========================================================
-- MIGRAÇÃO: HABILITAR RLS NAS TABELAS RESTANTES E CRIAR POLÍTICAS
-- ==========================================================

-- 1. Habilitar RLS nas tabelas
ALTER TABLE public.conteudo_site ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_pre_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites_cac ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.perfis ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS conteudo_site_select_policy ON public.conteudo_site;
DROP POLICY IF EXISTS conteudo_site_write_policy ON public.conteudo_site;
DROP POLICY IF EXISTS leads_pre_cadastro_select_policy ON public.leads_pre_cadastro;
DROP POLICY IF EXISTS leads_pre_cadastro_insert_policy ON public.leads_pre_cadastro;
DROP POLICY IF EXISTS leads_pre_cadastro_admin_policy ON public.leads_pre_cadastro;
DROP POLICY IF EXISTS convites_cac_insert_policy ON public.convites_cac;
DROP POLICY IF EXISTS convites_cac_select_policy ON public.convites_cac;
DROP POLICY IF EXISTS convites_cac_update_policy ON public.convites_cac;
DROP POLICY IF EXISTS convites_cac_update_anon ON public.convites_cac;
DROP POLICY IF EXISTS perfis_policy ON public.perfis;

-- 3. Políticas para public.conteudo_site
-- Leitura pública (Landing Page precisa exibir sem login)
CREATE POLICY conteudo_site_select_policy ON public.conteudo_site
  FOR SELECT TO anon, authenticated
  USING (true);

-- Edição exclusiva do Master Admin
CREATE POLICY conteudo_site_write_policy ON public.conteudo_site
  FOR ALL TO authenticated
  USING (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com')
  WITH CHECK (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com');

-- 4. Políticas para public.leads_pre_cadastro
-- Qualquer visitante/usuário pode fazer pré-cadastro
CREATE POLICY leads_pre_cadastro_insert_policy ON public.leads_pre_cadastro
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Verificação de CPF duplicado na página de cadastro
CREATE POLICY leads_pre_cadastro_select_policy ON public.leads_pre_cadastro
  FOR SELECT TO anon, authenticated
  USING (true);

-- Gerenciamento exclusivo pelo Master Admin
CREATE POLICY leads_pre_cadastro_admin_policy ON public.leads_pre_cadastro
  FOR ALL TO authenticated
  USING (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com')
  WITH CHECK (LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com');

-- 5. Políticas para public.convites_cac
-- Inserção de convites por despachante autenticado ou master admin
CREATE POLICY convites_cac_insert_policy ON public.convites_cac
  FOR INSERT TO authenticated
  WITH CHECK (
    despachante_empresa_id = public.get_auth_empresa_id() 
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  );

-- Leitura de convites pelo despachante criador, pelo CAC vinculado ou master admin, ou se pendente
CREATE POLICY convites_cac_select_policy ON public.convites_cac
  FOR SELECT TO authenticated
  USING (
    despachante_empresa_id = public.get_auth_empresa_id()
    OR cac_empresa_id = public.get_auth_empresa_id()
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR status = 'pendente'
  );

-- Atualização de convite por despachante criador, CAC de destino, ou master admin
CREATE POLICY convites_cac_update_policy ON public.convites_cac
  FOR UPDATE TO authenticated
  USING (
    despachante_empresa_id = public.get_auth_empresa_id()
    OR cac_empresa_id = public.get_auth_empresa_id()
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
    OR status = 'pendente'
  )
  WITH CHECK (
    despachante_empresa_id = public.get_auth_empresa_id()
    OR cac_empresa_id = public.get_auth_empresa_id()
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  );

-- Atualização por anônimo apenas para marcar como expirado de forma não-bloqueante
CREATE POLICY convites_cac_update_anon ON public.convites_cac
  FOR UPDATE TO anon
  USING (expira_em < now())
  WITH CHECK (status = 'expirado');

-- 6. Políticas para public.perfis
CREATE POLICY perfis_policy ON public.perfis
  FOR ALL TO authenticated
  USING (
    LOWER(email) = LOWER(auth.jwt() ->> 'email')
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  )
  WITH CHECK (
    LOWER(email) = LOWER(auth.jwt() ->> 'email')
    OR LOWER(auth.jwt() ->> 'email') = 'gui.gomesassis@gmail.com'
  );
