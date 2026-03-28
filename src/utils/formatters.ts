import { StatusOS, FormaPagamento, StatusOrcamento, StatusExecucaoServico } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarData(dataISO: string): string {
  try {
    return format(parseISO(dataISO), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dataISO;
  }
}

export function formatarDataHora(dataISO: string): string {
  try {
    return format(parseISO(dataISO), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dataISO;
  }
}

export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatarTelefone(tel: string): string {
  const numeros = tel.replace(/\D/g, '');
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function formatarNumeroOS(numero: number): string {
  return `OS-${String(numero).padStart(4, '0')}`;
}

export function classeStatus(status: StatusOS): string {
  switch (status) {
    case 'Aguardando Pagamento': return 'badge-pendente';
    case 'Gratuidade':           return 'badge-andamento';
    case 'Pago':                 return 'badge-concluido';
    default:                     return 'badge';
  }
}

export function corStatus(status: StatusOS): string {
  switch (status) {
    case 'Aguardando Pagamento': return '#eab308';
    case 'Gratuidade':           return '#2d8de0';
    case 'Pago':                 return '#6DBE45';
    default:                     return '#8A8A8A';
  }
}

export function classeStatusOrcamento(status: StatusOrcamento): string {
  switch (status) {
    case 'Pendente': return 'badge-pendente';
    case 'Aprovado': return 'badge-concluido';
    case 'Recusado': return 'badge-cancelado text-red-400 bg-red-500/10 border-red-500/20'; // Custom if badge-cancelado is not enough
    default:         return 'badge';
  }
}

export function corStatusOrcamento(status: StatusOrcamento): string {
  switch (status) {
    case 'Pendente': return '#eab308'; // amarelo
    case 'Aprovado': return '#6DBE45'; // verde
    case 'Recusado': return '#f87171'; // vermelho
    default:         return '#8A8A8A';
  }
}

export function classeStatusExecucao(status?: StatusExecucaoServico): string {
  switch (status) {
    case 'Pendente':                      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'Iniciado — Montando Processo':   return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Aguardando Documentos':         return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'Protocolado — Ag. PF':          return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Concluído':                    return 'bg-green-500/20 text-green-300 border-green-500/30';
    default:                              return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function iconeStatusExecucao(status?: StatusExecucaoServico): string {
  switch (status) {
    case 'Pendente':                      return '⏳';
    case 'Iniciado — Montando Processo':   return '🔧';
    case 'Aguardando Documentos':         return '📄';
    case 'Protocolado — Ag. PF':          return '📤';
    case 'Concluído':                    return '✅';
    default:                              return '⏳';
  }
}

export function parsearMoeda(valor: string): number {
  const limpo = valor.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(limpo) || 0;
}

export function hoje(): string {
  return new Date().toISOString().split('T')[0];
}
