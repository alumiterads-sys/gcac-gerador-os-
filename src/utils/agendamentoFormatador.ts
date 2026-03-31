import { Agendamento } from '../types';

export function formatarDataParaWhatsApp(dataIso: string): string {
  if (!dataIso) return '';
  // Forçamos o fuso horário local para evitar problemas de data retrocedendo um dia
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  
  const diaStr = String(data.getDate()).padStart(2, '0');
  const mesStr = String(data.getMonth() + 1).padStart(2, '0');
  const diasDaSemana = [
    'DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 
    'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'
  ];
  const diaSemana = diasDaSemana[data.getDay()];
  return `${diaStr}/${mesStr} ${diaSemana}`;
}

export function gerarTextoAgendamento(agendamento: Agendamento): string {
  const dataFormatada = formatarDataParaWhatsApp(agendamento.data);
  const emojiCerto = '\u2705';

  if (agendamento.tipo === 'Psicológico') {
    return `*Confirmação de agendamento de Laudo psicológico*
${agendamento.clienteNome.toUpperCase()}
CPF: ${agendamento.clienteCPF}
Contato: ${agendamento.clienteContato}
Endereço: ${agendamento.clienteEndereco}
ARMA: ${agendamento.arma.toUpperCase()}
DIA ${dataFormatada}
HORÁRIO ${agendamento.horario}
Local: ${agendamento.local}
Psicologa ${agendamento.profissional}
Valor: ${agendamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
${emojiCerto}`;
  } else {
    // Para o laudo de tiro, formatamos o psicológico se existir
    let infoPsi = '';
    if (agendamento.dataPsicologico) {
      const parts = formatarDataParaWhatsApp(agendamento.dataPsicologico).split(' ');
      const dataPsi = parts[0];
      infoPsi = `Laudo psicológico para: ${dataPsi} ${agendamento.horarioPsicologico || ''}\n`;
    }

    return `*Confirmação de agendamento de Laudo de Tiro*
${agendamento.clienteNome.toUpperCase()}
CPF: ${agendamento.clienteCPF}
Contato: ${agendamento.clienteContato}
Endereço: ${agendamento.clienteEndereco}
ARMA: ${agendamento.arma.toUpperCase()}
DIA ${dataFormatada}
HORÁRIO ${agendamento.horario}
${infoPsi}Local: ${agendamento.local}
Instrutor: ${agendamento.profissional}
Valor: ${agendamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
${emojiCerto}`;
  }
}
