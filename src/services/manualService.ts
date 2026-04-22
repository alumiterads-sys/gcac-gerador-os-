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
      '• Cadastro Detalhado: CPF, Endereço completo, Senha GOV e Observações.',
      '• Histórico de atendimentos vinculados ao cliente.',
      '• Busca rápida por nome ou CPF para agilizar o atendimento.'
    ],
    imagemPath: '/manual/clientes.png'
  },
  {
    id: 'ordens',
    titulo: '3. Ordens de Serviço (OS)',
    conteudo: [
      'A O.S. é o coração do sistema. Ela registra quais serviços serão executados.',
      'Fluxo de Trabalho:',
      '• Abertura: Ao abrir uma OS, selecione os serviços. Cada serviço pode ter seu próprio número de protocolo.',
      '• Status e Execução: Acompanhe o progresso individual de cada serviço no processo.',
      '• Timeline de Auditoria: O sistema registra automaticamente quem alterou o status ou registrou pagamentos.',
      '• Emissão: Você pode imprimir a OS em PDF com detalhamento de valores individuais.'
    ],
    imagemPath: '/manual/ordens.png'
  },
  {
    id: 'financeiro',
    titulo: '4. Painel Financeiro e Recibos',
    conteudo: [
      'O módulo financeiro permite o controle total de entradas e desempenho.',
      'Recursos:',
      '• Exportador Avançado: Gere planilhas customizadas selecionando colunas e filtros de status.',
      '• Desempenho de Equipe: Relatórios detalhados de conversão e volume por colaborador.',
      '• Emissão de Recibos: Gere recibos profissionais com um clique.',
      '• Fluxo de Caixa: Visualize o faturamento líquido descontando taxas GRU e despesas operacionais.'
    ],
    imagemPath: '/manual/financeiro.png'
  },
  {
    id: 'agendamentos',
    titulo: '5. Agendamentos e Calendário',
    conteudo: [
      'Organize as visitas e entregas de documentos.',
      '• Calendário Interativo: Veja todos os compromissos do mês.',
      '• Status: Marque compromissos como concluídos ou reagende com facilidade.',
      '• Vínculo: Cada agendamento pode estar ligado a um cliente específico.'
    ],
    imagemPath: '/manual/agendamentos.png'
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
