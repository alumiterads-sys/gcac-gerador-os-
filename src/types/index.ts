// ─── Tipos Principais ──────────────────────────────────────────────────────

export type StatusOS =
  | 'Aguardando Pagamento'
  | 'Parcialmente Pago'
  | 'Gratuidade'
  | 'Pago';

export type StatusOrcamento =
  | 'Pendente'
  | 'Aprovado'
  | 'Recusado';

export type FormaPagamento =
  | 'PIX'
  | 'Dinheiro'
  | 'Cartão de Crédito (Stone)'
  | 'Cartão de Débito (Stone)'
  | 'Cartão de Crédito (Infinity)'
  | 'Cartão de Débito (Infinity)'
  | 'Transferência'
  | 'A Combinar'
  | 'Pendente'
  | 'Cartão de Crédito'
  | 'Cartão de Débito';

export type CanalAtendimento =
  | 'WhatsApp'
  | 'Presencial'
  | 'Ligação'
  | 'E-mail'
  | 'Outro';

export type StatusExecucaoServico =
  | 'Não Iniciado'
  | 'Iniciado — Montando Processo'
  | 'Aguardando Documentos'
  | 'Protocolado — Ag. PF'
  | 'Concluído';

export interface ServicoConfig {
  id: string;
  nome: string;
  valorPadrao: number;
  valorFiliado: number;
  taxaPF: number;
  categoria: 'Honorário' | 'Laudo';
  pagoDiretoDefault?: boolean;
  criadoEm: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  contato: string;
  senhaGov: string;
  filiadoProTiro: boolean;
  clubeFiliado: string;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface OrdemDeServico {
  id: string;
  numero: number;

  // Dados do Cliente
  nomeCliente: string;
  contato: string;
  cpf: string;
  senhaGov: string;
  filiadoProTiro: boolean;
  clubeFiliado: string;  // preenchido se filiadoProTiro === false

  // Serviço
  servicos: {
    id: string;
    nome: string;
    detalhes: string;
    taxaPF?: number; // Armazenamos o snapshot da taxa no momento da criação
    valor?: number;  // Valor individual editável do serviço
    statusExecucao?: StatusExecucaoServico;
    pagoGRU?: boolean;
    categoria?: 'Honorário' | 'Laudo';
    pagoDireto?: boolean; // Se o pagamento vai direto ao terceiro (instrutor/psicóloga)
    protocolo?: string;
  }[];
  valor: number;
  valorPago: number;
  historicoPagamentos: PagamentoItem[];
  taxaPFTotal?: number; // Total de taxas para esta OS
  formaPagamento: FormaPagamento;

  // Controle
  status: StatusOS;
  canalAtendimento: CanalAtendimento | null;
  observacaoContato: string;
  observacoes: string;
  migrado?: boolean;

  // Sincronização
  driveArquivoJsonId: string | null;
  drivePdfId: string | null;
  ultimaSincronizacao: string | null;
  pendenteSincronizacao: boolean;

  // Datas
  criadoEm: string;
  atualizadoEm: string;
}

export interface ServicoOrcamento {
  id: string;
  nome: string;
  detalhes: string;
  valor: number;
  taxaPF?: number; // Armazenamos o snapshot da taxa no momento da criação
  categoria?: 'Honorário' | 'Laudo';
  pagoDireto?: boolean;
}

export interface Orcamento {
  id: string;
  numero: number;
  
  // Dados do Cliente
  nomeCliente: string;
  contato: string;
  cpf: string;
  senhaGov?: string;
  filiadoProTiro: boolean;
  clubeFiliado: string;
  
  // Serviço
  servicos: ServicoOrcamento[];
  valorTotal: number;
  
  // Controle
  status: StatusOrcamento;
  observacoes: string;
  convertidoOsId?: string;
  taxaPFTotal?: number;
  
  // Datas
  criadoEm: string;
  atualizadoEm: string;
}

export interface Recibo {
  id: string;
  numero: number;
  
  // Dados do Cliente
  clienteNome: string;
  clienteCPF: string;
  
  // Valores e Serviços
  servicos: {
    id: string;
    nome: string;
    valor: number;
    detalhes?: string;
  }[];
  valorTotal: number;
  
  // Referência Opcional
  ordemId?: string;
  formaPagamento: FormaPagamento;
  observacoes: string;
  
  // Emitente (Dados Fixos)
  emitenteNome: string;
  emitenteCNPJ: string;
  
  // Datas
  criadoEm: string;
}

export interface FilaSincronizacao {
  id?: number;
  ordemId: string;
  operacao: 'criar' | 'atualizar' | 'deletar';
  tentativas: number;
  criadoEm: string;
}

export interface UsuarioGoogle {
  id: string;
  nome: string;
  email: string;
  fotoPerfil: string;
  accessToken: string;
  role: 'admin' | 'instrutor';
}

// ─── Constantes ───────────────────────────────────────────────────────────

export const ATALHOS_SERVICO = [
  'Atualização de atividades',
  'Atualização de dados pessoais',
  'Atualização de endereço',
  'Autorização de aquisição de arma de fogo (pedido de compra)',
  'Cancelamento de CR',
  'Concessão de CR para pessoa física - Atirador',
  'Concessão de CR para pessoa física - Caçador',
  'Guia de Tráfego',
  'IBAMA - Emissão de CR',
  'IBAMA - Emissão de Autorização de manejo',
  'IBAMA - Declaração de acesso a propriedade',
  'Inclusão de 2º endereço',
  'Renovação de CR',
  'Renovação de CRAF',
  'Solicitação de CRAF (apostilamento de arma)',
  'Transferência entre acervos (mudança de acervo)',
  'Progressão de nível',
  'Transferência CAC x CAC',
  'Pasta de documentos personalizada',
  'Outros',
] as const;

export const CANAIS_ATENDIMENTO: CanalAtendimento[] = [
  'WhatsApp',
  'Presencial',
  'Ligação',
  'E-mail',
  'Outro',
];

export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  'PIX',
  'Dinheiro',
  'Cartão de Crédito (Stone)',
  'Cartão de Débito (Stone)',
  'Cartão de Crédito (Infinity)',
  'Cartão de Débito (Infinity)',
  'Transferência',
  'A Combinar',
  'Pendente',
];

export const STATUS_OS: StatusOS[] = [
  'Aguardando Pagamento',
  'Parcialmente Pago',
  'Gratuidade',
  'Pago',
];

export const STATUS_ORCAMENTO: StatusOrcamento[] = [
  'Pendente',
  'Aprovado',
  'Recusado',
];

export const STATUS_EXECUCAO_SERVICO: StatusExecucaoServico[] = [
  'Não Iniciado',
  'Iniciado — Montando Processo',
  'Aguardando Documentos',
  'Protocolado — Ag. PF',
  'Concluído',
];

export interface PagamentoItem {
  id: string;
  valor: number;
  metodo: FormaPagamento;
  data: string;
}

export type TipoAgendamento = 'Psicológico' | 'Tiro';

export interface Agendamento {
  id: string;
  tipo: TipoAgendamento;
  clienteNome: string;
  clienteCPF: string;
  clienteContato: string;
  clienteEndereco: string;
  arma: string;
  data: string; // YYYY-MM-DD
  horario: string;
  local: string;
  profissional: string;
  valor: number;
  dataPsicologico?: string;
  horarioPsicologico?: string;
  confirmado: boolean;
  confirmadoInstrutor?: boolean;
  despachante?: string;
  usuarioId?: string;
  status?: 'pendente' | 'realizado';
  criadoEm: string;
}

export interface Perfil {
  id: string; // Google sub
  nome: string;
  email: string;
  cpf?: string;
  contato?: string;
  role: 'admin' | 'instrutor';
  ativo: boolean;
  statusPagamento: 'em_dia' | 'atrasado' | 'pendente';
  criadoEm: string;
}
export interface NotificacaoSistema {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  tipo: 'info' | 'sucesso' | 'alerta';
  link?: string;
  criadoEm: string;
}

export interface Lembrete {
  id: string;
  titulo: string;
  descricao?: string;
  data: string;     // YYYY-MM-DD
  horario?: string; // HH:mm
  concluido: boolean;
  prioridade: 'baixa' | 'media' | 'alta';
  clienteId?: string;
  clienteNome?: string;
  usuarioId: string;
  criadoEm: string;
}
