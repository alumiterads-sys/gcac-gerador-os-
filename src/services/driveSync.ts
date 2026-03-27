import { OrdemDeServico } from '../types';
import { getAccessToken } from '../context/AuthContext';
import { db, adicionarNaFilaSync, limparDadosPesadosAposSyncOK } from '../db/database';
import { gerarPdfBlob } from './geradorPdf';

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

  // Buscar pasta existente
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

  // Criar pasta
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
    // Atualizar arquivo existente
    await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${ordem.driveArquivoJsonId}?uploadType=media`,
      { method: 'PATCH', headers: headers(token, 'application/json'), body: blob }
    );
    return ordem.driveArquivoJsonId;
  }

  // Criar novo arquivo (multipart)
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

    await db.ordensDeServico.update(ordem.id, {
      driveArquivoJsonId: jsonId,
      drivePdfId: pdfId,
    });

    await limparDadosPesadosAposSyncOK(ordem.id);
    return true;
  } catch (err) {
    console.error('Erro ao sincronizar OS:', err);
    return false;
  }
}

// ─── Sincronizar todos os pendentes ──────────────────────────────────────

export async function sincronizarPendentes(): Promise<{ ok: number; erro: number }> {
  const token = getAccessToken();
  if (!token) return { ok: 0, erro: 0 };

  const fila = await db.filaDeSincronizacao.toArray();
  let ok = 0;
  let erro = 0;

  for (const item of fila) {
    if (item.operacao === 'deletar') {
      // Já foi deletado localmente — remove da fila
      await db.filaDeSincronizacao.delete(item.id!);
      ok++;
      continue;
    }

    const ordem = await db.ordensDeServico.get(item.ordemId);
    if (!ordem) {
      await db.filaDeSincronizacao.delete(item.id!);
      continue;
    }

    const sucesso = await sincronizarOrdem(ordem);
    if (sucesso) {
      ok++;
    } else {
      await db.filaDeSincronizacao.update(item.id!, {
        tentativas: item.tentativas + 1,
      });
      erro++;
    }
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
