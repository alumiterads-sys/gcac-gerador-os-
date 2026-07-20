const parseGeminiResponse = (text) => {
  let titulo = '';
  let mensagem = '';
  let explicacao = '';

  // Split text into lines
  const lines = text.split('\n');
  
  let currentSection = 'none';

  for (let line of lines) {
    const trimmedLine = line.trim();
    const lowerLine = trimmedLine.toLowerCase();

    if (!trimmedLine) continue;

    // Heuristics to detect header lines
    const hasTituloKeyword = lowerLine.includes('título') || lowerLine.includes('titulo') || lowerLine.includes('title');
    const hasMensagemKeyword = lowerLine.includes('mensagem') || lowerLine.includes('conteúdo') || lowerLine.includes('conteudo') || lowerLine.includes('message') || lowerLine.includes('content');
    const hasExplicacaoKeyword = lowerLine.includes('explicação') || lowerLine.includes('explicacao') || lowerLine.includes('observação') || lowerLine.includes('observacao');

    const isHeaderFormat = 
      (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) || 
      (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) ||
      trimmedLine.endsWith(':') ||
      (trimmedLine.includes(':') && trimmedLine.indexOf(':') < 25) ||
      (trimmedLine.includes(']') && trimmedLine.indexOf(']') < 20);

    if (isHeaderFormat && hasTituloKeyword) {
      currentSection = 'titulo';
      const parts = trimmedLine.split(/\]|:/);
      const content = parts.slice(1).join(']').replace(/[*#]/g, '').trim();
      if (content) {
        titulo += (titulo ? '\n' : '') + content;
      }
      continue;
    }
    
    if (isHeaderFormat && hasMensagemKeyword) {
      currentSection = 'mensagem';
      const parts = trimmedLine.split(/\]|:/);
      const content = parts.slice(1).join(']').replace(/[*#]/g, '').trim();
      if (content) {
        mensagem += (mensagem ? '\n' : '') + content;
      }
      continue;
    }

    if (isHeaderFormat && hasExplicacaoKeyword) {
      currentSection = 'explicacao';
      const parts = trimmedLine.split(/\]|:/);
      const content = parts.slice(1).join(']').replace(/[*#]/g, '').trim();
      if (content) {
        explicacao += (explicacao ? '\n' : '') + content;
      }
      continue;
    }

    // Append line to current section
    if (currentSection === 'titulo') {
      titulo += (titulo ? '\n' : '') + trimmedLine;
    } else if (currentSection === 'mensagem') {
      mensagem += (mensagem ? '\n' : '') + trimmedLine;
    } else if (currentSection === 'explicacao') {
      explicacao += (explicacao ? '\n' : '') + trimmedLine;
    } else {
      // Capture any text before headers as explanation/introduction
      explicacao += (explicacao ? '\n' : '') + trimmedLine;
    }
  }

  // Clean up formatting
  titulo = titulo.replace(/^["']|["']$/g, '').replace(/[*#]/g, '').trim();
  mensagem = mensagem.replace(/^["']|["']$/g, '').replace(/[*#]/g, '').trim();
  explicacao = explicacao.replace(/[*#]/g, '').trim();

  // If no sections were parsed, check if it has a simple plain text title and message
  if (!titulo && !mensagem) {
    const cleanText = text.replace(/[*#]/g, '').trim();
    const cleanLines = cleanText.split('\n').filter(l => l.trim().length > 0);
    if (cleanLines.length > 0) {
      if (cleanLines[0].length < 60) {
        titulo = cleanLines[0].trim();
        mensagem = cleanLines.slice(1).join('\n').trim();
      } else {
        mensagem = cleanText;
      }
    }
  }

  return {
    isStructured: !!(titulo || mensagem),
    titulo: titulo.substring(0, 80),
    mensagem: mensagem.substring(0, 500),
    explicacao
  };
};

const caseWithIntro = `Com certeza! Aqui está uma sugestão de notificação bem amigável e calorosa para os novos usuários do Portal G CAC:

Título: Bem-vindo ao G CAC! Ative sua conta
Mensagem: Olá, atirador! Complete o seu cadastro informando os dados das suas armas e guias do IBAMA para desbloquear todos os recursos do portal. Se precisar de ajuda, entre em contato conosco!`;

console.log("With Intro Case:", parseGeminiResponse(caseWithIntro));
