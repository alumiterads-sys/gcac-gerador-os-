import Dexie, { Table } from 'dexie';
import { OrdemDeServico, FilaSincronizacao, Cliente } from '../types';

class GCACDatabase extends Dexie {
  ordensDeServico!: Table<OrdemDeServico, string>;
  filaDeSincronizacao!: Table<FilaSincronizacao, number>;
  clientes!: Table<Cliente, string>;

  constructor() {
    super('GCACGeradordOS');

    this.version(1).stores({
      ordensDeServico: 'id, numero, status, nomeCliente, criadoEm, pendenteSincronizacao',
      filaDeSincronizacao: '++id, ordemId, operacao, criadoEm',
    });

    this.version(2).stores({
      clientes: 'id, cpf, nome, criadoEm'
    });
  }
}

export const db = new GCACDatabase();

// ─── Helpers ───────────────────────────────────────────────────────────────

export async function proximoNumeroOS(): Promise<number> {
  const total = await db.ordensDeServico.count();
  const ultima = await db.ordensDeServico.orderBy('numero').last();
  if (ultima) return ultima.numero + 1;
  return total + 1;
}

export async function adicionarNaFilaSync(
  ordemId: string,
  operacao: 'criar' | 'atualizar' | 'deletar'
): Promise<void> {
  const existente = await db.filaDeSincronizacao
    .where('ordemId').equals(ordemId)
    .first();

  if (existente) {
    await db.filaDeSincronizacao.update(existente.id!, {
      operacao,
      criadoEm: new Date().toISOString(),
    });
  } else {
    await db.filaDeSincronizacao.add({
      ordemId,
      operacao,
      tentativas: 0,
      criadoEm: new Date().toISOString(),
    });
  }
}

export async function removerDaFilaSync(ordemId: string): Promise<void> {
  await db.filaDeSincronizacao.where('ordemId').equals(ordemId).delete();
}

export async function limparDadosPesadosAposSyncOK(ordemId: string): Promise<void> {
  await db.ordensDeServico.update(ordemId, {
    pendenteSincronizacao: false,
    ultimaSincronizacao: new Date().toISOString(),
  });
  await removerDaFilaSync(ordemId);
}
