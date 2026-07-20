import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const localId = 'a8551e1b-d47b-4b2c-9eff-c9437b5fc091';
  const linkedEmpresaId = '27ab35ad-885a-42a6-a95c-a59bca4bdee4';

  console.log('--- LOCAL CUSTOMER RECORD ---');
  const { data: localCliente } = await supabase.from('clientes').select('*').eq('id', localId).single();
  console.log('Local Cliente:', localCliente ? { id: localCliente.id, nome: localCliente.nome, cpf: localCliente.cpf, vencimento_cr: localCliente.vencimento_cr, vencimento_cr_ibama: localCliente.vencimento_cr_ibama } : 'NOT FOUND');

  const { data: localArmas } = await supabase.from('armas').select('*').eq('cliente_id', localId);
  console.log(`Local Armas (${localArmas?.length || 0}):`, localArmas?.map(a => ({ id: a.id, modelo: a.modelo, serie: a.numero_serie, vencimento_craf: a.vencimento_craf })));

  const localArmaIds = localArmas?.map(a => a.id) || [];
  if (localArmaIds.length > 0) {
    const { data: localGts } = await supabase.from('guias_trafego').select('*').in('arma_id', localArmaIds);
    console.log(`Local GTs (${localGts?.length || 0}):`, localGts?.map(g => ({ id: g.id, arma_id: g.arma_id, vencimento: g.vencimento, destino: g.destino })));
  }

  const { data: localManejos } = await supabase.from('autorizacoes_manejo').select('*').eq('cliente_id', localId);
  console.log(`Local Manejos (${localManejos?.length || 0}):`, localManejos?.map(m => ({ id: m.id, fazenda: m.nome_fazenda, vencimento: m.vencimento })));


  console.log('\n--- LINKED CAC PORTAL WORKSPACE ---');
  const { data: linkedClientes } = await supabase.from('clientes').select('*').eq('empresa_id', linkedEmpresaId);
  const linkedCliente = linkedClientes?.[0];
  console.log('Linked Cliente:', linkedCliente ? { id: linkedCliente.id, nome: linkedCliente.nome, cpf: linkedCliente.cpf, vencimento_cr: linkedCliente.vencimento_cr, vencimento_cr_ibama: linkedCliente.vencimento_cr_ibama } : 'NOT FOUND');

  if (linkedCliente) {
    const { data: linkedArmas } = await supabase.from('armas').select('*').eq('empresa_id', linkedEmpresaId);
    console.log(`Linked Armas (${linkedArmas?.length || 0}):`, linkedArmas?.map(a => ({ id: a.id, cliente_id: a.cliente_id, modelo: a.modelo, serie: a.numero_serie, vencimento_craf: a.vencimento_craf })));

    const linkedArmaIds = linkedArmas?.map(a => a.id) || [];
    if (linkedArmaIds.length > 0) {
      const { data: linkedGts } = await supabase.from('guias_trafego').select('*').in('arma_id', linkedArmaIds);
      console.log(`Linked GTs (${linkedGts?.length || 0}):`, linkedGts?.map(g => ({ id: g.id, arma_id: g.arma_id, vencimento: g.vencimento, destino: g.destino })));
    }

    const { data: linkedManejos } = await supabase.from('autorizacoes_manejo').select('*').eq('empresa_id', linkedEmpresaId);
    console.log(`Linked Manejos (${linkedManejos?.length || 0}):`, linkedManejos?.map(m => ({ id: m.id, cliente_id: m.cliente_id, fazenda: m.nome_fazenda, vencimento: m.vencimento })));
  }
}

run();
