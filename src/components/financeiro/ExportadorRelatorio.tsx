import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Calendar, 
  CheckSquare, 
  Square,
  Filter,
  Download,
  Settings,
  ChevronRight,
  Database,
  FileText
} from 'lucide-react';
import { useOrdens } from '../../context/OrdensContext';
import { useOrcamentos } from '../../context/OrcamentosContext';
import { useRecibos } from '../../context/RecibosContext';
import { useFinanceiro } from '../../context/FinanceiroContext';
import { useClientes } from '../../context/ClientesContext';
import { STATUS_OS, FORMAS_PAGAMENTO, STATUS_ORCAMENTO } from '../../types';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import { supabase } from '../../db/supabase';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import { formatarMoeda } from '../../utils/formatters';

interface ExportadorRelatorioProps {
  isOpen: boolean;
  onClose: () => void;
  dataInicioProp?: string;
  dataFimProp?: string;
}

type FonteDados = 'faturamento_detalhado' | 'os' | 'orcamentos' | 'recibos' | 'despesas' | 'clientes' | 'atividades';

interface ColunaConfig {
  key: string;
  label: string;
  selected: boolean;
}

export function ExportadorRelatorio({ isOpen, onClose, dataInicioProp, dataFimProp }: ExportadorRelatorioProps) {
  const { ordens } = useOrdens();
  const { orcamentos } = useOrcamentos();
  const { recibos } = useRecibos();
  const { despesas } = useFinanceiro();
  const { clientes } = useClientes();

  const [passo, setPasso] = useState(1);
  const [fonte, setFonte] = useState<FonteDados>('faturamento_detalhado');
  
  // Filtros
  const [dataInicio, setDataInicio] = useState(dataInicioProp || format(new Date(), 'yyyy-MM-01'));
  const [dataFim, setDataFim] = useState(dataFimProp || format(new Date(), 'yyyy-MM-dd'));
  const [statusFiltro, setStatusFiltro] = useState<string[]>([]);
  const [execucaoFiltro, setExecucaoFiltro] = useState<string[]>([]);
  const [colaboradorFiltro, setColaboradorFiltro] = useState<string>('Todos');
  const [usuarios, setUsuarios] = useState<{id: string, nome: string}[]>([]);

  const { usuario } = useAuth();

  // Colunas
  const [colunas, setColunas] = useState<ColunaConfig[]>([]);

  useEffect(() => {
    if (dataInicioProp) setDataInicio(dataInicioProp);
    if (dataFimProp) setDataFim(dataFimProp);
  }, [dataInicioProp, dataFimProp]);

  useEffect(() => {
    const carregarUsuarios = async () => {
      if (!usuario?.empresaId) return;
      const { data } = await supabase
        .from('usuarios_autorizados')
        .select('id, nome')
        .eq('ativo', true)
        .eq('empresa_id', usuario.empresaId);
      if (data) setUsuarios(data);
    };
    carregarUsuarios();
  }, [usuario?.empresaId]);

  const configColunas: Record<FonteDados, ColunaConfig[]> = {
    faturamento_detalhado: [
      { key: 'incluir_resumo', label: 'Resumo Geral (DRE Simplificada)', selected: true },
      { key: 'incluir_pagamentos', label: 'Resumo de Meios de Pagamento', selected: true },
      { key: 'incluir_servicos', label: 'Faturamento por Tipo de Serviço', selected: true },
      { key: 'incluir_os', label: 'Detalhamento de Transações (O.S.)', selected: true },
      { key: 'incluir_despesas', label: 'Detalhamento de Saídas (Despesas PJ)', selected: true },
    ],
    os: [
      { key: 'numero', label: 'Nº OS', selected: true },
      { key: 'criadoEm', label: 'Data Criação', selected: true },
      { key: 'nomeCliente', label: 'Cliente', selected: true },
      { key: 'cpf', label: 'CPF', selected: true },
      { key: 'contato', label: 'Contato', selected: true },
      { key: 'endereco', label: 'Endereço', selected: false },
      { key: 'servicos', label: 'Serviços', selected: true },
      { key: 'valor', label: 'Valor Total', selected: true },
      { key: 'valorPago', label: 'Valor Pago', selected: true },
      { key: 'taxaPFTotal', label: 'Taxas PF', selected: true },
      { key: 'status', label: 'Status OS', selected: true },
      { key: 'formaPagamento', label: 'Forma Pagamento', selected: true },
      { key: 'canalAtendimento', label: 'Canal Atendimento', selected: false },
      { key: 'criadoPorNome', label: 'Colaborador', selected: true },
      { key: 'observacoes', label: 'Observações', selected: false },
    ],
    orcamentos: [
      { key: 'numero', label: 'Nº Orçamento', selected: true },
      { key: 'criadoEm', label: 'Data', selected: true },
      { key: 'nomeCliente', label: 'Cliente', selected: true },
      { key: 'cpf', label: 'CPF', selected: true },
      { key: 'valorTotal', label: 'Valor Total', selected: true },
      { key: 'status', label: 'Status', selected: true },
      { key: 'criadoPorNome', label: 'Colaborador', selected: true },
    ],
    recibos: [
      { key: 'numero', label: 'Nº Recibo', selected: true },
      { key: 'criadoEm', label: 'Data', selected: true },
      { key: 'clienteNome', label: 'Cliente', selected: true },
      { key: 'clienteCPF', label: 'CPF', selected: true },
      { key: 'valorTotal', label: 'Valor Total', selected: true },
      { key: 'formaPagamento', label: 'Forma Pagamento', selected: true },
      { key: 'criadoPorNome', label: 'Colaborador', selected: true },
    ],
    despesas: [
      { key: 'data', label: 'Data', selected: true },
      { key: 'descricao', label: 'Descrição', selected: true },
      { key: 'categoria', label: 'Categoria', selected: true },
      { key: 'valor', label: 'Valor', selected: true },
      { key: 'criadoEm', label: 'Registrado em', selected: false },
    ],
    clientes: [
      { key: 'nome', label: 'Nome', selected: true },
      { key: 'cpf', label: 'CPF', selected: true },
      { key: 'contato', label: 'Contato', selected: true },
      { key: 'endereco', label: 'Endereço', selected: true },
      { key: 'observacoes', label: 'Observações', selected: false },
      { key: 'criadoEm', label: 'Data Cadastro', selected: true },
    ],
    atividades: [
      { key: 'data', label: 'Data/Hora', selected: true },
      { key: 'usuario', label: 'Colaborador', selected: true },
      { key: 'acao', label: 'Ação', selected: true },
      { key: 'ordemNumero', label: 'Nº OS', selected: true },
      { key: 'clienteNome', label: 'Cliente', selected: true },
    ]
  };

  useEffect(() => {
    setColunas(configColunas[fonte]);
  }, [fonte]);

  const toggleColuna = (key: string) => {
    setColunas(prev => prev.map(c => c.key === key ? { ...c, selected: !c.selected } : c));
  };

  const handleExportar = (formato: 'excel' | 'pdf' = 'excel') => {
    if (fonte === 'faturamento_detalhado') {
      const ordensFiltradas = ordens.filter(item => {
        const dataItem = parseISO(item.criadoEm || item.data);
        const noIntervalo = isWithinInterval(dataItem, {
          start: startOfDay(parseISO(dataInicio)),
          end: endOfDay(parseISO(dataFim))
        });
        if (!noIntervalo) return false;
        const ehMigracao = item.migrado === true || item.observacoes?.includes('[MIGRAÇÃO]');
        if (ehMigracao) return false;
        return true;
      });

      const despesasFiltradas = despesas.filter(item => {
        const dataItem = parseISO(item.data);
        return isWithinInterval(dataItem, {
          start: startOfDay(parseISO(dataInicio)),
          end: endOfDay(parseISO(dataFim))
        });
      });

      // Totais
      const faturamento = ordensFiltradas.reduce((s, o) => s + (o.valorPago || 0), 0);
      const taxas = ordensFiltradas
        .filter(o => o.status === 'Pago' || o.status === 'Parcialmente Pago')
        .reduce((s, o) => s + (o.taxaPFTotal || 0), 0);
      const despesasTotal = despesasFiltradas.reduce((s, d) => s + (d.valor || 0), 0);
      const margemBruta = faturamento - taxas;
      const lucroLiquido = margemBruta - despesasTotal;

      // Agrupamento por formas de pagamento no período selecionado
      const formasPgtoBreakdown: Record<string, number> = {};
      const formasPgtoQtd: Record<string, number> = {};
      ordensFiltradas.forEach(o => {
        if (o.historicoPagamentos && o.historicoPagamentos.length > 0) {
          o.historicoPagamentos.forEach(p => {
            const dataPagamento = parseISO(p.data);
            if (isWithinInterval(dataPagamento, { start: startOfDay(parseISO(dataInicio)), end: endOfDay(parseISO(dataFim)) })) {
              const metodo = p.metodo || 'Pendente';
              formasPgtoBreakdown[metodo] = (formasPgtoBreakdown[metodo] || 0) + (p.valor || 0);
              formasPgtoQtd[metodo] = (formasPgtoQtd[metodo] || 0) + 1;
            }
          });
        } else if (o.valorPago > 0) {
          const dataOS = parseISO(o.criadoEm);
          if (isWithinInterval(dataOS, { start: startOfDay(parseISO(dataInicio)), end: endOfDay(parseISO(dataFim)) })) {
            const metodo = o.formaPagamento || 'Pendente';
            formasPgtoBreakdown[metodo] = (formasPgtoBreakdown[metodo] || 0) + (o.valorPago || 0);
            formasPgtoQtd[metodo] = (formasPgtoQtd[metodo] || 0) + 1;
          }
        }
      });

      // Agrupamento por tipo de serviço no período selecionado (proporcional para pagamentos parciais)
      const servicosBreakdown: Record<string, { nome: string; qtd: number; bruto: number; taxas: number; liquido: number }> = {};
      ordensFiltradas.forEach(o => {
        const totalOSVal = o.valor || 1;
        const totalPagoOSVal = o.valorPago || 0;
        const oStatusPago = o.status === 'Pago' || o.status === 'Parcialmente Pago';

        (o.servicos || []).forEach(s => {
          const servVal = s.valor || 0;
          const brutoProp = (servVal / totalOSVal) * totalPagoOSVal;
          const taxasProp = oStatusPago ? (s.taxaPF || 0) : 0;
          const liquidoProp = brutoProp - taxasProp;

          if (!servicosBreakdown[s.nome]) {
            servicosBreakdown[s.nome] = { nome: s.nome, qtd: 0, bruto: 0, taxas: 0, liquido: 0 };
          }
          servicosBreakdown[s.nome].qtd += 1;
          servicosBreakdown[s.nome].bruto += brutoProp;
          servicosBreakdown[s.nome].taxas += taxasProp;
          servicosBreakdown[s.nome].liquido += liquidoProp;
        });
      });

      const showResumo = colunas.find(c => c.key === 'incluir_resumo')?.selected;
      const showPagamentos = colunas.find(c => c.key === 'incluir_pagamentos')?.selected;
      const showServicos = colunas.find(c => c.key === 'incluir_servicos')?.selected;
      const showOS = colunas.find(c => c.key === 'incluir_os')?.selected;
      const showDespesas = colunas.find(c => c.key === 'incluir_despesas')?.selected;

      const empresaName = usuario?.dadosEmpresa?.razaoSocialFantasia || usuario?.empresaNome || 'G CAC Despachante Bélico';

      if (formato === 'pdf') {
        const doc = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4'
        });

        let pageCount = 1;

        // Desenhar cabeçalho e rodapé nas páginas
        const drawHeaderFooter = (pageNum: number) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(empresaName.toUpperCase(), 15, 12);
          doc.setFont('helvetica', 'normal');
          doc.text(`Período: ${format(parseISO(dataInicio), 'dd/MM/yyyy')} a ${format(parseISO(dataFim), 'dd/MM/yyyy')}`, 130, 12);
          doc.setDrawColor(220, 225, 230);
          doc.line(15, 14, 195, 14);

          // Rodapé
          doc.line(15, 282, 195, 282);
          doc.setFontSize(8);
          doc.text('Portal G CAC - Gestão Financeira', 15, 287);
          doc.text(`Página ${pageNum}`, 180, 287);
        };

        // Banner principal da página 1
        doc.setFillColor(15, 32, 67); // Azul marinho
        doc.rect(15, 20, 180, 24, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text('RELATÓRIO DE FATURAMENTO DETALHADO', 20, 30);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(190, 210, 240);
        doc.text(`Empresa: ${empresaName}   |   Intervalo: ${format(parseISO(dataInicio), 'dd/MM/yyyy')} a ${format(parseISO(dataFim), 'dd/MM/yyyy')}`, 20, 38);

        drawHeaderFooter(pageCount);

        let y = 52;

        const checkSpace = (needed: number) => {
          if (y + needed > 275) {
            doc.addPage();
            pageCount++;
            drawHeaderFooter(pageCount);
            y = 25;
          }
        };

        const drawSectionTable = (
          headers: { label: string; width: number; align?: 'left' | 'right' }[],
          rows: string[][],
          title: string
        ) => {
          checkSpace(20 + rows.length * 6);
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(15, 32, 67);
          doc.text(title, 15, y);
          y += 5;

          // Header do grid
          doc.setFillColor(235, 240, 248);
          doc.rect(15, y, 180, 6.5, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(50, 50, 50);
          
          let currentX = 15;
          headers.forEach(h => {
            const xPos = h.align === 'right' ? currentX + h.width - 2 : currentX + 2;
            doc.text(h.label, xPos, y + 4.5, { align: h.align || 'left' });
            currentX += h.width;
          });
          y += 6.5;

          // Linhas da tabela
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(60, 60, 60);

          rows.forEach((row, rIdx) => {
            checkSpace(6);
            if (rIdx % 2 === 1) {
              doc.setFillColor(248, 250, 253);
              doc.rect(15, y, 180, 5.5, 'F');
            }

            currentX = 15;
            row.forEach((cell, cIdx) => {
              const h = headers[cIdx];
              const xPos = h.align === 'right' ? currentX + h.width - 2 : currentX + 2;
              
              let cellText = cell || '';
              if (doc.getTextWidth(cellText) > h.width - 3) {
                while (cellText.length > 3 && doc.getTextWidth(cellText + '...') > h.width - 3) {
                  cellText = cellText.slice(0, -1);
                }
                cellText = cellText + '...';
              }

              doc.text(cellText, xPos, y + 4, { align: h.align || 'left' });
              currentX += h.width;
            });
            y += 5.5;
          });
          y += 6;
        };

        // 1. Resumo Geral (DRE)
        if (showResumo) {
          checkSpace(40);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(15, 32, 67);
          doc.text('DRE SIMPLIFICADA / RESUMO GERAL', 15, y);
          y += 5;

          const summaryItems = [
            { label: 'FATURAMENTO BRUTO (ENTRADAS CAIXA)', val: faturamento, color: [46, 117, 89] },
            { label: '(-) DEDUÇÃO TAXAS PF (GRU OPERACIONAIS)', val: taxas, color: [165, 42, 42] },
            { label: '(=) MARGEM / LUCRO BRUTO OPERACIONAL', val: margemBruta, color: [15, 32, 67] },
            { label: '(-) DESPESAS PJ (SAÍDAS OPERACIONAIS)', val: despesasTotal, color: [165, 42, 42] },
            { label: '(=) LUCRO LÍQUIDO REAL DO PERÍODO', val: lucroLiquido, color: [46, 117, 89] }
          ];

          summaryItems.forEach(item => {
            doc.setFillColor(245, 247, 250);
            doc.rect(15, y, 180, 6, 'F');
            doc.setDrawColor(220, 225, 230);
            doc.rect(15, y, 180, 6, 'S');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.text(item.label, 18, y + 4.2);

            doc.setTextColor(item.color[0], item.color[1], item.color[2]);
            doc.text(formatarMoeda(item.val), 190, y + 4.2, { align: 'right' });
            y += 6.5;
          });
          y += 4;
        }

        // 2. Receitas por Meio de Pagamento
        if (showPagamentos && Object.keys(formasPgtoBreakdown).length > 0) {
          const pgtoHeaders = [
            { label: 'Meio de Pagamento', width: 80 },
            { label: 'Transações', width: 40, align: 'right' as const },
            { label: 'Total Recebido', width: 60, align: 'right' as const }
          ];
          const pgtoRows = Object.entries(formasPgtoBreakdown).map(([metodo, valor]) => [
            metodo,
            String(formasPgtoQtd[metodo] || 0),
            formatarMoeda(valor)
          ]);
          drawSectionTable(pgtoHeaders, pgtoRows, 'RECEITAS POR MEIO DE PAGAMENTO');
        }

        // 3. Faturamento por Tipo de Serviço
        if (showServicos && Object.keys(servicosBreakdown).length > 0) {
          const servHeaders = [
            { label: 'Serviço Prestado', width: 75 },
            { label: 'Quant.', width: 20, align: 'right' as const },
            { label: 'Faturamento Bruto', width: 30, align: 'right' as const },
            { label: 'Dedução Taxas', width: 25, align: 'right' as const },
            { label: 'Faturamento Líquido', width: 30, align: 'right' as const }
          ];
          const servRows = Object.values(servicosBreakdown).map((s: any) => [
            s.nome,
            String(s.qtd),
            formatarMoeda(s.bruto),
            formatarMoeda(s.taxas),
            formatarMoeda(s.liquido)
          ]);
          drawSectionTable(servHeaders, servRows, 'DETALHAMENTO DE FATURAMENTO POR SERVIÇO');
        }

        // 4. Detalhes de Entradas (O.S.)
        if (showOS && ordensFiltradas.length > 0) {
          const osHeaders = [
            { label: 'OS', width: 14 },
            { label: 'Data', width: 18 },
            { label: 'Cliente', width: 48 },
            { label: 'Forma Pagamento', width: 38 },
            { label: 'Total (OS)', width: 22, align: 'right' as const },
            { label: 'Taxa GRU', width: 18, align: 'right' as const },
            { label: 'Líquido', width: 22, align: 'right' as const }
          ];
          const osRows = ordensFiltradas.map(o => [
            `#${String(o.numero).padStart(4, '0')}`,
            format(parseISO(o.criadoEm), 'dd/MM/yy'),
            o.nomeCliente,
            o.formaPagamento || 'A Combinar',
            formatarMoeda(o.valor),
            formatarMoeda(o.taxaPFTotal || 0),
            formatarMoeda((o.valorPago || 0) - (o.taxaPFTotal || 0))
          ]);
          drawSectionTable(osHeaders, osRows, 'HISTÓRICO DETALHADO DE ENTRADAS (ORDENS DE SERVIÇO)');
        }

        // 5. Detalhes de Despesas (Saídas)
        if (showDespesas && despesasFiltradas.length > 0) {
          const despHeaders = [
            { label: 'Data', width: 25 },
            { label: 'Descrição da Despesa PJ', width: 85 },
            { label: 'Categoria', width: 45 },
            { label: 'Valor Pago', width: 25, align: 'right' as const }
          ];
          const despRows = despesasFiltradas.map(d => [
            format(parseISO(d.data), 'dd/MM/yyyy'),
            d.descricao,
            d.categoria,
            `-${formatarMoeda(d.valor)}`
          ]);
          drawSectionTable(despHeaders, despRows, 'HISTÓRICO DETALHADO DE DESPESAS PJ (SAÍDAS OPERACIONAIS)');
        }

        doc.save(`Faturamento_Detalhado_${dataInicio}_a_${dataFim}.pdf`);
      } else {
        // Formato Excel estruturado
        const rowsResumo: any[] = [
          ['PORTAL G CAC - RELATÓRIO DE FATURAMENTO DETALHADO'],
          [`Empresa: ${empresaName}`],
          [`Período: ${format(parseISO(dataInicio), 'dd/MM/yyyy')} a ${format(parseISO(dataFim), 'dd/MM/yyyy')}`],
          [],
          ['1. DRE SIMPLIFICADA / RESUMO GERAL'],
          ['Indicador', 'Valor no Caixa'],
          ['Faturamento Bruto (Entradas)', faturamento],
          ['Dedução Taxas PF (GRU)', taxas],
          ['Margem / Lucro Bruto Operacional', faturamento - taxas],
          ['Despesas PJ (Saídas)', despesasTotal],
          ['Lucro Líquido Real', faturamento - taxas - despesasTotal],
          []
        ];

        if (showPagamentos && Object.keys(formasPgtoBreakdown).length > 0) {
          rowsResumo.push(['2. RECEITAS POR MEIO DE PAGAMENTO']);
          rowsResumo.push(['Meio de Pagamento', 'Transações', 'Total Recebido']);
          Object.entries(formasPgtoBreakdown).forEach(([metodo, valor]) => {
            rowsResumo.push([metodo, formasPgtoQtd[metodo] || 0, valor]);
          });
          rowsResumo.push([]);
        }

        if (showServicos && Object.keys(servicosBreakdown).length > 0) {
          rowsResumo.push(['3. FATURAMENTO POR TIPO DE SERVIÇO']);
          rowsResumo.push(['Serviço', 'Quantidade', 'Faturamento Bruto', 'Taxas GRU', 'Faturamento Líquido']);
          Object.values(servicosBreakdown).forEach((s: any) => {
            rowsResumo.push([s.nome, s.qtd, s.bruto, s.taxas, s.liquido]);
          });
          rowsResumo.push([]);
        }

        const wsResumo = XLSX.utils.aoa_to_sheet(rowsResumo);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Financeiro');

        if (showOS && ordensFiltradas.length > 0) {
          const rowsEntradas = ordensFiltradas.map(o => ({
            'Nº OS': `#${String(o.numero).padStart(4, '0')}`,
            'Data Criação': format(parseISO(o.criadoEm), 'dd/MM/yyyy HH:mm'),
            'Cliente': o.nomeCliente,
            'CPF': o.cpf,
            'Valor Total (OS)': o.valor,
            'Valor Pago': o.valorPago,
            'Taxas PF (GRU)': o.taxaPFTotal || 0,
            'Líquido (OS)': (o.valorPago || 0) - (o.taxaPFTotal || 0),
            'Status': o.status,
            'Forma de Pagamento': o.formaPagamento
          }));
          const wsEntradas = XLSX.utils.json_to_sheet(rowsEntradas);
          XLSX.utils.book_append_sheet(wb, wsEntradas, 'Entradas Detalhadas');
        }

        if (showDespesas && despesasFiltradas.length > 0) {
          const rowsSaidas = despesasFiltradas.map(d => ({
            'Data': format(parseISO(d.data), 'dd/MM/yyyy'),
            'Descrição': d.descricao,
            'Categoria': d.categoria,
            'Valor Pago': d.valor
          }));
          const wsSaidas = XLSX.utils.json_to_sheet(rowsSaidas);
          XLSX.utils.book_append_sheet(wb, wsSaidas, 'Saídas PJ');
        }

        XLSX.writeFile(wb, `Faturamento_Detalhado_${dataInicio}_a_${dataFim}.xlsx`);
      }
      onClose();
      return;
    }

    // Código original mantido para as outras fontes de dados
    let dadosParaFiltrar: any[] = [];
    
    if (fonte === 'atividades') {
      const atividadesGeradas: any[] = [];
      ordens.forEach(o => {
        if (colaboradorFiltro === 'Todos' || o.criadoPorNome === colaboradorFiltro) {
          const dataCriacao = parseISO(o.criadoEm);
          if (isWithinInterval(dataCriacao, { start: startOfDay(parseISO(dataInicio)), end: endOfDay(parseISO(dataFim)) })) {
            atividadesGeradas.push({
              id: `criacao-${o.id}`,
              data: o.criadoEm,
              usuario: o.criadoPorNome || 'Sistema',
              acao: 'Criou OS',
              ordemNumero: o.numero,
              clienteNome: o.nomeCliente
            });
          }
        }

        if (o.historicoStatus) {
          o.historicoStatus.forEach(evento => {
            const dataEvento = parseISO(evento.data);
            if (isWithinInterval(dataEvento, { start: startOfDay(parseISO(dataInicio)), end: endOfDay(parseISO(dataFim)) })) {
              if (evento.tipo === 'status_execucao') {
                if (colaboradorFiltro === 'Todos' || evento.usuario === colaboradorFiltro) {
                  if (evento.valorNovo === 'Protocolado — Ag. PF') {
                    atividadesGeradas.push({
                      id: evento.id,
                      data: evento.data,
                      usuario: evento.usuario,
                      acao: 'Protocolou Serviço',
                      ordemNumero: o.numero,
                      clienteNome: o.nomeCliente
                    });
                  } else if (evento.valorNovo === 'Concluído') {
                    atividadesGeradas.push({
                      id: evento.id,
                      data: evento.data,
                      usuario: evento.usuario,
                      acao: 'Concluiu Serviço',
                      ordemNumero: o.numero,
                      clienteNome: o.nomeCliente
                    });
                  }
                }
              }
            }
          });
        }
      });
      dadosParaFiltrar = atividadesGeradas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    } else {
      if (fonte === 'os') dadosParaFiltrar = ordens;
      else if (fonte === 'orcamentos') dadosParaFiltrar = orcamentos;
      else if (fonte === 'recibos') dadosParaFiltrar = recibos;
      else if (fonte === 'despesas') dadosParaFiltrar = despesas;
      else if (fonte === 'clientes') dadosParaFiltrar = clientes;

      dadosParaFiltrar = dadosParaFiltrar.filter(item => {
        const dataItem = parseISO(item.criadoEm || item.data);
        const noIntervalo = isWithinInterval(dataItem, {
          start: startOfDay(parseISO(dataInicio)),
          end: endOfDay(parseISO(dataFim))
        });

        if (!noIntervalo) return false;

        if (fonte === 'os') {
          if (statusFiltro.length > 0 && !statusFiltro.includes(item.status)) return false;
          if (execucaoFiltro.length > 0) {
            const temStatusExecucao = item.servicos?.some((s: any) => execucaoFiltro.includes(s.statusExecucao));
            if (!temStatusExecucao) return false;
          }
          if (colaboradorFiltro !== 'Todos' && item.criadoPorNome !== colaboradorFiltro) return false;
        }

        return true;
      });
    }

    const colunasSelecionadas = colunas.filter(c => c.selected);
    const dadosFormatados = dadosParaFiltrar.map(item => {
      const obj: any = {};
      colunasSelecionadas.forEach(col => {
        let valor = item[col.key];
        
        if (col.key === 'criadoEm' || col.key === 'data') {
          valor = format(parseISO(valor), 'dd/MM/yyyy HH:mm');
        } else if (col.key === 'servicos' && Array.isArray(valor)) {
          valor = valor.map((s: any) => s.nome).join(', ');
        } else if (col.key === 'numero' || col.key === 'ordemNumero') {
          valor = `#${String(valor).padStart(4, '0')}`;
        }
        
        obj[col.label] = valor;
      });
      return obj;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosFormatados);
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `Relatorio_${fonte}_${dataInicio}_a_${dataFim}.xlsx`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="card w-full max-w-2xl relative z-10 animate-scale-up overflow-hidden p-0 border-brand-dark-5">
        {/* Header */}
        <div className="bg-brand-dark-3 p-6 border-b border-brand-dark-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="text-brand-green" />
              Gerador de Relatórios Avançado
            </h2>
            <p className="text-gray-400 text-sm">Configure os filtros e colunas para exportação</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {[1, 2, 3].map(step => (
              <React.Fragment key={step}>
                <div className={`flex items-center gap-2 whitespace-nowrap ${passo === step ? 'text-brand-blue' : passo > step ? 'text-brand-green' : 'text-gray-500'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    passo === step ? 'border-brand-blue bg-brand-blue/10' : 
                    passo > step ? 'border-brand-green bg-brand-green text-white' : 'border-gray-600'
                  }`}>
                    {passo > step ? '✓' : step}
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">
                    {step === 1 ? 'Fonte' : step === 2 ? 'Filtros' : 'Colunas'}
                  </span>
                </div>
                {step < 3 && <div className="h-px w-8 bg-brand-dark-5" />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Fonte de Dados */}
          {passo === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'faturamento_detalhado', label: '⭐ Faturamento Consolidado', icon: <FileSpreadsheet size={24} className="text-brand-blue-light" />, desc: 'Relatório DRE consolidado com faturamento por serviços, meios de pagamento e PDF para contabilidade/banco.' },
                { id: 'os', label: 'Ordens de Serviço', icon: <Database size={24} />, desc: 'Relatório detalhado de atendimentos e pagamentos' },
                { id: 'atividades', label: 'Atividades da Equipe', icon: <CheckSquare size={24} />, desc: 'Métricas e histórico de ações operacionais' },
                { id: 'recibos', label: 'Recibos', icon: <Download size={24} />, desc: 'Listagem de todos os recibos emitidos' },
                { id: 'orcamentos', label: 'Orçamentos', icon: <Settings size={24} />, desc: 'Status de orçamentos e conversão' },
                { id: 'despesas', label: 'Despesas PJ', icon: <Download size={24} />, desc: 'Controle de saídas e categorias' },
                { id: 'clientes', label: 'Base de Clientes', icon: <Settings size={24} />, desc: 'Dados cadastrais e contatos' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setFonte(item.id as FonteDados); setPasso(2); }}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    fonte === item.id ? 'border-brand-blue bg-brand-blue/5' : 'border-brand-dark-5 hover:border-gray-600'
                  }`}
                >
                  <div className={`${fonte === item.id ? 'text-brand-blue' : 'text-gray-500'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.label}</h3>
                    <p className="text-[11px] text-gray-500 mt-1">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Filtros */}
          {passo === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Data Início</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="date" 
                      className="input pl-10" 
                      value={dataInicio} 
                      onChange={e => setDataInicio(e.target.value)} 
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Data Fim</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="date" 
                      className="input pl-10" 
                      value={dataFim} 
                      onChange={e => setDataFim(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {fonte === 'os' && (
                <>
                  <div>
                    <label className="label">Status da OS</label>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OS.map(status => (
                        <button
                          key={status}
                          onClick={() => setStatusFiltro(prev => 
                            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                          )}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            statusFiltro.includes(status) 
                              ? 'bg-brand-blue border-brand-blue text-white shadow-lg' 
                              : 'bg-brand-dark-4 border-brand-dark-5 text-gray-500 hover:border-gray-600'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Status de Execução (Qualquer Serviço)</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Não Iniciado',
                        'Iniciado — Montando Processo',
                        'Aguardando Documentos',
                        'Protocolado — Ag. PF',
                        'Concluído'
                      ].map(status => (
                        <button
                          key={status}
                          onClick={() => setExecucaoFiltro(prev => 
                            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                          )}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            execucaoFiltro.includes(status) 
                              ? 'bg-purple-600 border-purple-600 text-white shadow-lg' 
                              : 'bg-brand-dark-4 border-brand-dark-5 text-gray-500 hover:border-gray-600'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Colaborador Responsável</label>
                    <select 
                      className="select" 
                      value={colaboradorFiltro}
                      onChange={e => setColaboradorFiltro(e.target.value)}
                    >
                      <option value="Todos">Todos os Colaboradores</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.nome}>{u.nome}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {fonte === 'atividades' && (
                <div>
                  <label className="label">Filtrar por Colaborador</label>
                  <select 
                    className="select" 
                    value={colaboradorFiltro}
                    onChange={e => setColaboradorFiltro(e.target.value)}
                  >
                    <option value="Todos">Todos os Colaboradores</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.nome}>{u.nome}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-2">
                    A exportação retornará o log de operações (Criação de O.S., Protocolos e Deferimentos) do período.
                  </p>
                </div>
              )}
              
              {/* Adicionar mais filtros específicos conforme necessário */}
            </div>
          )}

          {/* Step 3: Colunas */}
          {passo === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">
                  {fonte === 'faturamento_detalhado' 
                    ? 'Selecione as seções que deseja incluir no relatório consolidado' 
                    : 'Selecione as colunas que deseja incluir no arquivo Excel'}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setColunas(prev => prev.map(c => ({...c, selected: true})))}
                    className="text-[10px] text-brand-blue font-bold uppercase hover:underline"
                  >
                    Marcar Todas
                  </button>
                  <button 
                    onClick={() => setColunas(prev => prev.map(c => ({...c, selected: false})))}
                    className="text-[10px] text-gray-500 font-bold uppercase hover:underline"
                  >
                    Desmarcar Todas
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {colunas.map(col => (
                  <button
                    key={col.key}
                    onClick={() => toggleColuna(col.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      col.selected ? 'border-brand-blue/50 bg-brand-blue/5 text-white' : 'border-brand-dark-5 text-gray-500'
                    }`}
                  >
                    {col.selected ? (
                      <CheckSquare size={18} className="text-brand-blue" />
                    ) : (
                      <Square size={18} />
                    )}
                    <span className="text-xs font-medium">{col.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-brand-dark-3 p-6 border-t border-brand-dark-5 flex items-center justify-between gap-4">
          <button 
            onClick={() => passo === 1 ? onClose() : setPasso(passo - 1)}
            className="btn-ghost flex-1 font-black text-xs uppercase tracking-widest"
          >
            {passo === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          
          {passo < 3 ? (
            <button 
              onClick={() => setPasso(passo + 1)}
              className="btn-primary flex-1 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Próximo Passo
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className="flex gap-2 flex-1 w-full">
              {fonte === 'faturamento_detalhado' ? (
                <>
                  <button 
                    onClick={() => handleExportar('pdf')}
                    className="btn-primary flex-1 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-red-600 border-red-600 hover:bg-red-600/90 text-white"
                  >
                    <FileText size={16} />
                    Gerar PDF
                  </button>
                  <button 
                    onClick={() => handleExportar('excel')}
                    className="btn-primary flex-1 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-brand-green border-brand-green hover:bg-brand-green/90 text-white"
                  >
                    <FileSpreadsheet size={16} />
                    Planilha (Excel)
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleExportar('excel')}
                  className="btn-primary flex-1 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-brand-green border-brand-green hover:bg-brand-green/90 text-white"
                >
                  <Download size={16} />
                  Gerar Planilha
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
