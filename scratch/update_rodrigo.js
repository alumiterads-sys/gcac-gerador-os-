import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Updating link permits_edicao = true for Rodrigo Ferreira...');
  const { data, error } = await supabase
    .from('vinculos_despachante_cac')
    .update({ 
      permite_edicao: true, 
      autorizado_edicao_em: new Date().toISOString(),
      termo_aceito_texto: 'Estou ciente e autorizo este despachante a gerenciar, atualizar e editar os dados do meu acervo.'
    })
    .eq('id', '3dd3e851-ac77-4b5c-8f3b-3402ed094ae6')
    .select();
  
  if (error) {
    console.error('Error updating link:', error);
    return;
  }
  
  console.log('Successfully updated link:', JSON.stringify(data, null, 2));
}

run();
