import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: user, error } = await supabase
    .from('usuarios_autorizados')
    .select('*')
    .eq('email', 'gui.gomesassis@gmail.com')
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('User:', user);
  }
}

run();
