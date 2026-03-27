import jsPDF from 'jspdf';
import { OrdemDeServico } from '../types';
import { formatarMoeda, formatarData, formatarNumeroOS, formatarCPF, formatarTelefone } from '../utils/formatters';

// Cores GCAC
const AZUL   = '#1B6FBF';
const VERDE  = '#6DBE45';
const ESCURO = '#0D0D0D';
const CINZA  = '#555555';
const LINHA  = '#DDDDDD';

export async function gerarPdfBlob(ordem: OrdemDeServico): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const largura = doc.internal.pageSize.getWidth();
  const altura  = doc.internal.pageSize.getHeight();
  let y = 0;

  // ── Cabeçalho ───────────────────────────────────────────────────────────
  doc.setFillColor(ESCURO);
  doc.rect(0, 0, largura, 42, 'F');

  // Logo
  try {
    const logoRes = await fetch('/logo.jpg');
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();
      const logoBase64 = await blobParaBase64(logoBlob);
      doc.addImage(logoBase64, 'JPEG', 6, 2, 34, 38);
    }
  } catch { /* logo nao disponivel */ }

  // Dados da empresa
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('GCAC Despachante Belico', 46, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#CCCCCC');
  doc.text('Guilherme Gomes', 46, 17);
  doc.text('(64) 9.9995-9865', 46, 22);
  doc.text('Av. Goias, n 1802, Sala 04 - Bairro Santa Maria - Jatai-GO', 46, 27);

  // Linha separadora interna
  doc.setDrawColor('#333333');
  doc.line(46, 30, largura - 12, 30);

  // Número OS e Data
  doc.setFontSize(14);
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.text(formatarNumeroOS(ordem.numero), largura - 12, 35, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#AAAAAA');
  doc.text('Data: ' + formatarData(ordem.criadoEm), largura - 12, 40, { align: 'right' });

  // Badge de Status
  const corStatus = getCorStatus(ordem.status);
  doc.setFillColor(corStatus);
  doc.roundedRect(46, 33, 55, 8, 1.5, 1.5, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS: ' + ordem.status.toUpperCase(), 73.5, 38.5, { align: 'center' });


  y = 50;

  // ── Dados do Cliente ─────────────────────────────────────────────────────
  y = secaoTitulo(doc, 'DADOS DO CLIENTE', y, AZUL);
  y += 2;

  y = linhaInfo(doc, 'Nome Completo:', ordem.nomeCliente, y, largura);
  y = linhaInfo(doc, 'CPF:', formatarCPF(ordem.cpf), y, largura);
  y = linhaInfo(doc, 'Contato:', formatarTelefone(ordem.contato), y, largura);
  y = linhaInfo(doc, 'Senha GOV.br:', ordem.senhaGov, y, largura);

  const textoFiliacao = ordem.filiadoProTiro
    ? 'Filiado Pro-Tiro (Clube de Tiro e Caca Pro-Tiro, Jatai-GO)'
    : 'Nao filiado ao Pro-Tiro' + (ordem.clubeFiliado ? ' | Clube: ' + ordem.clubeFiliado : '');
  y = linhaInfo(doc, 'Filiacao:', textoFiliacao, y, largura);

  y += 4;

  // ── Descrição do Serviço ─────────────────────────────────────────────────
  y = secaoTitulo(doc, 'DESCRICAO DO SERVICO', y, AZUL);
  y += 2;

  doc.setFillColor('#F8F9FA');
  const alturaServico = Math.max(28, Math.ceil(ordem.servico.length / 90) * 7 + 10);
  doc.roundedRect(12, y, largura - 24, alturaServico, 2, 2, 'F');
  doc.setDrawColor(LINHA);
  doc.roundedRect(12, y, largura - 24, alturaServico, 2, 2, 'S');

  doc.setTextColor(ESCURO);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  const linhasServico = doc.splitTextToSize(ordem.servico, largura - 34);
  doc.text(linhasServico, 17, y + 7);
  y += alturaServico + 5;

  // ── Valores e Pagamento ──────────────────────────────────────────────────
  y = secaoTitulo(doc, 'VALORES E PAGAMENTO', y, AZUL);
  y += 2;

  // Caixa valor
  doc.setFillColor('#EBF5FB');
  doc.roundedRect(12, y, (largura - 28) / 2, 18, 2, 2, 'F');
  doc.setDrawColor(LINHA);
  doc.roundedRect(12, y, (largura - 28) / 2, 18, 2, 2, 'S');
  doc.setTextColor(CINZA);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR DO SERVICO', 17, y + 5);
  doc.setTextColor(AZUL);
  doc.setFontSize(15);
  doc.text(formatarMoeda(ordem.valor), 17, y + 13);

  // Caixa pagamento
  doc.setFillColor('#EBF5FB');
  const xPag = largura / 2 + 2;
  const wPag = (largura - 28) / 2;
  doc.roundedRect(xPag, y, wPag, 18, 2, 2, 'F');
  doc.roundedRect(xPag, y, wPag, 18, 2, 2, 'S');
  doc.setTextColor(CINZA);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMA DE PAGAMENTO', xPag + 5, y + 5);
  doc.setTextColor(ESCURO);
  doc.setFontSize(12);
  doc.text(ordem.formaPagamento, xPag + 5, y + 13);

  // Status de pagamento
  doc.setFillColor(corStatus);
  doc.roundedRect(12, y + 21, largura - 24, 8, 1.5, 1.5, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS: ' + ordem.status.toUpperCase(), largura / 2, y + 26.5, { align: 'center' });

  y += 34;

  // ── Observações ──────────────────────────────────────────────────────────
  if (ordem.observacoes && ordem.observacoes.trim()) {
    y = secaoTitulo(doc, 'OBSERVACOES', y, CINZA);
    y += 2;
    doc.setTextColor('#333333');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const linhasObs = doc.splitTextToSize(ordem.observacoes, largura - 34);
    doc.text(linhasObs, 17, y);
    y += linhasObs.length * 5.5 + 5;
  }

  // ── Canal de Atendimento ─────────────────────────────────────────────────
  if (ordem.canalAtendimento || (ordem.observacaoContato && ordem.observacaoContato.trim())) {
    y = secaoTitulo(doc, 'CANAL DE ATENDIMENTO', y, CINZA);
    y += 2;

    if (ordem.canalAtendimento) {
      y = linhaInfo(doc, 'Canal:', ordem.canalAtendimento, y, largura);
    }
    if (ordem.observacaoContato && ordem.observacaoContato.trim()) {
      y = linhaInfo(doc, 'Observacao:', ordem.observacaoContato, y, largura);
    }
    y += 2;
  }

  // ── Rodapé ────────────────────────────────────────────────────────────────
  // Linha separadora
  doc.setDrawColor(LINHA);
  doc.line(12, altura - 20, largura - 12, altura - 20);

  doc.setFillColor(ESCURO);
  doc.rect(0, altura - 16, largura, 16, 'F');
  doc.setTextColor('#AAAAAA');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('GCAC Despachante Belico — Documento gerado eletronicamente', largura / 2, altura - 8, { align: 'center' });
  doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), largura / 2, altura - 4, { align: 'center' });

  return doc.output('blob');
}

export async function baixarPdf(ordem: OrdemDeServico): Promise<void> {
  const blob = await gerarPdfBlob(ordem);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `OS_${String(ordem.numero).padStart(4, '0')}_${ordem.nomeCliente.replace(/\s/g, '_')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function imprimirPdf(ordem: OrdemDeServico): Promise<void> {
  const blob = await gerarPdfBlob(ordem);
  const url = URL.createObjectURL(blob);
  const janela = window.open(url, '_blank');
  if (janela) {
    janela.addEventListener('load', () => {
      janela.print();
    });
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function secaoTitulo(doc: jsPDF, titulo: string, y: number, cor: string): number {
  // Barra colorida lateral
  doc.setFillColor(cor);
  doc.rect(12, y, 4, 7, 'F');

  // Texto do título
  doc.setTextColor(cor);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 19, y + 5.5);

  // Linha separadora
  doc.setDrawColor('#EEEEEE');
  doc.line(12, y + 10, doc.internal.pageSize.getWidth() - 12, y + 10);

  return y + 14;
}

function linhaInfo(
  doc: jsPDF,
  rotulo: string,
  valor: string,
  y: number,
  largura: number
): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#555555');
  doc.text(rotulo, 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#111111');
  const texto = doc.splitTextToSize(valor || '-', largura - 70);
  doc.text(texto, 55, y);
  return y + texto.length * 5 + 2;
}

function getCorStatus(status: string): string {
  switch (status) {
    case 'Aguardando Pagamento': return '#F59E0B';
    case 'Gratuidade':           return '#3B82F6';
    case 'Pago':                 return '#16A34A';
    default:                     return '#6B7280';
  }
}

async function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
