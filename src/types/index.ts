// ─── Tipos Principais ──────────────────────────────────────────────────────

export type StatusOS =
  | 'Aguardando Pagamento'
  | 'Gratuidade'
  | 'Pago';

export type FormaPagamento =
  | 'PIX'
  | 'Dinheiro'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Transferência'
  | 'A Combinar';

export type CanalAtendimento =
  | 'WhatsApp'
  | 'Presencial'
  | 'Ligação'
  | 'E-mail'
  | 'Outro';

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  contato: string;
  senhaGov: string;
  filiadoProTiro: boolean;
  clubeFiliado: string;
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
  }[];
  valor: number;
  formaPagamento: FormaPagamento;

  // Controle
  status: StatusOS;
  canalAtendimento: CanalAtendimento | null;
  observacaoContato: string;
  observacoes: string;

  // Sincronização
  driveArquivoJsonId: string | null;
  drivePdfId: string | null;
  ultimaSincronizacao: string | null;
  pendenteSincronizacao: boolean;

  // Datas
  criadoEm: string;
  atualizadoEm: string;
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
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência',
  'A Combinar',
];

export const STATUS_OS: StatusOS[] = [
  'Aguardando Pagamento',
  'Gratuidade',
  'Pago',
];
