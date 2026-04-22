import { supabase } from '../db/supabase';
import { calcularAlerta, AlertaDocumento } from '../utils/vencimentos';

export async function buscarAlertasGlobais(): Promise<AlertaDocumento[]> {
  const alertas: AlertaDocumento[] = [];

  // 1. Buscar Clientes (CR e IBAMA CR)
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, numero_cr, vencimento_cr, vencimento_cr_ibama');

  if (clientes) {
    clientes.forEach(c => {
      if (c.vencimento_cr) {
        const result = calcularAlerta('CR', c.vencimento_cr);
        if (result.nivel !== 'OK') {
          alertas.push({
            id: `${c.id}-cr`,
            tipo: 'CR',
            label: `CR Exército/PF: ${c.numero_cr || 'N/I'}`,
            dataVencimento: c.vencimento_cr,
            nivel: result.nivel,
            diasRestantes: result.dias,
            clienteNome: c.nome
          });
        }
      }
      if (c.vencimento_cr_ibama) {
        const result = calcularAlerta('IBAMA_CR', c.vencimento_cr_ibama);
        if (result.nivel !== 'OK') {
          alertas.push({
            id: `${c.id}-ibama`,
            tipo: 'IBAMA_CR',
            label: 'CR IBAMA',
            dataVencimento: c.vencimento_cr_ibama,
            nivel: result.nivel,
            diasRestantes: result.dias,
            clienteNome: c.nome
          });
        }
      }
    });
  }

  // 2. Buscar Armas (CRAF)
  const { data: armas } = await supabase
    .from('armas')
    .select('id, modelo, vencimento_craf, clientes(nome)') as any;

  if (armas) {
    armas.forEach((a: any) => {
      if (a.vencimento_craf) {
        const result = calcularAlerta('CRAF', a.vencimento_craf);
        if (result.nivel !== 'OK') {
          alertas.push({
            id: `${a.id}-craf`,
            tipo: 'CRAF',
            label: `CRAF: ${a.modelo}`,
            dataVencimento: a.vencimento_craf,
            nivel: result.nivel,
            diasRestantes: result.dias,
            clienteNome: a.clientes?.nome,
            armaModelo: a.modelo
          });
        }
      }
    });
  }

  // 3. Buscar GTs
  const { data: gts } = await supabase
    .from('guias_trafego')
    .select('id, tipo, vencimento, armas(modelo, clientes(nome))') as any;

  if (gts) {
    gts.forEach((g: any) => {
      if (g.vencimento) {
        const result = calcularAlerta('GT', g.vencimento);
        if (result.nivel !== 'OK') {
          alertas.push({
            id: `${g.id}-gt`,
            tipo: 'GT',
            label: `GT ${g.tipo}: ${g.armas?.modelo}`,
            dataVencimento: g.vencimento,
            nivel: result.nivel,
            diasRestantes: result.dias,
            clienteNome: g.armas?.clientes?.nome,
            armaModelo: g.armas?.modelo
          });
        }
      }
    });
  }

  // 4. Buscar Manejos
  const { data: manejos } = await supabase
    .from('autorizacoes_manejo')
    .select('id, nome_fazenda, vencimento, clientes(nome)') as any;

  if (manejos) {
    manejos.forEach((m: any) => {
      if (m.vencimento) {
        const result = calcularAlerta('MANEJO', m.vencimento);
        if (result.nivel !== 'OK') {
          alertas.push({
            id: `${m.id}-manejo`,
            tipo: 'MANEJO',
            label: `Manejo: ${m.nome_fazenda}`,
            dataVencimento: m.vencimento,
            nivel: result.nivel,
            diasRestantes: result.dias,
            clienteNome: m.clientes?.nome
          });
        }
      }
    });
  }

  // Ordenar por gravidade e depois por data
  return alertas.sort((a, b) => {
    const ordem = { 'VENCIDO': 0, 'CRITICO': 1, 'AVISO': 2, 'OK': 3 };
    if (ordem[a.nivel] !== ordem[b.nivel]) return ordem[a.nivel] - ordem[b.nivel];
    return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
  });
}
