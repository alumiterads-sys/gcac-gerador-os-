const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xknexpjapjanozsuowod.supabase.co';
const supabaseKey = 'sb_publishable_HAFcm7qicaIH-FrexVz3lQ_mqRRhurR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: companies, error } = await supabase
    .from('empresas')
    .select('*');

  if (error) {
    console.error('Error fetching companies:', error);
    return;
  }

  const wiltonComp = companies.find(c => c.nome && c.nome.toUpperCase().includes('WILTON'));
  if (wiltonComp) {
    console.log('Found company:', wiltonComp);
  } else {
    console.log('Wilton company not found. All companies:', companies.map(c => ({ id: c.id, nome: c.nome })));
  }
}

main();
