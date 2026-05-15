import * as pdfjs from 'pdfjs-dist';

// Usar uma versão específica e estável do worker via CDN para evitar problemas de versão
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface IbamaData {
  nomeFazenda: string;
  numeroCar: string;
  nomeProprietario: string;
  cidade: string;
  vencimento: string;
}

export async function parseIbamaPdf(file: File): Promise<IbamaData> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  let textItems: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items.map((item: any) => item.str);
    textItems = [...textItems, ...items];
    fullText += items.join(' ') + '\n';
  }

  const data: IbamaData = {
    nomeFazenda: '',
    numeroCar: '',
    nomeProprietario: '',
    cidade: '',
    vencimento: ''
  };

  // 1. Extrair Vencimento (Período Fim)
  const matchVenc = fullText.match(/Fim:?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (matchVenc) {
    const [d, m, y] = matchVenc[1].split('/');
    data.vencimento = `${y}-${m}-${d}`;
  }

  // Normalizar texto para busca
  const cleanText = fullText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  
  // Isolar a área da tabela de forma mais agressiva
  // Procurar pelo cabeçalho da tabela: Propriedade CAR Matrícula...
  const tableHeaderMatch = cleanText.match(/PROPRIEDADE\s+CAR\s+MATRICULA/i);
  const tableStartIndex = tableHeaderMatch ? tableHeaderMatch.index : cleanText.indexOf('LOCAL(IS) DO MANEJO');
  
  const tableArea = tableStartIndex !== -1 ? fullText.substring(tableStartIndex!) : fullText;
  const tableAreaClean = tableStartIndex !== -1 ? cleanText.substring(tableStartIndex!) : cleanText;

  // 2. Extrair CAR (Fundamental para localizar o proprietário)
  const carRegex = /([A-Z]{2}-\d{7}-[\w\s-]+)/i;
  const carMatch = tableArea.match(carRegex);
  let carMainPart = '';
  if (carMatch) {
    carMainPart = carMatch[0].trim();
    const possibleHashes = tableArea.match(/[A-Z0-9]{10,}/g) || [];
    const filteredHashes = possibleHashes.filter(h => 
      h.length > 10 && 
      !['SOLICITANTE', 'AUTORIZACAO', 'CONTROLADOR', 'MATRICULA', 'PROPRIEDADE', 'ENDERECO', 'CIDADE', 'JAVALI', 'GLEICKSUEL'].some(excl => h.includes(excl)) &&
      !h.includes('/')
    );
    data.numeroCar = (carMainPart + ' ' + filteredHashes.join(' ')).replace(/\s+/g, ' ').trim();
  }

  // 3. Extrair Fazenda
  const fazendaMatch = tableArea.match(/FAZENDA\s+([A-ZÀ-ÿ\s]{3,40})(?=\s+[A-Z]{2}-\d{7})/i);
  if (fazendaMatch) {
    data.nomeFazenda = `FAZENDA ${fazendaMatch[1].trim()}`.toUpperCase().replace(/\s+/g, ' ');
  }

  // 4. Extrair Proprietário (O nome que vem LOGO APÓS o CAR na tabela)
  // Estratégia: Pegar o texto após o CAR e buscar o primeiro bloco de nome maiúsculo
  if (carMainPart) {
    const afterCarText = tableArea.substring(tableArea.indexOf(carMainPart) + carMainPart.length);
    const nameBlocks = afterCarText.match(/[A-ZÀ-ÿ]{4,}\s[A-ZÀ-ÿ]{4,}(\s[A-ZÀ-ÿ]{2,})*/g) || [];
    const blacklist = ['RODOVIA', 'ESTRADA', 'AVENIDA', 'RUA', 'CIDADE', 'MATRICULA', 'ENDERECO', 'PROPRIETARIO', 'CONTROLADOR'];
    
    const ownerName = nameBlocks.find(n => {
       const nClean = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
       return !blacklist.some(b => nClean.includes(b)) && nClean.length > 8;
    });
    
    if (ownerName) {
      data.nomeProprietario = ownerName.trim().toUpperCase();
      // Se houver um bloco de nome logo em seguida (sobrenome em outra linha), podemos tentar anexar
      const nextIdx = nameBlocks.indexOf(ownerName) + 1;
      if (nameBlocks[nextIdx] && afterCarText.indexOf(nameBlocks[nextIdx]) < afterCarText.indexOf(ownerName) + 50) {
        // data.nomeProprietario += ' ' + nameBlocks[nextIdx].trim().toUpperCase();
      }
    }
  }

  // Fallback para Proprietário se a lógica do CAR falhar
  if (!data.nomeProprietario) {
    const fallbackNomes = tableArea.match(/[A-ZÀ-ÿ]{5,}\s[A-ZÀ-ÿ]{5,}(\s[A-ZÀ-ÿ]{2,})*/g) || [];
    const filtrados = fallbackNomes.filter(n => 
      !['GLEICKSUEL', 'FERRERA', 'INSTITUTO', 'BRASILEIRO', 'FAZENDA'].some(excl => n.includes(excl))
    );
    if (filtrados.length > 0) data.nomeProprietario = filtrados[0].toUpperCase();
  }

  // 5. Extrair Cidade/UF
  // Buscar no final da área da tabela
  const cidadeRegex = /([A-ZÀ-ÿ\s]{3,30})\/([A-Z]{2})(?=\s|$|\n)/g;
  let matches;
  while ((matches = cidadeRegex.exec(tableArea)) !== null) {
    const nome = matches[1].trim().toUpperCase();
    if (!['MTS', 'KM', 'RUA', 'AV', 'RODOVIA', 'ENDERECO'].some(excl => nome.includes(excl))) {
      data.cidade = `${nome}/${matches[2].toUpperCase()}`;
    }
  }

  return data;
}
