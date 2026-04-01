import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: Credenciais do Supabase não encontradas.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para converter data do Excel (serial) para ISO
function excelDateToISO(serial) {
  if (!serial || isNaN(serial)) return new Date().toISOString();
  const date = new Date((serial - 25569) * 86400 * 1000);
  return date.toISOString();
}

async function startMigration() {
  try {
    const filePath = path.join(__dirname, 'serviços antigo sistema.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 'A' }).slice(1);

    console.log(`🚀 Iniciando migração de ${rows.length} Ordens de Serviço...`);

    // Busca todos os clientes para vincular pelo nome
    const { data: clientes } = await supabase.from('clientes').select('*');
    const clienteMap = new Map();
    clientes.forEach(c => clienteMap.set(c.nome.toUpperCase(), c));

    const ordensToInsert = [];

    for (const row of rows) {
      const nomeInput = String(row.C || '').trim().toUpperCase();
      const cliente = clienteMap.get(nomeInput);

      if (!cliente && nomeInput !== '') {
        console.warn(`⚠️ Cliente não encontrado: ${nomeInput}. Pulando ou criando placeholder? (Pulando para segurança)`);
        continue;
      }

      const valorTotal = parseFloat(row.H || 0);
      const isPago = String(row.I || '').toUpperCase() === 'PAGO';
      const statusExec = String(row.B || '').toUpperCase() === 'EM ANÁLISE PELA PF' 
        ? 'Protocolado — Ag. PF' 
        : 'Não Iniciado';

      const servicoObj = {
        id: crypto.randomUUID(),
        nome: String(row.E || 'Serviço Migrado').toUpperCase(),
        detalhes: String(row.K || ''),
        valor: valorTotal,
        statusExecucao: statusExec,
        pagoGRU: row.F === true || String(row.F).toUpperCase() === 'SIM'
      };

      const ordem = {
        nome_cliente: cliente.nome,
        contato: cliente.contato,
        cpf: cliente.cpf,
        senha_gov: cliente.senha_gov || '',
        filiado_pro_tiro: cliente.filiado_pro_tiro,
        clube_filiado: cliente.clube_filiado || '',
        servicos: [servicoObj],
        valor: valorTotal,
        valor_pago: isPago ? valorTotal : 0,
        status: isPago ? 'Pago' : 'Aguardando Pagamento',
        forma_pagamento: isPago ? (String(row.J || 'PIX')) : 'Pendente',
        historico_pagamentos: isPago ? [{
          id: crypto.randomUUID(),
          valor: valorTotal,
          metodo: String(row.J || 'PIX'),
          data: excelDateToISO(row.A)
        }] : [],
        protocolo: String(row.L || '').replace('nº', '').trim(),
        observacoes: `[MIGRAÇÃO] ${row.K || ''}`,
        canal_atendimento: 'WhatsApp',
        pendente_sincronizacao: true,
        criado_em: excelDateToISO(row.A),
        atualizado_em: new Date().toISOString()
      };

      ordensToInsert.push(ordem);
    }

    console.log(`📦 Preparadas ${ordensToInsert.length} Ordens para inserção.`);

    // Inserção em lotes
    const batchSize = 25;
    for (let i = 0; i < ordensToInsert.length; i += batchSize) {
      const batch = ordensToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from('ordens').insert(batch);
      if (error) {
        console.error(`❌ Erro no lote ${i/batchSize + 1}:`, error);
      } else {
        console.log(`✅ Lote ${i/batchSize + 1} concluído.`);
      }
    }

    console.log("✨ Migração concluída com sucesso!");
    process.exit(0);

  } catch (err) {
    console.error("💥 Erro fatal:", err);
    process.exit(1);
  }
}

startMigration();
