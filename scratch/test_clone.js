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

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

async function testClone() {
  const emailLower = 'gui.g.assis09@gmail.com';
  const convite = {
    id: 'd62bf7f7-28f8-4a00-a215-51d41688ffba',
    cliente_id: '02f11a3e-9037-45bd-af84-84c9e53a8c0a',
    cliente_cpf: '516.999.071-53',
  };
  const googleInfo = {
    name: 'Guilherme Gomes',
    email: emailLower,
  };

  // We will create a mock company and a mock user to simulate this
  // 1. Create company
  console.log('1. Creating empresa...');
  const { data: novaEmpresa, error: erroEmpresa } = await supabase
    .from('empresas')
    .insert([{
      nome: googleInfo.name.toUpperCase(),
      tipo_conta: 'cac_individual',
      modulos_ativos: ['clientes', 'agenda', 'config'],
      limite_cac_vinculados: 0,
      recursos_liberados: [],
    }])
    .select('id')
    .single();

  if (erroEmpresa || !novaEmpresa) {
    console.error('Error creating empresa:', erroEmpresa);
    return;
  }
  const empresaId = novaEmpresa.id;
  console.log('Empresa created:', empresaId);

  // 2. Create user
  console.log('2. Creating user...');
  const { error: erroUsuario } = await supabase
    .from('usuarios_autorizados')
    .insert([{
      nome: googleInfo.name,
      email: emailLower + '.test', // use a test email so it doesn't conflict
      cpf: convite.cliente_cpf || null,
      empresa_id: empresaId,
      role: 'admin',
      ativo: true,
      permissoes: ['clientes', 'agenda', 'config'],
    }]);

  if (erroUsuario) {
    console.error('Error creating user:', erroUsuario);
    return;
  }
  console.log('User created successfully.');

  // 3. Fetch source client
  console.log('3. Fetching source client...');
  const { data: clienteOrigem, error: errSrcCl } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', convite.cliente_id)
    .maybeSingle();

  if (errSrcCl) {
    console.error('Error fetching source client:', errSrcCl);
  }
  console.log('Source client:', clienteOrigem);

  const novoClienteId = generateUUID();

  // 4. Create client profile
  console.log('4. Creating client profile...');
  const clientPayload = {
    id: novoClienteId,
    nome: googleInfo.name.toUpperCase(),
    cpf: convite.cliente_cpf || clienteOrigem?.cpf || null,
    email: emailLower,
    empresa_id: empresaId,
    contato: clienteOrigem?.contato || null,
    senha_gov: clienteOrigem?.senha_gov || '',
    filiado_pro_tiro: clienteOrigem?.filiado_pro_tiro || false,
    clube_filiado: clienteOrigem?.clube_filiado || '',
    observacoes: clienteOrigem?.observacoes || 'PERFIL INDIVIDUAL CAC (criado via convite despachante)',
    endereco: clienteOrigem?.endereco || '',
    numero_cr: clienteOrigem?.numero_cr || '',
    vencimento_cr: clienteOrigem?.vencimento_cr || null,
    numero_cr_ibama: clienteOrigem?.numero_cr_ibama || '',
    vencimento_cr_ibama: clienteOrigem?.vencimento_cr_ibama || null,
    foto_url: clienteOrigem?.foto_url || '',
    cr_url: clienteOrigem?.cr_url || '',
    cr_ibama_url: clienteOrigem?.cr_ibama_url || '',
  };

  const { error: erroCliente } = await supabase
    .from('clientes')
    .insert([clientPayload]);

  if (erroCliente) {
    console.error('Error creating client profile:', erroCliente);
  } else {
    console.log('Client profile created successfully with ID:', novoClienteId);
  }

  // 5. Clone weapons
  console.log('5. Cloning weapons...');
  const { data: armasOrigem, error: errSrcArm } = await supabase
    .from('armas')
    .select('*')
    .eq('cliente_id', convite.cliente_id);

  if (errSrcArm) console.error('Error fetching source weapons:', errSrcArm);
  console.log('Source weapons:', armasOrigem);

  if (armasOrigem && armasOrigem.length > 0) {
    for (const arma of armasOrigem) {
      const novaArmaId = generateUUID();
      console.log('Cloning weapon:', arma.modelo, 'with new ID:', novaArmaId);
      const { error: erroArma } = await supabase
        .from('armas')
        .insert([{
          id: novaArmaId,
          cliente_id: novoClienteId,
          tipo: arma.tipo || '',
          modelo: arma.modelo,
          calibre: arma.calibre,
          fabricante: arma.fabricante,
          numero_serie: arma.numero_serie,
          numero_sigma: arma.numero_sigma,
          acervo: arma.acervo,
          vencimento_craf: arma.vencimento_craf || null,
          craf_url: arma.craf_url || null,
          empresa_id: empresaId,
        }]);

      if (erroArma) {
        console.error('Error cloning weapon:', erroArma);
      } else {
        console.log('Weapon cloned successfully.');
        // Clone traffic guides
        const { data: gtsOrigem, error: errSrcGt } = await supabase
          .from('guias_trafego')
          .select('*')
          .eq('arma_id', arma.id);

        if (errSrcGt) console.error('Error fetching source guides:', errSrcGt);
        console.log('Source guides:', gtsOrigem);

        if (gtsOrigem && gtsOrigem.length > 0) {
          const gtsParaInserir = gtsOrigem.map(gt => ({
            id: generateUUID(),
            arma_id: novaArmaId,
            tipo: gt.tipo,
            vencimento: gt.vencimento,
            destino: gt.destino,
            arquivo_url: gt.arquivo_url || null,
            empresa_id: empresaId,
          }));
          const { error: erroGt } = await supabase.from('guias_trafego').insert(gtsParaInserir);
          if (erroGt) console.error('Error inserting guides:', erroGt);
          else console.log('Guides cloned successfully.');
        }
      }
    }
  }

  // 6. Clone manejos
  console.log('6. Cloning manejos...');
  const { data: manejosOrigem, error: errSrcMan } = await supabase
    .from('autorizacoes_manejo')
    .select('*')
    .eq('cliente_id', convite.cliente_id);

  if (errSrcMan) console.error('Error fetching source manejos:', errSrcMan);
  console.log('Source manejos:', manejosOrigem);

  if (manejosOrigem && manejosOrigem.length > 0) {
    const manejosParaInserir = manejosOrigem.map(manejo => ({
      id: generateUUID(),
      cliente_id: novoClienteId,
      numero_car: manejo.numero_car,
      nome_fazenda: manejo.nome_fazenda,
      nome_proprietario: manejo.nome_proprietario,
      cidade: manejo.cidade,
      vencimento: manejo.vencimento,
      status: manejo.status || 'Ativo',
      arquivo_url: manejo.arquivo_url || null,
      empresa_id: empresaId,
    }));
    const { error: erroMan } = await supabase.from('autorizacoes_manejo').insert(manejosParaInserir);
    if (erroMan) console.error('Error inserting manejos:', erroMan);
    else console.log('Manejos cloned successfully.');
  }

  // Cleanup simulation data
  console.log('Cleaning up simulation...');
  await supabase.from('vinculos_despachante_cac').delete().eq('cac_empresa_id', empresaId);
  await supabase.from('autorizacoes_manejo').delete().eq('empresa_id', empresaId);
  await supabase.from('guias_trafego').delete().eq('empresa_id', empresaId);
  await supabase.from('armas').delete().eq('empresa_id', empresaId);
  await supabase.from('clientes').delete().eq('empresa_id', empresaId);
  await supabase.from('usuarios_autorizados').delete().eq('empresa_id', empresaId);
  await supabase.from('empresas').delete().eq('id', empresaId);
  console.log('Cleanup completed.');
}

testClone();
