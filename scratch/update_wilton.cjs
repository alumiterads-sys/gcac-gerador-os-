const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xknexpjapjanozsuowod.supabase.co';
const supabaseKey = 'sb_publishable_HAFcm7qicaIH-FrexVz3lQ_mqRRhurR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const companyId = 'd98ac18f-34fa-4b55-ac65-24f4c1e89126'; // Wilton P. Lacerda- SIMAF
  
  console.log('Updating company configurations for ID:', companyId);
  const { data, error } = await supabase
    .from('empresas')
    .update({
      alerta_manejo: 2,
      alerta_ibama_cr: 1
    })
    .eq('id', companyId)
    .select();

  if (error) {
    console.error('Error updating company:', error);
  } else {
    console.log('Successfully updated company:', data);
  }
}

main();
