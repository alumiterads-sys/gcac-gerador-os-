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
  console.log('Querying options...');
  
  // Encontrar o usuario master para pegar o empresa_id
  const { data: users, error: errU } = await supabase
    .from('usuarios_autorizados')
    .select('*')
    .eq('email', 'gui.gomesassis@gmail.com');

  if (errU) {
    console.error('Error users:', errU);
    return;
  }
  
  console.log('Users found:', users);
  if (!users || users.length === 0) {
    console.log('User not found.');
    return;
  }

  const empresaId = users[0].empresa_id;
  console.log('Empresa ID:', empresaId);

  // Buscar opções cadastradas
  const { data: opcoes, error: errOp } = await supabase
    .from('opcoes_armas')
    .select('*')
    .eq('empresa_id', empresaId);

  if (errOp) {
    console.error('Error querying opcoes:', errOp);
  } else {
    console.log(`Total options found: ${opcoes.length}`);
    console.log('Calibres:', opcoes.filter(o => o.tipo === 'calibre').map(o => ({ id: o.id, nome: o.nome })));
  }
}

run();
