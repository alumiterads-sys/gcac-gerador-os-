import jsPDF from 'jspdf';
import { Recibo } from '../types';
import { formatarMoeda, formatarData, formatarCPF, formatarTelefone } from '../utils/formatters';

// Cores GCAC
const AZUL_ESCURO = '#0D1B2A';
const AZUL_BRILHO = '#1B6FBF';
const ESCURO      = '#0D0D0D';
const CINZA       = '#555555';
const LINHA       = '#DDDDDD';

export async function gerarPdfReciboBlob(recibo: Recibo): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const largura = doc.internal.pageSize.getWidth();
  const altura  = doc.internal.pageSize.getHeight();
  let y = 0;

  // ── Cabeçalho ───────────────────────────────────────────────────────────
  doc.setFillColor(ESCURO);
  doc.rect(0, 0, largura, 42, 'F');

  // Logo
  try {
    const logoRes = await fetch('/Logo oficial.png');
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();
      const logoBase64 = await blobParaBase64(logoBlob);
      doc.addImage(logoBase64, 'PNG', 6, 2, 34, 38);
    }
  } catch { /* logo nao disponivel */ }

  // Dados da empresa
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('GCAC Despachante Bélico', 46, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#CCCCCC');
  doc.text('Gestão e Assessoria C.A.C.', 46, 17);
  doc.text('CNPJ: ' + recibo.emitenteCNPJ, 46, 22);
  doc.text('Assinatura Responsável: Guilherme Gomes', 46, 27);

  // Linha separadora interna
  doc.setDrawColor('#333333');
  doc.line(46, 30, largura - 12, 30);

  // Número Recibo e Data
  doc.setFontSize(14);
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  const numFormatado = `# ${String(recibo.numero).padStart(4, '0')}`;
  doc.text(numFormatado, largura - 12, 35, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#AAAAAA');
  doc.text('Emissão: ' + formatarData(recibo.criadoEm), largura - 12, 40, { align: 'right' });

  y = 55;

  // ── Bloco Principal do Recibo ──────────────────────────────────────────
  doc.setFillColor('#F0F7FF');
  doc.setDrawColor(AZUL_BRILHO);
  doc.setLineWidth(0.5);
  doc.roundedRect(12, y, largura - 24, 25, 2, 2, 'FD');
  doc.setLineWidth(0.1);

  doc.setTextColor(ESCURO);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const textoRecibo = `Recebemos de ${recibo.clienteNome}, CPF/CNPJ ${recibo.clienteCPF}, a importância de:`;
  const linhasTexto = doc.splitTextToSize(textoRecibo, largura - 34);
  doc.text(linhasTexto, 17, y + 8);

  doc.setTextColor(AZUL_BRILHO);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(formatarMoeda(recibo.valorTotal), 17, y + 18);

  y += 35;

  // ── Detalhes dos Serviços ──────────────────────────────────────────────
  y = secaoTitulo(doc, 'DESCRIÇÃO DOS SERVIÇOS E PRODUTOS', y, AZUL_ESCURO);
  y += 2;

  recibo.servicos.forEach((serv) => {
    if (y > 250) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ESCURO);
    doc.text(serv.nome.toUpperCase(), 17, y + 5);
    
    doc.setFontSize(11);
    doc.text(formatarMoeda(serv.valor), largura - 16, y + 5, { align: 'right' });

    if (serv.detalhes) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(CINZA);
      const detalhes = doc.splitTextToSize(serv.detalhes, largura - 50);
      doc.text(detalhes, 17, y + 10);
      y += (detalhes.length * 5) + 8;
    } else {
      y += 10;
    }
    
    doc.setDrawColor(LINHA);
    doc.line(12, y, largura - 12, y);
    y += 5;
  });

  // ── Totais e Pagamento ────────────────────────────────────────────────
  y += 5;
  doc.setFillColor('#F8F9FA');
  doc.rect(largura - 90, y, 78, 20, 'F');
  doc.setDrawColor(LINHA);
  doc.rect(largura - 90, y, 78, 20, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(CINZA);
  doc.text('FORMA DE PAGAMENTO: ' + recibo.formaPagamento.toUpperCase(), largura / 2, y + 26, { align: 'center' });

  doc.setFontSize(9);
  doc.text('TOTAL DO RECIBO', largura - 51, y + 7, { align: 'center' });
  doc.setTextColor(AZUL_BRILHO);
  doc.setFontSize(16);
  doc.text(formatarMoeda(recibo.valorTotal), largura - 51, y + 15, { align: 'center' });

  y += 40;

  // ── Assinaturas ────────────────────────────────────────────────────────
  const yAss = altura - 60;
  
  // Linha Responsável
  doc.setDrawColor(ESCURO);
  doc.line(20, yAss, 85, yAss);
  doc.setFontSize(8);
  doc.setTextColor(CINZA);
  doc.text('PELO RESPONSÁVEL / EMITENTE', 52.5, yAss + 5, { align: 'center' });
  doc.setTextColor(ESCURO);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('GUILHERME GOMES', 52.5, yAss + 10, { align: 'center' });
  doc.setFontSize(7);
  doc.text('CNPJ: ' + recibo.emitenteCNPJ, 52.5, yAss + 14, { align: 'center' });

  // Assinatura (Rubrica)
  try {
    const assRes = await fetch('/assinatura_guilherme.png');
    if (assRes.ok) {
      const assBlob = await assRes.blob();
      const assBase64 = await blobParaBase64(assBlob);
      // Ajuste de posição para ficar "sobre a linha"
      doc.addImage(assBase64, 'PNG', 30, yAss - 25, 45, 25);
    }
  } catch { /* assinatura nao disponivel */ }

  // Linha Cliente
  doc.line(largura - 85, yAss, largura - 20, yAss);
  doc.setFontSize(8);
  doc.setTextColor(CINZA);
  doc.text('PELO CLIENTE / BENEFICIÁRIO', largura - 52.5, yAss + 5, { align: 'center' });
  doc.setTextColor(ESCURO);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(recibo.clienteNome.toUpperCase(), largura - 52.5, yAss + 10, { align: 'center' });

  // ── Rodapé ─────────────────────────────────────────────────────────────
  doc.setFillColor(ESCURO);
  doc.rect(0, altura - 15, largura, 15, 'F');
  doc.setTextColor('#AAAAAA');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Este recibo é um documento de quitação de pagamento emitido eletronicamente pela plataforma GCAC', largura / 2, altura - 8, { align: 'center' });
  doc.text(`Sistemas Portal Gcac © ${new Date().getFullYear()} — Todos os direitos reservados.`, largura / 2, altura - 4, { align: 'center' });

  return doc.output('blob');
}

export async function baixarPdfRecibo(recibo: Recibo): Promise<void> {
  const blob = await gerarPdfReciboBlob(recibo);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `RECIBO_${String(recibo.numero).padStart(4, '0')}_${recibo.clienteNome.replace(/\s/g, '_')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

// Helpers
function secaoTitulo(doc: jsPDF, titulo: string, y: number, cor: string): number {
  doc.setFillColor(cor);
  doc.rect(12, y, 4, 7, 'F');
  doc.setTextColor(cor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 19, y + 5.5);
  doc.setDrawColor('#EEEEEE');
  doc.line(12, y + 10, doc.internal.pageSize.getWidth() - 12, y + 10);
  return y + 14;
}

async function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
