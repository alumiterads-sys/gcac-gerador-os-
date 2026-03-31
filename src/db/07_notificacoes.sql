-- Tabela para notificações internas do sistema (Alertas para o Administrador)
CREATE TABLE IF NOT EXISTS public.notificacoes_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    tipo TEXT DEFAULT 'info', -- 'info', 'sucesso', 'alerta'
    link TEXT, -- Opcional: link para redirecionar ao clicar
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.notificacoes_sistema ENABLE ROW LEVEL SECURITY;

-- Política simples: Todos autenticados podem ver e criar (para fins de protótipo)
-- Em produção, o ideal é que apenas admins vejam, mas todos possam criar
CREATE POLICY "notificacoes_sistema_select" ON public.notificacoes_sistema FOR SELECT TO authenticated USING (true);
CREATE POLICY "notificacoes_sistema_insert" ON public.notificacoes_sistema FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notificacoes_sistema_update" ON public.notificacoes_sistema FOR UPDATE TO authenticated USING (true);

-- Habilitar Realtime para esta tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes_sistema;
