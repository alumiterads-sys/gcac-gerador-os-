const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xknexpjapjanozsuowod.supabase.co';
const supabaseKey = 'sb_publishable_HAFcm7qicaIH-FrexVz3lQ_mqRRhurR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Querying clients by name like %MILTON%');

  const { data: clients, error } = await supabase
    .from('clientes')
    .select('id, nome, cpf, responsavel_id, ignorar_mensagens_alertas, empresa_id')
    .ilike('nome', '%MILTON%');

  if (error) {
    console.error('Error fetching clients:', error);
    return;
  }

  console.log('Clients found in database:');
  clients.forEach(c => {
    console.log(`- ID: ${c.id}`);
    console.log(`  Name: ${c.nome}`);
    console.log(`  CPF: ${c.cpf}`);
    console.log(`  Responsavel ID: ${c.responsavel_id}`);
    console.log(`  Ignorar Alertas: ${c.ignorar_mensagens_alertas}`);
    console.log(`  Empresa ID: ${c.empresa_id}`);
    console.log('--------------------------------------');
  });
}

main();
