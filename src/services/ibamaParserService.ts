import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js usando um CDN estável
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface IbamaData {
  numeroCar?: string;
  nomeFazenda?: string;
  nomeProprietario?: string;
  cidade?: string;
  vencimento?: string;
}

export async function parseIbamaPdf(file: File): Promise<IbamaData> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  const data: IbamaData = {};

  // Normalizar texto para busca
  const cleanText = fullText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  // 1. Extrair Vencimento
  const matchVenc = fullText.match(/Fim:?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (matchVenc) {
    const [d, m, y] = matchVenc[1].split('/');
    data.vencimento = `${y}-${m}-${d}`;
  }

  // 2. IDENTIFICAR O SOLICITANTE
  const solicitanteMatch = fullText.match(/Solicitante:?\s*([A-ZÀ-ÿ\s]{10,60})(?=\s+CTF|Data|$)/i);
  const solicitanteNome = solicitanteMatch ? solicitanteMatch[1].trim().toUpperCase() : '';

  // 3. EXTRAIR CAR
  const carRegex = /([A-Z]{2}-\d{7}-[\w\s-]+)/i;
  const carMatch = fullText.match(carRegex);
  if (carMatch) {
    const carMain = carMatch[0].trim();
    const hashes = fullText.match(/[A-Z0-9]{15,}/g) || [];
    const filteredHashes = hashes.filter(h => h.length > 15 && !h.includes('/') && !h.includes('SOLICITANTE'));
    data.numeroCar = (carMain + ' ' + filteredHashes.join(' ')).replace(/\s+/g, ' ').trim();
  }

  // 4. EXTRAIR FAZENDA
  const fazendaMatch = fullText.match(/FAZENDA\s+([A-ZÀ-ÿ\s]{3,40})(?=\s+[A-Z]{2}-\d{7})/i);
  if (fazendaMatch) {
    data.nomeFazenda = `FAZENDA ${fazendaMatch[1].trim()}`.toUpperCase();
  }

  // 5. EXTRAIR CIDADE (Busca elástica para Cidade/UF)
  const cidadeRegex = /([A-ZÀ-ÿ\s]{3,30})\s*\/\s*([A-Z]{2})(?=\s|$|\n)/gi;
  let matchC;
  while ((matchC = cidadeRegex.exec(fullText)) !== null) {
    let nome = matchC[1].trim().toUpperCase();
    nome = nome.replace(/\d+/g, '').replace('MTS', '').replace('KM', '').trim();
    // Se sobrar algo como "27 ITIQUIRA", pegar só o texto
    const apenasTexto = nome.match(/[A-ZÀ-ÿ]{3,}/g);
    if (apenasTexto) {
      const nomeLimpo = apenasTexto.join(' ');
      if (nomeLimpo.length > 2 && !['RUA', 'AV', 'RODOVIA', 'ENDERECO', 'MATRICULA'].includes(nomeLimpo)) {
        data.cidade = `${nomeLimpo}/${matchC[2].toUpperCase()}`;
      }
    }
  }

  // 6. EXTRAIR PROPRIETÁRIO (Estratégia de limpeza de cabeçalhos)
  const blacklist = [
    'INSTITUTO', 'BRASILEIRO', 'IBAMA', 'MINISTERIO', 'AMBIENTE', 'RECURSOS', 'NATURAIS', 
    'RENOVAVEIS', 'SOLICITANTE', 'AUTORIZACAO', 'CONTROLADOR', 'MATRICULA', 'ENDERECO', 
    'CIDADE', 'FAZENDA', 'RODOVIA', 'ESTRADA', 'ESTA', 'PERMITE', 'TRANSPORTE', 'ESPECIES', 
    'INVASORAS', 'JAVALI', 'ARMADILHA', 'CAES', 'ESPERA', 'SIM', 'NAO', 'PROPRIEDADE', 'NOME', 'PROPRIETARIO'
  ];

  const allNames = fullText.match(/[A-ZÀ-ÿ]{3,}\s[A-ZÀ-ÿ]{2,}(\s[A-ZÀ-ÿ]{2,})*/g) || [];
  
  const validNames = allNames.filter(n => {
    let nClean = n.toUpperCase().trim();
    
    // Remover palavras de título que podem estar grudadas no nome
    blacklist.forEach(b => {
      if (nClean.startsWith(b + ' ')) nClean = nClean.replace(b + ' ', '').trim();
      if (nClean.endsWith(' ' + b)) nClean = nClean.replace(' ' + b, '').trim();
    });

    if (solicitanteNome && nClean.includes(solicitanteNome.split(' ')[0])) return false;
    // Se o bloco ainda contém palavras proibidas no MEIO dele, descartar
    if (blacklist.some(b => nClean.includes(b) && nClean.length < 15)) return false;
    if (data.nomeFazenda && nClean.includes(data.nomeFazenda.replace('FAZENDA ', ''))) return false;
    
    return nClean.length >= 5;
  });

  if (validNames.length > 0) {
    // Pegar o primeiro nome que faz sentido após o CAR
    const carIdx = data.numeroCar ? fullText.indexOf(data.numeroCar.split(' ')[0]) : 0;
    let selecionado = validNames.find(n => fullText.indexOf(n) > carIdx) || validNames[0];
    
    // Limpeza final de títulos residuais
    let final = selecionado.toUpperCase().trim();
    ['NOME DO', 'PROPRIETARIO', 'CONTROLADOR'].forEach(t => final = final.replace(t, '').trim());
    
    data.nomeProprietario = final;
  }

  return data;
}
