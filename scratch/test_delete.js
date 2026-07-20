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
  const empresaId = '78c5a17f-6c30-4eee-b490-1eaab13b9822';
  
  console.log('Testing deletion of empresa:', empresaId);
  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', empresaId);

  if (error) {
    console.error('FAILED to delete empresa:', error);
  } else {
    console.log('SUCCESS: Empresa deleted successfully!');
  }
}

run();
