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
  const empresaId = '00000000-0000-0000-0000-000000000001';
  console.log('Testing insert for Empresa:', empresaId);

  // Vamos tentar inserir '.12 GA'
  const { data, error } = await supabase
    .from('opcoes_armas')
    .insert([{
      empresa_id: empresaId,
      tipo: 'calibre',
      nome: '.12 GA'
    }]);

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Insert succeeded! Data:', data);
    
    // Deletar para limpar o teste
    const { error: delErr } = await supabase
      .from('opcoes_armas')
      .delete()
      .eq('empresa_id', empresaId)
      .eq('tipo', 'calibre')
      .eq('nome', '.12 GA');
      
    if (delErr) console.error('Error cleaning up:', delErr);
    else console.log('Cleanup succeeded!');
  }
}

run();
