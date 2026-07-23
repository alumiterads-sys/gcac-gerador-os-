import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  BarChart3, 
  Users, 
  Bell, 
  Calendar, 
  Download, 
  Printer, 
  TrendingUp, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  DollarSign, 
  Percent, 
  Target, 
  MapPin, 
  Shield, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Info,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrdens } from '../../context/OrdensContext';
import { useClientes } from '../../context/ClientesContext';
import { useFinanceiro } from '../../context/FinanceiroContext';
import { buscarAlertasGlobais, buscarAlertasCacsVinculados } from '../../services/vencimentosService';
import { formatarMoeda, formatarData, formatarCPF, formatarTelefone } from '../../utils/formatters';
import { 
  format, 
  parseISO, 
  isWithinInterval, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  subDays,
  isBefore,
  isAfter,
  differenceInDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { supabase } from '../../db/supabase';

type TabType = 'ordens' | 'financeiro' | 'clientes' | 'alertas';
type PeriodoPreset = 'hoje' | 'semana' | 'mes' | '30dias' | 'ano' | 'personalizado';

interface AlertaDocumento {
  id: string;
  tipo: string;
  label: string;
  dataVencimento: string;
  nivel: string;
  diasRestantes: number;
  clienteNome: string;
  clienteId: string;
  armaModelo?: string;
  armaId?: string;
  documentoId?: string;
  isVinculado?: boolean;
  emRenovacao?: boolean;
}

export function Relatorios() {
  const { usuario } = useAuth();
  const { ordens } = useOrdens();
  const { clientes } = useClientes();
  const { despesas } = useFinanceiro();

  // Abas e Filtros
  const [activeTab, setActiveTab] = useState<TabType>('ordens');
  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>('mes');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Estados locais para dados avançados
  const [armas, setArmas] = useState<any[]>([]);
  const [gts, setGts] = useState<any[]>([]);
  const [manejos, setManejos] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<AlertaDocumento[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(false);

  // Manipular alteração de presets
  const handlePresetChange = (preset: PeriodoPreset) => {
    setPresetPeriodo(preset);
    const hoje = new Date();
    let inicio = startOfMonth(hoje);
    let fim = endOfMonth(hoje);

    switch (preset) {
      case 'hoje':
        inicio = startOfDay(hoje);
        fim = endOfDay(hoje);
        break;
      case 'semana':
        inicio = startOfWeek(hoje, { weekStartsOn: 1 }); // Segunda
        fim = endOfWeek(hoje, { weekStartsOn: 1 }); // Domingo
        break;
      case 'mes':
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
        break;
      case '30dias':
        inicio = subDays(hoje, 30);
        fim = endOfDay(hoje);
        break;
      case 'ano':
        inicio = startOfYear(hoje);
        fim = endOfYear(hoje);
        break;
      default:
        return; // não altera se for personalizado
    }

    setDataInicio(format(inicio, 'yyyy-MM-dd'));
    setDataFim(format(fim, 'yyyy-MM-dd'));
  };

  // Carregar dados de Armas, GTs, Manejos e Alertas no mount
  useEffect(() => {
    async function carregarDadosRelatorios() {
      if (!usuario?.empresaId) return;
      setCarregandoDados(true);
      try {
        // 1. Armas
        const { data: armasData } = await supabase
          .from('armas')
          .select('*, clientes:cliente_id(nome)')
          .eq('empresa_id', usuario.empresaId);
        
        // 2. GTs
        const { data: gtsData } = await supabase
          .from('guias_trafego')
          .select('*, armas:arma_id(modelo, cliente_id, clientes:cliente_id(nome))')
          .eq('empresa_id', usuario.empresaId);

        // 3. Manejos
        const { data: manejosData } = await supabase
          .from('autorizacoes_manejo')
          .select('*, clientes:cliente_id(nome)')
          .eq('empresa_id', usuario.empresaId);

        // 4. Alertas
        const [alertasDiretos, alertasVinculados] = await Promise.all([
          buscarAlertasGlobais(usuario.empresaId),
          buscarAlertasCacsVinculados(usuario.empresaId)
        ]);

        if (armasData) setArmas(armasData);
        if (gtsData) setGts(gtsData);
        if (manejosData) setManejos(manejosData);
        
        const todosAlertas = [...alertasDiretos, ...alertasVinculados];
        setAlertas(todosAlertas as AlertaDocumento[]);

      } catch (err) {
        console.error('Erro ao carregar dados complementares para relatórios:', err);
      } finally {
        setCarregandoDados(false);
      }
    }

    carregarDadosRelatorios();
  }, [usuario?.empresaId]);

  // Intervalo de Datas para Filtro
  const intervalFiltro = useMemo(() => {
    return {
      start: startOfDay(parseISO(dataInicio)),
      end: endOfDay(parseISO(dataFim))
    };
  }, [dataInicio, dataFim]);

  // Filtragem de OS pelo período
  const ordensFiltradas = useMemo(() => {
    return ordens.filter(o => {
      if (!o.criadoEm) return false;
      const dataCriacao = parseISO(o.criadoEm);
      return isWithinInterval(dataCriacao, intervalFiltro);
    });
  }, [ordens, intervalFiltro]);

  // Filtragem de Despesas pelo período
  const despesasFiltradas = useMemo(() => {
    return despesas.filter(d => {
      if (!d.data) return false;
      const dataDespesa = parseISO(d.data);
      return isWithinInterval(dataDespesa, intervalFiltro);
    });
  }, [despesas, intervalFiltro]);

  // Filtragem de Alertas pelo período de vencimento (opcional ou exibir todos os ativos)
  const alertasFiltrados = useMemo(() => {
    return alertas.filter(alerta => {
      if (!alerta.dataVencimento) return true;
      const dataVenc = parseISO(alerta.dataVencimento);
      return isWithinInterval(dataVenc, intervalFiltro);
    });
  }, [alertas, intervalFiltro]);

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULOS: ORDENS DE SERVIÇO
  // ───────────────────────────────────────────────────────────────────────────
  const statusOsCounts = useMemo(() => {
    const counts = { Pago: 0, 'Aguardando Pagamento': 0, 'Parcialmente Pago': 0, Gratuidade: 0 };
    ordensFiltradas.forEach(o => {
      if (o.status in counts) {
        counts[o.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [ordensFiltradas]);

  const execStatusCounts = useMemo(() => {
    const counts = { 'Não Iniciado': 0, 'Iniciado — Montando Processo': 0, 'Aguardando Documentos': 0, 'Protocolado — Ag. PF': 0, Concluído: 0 };
    ordensFiltradas.forEach(o => {
      o.servicos?.forEach(s => {
        const stat = s.statusExecucao || 'Não Iniciado';
        if (stat in counts) {
          counts[stat as keyof typeof counts]++;
        }
      });
    });
    return counts;
  }, [ordensFiltradas]);

  const ordensPorPeriodoSemanaMesAno = useMemo(() => {
    const agora = new Date();
    const startWeek = startOfWeek(agora, { weekStartsOn: 1 });
    const endWeek = endOfWeek(agora, { weekStartsOn: 1 });
    const startMonth = startOfMonth(agora);
    const endMonth = endOfMonth(agora);
    const startYear = startOfYear(agora);
    const endYear = endOfYear(agora);

    let semana = 0;
    let mes = 0;
    let ano = 0;

    ordens.forEach(o => {
      if (!o.criadoEm) return;
      const date = parseISO(o.criadoEm);
      if (isWithinInterval(date, { start: startWeek, end: endWeek })) semana++;
      if (isWithinInterval(date, { start: startMonth, end: endMonth })) mes++;
      if (isWithinInterval(date, { start: startYear, end: endYear })) ano++;
    });

    return { semana, mes, ano };
  }, [ordens]);

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULOS: FINANCEIRO
  // ───────────────────────────────────────────────────────────────────────────
  const faturamentoStats = useMemo(() => {
    let faturamentoBruto = 0;
    let totalDespesasVal = 0;
    let aReceberVal = 0;

    ordens.forEach(o => {
      o.historicoPagamentos?.forEach(p => {
        if (!p.data) return;
        const dataPag = parseISO(p.data);
        if (isWithinInterval(dataPag, intervalFiltro)) {
          faturamentoBruto += p.valor;
        }
      });

      const dataCriacao = parseISO(o.criadoEm);
      if (isWithinInterval(dataCriacao, intervalFiltro)) {
        const restante = Math.max(0, (o.valor || 0) - (o.desconto || 0) - (o.valorPago || 0));
        if (o.status !== 'Pago' && o.status !== 'Gratuidade') {
          aReceberVal += restante;
        }
      }
    });

    despesasFiltradas.forEach(d => {
      totalDespesasVal += d.valor || 0;
    });

    const saldoLiquido = faturamentoBruto - totalDespesasVal;
    const margemLucro = faturamentoBruto > 0 ? (saldoLiquido / faturamentoBruto) * 100 : 0;

    return {
      faturamentoBruto,
      totalDespesas: totalDespesasVal,
      saldoLiquido,
      margemLucro,
      aReceber: aReceberVal
    };
  }, [ordens, despesasFiltradas, intervalFiltro]);

  const receitasPorMetodo = useMemo(() => {
    const metodos: Record<string, { count: number; total: number }> = {};
    ordens.forEach(o => {
      o.historicoPagamentos?.forEach(p => {
        if (!p.data) return;
        const dataPag = parseISO(p.data);
        if (isWithinInterval(dataPag, intervalFiltro)) {
          const met = p.metodo || 'Outro';
          if (!metodos[met]) {
            metodos[met] = { count: 0, total: 0 };
          }
          metodos[met].count++;
          metodos[met].total += p.valor;
        }
      });
    });
    return Object.entries(metodos).map(([metodo, dados]) => ({
      metodo,
      ...dados
    })).sort((a, b) => b.total - a.total);
  }, [ordens, intervalFiltro]);

  const despesasPorCategoria = useMemo(() => {
    const categorias: Record<string, { count: number; total: number }> = {};
    despesasFiltradas.forEach(d => {
      const cat = d.categoria || 'Outros';
      if (!categorias[cat]) {
        categorias[cat] = { count: 0, total: 0 };
      }
      categorias[cat].count++;
      categorias[cat].total += d.valor || 0;
    });
    return Object.entries(categorias).map(([categoria, dados]) => ({
      categoria,
      ...dados
    })).sort((a, b) => b.total - a.total);
  }, [despesasFiltradas]);

  const comissoesEquipe = useMemo(() => {
    const repasses: Record<string, { count: number; total: number }> = {};
    ordensFiltradas.forEach(o => {
      o.servicos?.forEach(s => {
        const resp = s.responsavelNome;
        const valorRep = s.valorRepasse || 0;
        if (resp && valorRep > 0) {
          const respTrim = resp.trim();
          if (!repasses[respTrim]) {
            repasses[respTrim] = { count: 0, total: 0 };
          }
          repasses[respTrim].count++;
          repasses[respTrim].total += valorRep;
        }
      });
    });
    return Object.entries(repasses).map(([colaborador, dados]) => ({
      colaborador,
      ...dados
    })).sort((a, b) => b.total - a.total);
  }, [ordensFiltradas]);

  const extratoTransacoes = useMemo(() => {
    const transacoes: any[] = [];

    ordens.forEach(o => {
      o.historicoPagamentos?.forEach(p => {
        if (!p.data) return;
        const dataPag = parseISO(p.data);
        if (isWithinInterval(dataPag, intervalFiltro)) {
          transacoes.push({
            id: `rec-${p.id}`,
            data: p.data,
            tipo: 'entrada',
            categoria: p.metodo,
            descricao: `Recebimento OS-${String(o.numero).padStart(4, '0')}`,
            entidade: o.nomeCliente,
            valor: p.valor
          });
        }
      });
    });

    despesasFiltradas.forEach(d => {
      transacoes.push({
        id: `desp-${d.id}`,
        data: d.data,
        tipo: 'saida',
        categoria: d.categoria,
        descricao: d.descricao,
        entidade: 'Despesa PJ',
        valor: d.valor
      });
    });

    return transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [ordens, despesasFiltradas, intervalFiltro]);

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULOS: CLIENTES E ACERVO
  // ───────────────────────────────────────────────────────────────────────────
  const clientesStats = useMemo(() => {
    const total = clientes.length;
    const filiados = clientes.filter(c => c.filiadoProTiro).length;
    const naoFiliados = total - filiados;

    const totalArmas = armas.length;
    const totalGts = gts.length;
    const totalManejos = manejos.filter(m => m.status === 'Ativo').length;

    return { total, filiados, naoFiliados, totalArmas, totalGts, totalManejos };
  }, [clientes, armas, gts, manejos]);

  const armasPorAcervo = useMemo(() => {
    const acervos: Record<string, number> = { 'Tiro Desportivo': 0, 'Caça': 0, 'Coleção': 0 };
    armas.forEach(a => {
      const ac = a.acervo || 'Tiro Desportivo';
      if (ac in acervos) {
        acervos[ac]++;
      } else {
        acervos[ac] = (acervos[ac] || 0) + 1;
      }
    });
    return Object.entries(acervos).map(([acervo, count]) => ({ acervo, count }));
  }, [armas]);

  const armasPorFabricante = useMemo(() => {
    const fabricantes: Record<string, number> = {};
    armas.forEach(a => {
      if (a.fabricante) {
        const fab = a.fabricante.toUpperCase().trim();
        fabricantes[fab] = (fabricantes[fab] || 0) + 1;
      }
    });
    return Object.entries(fabricantes)
      .map(([fabricante, count]) => ({ fabricante, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [armas]);

  const armasPorCalibre = useMemo(() => {
    const calibres: Record<string, number> = {};
    armas.forEach(a => {
      if (a.calibre) {
        const cal = a.calibre.toUpperCase().trim();
        calibres[cal] = (calibres[cal] || 0) + 1;
      }
    });
    return Object.entries(calibres)
      .map(([calibre, count]) => ({ calibre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [armas]);

  const tabelaClientesRelatorio = useMemo(() => {
    return clientes.map(c => {
      const armasCliente = armas.filter(a => a.cliente_id === c.id);
      const gtsCliente = gts.filter(g => g.armas?.cliente_id === c.id || g.arma_id && armasCliente.some(a => a.id === g.arma_id));
      const manejosCliente = manejos.filter(m => m.cliente_id === c.id && m.status === 'Ativo');

      return {
        id: c.id,
        nome: c.nome,
        cpf: c.cpf,
        contato: c.contato,
        filiado: c.filiadoProTiro ? 'Sim' : 'Não',
        numeroCr: c.numeroCr || 'N/I',
        vencimentoCr: c.vencimentoCr ? formatarData(c.vencimentoCr) : 'N/I',
        vencimentoCrRaw: c.vencimentoCr,
        numeroCrIbama: c.numeroCrIbama || 'N/I',
        vencimentoCrIbama: c.vencimentoCrIbama ? formatarData(c.vencimentoCrIbama) : 'N/I',
        vencimentoCrIbamaRaw: c.vencimentoCrIbama,
        armasCount: armasCliente.length,
        gtsCount: gtsCliente.length,
        manejosCount: manejosCliente.length
      };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [clientes, armas, gts, manejos]);

  // ───────────────────────────────────────────────────────────────────────────
  // CÁLCULOS: PAINEL DE ALERTAS
  // ───────────────────────────────────────────────────────────────────────────
  const alertasStats = useMemo(() => {
    let vencidos = 0;
    let criticos = 0;
    let avisos = 0;
    let emRenovacao = 0;

    alertasFiltrados.forEach(a => {
      if (a.emRenovacao) {
        emRenovacao++;
      } else if (a.nivel === 'VENCIDO' || a.diasRestantes < 0) {
        vencidos++;
      } else if (a.nivel === 'CRITICO' || a.diasRestantes <= 30) {
        criticos++;
      } else {
        avisos++;
      }
    });

    return {
      total: alertasFiltrados.length,
      vencidos,
      criticos,
      avisos,
      emRenovacao
    };
  }, [alertasFiltrados]);

  // ───────────────────────────────────────────────────────────────────────────
  // EXPORTAÇÃO EXCEL (.xlsx)
  // ───────────────────────────────────────────────────────────────────────────
  const exportarParaExcel = () => {
    const wb = XLSX.utils.book_new();
    const dataRefStr = `${dataInicio}_a_${dataFim}`;

    if (activeTab === 'ordens') {
      const resumoOS = [
        ['Métrica', 'Quantidade'],
        ['Total de O.S. no Período', ordensFiltradas.length],
        ['Status: Pago', statusOsCounts.Pago],
        ['Status: Aguardando Pagamento', statusOsCounts['Aguardando Pagamento']],
        ['Status: Parcialmente Pago', statusOsCounts['Parcialmente Pago']],
        ['Status: Gratuidade', statusOsCounts.Gratuidade],
        ['Serviços: Não Iniciado', execStatusCounts['Não Iniciado']],
        ['Serviços: Iniciado', execStatusCounts['Iniciado — Montando Processo']],
        ['Serviços: Aguardando Documentos', execStatusCounts['Aguardando Documentos']],
        ['Serviços: Protocolado', execStatusCounts['Protocolado — Ag. PF']],
        ['Serviços: Concluído', execStatusCounts.Concluído],
      ];
      const wsRes = XLSX.utils.aoa_to_sheet(resumoOS);
      XLSX.utils.book_append_sheet(wb, wsRes, 'Resumo OS');

      const detalheOS = ordensFiltradas.map(o => ({
        'Número OS': o.numero,
        'Cliente': o.nomeCliente,
        'CPF': o.cpf,
        'Contato': o.contato,
        'Data Abertura': o.criadoEm ? format(parseISO(o.criadoEm), 'dd/MM/yyyy HH:mm') : '',
        'Valor Total': o.valor,
        'Desconto': o.desconto || 0,
        'Valor Pago': o.valorPago,
        'Status Financeiro': o.status,
        'Canal Atendimento': o.canalAtendimento || '',
        'Serviços': o.servicos?.map(s => `${s.nome} (${s.statusExecucao || 'N/I'})`).join(' | ') || ''
      }));
      const wsDet = XLSX.utils.json_to_sheet(detalheOS);
      XLSX.utils.book_append_sheet(wb, wsDet, 'Listagem OS');

      XLSX.writeFile(wb, `Relatorio_OrdensServico_${dataRefStr}.xlsx`);

    } else if (activeTab === 'financeiro') {
      const resumoFin = [
        ['Métrica', 'Valor'],
        ['Faturamento Bruto', faturamentoStats.faturamentoBruto],
        ['Total Despesas', faturamentoStats.totalDespesas],
        ['Saldo Líquido', faturamentoStats.saldoLiquido],
        ['Margem de Lucro (%)', faturamentoStats.margemLucro.toFixed(2) + '%'],
        ['A Receber (Previsão)', faturamentoStats.aReceber],
      ];
      const wsRes = XLSX.utils.aoa_to_sheet(resumoFin);
      XLSX.utils.book_append_sheet(wb, wsRes, 'Resumo Financeiro');

      const extratoDet = extratoTransacoes.map(t => ({
        'Data': format(parseISO(t.data), 'dd/MM/yyyy'),
        'Tipo': t.tipo === 'entrada' ? 'Entrada (Recebimento)' : 'Saída (Despesa)',
        'Categoria / Método': t.categoria,
        'Descrição': t.descricao,
        'Cliente / Destino': t.entidade,
        'Valor (R$)': t.valor
      }));
      const wsExt = XLSX.utils.json_to_sheet(extratoDet);
      XLSX.utils.book_append_sheet(wb, wsExt, 'Extrato Financeiro');

      const comissoesDet = comissoesEquipe.map(c => ({
        'Colaborador': c.colaborador,
        'Serviços Realizados': c.count,
        'Total Comissão (R$)': c.total
      }));
      const wsCom = XLSX.utils.json_to_sheet(comissoesDet);
      XLSX.utils.book_append_sheet(wb, wsCom, 'Comissões');

      XLSX.writeFile(wb, `Relatorio_Financeiro_${dataRefStr}.xlsx`);

    } else if (activeTab === 'clientes') {
      const resumoCli = [
        ['Indicador', 'Valor'],
        ['Clientes Cadastrados', clientesStats.total],
        ['Filiados ProTiro', clientesStats.filiados],
        ['Não Filiados', clientesStats.naoFiliados],
        ['Total de Armas', clientesStats.totalArmas],
        ['Total de GTs', clientesStats.totalGts],
        ['Total de Manejos Ativos', clientesStats.totalManejos],
      ];
      const wsRes = XLSX.utils.aoa_to_sheet(resumoCli);
      XLSX.utils.book_append_sheet(wb, wsRes, 'Estatísticas');

      const listagemCli = tabelaClientesRelatorio.map(c => ({
        'Nome': c.nome,
        'CPF': c.cpf,
        'Contato': c.contato,
        'Filiado': c.filiado,
        'Nº CR Exército': c.numeroCr,
        'Vencimento CR': c.vencimentoCr,
        'Nº CR IBAMA': c.numeroCrIbama,
        'Vencimento IBAMA': c.vencimentoCrIbama,
        'Total Armas': c.armasCount,
        'Total GTs': c.gtsCount,
        'Manejos Ativos': c.manejosCount
      }));
      const wsList = XLSX.utils.json_to_sheet(listagemCli);
      XLSX.utils.book_append_sheet(wb, wsList, 'Clientes');

      const armasDet = armas.map(a => ({
        'Proprietário': a.clientes?.nome || 'N/I',
        'Tipo': a.tipo,
        'Modelo': a.modelo,
        'Calibre': a.calibre,
        'Fabricante': a.fabricante,
        'Nº Série': a.numeroSerie,
        'Nº Sigma': a.numeroSigma,
        'Acervo': a.acervo,
        'Vencimento CRAF': a.vencimentoCraf ? format(parseISO(a.vencimentoCraf), 'dd/MM/yyyy') : 'N/I'
      }));
      const wsArm = XLSX.utils.json_to_sheet(armasDet);
      XLSX.utils.book_append_sheet(wb, wsArm, 'Armas Cadastradas');

      XLSX.writeFile(wb, `Relatorio_Clientes_Acervo_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

    } else if (activeTab === 'alertas') {
      const resumoAlert = [
        ['Métrica', 'Valor'],
        ['Total Alertas', alertasStats.total],
        ['Vencidos', alertasStats.vencidos],
        ['Críticos (<30d)', alertasStats.criticos],
        ['Avisos (<90d)', alertasStats.avisos],
        ['Em Renovação', alertasStats.emRenovacao]
      ];
      const wsRes = XLSX.utils.aoa_to_sheet(resumoAlert);
      XLSX.utils.book_append_sheet(wb, wsRes, 'Resumo Alertas');

      const detalheAlert = alertasFiltrados.map(a => ({
        'Tipo Documento': a.tipo,
        'Descrição Registro': a.label,
        'Nome Cliente': a.clienteNome,
        'Vencimento': a.dataVencimento ? format(parseISO(a.dataVencimento), 'dd/MM/yyyy') : '',
        'Dias Restantes': a.diasRestantes,
        'Status Alerta': a.emRenovacao ? 'Em Renovação' : a.diasRestantes < 0 ? 'Vencido' : a.nivel
      }));
      const wsDet = XLSX.utils.json_to_sheet(detalheAlert);
      XLSX.utils.book_append_sheet(wb, wsDet, 'Alertas Documentos');

      XLSX.writeFile(wb, `Relatorio_Vencimentos_${dataRefStr}.xlsx`);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const periodoExibicaoText = useMemo(() => {
    if (presetPeriodo === 'personalizado') {
      return `Período: ${format(parseISO(dataInicio), 'dd/MM/yyyy')} a ${format(parseISO(dataFim), 'dd/MM/yyyy')}`;
    }
    const presetsNomes = {
      hoje: 'Hoje',
      semana: 'Esta Semana',
      mes: 'Este Mês',
      '30dias': 'Últimos 30 Dias',
      ano: 'Ano Atual'
    };
    return `Período: ${presetsNomes[presetPeriodo as keyof typeof presetsNomes]} (${format(parseISO(dataInicio), 'dd/MM/yyyy')} a ${format(parseISO(dataFim), 'dd/MM/yyyy')})`;
  }, [presetPeriodo, dataInicio, dataFim]);

  return (
    <div className="w-full space-y-6">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print, .print\\:hidden, button, input, select, aside, nav, header {
            display: none !important;
          }
          
          body, html, #scroll-main, main, .flex-grow {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          .print-header {
            display: flex !important;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #333 !important;
            padding-bottom: 5px !important;
            margin-bottom: 20px !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
            color: #000 !important;
          }
          th {
            background-color: #f3f4f6 !important;
            border-bottom: 1.5px solid #000 !important;
            padding: 6px 4px !important;
            font-weight: bold !important;
            text-align: left !important;
          }
          td {
            border-bottom: 1px solid #e5e7eb !important;
            padding: 5px 4px !important;
            word-break: break-word !important;
          }

          .print-cards-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
          }
          .print-card {
            border: 1px solid #d1d5db !important;
            background-color: #f9fafb !important;
            padding: 8px !important;
            border-radius: 6px !important;
            text-align: center !important;
          }
          .print-card h4 {
            font-size: 8px !important;
            text-transform: uppercase !important;
            color: #4b5563 !important;
            margin-bottom: 2px !important;
          }
          .print-card p {
            font-size: 14px !important;
            font-weight: 800 !important;
            color: #000 !important;
          }
          
          .print-section-title {
            font-size: 12px !important;
            font-weight: bold !important;
            border-bottom: 1px solid #ccc !important;
            padding-bottom: 3px !important;
            margin-top: 15px !important;
            margin-bottom: 8px !important;
            text-transform: uppercase !important;
          }
          
          #print-area {
            display: block !important;
            visibility: visible !important;
          }
        }
      `}} />

      {/* CABEÇALHO DA TELA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-dark-5 pb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="text-brand-blue" />
            Central de Relatórios
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Analise e exporte dados consolidados de OS, financeiro, clientes e alertas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            onClick={handleImprimir}
            className="btn-ghost btn-sm text-xs flex items-center gap-1.5"
            title="Imprimir ou Salvar como PDF"
          >
            <Printer size={14} />
            <span>Imprimir / PDF</span>
          </button>
          <button 
            onClick={exportarParaExcel}
            className="btn-success btn-sm text-xs flex items-center gap-1.5 font-bold"
            title="Exportar dados para Excel (.xlsx)"
          >
            <Download size={14} />
            <span>Exportar Planilha</span>
          </button>
        </div>
      </div>

      {/* FILTRO DE DATA GERAL */}
      <div className="card bg-brand-dark-2/50 border-brand-dark-5 p-4 sm:p-5 flex flex-col gap-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex flex-wrap gap-1.5">
            {(['hoje', 'semana', 'mes', '30dias', 'ano'] as PeriodoPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  presetPeriodo === p
                    ? 'bg-brand-blue text-white shadow-glow-blue'
                    : 'bg-brand-dark-4 hover:bg-brand-dark-5 text-gray-400 hover:text-white border border-brand-dark-5'
                }`}
              >
                {p === '30dias' ? '30 Dias' : p === 'mes' ? 'Mês' : p === 'semana' ? 'Semana' : p === 'ano' ? 'Ano' : p}
              </button>
            ))}
            <button
              onClick={() => setPresetPeriodo('personalizado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                presetPeriodo === 'personalizado'
                  ? 'bg-brand-blue text-white shadow-glow-blue'
                  : 'bg-brand-dark-4 hover:bg-brand-dark-5 text-gray-400 hover:text-white border border-brand-dark-5'
              }`}
            >
              Personalizado
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-3 text-gray-500" />
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value);
                  setPresetPeriodo('personalizado');
                }}
                className="bg-brand-dark-4 border border-brand-dark-5 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-blue w-36"
              />
            </div>
            <span className="text-gray-500 text-xs">até</span>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-3 text-gray-500" />
              <input
                type="date"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value);
                  setPresetPeriodo('personalizado');
                }}
                className="bg-brand-dark-4 border border-brand-dark-5 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-blue w-36"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ABAS */}
      <div className="border-b border-brand-dark-5 flex overflow-x-auto print:hidden no-scrollbar">
        <button
          onClick={() => setActiveTab('ordens')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ordens'
              ? 'border-brand-blue text-brand-blue-light bg-brand-blue/5'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
          }`}
        >
          <FileText size={16} />
          Ordens de Serviço
        </button>
        <button
          onClick={() => setActiveTab('financeiro')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'financeiro'
              ? 'border-brand-blue text-brand-blue-light bg-brand-blue/5'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
          }`}
        >
          <BarChart3 size={16} />
          Financeiro
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'clientes'
              ? 'border-brand-blue text-brand-blue-light bg-brand-blue/5'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
          }`}
        >
          <Users size={16} />
          Clientes & Acervo
        </button>
        <button
          onClick={() => setActiveTab('alertas')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'alertas'
              ? 'border-brand-blue text-brand-blue-light bg-brand-blue/5'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
          }`}
        >
          <Bell size={16} />
          Painel de Alertas
        </button>
      </div>

      {/* ÁREA DE CONTEÚDO IMPRIMÍVEL */}
      <div id="print-area" className="space-y-6">
        
        <div className="hidden print-header">
          <div>
            <h2 className="text-lg font-black text-black tracking-tight">PORTAL GCAC - RELATÓRIOS</h2>
            <p className="text-[10px] text-gray-600 font-bold uppercase">{usuario?.dadosEmpresa?.nome || usuario?.empresaNome || 'GCAC'}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold uppercase">
              {activeTab === 'ordens' ? 'Relatório de Ordens de Serviço' :
               activeTab === 'financeiro' ? 'Relatório Financeiro & Fluxo de Caixa' :
               activeTab === 'clientes' ? 'Relatório de Clientes & Acervo' :
               'Relatório de Alertas e Vencimento de Documentos'}
            </h3>
            <p className="text-[9px] text-gray-600 font-bold">{periodoExibicaoText}</p>
          </div>
        </div>

        {carregandoDados && (
          <div className="text-center py-12 print:hidden">
            <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-xs">Carregando dados complementares...</p>
          </div>
        )}

        {/* 1. ORDENS DE SERVIÇO */}
        {!carregandoDados && activeTab === 'ordens' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print-cards-grid">
              <div className="card bg-brand-dark-3 border-brand-dark-5 flex flex-col justify-between print-card">
                <div>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Total OS no Período</p>
                  <h3 className="text-2xl font-black text-white mt-1">{ordensFiltradas.length}</h3>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-brand-blue-light font-bold mt-3 print:hidden">
                  <TrendingUp size={12} />
                  <span>Na semana: {ordensPorPeriodoSemanaMesAno.semana}</span>
                </div>
              </div>
              
              <div className="card bg-brand-dark-3 border-brand-dark-5 flex flex-col justify-between print-card">
                <div>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Aguardando Pagamento</p>
                  <h3 className="text-2xl font-black text-yellow-500 mt-1">{statusOsCounts['Aguardando Pagamento']}</h3>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold mt-3 print:hidden">
                  <Clock size={12} />
                  <span>No mês: {ordensPorPeriodoSemanaMesAno.mes}</span>
                </div>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 flex flex-col justify-between print-card">
                <div>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Pagas / Parciais</p>
                  <h3 className="text-2xl font-black text-brand-green mt-1">
                    {statusOsCounts.Pago + statusOsCounts['Parcialmente Pago']}
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold mt-3 print:hidden">
                  <CheckCircle2 size={12} />
                  <span>No ano: {ordensPorPeriodoSemanaMesAno.ano}</span>
                </div>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 flex flex-col justify-between print-card">
                <div>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Gratuidades</p>
                  <h3 className="text-2xl font-black text-purple-400 mt-1">{statusOsCounts.Gratuidade}</h3>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold mt-3 print:hidden">
                  <Info size={12} />
                  <span>OS sem custo</span>
                </div>
              </div>
            </div>

            <div className="card bg-brand-dark-3/30 border-brand-dark-5 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider print-section-title">Status de Execução dos Serviços</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(execStatusCounts).map(([status, count]) => (
                  <div key={status} className="bg-brand-dark-4/50 border border-brand-dark-5/50 rounded-xl p-3 text-center print:border-gray-300 print:bg-gray-50">
                    <p className="text-gray-500 text-[9px] font-black uppercase tracking-tight truncate" title={status}>
                      {status === 'Iniciado — Montando Processo' ? 'Iniciado' : 
                       status === 'Protocolado — Ag. PF' ? 'Protocolado' : status}
                    </p>
                    <h4 className="text-lg font-black text-white mt-1 print:text-black">{count}</h4>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider print-section-title">Listagem das Ordens de Serviço do Período</h3>
              <div className="overflow-x-auto rounded-xl border border-brand-dark-5 bg-brand-dark-3 print:border-gray-300 print:bg-white">
                <table className="min-w-full divide-y divide-brand-dark-5 print:divide-gray-300">
                  <thead className="bg-brand-dark-4 print:bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">OS</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Cliente</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">CPF</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Abertura</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Valor Total</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Valor Pago</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Serviços</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark-5 bg-transparent print:divide-gray-200">
                    {ordensFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-xs text-gray-500">
                          Nenhuma OS encontrada para o período selecionado.
                        </td>
                      </tr>
                    ) : (
                      ordensFiltradas.map((o) => (
                        <tr key={o.id} className="hover:bg-white/[0.01]">
                          <td className="px-4 py-2.5 text-xs font-bold text-white print:text-black">
                            #{String(o.numero).padStart(4, '0')}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-300 font-bold truncate max-w-[150px] print:text-black">
                            {o.nomeCliente}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap print:text-black">
                            {formatarCPF(o.cpf)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap print:text-black">
                            {o.criadoEm ? format(parseISO(o.criadoEm), 'dd/MM/yyyy') : ''}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-white print:text-black">
                            {formatarMoeda(o.valor)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-brand-green font-bold print:text-black">
                            {formatarMoeda(o.valorPago)}
                          </td>
                          <td className="px-4 py-2.5 text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full ${
                              o.status === 'Pago' ? 'bg-brand-green/10 text-brand-green-light border border-brand-green/20' :
                              o.status === 'Parcialmente Pago' ? 'bg-brand-blue/10 text-brand-blue-light border border-brand-blue/20' :
                              o.status === 'Gratuidade' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' :
                              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            } print:bg-transparent print:border-none print:text-black print:p-0`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[10px] text-gray-400 max-w-[200px] truncate print:text-black" title={o.servicos?.map(s => s.nome).join(', ')}>
                            {o.servicos?.map(s => s.nome).join(', ')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 2. FINANCEIRO */}
        {!carregandoDados && activeTab === 'financeiro' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print-cards-grid">
              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Faturamento Bruto</p>
                <h3 className="text-xl font-black text-brand-green mt-1">{formatarMoeda(faturamentoStats.faturamentoBruto)}</h3>
                <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-500 print:hidden">
                  <ArrowUpCircle size={10} className="text-brand-green" />
                  <span>Entradas em caixa</span>
                </div>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Total de Despesas</p>
                <h3 className="text-xl font-black text-red-400 mt-1">{formatarMoeda(faturamentoStats.totalDespesas)}</h3>
                <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-500 print:hidden">
                  <ArrowDownCircle size={10} className="text-red-400" />
                  <span>Saídas pagas</span>
                </div>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Saldo Líquido</p>
                <h3 className={`text-xl font-black mt-1 ${faturamentoStats.saldoLiquido >= 0 ? 'text-brand-blue-light' : 'text-red-400'}`}>
                  {formatarMoeda(faturamentoStats.saldoLiquido)}
                </h3>
                <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-500 print:hidden">
                  <DollarSign size={10} className="text-brand-blue-light" />
                  <span>Líquido em caixa</span>
                </div>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Margem de Lucro</p>
                <h3 className="text-xl font-black text-purple-400 mt-1">{faturamentoStats.margemLucro.toFixed(1)}%</h3>
                <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-500 print:hidden">
                  <Percent size={10} className="text-purple-400" />
                  <span>Rentabilidade</span>
                </div>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Previsão a Receber</p>
                <h3 className="text-xl font-black text-yellow-500 mt-1">{formatarMoeda(faturamentoStats.aReceber)}</h3>
                <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-500 print:hidden">
                  <Clock size={10} className="text-yellow-500" />
                  <span>Restante das OS</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              
              <div className="card bg-brand-dark-3/50 border-brand-dark-5 p-4 sm:p-5">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider print-section-title">Receitas por Forma de Pagamento</h3>
                <div className="space-y-2">
                  {receitasPorMetodo.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">Sem recebimentos.</p>
                  ) : (
                    receitasPorMetodo.map((r) => (
                      <div key={r.metodo} className="flex justify-between items-center bg-brand-dark-4/30 px-3 py-2 rounded-lg border border-brand-dark-5/30 print:border-gray-200">
                        <span className="text-xs font-semibold text-gray-300 print:text-black">{r.metodo}</span>
                        <div className="text-right">
                          <p className="text-xs font-black text-brand-green print:text-black">{formatarMoeda(r.total)}</p>
                          <p className="text-[9px] text-gray-500 print:hidden">{r.count} lanc.</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card bg-brand-dark-3/50 border-brand-dark-5 p-4 sm:p-5">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider print-section-title">Despesas por Categoria</h3>
                <div className="space-y-2">
                  {despesasPorCategoria.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">Sem despesas.</p>
                  ) : (
                    despesasPorCategoria.map((d) => (
                      <div key={d.categoria} className="flex justify-between items-center bg-brand-dark-4/30 px-3 py-2 rounded-lg border border-brand-dark-5/30 print:border-gray-200">
                        <span className="text-xs font-semibold text-gray-300 print:text-black">{d.categoria}</span>
                        <div className="text-right">
                          <p className="text-xs font-black text-red-400 print:text-black">{formatarMoeda(d.total)}</p>
                          <p className="text-[9px] text-gray-500 print:hidden">{d.count} lanc.</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider print-section-title">Repasses e Comissões devidas no Período</h3>
              <div className="overflow-x-auto rounded-xl border border-brand-dark-5 bg-brand-dark-3 print:border-gray-300 print:bg-white">
                <table className="min-w-full divide-y divide-brand-dark-5 print:divide-gray-300">
                  <thead className="bg-brand-dark-4 print:bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Responsável / Colaborador</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400 text-center">Serviços Executados</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400 text-right">Total a Repassar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark-5 bg-transparent print:divide-gray-200">
                    {comissoesEquipe.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-xs text-gray-500">
                          Nenhum repasse de comissão detectado para o período.
                        </td>
                      </tr>
                    ) : (
                      comissoesEquipe.map((c) => (
                        <tr key={c.colaborador}>
                          <td className="px-4 py-2.5 text-xs font-bold text-white print:text-black">{c.colaborador}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-300 text-center print:text-black">{c.count}</td>
                          <td className="px-4 py-2.5 text-xs font-black text-brand-green text-right print:text-black">{formatarMoeda(c.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider print-section-title">Extrato de Transações do Caixa</h3>
              <div className="overflow-x-auto rounded-xl border border-brand-dark-5 bg-brand-dark-3 print:border-gray-300 print:bg-white">
                <table className="min-w-full divide-y divide-brand-dark-5 print:divide-gray-300">
                  <thead className="bg-brand-dark-4 print:bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Data</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Tipo</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Método / Categoria</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Descrição</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Cliente / Destino</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark-5 bg-transparent print:divide-gray-200">
                    {extratoTransacoes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                          Nenhuma transação financeira encontrada.
                        </td>
                      </tr>
                    ) : (
                      extratoTransacoes.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.01]">
                          <td className="px-4 py-2 text-xs text-gray-400 whitespace-nowrap print:text-black">
                            {format(parseISO(t.data), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-4 py-2 text-xs font-black uppercase">
                            <span className={t.tipo === 'entrada' ? 'text-brand-green' : 'text-red-400'}>
                              {t.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-300 print:text-black">{t.categoria}</td>
                          <td className="px-4 py-2 text-xs text-gray-300 print:text-black">{t.descricao}</td>
                          <td className="px-4 py-2 text-xs text-gray-400 truncate max-w-[150px] print:text-black">{t.entidade}</td>
                          <td className={`px-4 py-2 text-xs font-black text-right print:text-black ${t.tipo === 'entrada' ? 'text-brand-green' : 'text-red-400'}`}>
                            {t.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(t.valor)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 3. CLIENTES & ACERVO */}
        {!carregandoDados && activeTab === 'clientes' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 print-cards-grid">
              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Clientes Cadastrados</p>
                <h3 className="text-2xl font-black text-white mt-1">{clientesStats.total}</h3>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Filiados ProTiro</p>
                <h3 className="text-2xl font-black text-brand-green mt-1">{clientesStats.filiados}</h3>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Clientes Avulsos</p>
                <h3 className="text-2xl font-black text-yellow-500 mt-1">{clientesStats.naoFiliados}</h3>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Total de Armas</p>
                <h3 className="text-2xl font-black text-brand-blue-light mt-1">{clientesStats.totalArmas}</h3>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Total de GTs</p>
                <h3 className="text-2xl font-black text-purple-400 mt-1">{clientesStats.totalGts}</h3>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Manejos Ativos</p>
                <h3 className="text-2xl font-black text-orange-400 mt-1">{clientesStats.totalManejos}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
              
              <div className="card bg-brand-dark-3/50 border-brand-dark-5 p-4 sm:p-5">
                <h3 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-wider print-section-title">Distribuição por Acervo</h3>
                <div className="space-y-2">
                  {armasPorAcervo.map((a) => (
                    <div key={a.acervo} className="flex justify-between items-center bg-brand-dark-4/30 px-3 py-2 rounded-lg border border-brand-dark-5/30 print:border-gray-200">
                      <span className="text-xs text-gray-300 print:text-black">{a.acervo}</span>
                      <span className="text-xs font-black text-brand-blue-light print:text-black">{a.count} arma(s)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card bg-brand-dark-3/50 border-brand-dark-5 p-4 sm:p-5">
                <h3 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-wider print-section-title">Calibres Mais Frequentes</h3>
                <div className="space-y-2">
                  {armasPorCalibre.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">Nenhuma arma.</p>
                  ) : (
                    armasPorCalibre.map((c) => (
                      <div key={c.calibre} className="flex justify-between items-center bg-brand-dark-4/30 px-3 py-1.5 rounded-lg border border-brand-dark-5/30 print:border-gray-200">
                        <span className="text-xs text-gray-300 print:text-black">{c.calibre}</span>
                        <span className="text-xs font-black text-brand-blue-light print:text-black">{c.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card bg-brand-dark-3/50 border-brand-dark-5 p-4 sm:p-5">
                <h3 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-wider print-section-title">Fabricantes Populares</h3>
                <div className="space-y-2">
                  {armasPorFabricante.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">Nenhuma arma.</p>
                  ) : (
                    armasPorFabricante.map((f) => (
                      <div key={f.fabricante} className="flex justify-between items-center bg-brand-dark-4/30 px-3 py-1.5 rounded-lg border border-brand-dark-5/30 print:border-gray-200">
                        <span className="text-xs text-gray-300 print:text-black">{f.fabricante}</span>
                        <span className="text-xs font-black text-brand-blue-light print:text-black">{f.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider print-section-title">Listagem Consolidada de Clientes</h3>
              <div className="overflow-x-auto rounded-xl border border-brand-dark-5 bg-brand-dark-3 print:border-gray-300 print:bg-white">
                <table className="min-w-full divide-y divide-brand-dark-5 print:divide-gray-300">
                  <thead className="bg-brand-dark-4 print:bg-gray-100">
                    <tr>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase text-gray-400">Cliente</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase text-gray-400">CPF</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase text-gray-400">Contato</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase text-gray-400 text-center">Filiado</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase text-gray-400">Nº CR</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase text-gray-400">Vencimento CR</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase text-gray-400 text-center">Armas</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase text-gray-400 text-center">GTs</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase text-gray-400 text-center">Manejos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark-5 bg-transparent print:divide-gray-200">
                    {tabelaClientesRelatorio.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-500">
                          Nenhum cliente cadastrado.
                        </td>
                      </tr>
                    ) : (
                      tabelaClientesRelatorio.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.01]">
                          <td className="px-3 py-2 text-xs font-bold text-white print:text-black truncate max-w-[140px]" title={c.nome}>
                            {c.nome}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-400 print:text-black whitespace-nowrap">
                            {formatarCPF(c.cpf)}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-400 print:text-black whitespace-nowrap">
                            {formatarTelefone(c.contato)}
                          </td>
                          <td className="px-3 py-2 text-xs text-center font-bold text-gray-300 print:text-black">
                            <span className={c.filiado === 'Sim' ? 'text-brand-green' : 'text-gray-500'}>
                              {c.filiado}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-300 print:text-black whitespace-nowrap">{c.numeroCr}</td>
                          <td className={`px-3 py-2 text-xs whitespace-nowrap print:text-black ${
                            c.vencimentoCrRaw && isBefore(parseISO(c.vencimentoCrRaw), new Date()) ? 'text-red-400 font-bold' : 'text-gray-400'
                          }`}>{c.vencimentoCr}</td>
                          <td className="px-3 py-2 text-xs text-center text-brand-blue-light font-bold print:text-black">{c.armasCount}</td>
                          <td className="px-3 py-2 text-xs text-center text-purple-300 font-bold print:text-black">{c.gtsCount}</td>
                          <td className="px-3 py-2 text-xs text-center text-orange-300 font-bold print:text-black">{c.manejosCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 4. PAINEL DE ALERTAS */}
        {!carregandoDados && activeTab === 'alertas' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print-cards-grid">
              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Total Alertas</p>
                <h3 className="text-2xl font-black text-white mt-1">{alertasStats.total}</h3>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Vencidos</p>
                <h3 className="text-2xl font-black text-red-500 mt-1">{alertasStats.vencidos}</h3>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Urgentes (&lt;30d)</p>
                <h3 className="text-2xl font-black text-orange-400 mt-1">{alertasStats.criticos}</h3>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Avisos (&lt;90d)</p>
                <h3 className="text-2xl font-black text-yellow-400 mt-1">{alertasStats.avisos}</h3>
              </div>

              <div className="card bg-brand-dark-3 border-brand-dark-5 print-card">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider">Em Renovação</p>
                <h3 className="text-2xl font-black text-brand-blue-light mt-1">{alertasStats.emRenovacao}</h3>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider print-section-title">Detalhamento dos Alertas de Documentação</h3>
              <div className="overflow-x-auto rounded-xl border border-brand-dark-5 bg-brand-dark-3 print:border-gray-300 print:bg-white">
                <table className="min-w-full divide-y divide-brand-dark-5 print:divide-gray-300">
                  <thead className="bg-brand-dark-4 print:bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Tipo Doc.</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Descrição / Identificação</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Cliente</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Vencimento</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Status Alerta</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400 text-right">Tempo Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark-5 bg-transparent print:divide-gray-200">
                    {alertasFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                          Nenhum alerta de vencimento encontrado.
                        </td>
                      </tr>
                    ) : (
                      alertasFiltrados.map((a) => {
                        const isVencido = a.diasRestantes < 0;
                        const emRenovacao = a.emRenovacao;
                        
                        return (
                          <tr key={a.id} className="hover:bg-white/[0.01]">
                            <td className="px-4 py-2.5 text-xs font-black print:text-black">
                              <span className={`px-2 py-0.5 rounded-md ${
                                a.tipo === 'CR' || a.tipo === 'IBAMA_CR' ? 'bg-brand-blue/15 text-brand-blue-light' :
                                a.tipo === 'CRAF' ? 'bg-purple-500/15 text-purple-300' :
                                a.tipo === 'GT' ? 'bg-orange-500/15 text-orange-400' : 'bg-brand-green/15 text-brand-green-light'
                              } print:bg-transparent print:text-black print:p-0`}>
                                {a.tipo}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-200 font-bold print:text-black">{a.label}</td>
                            <td className="px-4 py-2.5 text-xs text-gray-300 font-bold print:text-black truncate max-w-[150px]">{a.clienteNome}</td>
                            <td className="px-4 py-2.5 text-xs text-gray-400 print:text-black whitespace-nowrap">{formatarData(a.dataVencimento)}</td>
                            <td className="px-4 py-2.5 text-xs font-black uppercase whitespace-nowrap">
                              {emRenovacao ? (
                                <span className="text-brand-blue-light print:text-black">Ag. Liberação</span>
                              ) : isVencido ? (
                                <span className="text-red-500 font-black">Vencido</span>
                              ) : a.diasRestantes <= 30 ? (
                                <span className="text-orange-400 font-black">Crítico</span>
                              ) : (
                                <span className="text-yellow-400 font-black">Aviso</span>
                              )}
                            </td>
                            <td className={`px-4 py-2.5 text-xs font-black text-right whitespace-nowrap print:text-black ${
                              emRenovacao ? 'text-brand-blue-light' : isVencido ? 'text-red-500' : a.diasRestantes <= 30 ? 'text-orange-400' : 'text-yellow-400'
                            }`}>
                              {emRenovacao ? 'Em Renovação' : isVencido ? `${Math.abs(a.diasRestantes)}d vencido` : `${a.diasRestantes}d restantes`}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
