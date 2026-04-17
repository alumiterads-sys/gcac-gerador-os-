import jsPDF from 'jspdf';
import { SecaoManual, CONTEUDO_MANUAL } from './manualService';

// Cores GCAC
const AZUL   = '#1B6FBF';
const ESCURO = '#0D0D0D';
const LINHA  = '#DDDDDD';

export async function gerarPdfManual(secoesIds: string[]): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const largura = doc.internal.pageSize.getWidth();
  const altura  = doc.internal.pageSize.getHeight();
  let y = 0;

  // ── Capa ───────────────────────────────────────────────────────────────
  doc.setFillColor(ESCURO);
  doc.rect(0, 0, largura, altura, 'F');

  // Logo (Tentativa)
  try {
    const logoRes = await fetch('/Logo oficial.png');
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();
      const logoBase64 = await blobParaBase64(logoBlob);
      doc.addImage(logoBase64, 'PNG', (largura / 2) - 25, 40, 50, 55);
    }
  } catch { /* logo nao disponivel */ }

  doc.setTextColor('#FFFFFF');
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('MANUAL DE INSTRUÇÕES', largura / 2, 110, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(AZUL);
  doc.text('Plataforma Gestão GCAC', largura / 2, 120, { align: 'center' });

  doc.setDrawColor(AZUL);
  doc.setLineWidth(1);
  doc.line(largura * 0.25, 130, largura * 0.75, 130);

  doc.setFontSize(10);
  doc.setTextColor('#AAAAAA');
  doc.setFont('helvetica', 'normal');
  doc.text('Versão: 1.0.0 — Atualizado em: ' + new Date().toLocaleDateString('pt-BR'), largura / 2, altura - 20, { align: 'center' });
  doc.text('GCAC Despachante Bélico', largura / 2, altura - 15, { align: 'center' });

  // ── Conteúdo ───────────────────────────────────────────────────────────
  const secoesParaGerar = CONTEUDO_MANUAL.filter(s => secoesIds.includes(s.id));

  secoesParaGerar.forEach((secao, index) => {
    doc.addPage();
    y = 20;

    // Título da Seção
    doc.setFillColor(AZUL);
    doc.rect(15, y - 5, 2, 10, 'F');
    doc.setTextColor(ESCURO);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(secao.titulo, 22, y + 2);
    y += 15;

    // Conteúdo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#333333');

    secao.conteudo.forEach(paragrafo => {
      const linhas = doc.splitTextToSize(paragrafo, largura - 40);
      
      // Quebra de página se não couber
      if (y + (linhas.length * 6) > 270) {
        doc.addPage();
        y = 30;
      }

      doc.text(linhas, 20, y);
      y += (linhas.length * 6) + 4;
    });

    // Placeholder para Imagem Ilustrativa (Se for necessário no futuro)
    if (secao.id !== 'suporte' && secao.id !== 'introducao') {
        y += 10;
        doc.setDrawColor(LINHA);
        doc.setLineDashPattern([2, 1], 0);
        doc.roundedRect(20, y, largura - 40, 60, 3, 3, 'S');
        doc.setFontSize(8);
        doc.setTextColor('#999999');
        doc.text('[ ÁREA ILUSTRATIVA DA INTERFACE DO MÓDULO ]', largura / 2, y + 32, { align: 'center' });
        y += 75;
        doc.setLineDashPattern([], 0);
    }
  });

  // ── Rodapé (Números de página) ──────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#999999');
    doc.text(`Página ${i - 1} de ${pageCount - 1}`, largura - 20, altura - 10, { align: 'right' });
    doc.text('GCAC Despachante Bélico — Manual de Uso Privado', 20, altura - 10);
  }

  return doc.output('blob');
}

export async function baixarManualPdf(secoesIds: string[]): Promise<void> {
  const blob = await gerarPdfManual(secoesIds);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Manual_GCAC_${new Date().getFullYear()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

// Helper: Converte blob em base64
async function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
