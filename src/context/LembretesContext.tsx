import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Lembrete } from '../types';
import { supabase } from '../db/supabase';
import { useAuth } from './AuthContext';
import { useNotificacoesSistema } from './NotificacoesSistemaContext';

interface LembretesContextType {
  lembretes: Lembrete[];
  estaCarregando: boolean;
  criarLembrete: (dados: Omit<Lembrete, 'id' | 'concluido' | 'criadoEm' | 'usuarioId'>) => Promise<void>;
  atualizarLembrete: (id: string, dados: Partial<Lembrete>) => Promise<void>;
  deletarLembrete: (id: string) => Promise<void>;
  marcarConcluido: (id: string, concluido: boolean) => Promise<void>;
}

const LembretesContext = createContext<LembretesContextType | null>(null);

const mapFromDB = (row: any): Lembrete => ({
  id: row.id,
  titulo: row.titulo,
  descricao: row.descricao,
  data: row.data,
  horario: row.horario,
  concluido: row.concluido,
  prioridade: row.prioridade || 'media',
  clienteId: row.cliente_id,
  clienteNome: row.cliente_nome,
  usuarioId: row.usuario_id,
  criadoEm: row.criado_em,
});

const mapToDB = (dados: any) => {
  const payload: any = {};
  if (dados.titulo !== undefined) payload.titulo = dados.titulo;
  if (dados.descricao !== undefined) payload.descricao = dados.descricao;
  if (dados.data !== undefined) payload.data = dados.data;
  if (dados.horario !== undefined) payload.horario = dados.horario;
  if (dados.concluido !== undefined) payload.concluido = dados.concluido;
  if (dados.prioridade !== undefined) payload.prioridade = dados.prioridade;
  if (dados.clienteId !== undefined) payload.cliente_id = dados.clienteId;
  if (dados.clienteNome !== undefined) payload.cliente_nome = dados.clienteNome;
  if (dados.usuarioId !== undefined) payload.usuario_id = dados.usuarioId;
  return payload;
};

export function LembretesProvider({ children }: { children: React.ReactNode }) {
  const { usuario, estaAutenticado } = useAuth();
  const { enviarNotificacao } = useNotificacoesSistema();
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [estaCarregando, setEstaCarregando] = useState(true);

  const carregarLembretes = useCallback(async () => {
    if (!estaAutenticado) return;
    
    setEstaCarregando(true);
    const { data, error } = await supabase
      .from('lembretes')
      .select('*')
      .order('data', { ascending: true })
      .order('horario', { ascending: true });
    
    if (!error && data) {
      setLembretes(data.map(mapFromDB));
    }
    setEstaCarregando(false);
  }, [estaAutenticado]);

  useEffect(() => {
    carregarLembretes();
  }, [carregarLembretes]);

  // Lógica de Verificação de Notificações
  useEffect(() => {
    if (!estaAutenticado || lembretes.length === 0) return;

    const checarNotificacoes = () => {
      const agora = new Date();
      const hojeStr = agora.toISOString().split('T')[0];
      const horaMinuto = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

      lembretes.forEach(lembrete => {
        if (!lembrete.concluido && lembrete.data === hojeStr) {
          // Se tiver horário e já passou, ou se não tiver horário (notifica no início do dia)
          const deveNotificar = !lembrete.horario || lembrete.horario <= horaMinuto;
          
          // Verificamos se já notificamos hoje no localStorage para não spammar
          const key = `notif_lembrete_${lembrete.id}_${hojeStr}`;
          if (deveNotificar && !localStorage.getItem(key)) {
            enviarNotificacao({
              titulo: `Lembrete: ${lembrete.titulo}`,
              mensagem: lembrete.descricao || 'Tarefa agendada para hoje.',
              tipo: lembrete.prioridade === 'alta' ? 'alerta' : 'info',
              link: '/agenda'
            });
            localStorage.setItem(key, 'true');
          }
        }
      });
    };

    const interval = setInterval(checarNotificacoes, 60000); // Checa a cada minuto
    checarNotificacoes(); // Checa na carga inicial

    return () => clearInterval(interval);
  }, [estaAutenticado, lembretes, enviarNotificacao]);

  const criarLembrete = useCallback(async (dados: Omit<Lembrete, 'id' | 'concluido' | 'criadoEm' | 'usuarioId'>) => {
    const { error } = await supabase
      .from('lembretes')
      .insert([{
        ...mapToDB(dados),
        usuario_id: usuario?.id,
        concluido: false
      }]);

    if (error) throw error;
    await carregarLembretes();
  }, [carregarLembretes, usuario?.id]);

  const atualizarLembrete = useCallback(async (id: string, dados: Partial<Lembrete>) => {
    const { error } = await supabase
      .from('lembretes')
      .update(mapToDB(dados))
      .eq('id', id);

    if (error) throw error;
    await carregarLembretes();
  }, [carregarLembretes]);

  const deletarLembrete = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('lembretes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await carregarLembretes();
  }, [carregarLembretes]);

  const marcarConcluido = useCallback(async (id: string, concluido: boolean) => {
    const { error } = await supabase
      .from('lembretes')
      .update({ concluido })
      .eq('id', id);

    if (error) throw error;
    await carregarLembretes();
  }, [carregarLembretes]);

  return (
    <LembretesContext.Provider value={{
      lembretes,
      estaCarregando,
      criarLembrete,
      atualizarLembrete,
      deletarLembrete,
      marcarConcluido
    }}>
      {children}
    </LembretesContext.Provider>
  );
}

export function useLembretes() {
  const ctx = useContext(LembretesContext);
  if (!ctx) throw new Error('useLembretes deve ser usado dentro de LembretesProvider');
  return ctx;
}
