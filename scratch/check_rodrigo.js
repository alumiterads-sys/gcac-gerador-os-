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
  console.log('Querying all active links...');
  const { data: links, error: err2 } = await supabase
    .from('vinculos_despachante_cac')
    .select('*')
    .eq('status', 'ativo');
    
  if (err2) {
    console.error('Error querying links:', err2);
    return;
  }
  
  console.log('Active links found:', JSON.stringify(links, null, 2));
}

run();
