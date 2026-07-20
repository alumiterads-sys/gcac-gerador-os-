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
  const userId = 'f4ae9e86-8fb4-43e9-8011-59fd7ce56b11';
  const empresaId = '78c5a17f-6c30-4eee-b490-1eaab13b9822';
  
  console.log('1. Deleting user:', userId);
  const { error: errUser } = await supabase
    .from('usuarios_autorizados')
    .delete()
    .eq('id', userId);

  if (errUser) {
    console.error('Failed to delete user:', errUser);
    return;
  }
  console.log('User deleted successfully.');

  console.log('2. Deleting empresa:', empresaId);
  const { error: errEmp } = await supabase
    .from('empresas')
    .delete()
    .eq('id', empresaId);

  if (errEmp) {
    console.error('Failed to delete empresa:', errEmp);
  } else {
    console.log('Empresa deleted successfully!');
  }
}

run();
