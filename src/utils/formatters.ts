import { StatusOS, FormaPagamento } from '../types';
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

export function parsearMoeda(valor: string): number {
  const limpo = valor.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(limpo) || 0;
}

export function hoje(): string {
  return new Date().toISOString().split('T')[0];
}
