import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xknexpjapjanozsuowod.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const empresaId = '6eb7923d-95a4-4622-b91f-d04adf1e2a0b';
  
  console.log('Cleaning up tables for company:', empresaId);

  // 1. Update convites_cac to nullify cac_empresa_id
  console.log('- Nullifying convites_cac...');
  const { error: errConv } = await supabase
    .from('convites_cac')
    .update({ cac_empresa_id: null, status: 'pendente', aceito_em: null })
    .eq('cac_empresa_id', empresaId);
  if (errConv) console.error('Error convites:', errConv);

  // 2. Delete vinculos
  console.log('- Deleting vinculos...');
  const { error: errV } = await supabase
    .from('vinculos_despachante_cac')
    .delete()
    .or(`despachante_empresa_id.eq.${empresaId},cac_empresa_id.eq.${empresaId}`);
  if (errV) console.error('Error vinculos:', errV);

  // 3. Delete autorizacoes_manejo
  console.log('- Deleting autorizacoes_manejo...');
  const { error: errM } = await supabase
    .from('autorizacoes_manejo')
    .delete()
    .eq('empresa_id', empresaId);
  if (errM) console.error('Error manejos:', errM);

  // 4. Delete guias_trafego
  console.log('- Deleting guias_trafego...');
  const { error: errG } = await supabase
    .from('guias_trafego')
    .delete()
    .eq('empresa_id', empresaId);
  if (errG) console.error('Error guias:', errG);

  // 5. Delete armas
  console.log('- Deleting armas...');
  const { error: errA } = await supabase
    .from('armas')
    .delete()
    .eq('empresa_id', empresaId);
  if (errA) console.error('Error armas:', errA);

  // 6. Delete clientes
  console.log('- Deleting clientes...');
  const { error: errCl } = await supabase
    .from('clientes')
    .delete()
    .eq('empresa_id', empresaId);
  if (errCl) console.error('Error clientes:', errCl);

  // 7. Delete usuarios_autorizados
  console.log('- Deleting usuarios_autorizados...');
  const { error: errU } = await supabase
    .from('usuarios_autorizados')
    .delete()
    .eq('empresa_id', empresaId);
  if (errU) console.error('Error users:', errU);

  // 8. Delete empresa
  console.log('- Deleting empresa...');
  const { error: errEmp } = await supabase
    .from('empresas')
    .delete()
    .eq('id', empresaId);
  if (errEmp) {
    console.error('FAILED to delete empresa:', errEmp);
  } else {
    console.log('SUCCESS: Empresa deleted completely!');
  }
}

run();
