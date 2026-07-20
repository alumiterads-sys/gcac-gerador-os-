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
  console.log('Checking database...');
  console.log('URL:', supabaseUrl);
  
  const email = 'gui.g.assis09@gmail.com';
  const cpf = '51699907153';

  console.log('\n--- 1. CONVITES_CAC ---');
  const { data: convites, error: errC } = await supabase
    .from('convites_cac')
    .select('*')
    .or(`cliente_cpf.eq.${cpf},cliente_nome.ilike.%guilherme%`);
  if (errC) console.error('Error convites:', errC);
  else console.log(convites);

  console.log('\n--- 2. USUARIOS_AUTORIZADOS ---');
  const { data: users, error: errU } = await supabase
    .from('usuarios_autorizados')
    .select('*')
    .eq('email', email);
  if (errU) console.error('Error users:', errU);
  else console.log(users);

  if (users && users.length > 0) {
    const empresaIds = users.map(u => u.empresa_id);
    console.log('\n--- 2b. EMPRESAS ---');
    const { data: empresas, error: errEmp } = await supabase
      .from('empresas')
      .select('*')
      .in('id', empresaIds);
    if (errEmp) console.error('Error empresas:', errEmp);
    else console.log(empresas);
  }

  console.log('\n--- 3. CLIENTES BY CPF ---');
  const { data: clientesCpf, error: errClC } = await supabase
    .from('clientes')
    .select('*')
    .eq('cpf', '516.999.071-53');
  if (errClC) console.error('Error clientes cpf:', errClC);
  else console.log(clientesCpf);

  console.log('\n--- 4. CLIENTES BY EMAIL ---');
  const { data: clientesEmail, error: errClE } = await supabase
    .from('clientes')
    .select('*')
    .eq('email', email);
  if (errClE) console.error('Error clientes email:', errClE);
  else console.log(clientesEmail);

  console.log('\n--- 5. ARMAS ---');
  const { data: armas, error: errArm } = await supabase
    .from('armas')
    .select('*');
  if (errArm) console.error('Error armas:', errArm);
  else {
    // Filter locally or log them
    console.log('Total weapons:', armas.length);
    console.log('Weapons:', armas.map(a => ({ id: a.id, cliente_id: a.cliente_id, modelo: a.modelo, numero_serie: a.numero_serie, empresa_id: a.empresa_id })));
  }

  console.log('\n--- 6. GUIAS DE TRAFEGO ---');
  const { data: guias, error: errGui } = await supabase
    .from('guias_trafego')
    .select('*');
  if (errGui) console.error('Error guias:', errGui);
  else {
    console.log('Total guias:', guias.length);
    console.log('Guias:', guias.map(g => ({ id: g.id, arma_id: g.arma_id, tipo: g.tipo, empresa_id: g.empresa_id })));
  }
}

run();
