import { OrdemDeServico } from '../types';
import { getAccessToken } from '../context/AuthContext';
import { gerarPdfBlob } from './geradorPdf';
import { supabase } from '../db/supabase';

const NOME_PASTA = 'GCAC_OS_Sync';
let idPastaCached: string | null = null;

// ─── Helpers de API ───────────────────────────────────────────────────────

function headers(token: string, contentType?: string) {
  const h: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (contentType) h['Content-Type'] = contentType;
  return h;
}

// ─── Garantir pasta no Drive ──────────────────────────────────────────────

async function garantirPastaSync(token: string): Promise<string> {
  if (idPastaCached) return idPastaCached;

  const query = encodeURIComponent(
    `name='${NOME_PASTA}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    { headers: headers(token) }
  );
  const data = await res.json();

  if (data.files && data.files.length > 0) {
    idPastaCached = data.files[0].id;
    return idPastaCached!;
  }

  const criar = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: headers(token, 'application/json'),
    body: JSON.stringify({
      name: NOME_PASTA,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const pasta = await criar.json();
  idPastaCached = pasta.id;
  return idPastaCached!;
}

// ─── Upload de JSON ───────────────────────────────────────────────────────

async function uploadJson(
  token: string,
  pastaId: string,
  ordem: OrdemDeServico
): Promise<string> {
  const nomeArquivo = `OS_${String(ordem.numero).padStart(4, '0')}_${ordem.id}.json`;
  const conteudo = JSON.stringify(ordem, null, 2);
  const blob = new Blob([conteudo], { type: 'application/json' });

  if (ordem.driveArquivoJsonId) {
    await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${ordem.driveArquivoJsonId}?uploadType=media`,
      { method: 'PATCH', headers: headers(token, 'application/json'), body: blob }
    );
    return ordem.driveArquivoJsonId;
  }

  const metadata = JSON.stringify({ name: nomeArquivo, parents: [pastaId] });
  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    { method: 'POST', headers: headers(token), body: form }
  );
  const arquivo = await res.json();
  return arquivo.id;
}

// ─── Upload de PDF ────────────────────────────────────────────────────────

async function uploadPdf(
  token: string,
  pastaId: string,
  ordem: OrdemDeServico,
  pdfBlob: Blob
): Promise<string> {
  const nomeArquivo = `OS_${String(ordem.numero).padStart(4, '0')}_${ordem.id}.pdf`;

  if (ordem.drivePdfId) {
    await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${ordem.drivePdfId}?uploadType=media`,
      { method: 'PATCH', headers: headers(token, 'application/pdf'), body: pdfBlob }
    );
    return ordem.drivePdfId;
  }

  const metadata = JSON.stringify({ name: nomeArquivo, parents: [pastaId] });
  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', pdfBlob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    { method: 'POST', headers: headers(token), body: form }
  );
  const arquivo = await res.json();
  return arquivo.id;
}

// ─── Sincronizar uma ordem ────────────────────────────────────────────────

export async function sincronizarOrdem(ordem: OrdemDeServico): Promise<boolean> {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const pastaId = await garantirPastaSync(token);
    const pdfBlob = await gerarPdfBlob(ordem);

    const [jsonId, pdfId] = await Promise.all([
      uploadJson(token, pastaId, ordem),
      uploadPdf(token, pastaId, ordem, pdfBlob),
    ]);

    await supabase
      .from('ordens')
      .update({
        drive_arquivo_json_id: jsonId,
        drive_pdf_id: pdfId,
        pendente_sincronizacao: false,
        ultima_sincronizacao: new Date().toISOString()
      })
      .eq('id', ordem.id);

    return true;
  } catch (err) {
    console.error('Erro ao sincronizar OS no Drive:', err);
    return false;
  }
}

// ─── Sincronizar todos os pendentes ──────────────────────────────────────

export async function sincronizarPendentes(): Promise<{ ok: number; erro: number }> {
  /*
   Com o Supabase, o banco central é online. Isso aqui faz o envio atrasado de arquivos pro 
   Google Drive (se der erro de internet durante a criação da OS).
  */
  const token = getAccessToken();
  if (!token) return { ok: 0, erro: 0 };

  const { data: pendentes } = await supabase
    .from('ordens')
    .select('*')
    .eq('pendente_sincronizacao', true);

  if (!pendentes || pendentes.length === 0) return { ok: 0, erro: 0 };

  let ok = 0;
  let erro = 0;

  for (const row of pendentes) {
    const ordem: OrdemDeServico = {
      id: row.id,
      numero: parseInt(row.numero, 10),
      nomeCliente: row.nome_cliente,
      contato: row.contato,
      cpf: row.cpf,
      senhaGov: row.senha_gov || '',
      filiadoProTiro: row.filiado_pro_tiro,
      clubeFiliado: row.clube_filiado || '',
      servicos: row.servicos || [],
      valor: row.valor,
      formaPagamento: row.forma_pagamento as any,
      status: row.status as any,
      canalAtendimento: row.canal_atendimento as any,
      observacaoContato: row.observacao_contato || '',
      observacoes: row.observacoes || '',
      driveArquivoJsonId: row.drive_arquivo_json_id || null,
      drivePdfId: row.drive_pdf_id || null,
      ultimaSincronizacao: row.ultima_sincronizacao || null,
      pendenteSincronizacao: row.pendente_sincronizacao,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
    };

    const sucesso = await sincronizarOrdem(ordem);
    if (sucesso) ok++;
    else erro++;
  }

  return { ok, erro };
}

// ─── Deletar arquivos do Drive ────────────────────────────────────────────

export async function deletarArquivosDrive(ordem: OrdemDeServico): Promise<void> {
  const token = getAccessToken();
  if (!token) return;

  const deletes: Promise<void>[] = [];

  if (ordem.driveArquivoJsonId) {
    deletes.push(
      fetch(`https://www.googleapis.com/drive/v3/files/${ordem.driveArquivoJsonId}`, {
        method: 'DELETE',
        headers: headers(token),
      }).then(() => {})
    );
  }

  if (ordem.drivePdfId) {
    deletes.push(
      fetch(`https://www.googleapis.com/drive/v3/files/${ordem.drivePdfId}`, {
        method: 'DELETE',
        headers: headers(token),
      }).then(() => {})
    );
  }

  await Promise.allSettled(deletes);
}
