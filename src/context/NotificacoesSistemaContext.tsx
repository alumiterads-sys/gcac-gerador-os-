import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { NotificacaoSistema } from '../types';
import { supabase } from '../db/supabase';
import { useAuth } from './AuthContext';

interface NotificacoesSistemaContextType {
  notificacoes: NotificacaoSistema[];
  naoLidas: number;
  estaCarregando: boolean;
  enviarNotificacao: (dados: { titulo: string, mensagem: string, tipo?: 'info' | 'sucesso' | 'alerta', link?: string }) => Promise<void>;
  marcarComoLida: (id: string) => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
}

const NotificacoesSistemaContext = createContext<NotificacoesSistemaContextType | null>(null);

const mapFromDB = (row: any): NotificacaoSistema => ({
  id: row.id,
  titulo: row.titulo,
  mensagem: row.mensagem,
  lida: row.lida,
  tipo: row.tipo as any,
  link: row.link,
  criadoEm: row.criado_em,
});

export function NotificacoesSistemaProvider({ children }: { children: React.ReactNode }) {
  const { usuario, estaAutenticado } = useAuth();
  const [notificacoes, setNotificacoes] = useState<NotificacaoSistema[]>([]);
  const [estaCarregando, setEstaCarregando] = useState(true);

  const carregarNotificacoes = useCallback(async () => {
    if (!estaAutenticado || usuario?.role !== 'admin') {
      setNotificacoes([]);
      setEstaCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from('notificacoes_sistema')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotificacoes(data.map(mapFromDB));
    }
    setEstaCarregando(false);
  }, [estaAutenticado, usuario?.role]);

  useEffect(() => {
    carregarNotificacoes();

    // Inscrição Realtime (Apenas para Admins)
    if (estaAutenticado && usuario?.role === 'admin') {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notificacoes_sistema' },
          () => {
            carregarNotificacoes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [carregarNotificacoes, estaAutenticado, usuario?.role]);

  const enviarNotificacao = useCallback(async (dados: { titulo: string, mensagem: string, tipo?: 'info' | 'sucesso' | 'alerta', link?: string }) => {
    const { error } = await supabase
      .from('notificacoes_sistema')
      .insert([{
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        tipo: dados.tipo || 'info',
        link: dados.link
      }]);

    if (error) console.error('Erro ao enviar notificação interna:', error);
  }, []);

  const marcarComoLida = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notificacoes_sistema')
      .update({ lida: true })
      .eq('id', id);

    if (error) console.error('Erro ao marcar como lida:', error);
    else await carregarNotificacoes();
  }, [carregarNotificacoes]);

  const marcarTodasComoLidas = useCallback(async () => {
    const { error } = await supabase
      .from('notificacoes_sistema')
      .update({ lida: true })
      .eq('lida', false);

    if (error) console.error('Erro ao marcar todas como lidas:', error);
    else await carregarNotificacoes();
  }, [carregarNotificacoes]);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <NotificacoesSistemaContext.Provider value={{
      notificacoes,
      naoLidas,
      estaCarregando,
      enviarNotificacao,
      marcarComoLida,
      marcarTodasComoLidas
    }}>
      {children}
    </NotificacoesSistemaContext.Provider>
  );
}

export function useNotificacoesSistema() {
  const ctx = useContext(NotificacoesSistemaContext);
  if (!ctx) throw new Error('useNotificacoesSistema deve ser usado dentro de NotificacoesSistemaProvider');
  return ctx;
}
