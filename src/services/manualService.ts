/**
 * manualService.ts
 * Centraliza o conteúdo textual do manual de instruções da plataforma.
 */

export interface SecaoManual {
  id: string;
  titulo: string;
  conteudo: string[];
  imagemPath?: string;
}

export const CONTEUDO_MANUAL: SecaoManual[] = [
  {
    id: 'introducao',
    titulo: '1. Introdução ao Sistema GCAC',
    conteudo: [
      'Bem-vindo ao sistema de Gestão GCAC Despachante Bélico.',
      'Esta plataforma foi desenvolvida para centralizar e automatizar todo o fluxo de trabalho, desde o primeiro contato com o cliente até a emissão de recibos e controle financeiro.',
      'O sistema é dividido em módulos acessíveis pela barra lateral esquerda.'
    ]
  },
  {
    id: 'clientes',
    titulo: '2. Gerenciamento de Clientes',
    conteudo: [
      'No módulo de Clientes, você pode cadastrar e consultar todos os dados dos CACs.',
      'Principais Funcionalidades:',
      '• Cadastro completo com CPF, Endereço e Filiação.',
      '• Histórico de atendimentos vinculados ao cliente.',
      '• Busca rápida por nome ou CPF para agilizar o atendimento.'
    ]
  },
  {
    id: 'ordens',
    titulo: '3. Ordens de Serviço (OS)',
    conteudo: [
      'A O.S. é o coração do sistema. Ela registra quais serviços serão executados.',
      'Fluxo de Trabalho:',
      '• Abertura: Ao abrir uma OS, selecione os serviços do catálogo.',
      '• Status: Acompanhe se o serviço está "Não Iniciado", "Em Andamento" ou "Finalizado".',
      '• Timeline: O sistema registra automaticamente cada mudança de status para auditoria.',
      '• Emissão: Você pode imprimir a OS em PDF para entregar ao cliente.'
    ]
  },
  {
    id: 'financeiro',
    titulo: '4. Painel Financeiro e Recibos',
    conteudo: [
      'O módulo financeiro permite o controle total de entradas.',
      'Recursos:',
      '• Emissão de Recibos: Gere recibos profissionais com um clique.',
      '• Fluxo de Caixa: Visualize o faturamento por período.',
      '• Orçamentos: Envie propostas formais antes de converter em OS.',
      '• Métricas: Veja o desempenho da equipe e volume de processos.'
    ]
  },
  {
    id: 'agendamentos',
    titulo: '5. Agendamentos e Calendário',
    conteudo: [
      'Organize as visitas e entregas de documentos.',
      '• Calendário Interativo: Veja todos os compromissos do mês.',
      '• Status: Marque compromissos como concluídos ou reagende com facilidade.',
      '• Vínculo: Cada agendamento pode estar ligado a um cliente específico.'
    ]
  },
  {
    id: 'configuracoes',
    titulo: '6. Configurações do Sistema',
    conteudo: [
      'Personalize o sistema de acordo com sua necessidade.',
      '• Catálogo de Serviços: Edite os valores padrão dos serviços.',
      '• Backup: O sistema realiza backup automático para o Google Drive.',
      '• Manual: É nesta seção que você gera este guia atualizado.'
    ]
  },
  {
    id: 'suporte',
    titulo: 'Suporte Técnico',
    conteudo: [
      'Caso tenha dúvidas ou encontre problemas no sistema, entre em contato:',
      'Responsável: Guilherme Gomes',
      'Contato: (64) 9.9995-9865',
      'GCAC Despachante Bélico — Jataí-GO'
    ]
  }
];
