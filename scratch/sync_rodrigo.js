import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const localClienteId = 'a8551e1b-d47b-4b2c-9eff-c9437b5fc091';
  const cacEmpresaId = '27ab35ad-885a-42a6-a95c-a59bca4bdee4';
  const linkedClienteId = '303973f2-5153-4201-ab96-25b42878dc42';
  const localEmpresaId = '00000000-0000-0000-0000-000000000001';

  console.log('Running deep sync for Rodrigo Ferreira...');

  try {
    const { data: localArmas } = await supabase.from('armas').select('*').eq('cliente_id', localClienteId);
    const { data: portalArmas } = await supabase.from('armas').select('*').eq('empresa_id', cacEmpresaId);

    const portalArmasBySerie = new Map();
    portalArmas?.forEach(a => {
      if (a.numero_serie) portalArmasBySerie.set(a.numero_serie.trim().toUpperCase(), a);
    });

    const localArmasBySerie = new Map();
    localArmas?.forEach(a => {
      if (a.numero_serie) localArmasBySerie.set(a.numero_serie.trim().toUpperCase(), a);
    });

    // Sincronizar Armas (Alinhamento de IDs)
    for (const localArma of (localArmas || [])) {
      const serie = localArma.numero_serie?.trim().toUpperCase();
      if (!serie) continue;
      const pArma = portalArmasBySerie.get(serie);

      if (pArma) {
        if (localArma.id !== pArma.id) {
          console.log(`Unifying weapon ID for serie ${serie}: old local ${localArma.id} -> new portal ${pArma.id}`);
          await supabase.from('armas').delete().eq('id', localArma.id);
          const payload = {
            id: pArma.id,
            cliente_id: localClienteId,
            tipo: pArma.tipo || localArma.tipo,
            modelo: pArma.modelo || localArma.modelo,
            calibre: pArma.calibre || localArma.calibre,
            fabricante: pArma.fabricante || localArma.fabricante,
            numero_serie: pArma.numero_serie || localArma.numero_serie,
            numero_sigma: pArma.numero_sigma || localArma.numero_sigma,
            acervo: pArma.acervo || localArma.acervo,
            vencimento_craf: pArma.vencimento_craf || localArma.vencimento_craf,
            craf_url: pArma.craf_url || localArma.craf_url,
            craf_em_renovacao: pArma.craf_em_renovacao !== undefined ? pArma.craf_em_renovacao : localArma.craf_em_renovacao,
            empresa_id: localEmpresaId
          };
          await supabase.from('armas').insert([payload]);
          const { error: gtErr } = await supabase.from('guias_trafego').update({ arma_id: pArma.id }).eq('arma_id', localArma.id);
          if (gtErr) console.error('Error updating local GTs arma_id:', gtErr);
        } else {
          const payload = {
            tipo: pArma.tipo || localArma.tipo,
            modelo: pArma.modelo || localArma.modelo,
            calibre: pArma.calibre || localArma.calibre,
            fabricante: pArma.fabricante || localArma.fabricante,
            numero_sigma: pArma.numero_sigma || localArma.numero_sigma,
            acervo: pArma.acervo || localArma.acervo,
            vencimento_craf: pArma.vencimento_craf || localArma.vencimento_craf,
            craf_url: pArma.craf_url || localArma.craf_url,
            craf_em_renovacao: pArma.craf_em_renovacao !== undefined ? pArma.craf_em_renovacao : localArma.craf_em_renovacao,
          };
          await supabase.from('armas').update(payload).eq('id', localArma.id);
        }
      } else {
        console.log(`Uploading local weapon to portal for serie ${serie}`);
        const payload = {
          id: localArma.id,
          cliente_id: linkedClienteId,
          tipo: localArma.tipo,
          modelo: localArma.modelo,
          calibre: localArma.calibre,
          fabricante: localArma.fabricante,
          numero_serie: localArma.numero_serie,
          numero_sigma: localArma.numero_sigma,
          acervo: localArma.acervo,
          vencimento_craf: localArma.vencimento_craf,
          craf_url: localArma.craf_url,
          craf_em_renovacao: !!localArma.craf_em_renovacao,
          empresa_id: cacEmpresaId
        };
        await supabase.from('armas').insert([payload]);
      }
    }

    for (const pArma of (portalArmas || [])) {
      const serie = pArma.numero_serie?.trim().toUpperCase();
      if (!serie) continue;
      if (!localArmasBySerie.has(serie)) {
        console.log(`Downloading portal weapon to local for serie ${serie}`);
        const payload = {
          id: pArma.id,
          cliente_id: localClienteId,
          tipo: pArma.tipo,
          modelo: pArma.modelo,
          calibre: pArma.calibre,
          fabricante: pArma.fabricante,
          numero_serie: pArma.numero_serie,
          numero_sigma: pArma.numero_sigma,
          acervo: pArma.acervo,
          vencimento_craf: pArma.vencimento_craf,
          craf_url: pArma.craf_url,
          craf_em_renovacao: !!pArma.craf_em_renovacao,
          empresa_id: localEmpresaId
        };
        await supabase.from('armas').insert([payload]);
      }
    }

    // Sincronizar GTs
    const { data: currentLocalArmas } = await supabase.from('armas').select('id').eq('cliente_id', localClienteId);
    const currentArmaIds = currentLocalArmas?.map(a => a.id) || [];

    if (currentArmaIds.length > 0) {
      const { data: localGts } = await supabase.from('guias_trafego').select('*').in('arma_id', currentArmaIds);
      const { data: portalGts } = await supabase.from('guias_trafego').select('*').in('arma_id', currentArmaIds);

      const matchGtKey = (g) => `${g.arma_id}_${g.destino?.trim().toUpperCase()}_${g.vencimento}`;

      const portalGtsByKey = new Map();
      portalGts?.forEach(g => portalGtsByKey.set(matchGtKey(g), g));

      const localGtsByKey = new Map();
      localGts?.forEach(g => localGtsByKey.set(matchGtKey(g), g));

      for (const lGt of (localGts || [])) {
        const key = matchGtKey(lGt);
        const pGt = portalGtsByKey.get(key);

        if (pGt) {
          if (lGt.id !== pGt.id) {
            console.log(`Unifying GT ID: old local ${lGt.id} -> new portal ${pGt.id}`);
            await supabase.from('guias_trafego').delete().eq('id', lGt.id);
            const payload = {
              id: pGt.id,
              arma_id: lGt.arma_id,
              tipo: pGt.tipo || lGt.tipo,
              vencimento: pGt.vencimento || lGt.vencimento,
              destino: pGt.destino || lGt.destino,
              arquivo_url: pGt.arquivo_url || lGt.arquivo_url,
              gt_em_renovacao: pGt.gt_em_renovacao !== undefined ? pGt.gt_em_renovacao : lGt.gt_em_renovacao,
              empresa_id: localEmpresaId
            };
            await supabase.from('guias_trafego').insert([payload]);
          } else {
            const payload = {
              tipo: pGt.tipo || lGt.tipo,
              vencimento: pGt.vencimento || lGt.vencimento,
              destino: pGt.destino || lGt.destino,
              arquivo_url: pGt.arquivo_url || lGt.arquivo_url,
              gt_em_renovacao: pGt.gt_em_renovacao !== undefined ? pGt.gt_em_renovacao : lGt.gt_em_renovacao,
            };
            await supabase.from('guias_trafego').update(payload).eq('id', lGt.id);
          }
        } else {
          console.log(`Uploading local GT to portal for destination ${lGt.destino}`);
          const payload = {
            id: lGt.id,
            arma_id: lGt.arma_id,
            tipo: lGt.tipo,
            vencimento: lGt.vencimento,
            destino: lGt.destino,
            arquivo_url: lGt.arquivo_url,
            gt_em_renovacao: !!lGt.gt_em_renovacao,
            empresa_id: cacEmpresaId
          };
          await supabase.from('guias_trafego').insert([payload]);
        }
      }

      for (const pGt of (portalGts || [])) {
        const key = matchGtKey(pGt);
        if (!localGtsByKey.has(key)) {
          console.log(`Downloading portal GT to local for destination ${pGt.destino}`);
          const payload = {
            id: pGt.id,
            arma_id: pGt.arma_id,
            tipo: pGt.tipo,
            vencimento: pGt.vencimento,
            destino: pGt.destino,
            arquivo_url: pGt.arquivo_url,
            gt_em_renovacao: !!pGt.gt_em_renovacao,
            empresa_id: localEmpresaId
          };
          await supabase.from('guias_trafego').insert([payload]);
        }
      }
    }

    // Sincronizar Manejos
    const { data: localManejos } = await supabase.from('autorizacoes_manejo').select('*').eq('cliente_id', localClienteId);
    const { data: portalManejos } = await supabase.from('autorizacoes_manejo').select('*').eq('empresa_id', cacEmpresaId);

    const matchManejoKey = (m) => `${m.nome_fazenda?.trim().toUpperCase()}_${m.numero_car?.trim().toUpperCase()}`;

    const portalManejosByKey = new Map();
    portalManejos?.forEach(m => portalManejosByKey.set(matchManejoKey(m), m));

    const localManejosByKey = new Map();
    localManejos?.forEach(m => localManejosByKey.set(matchManejoKey(m), m));

    for (const lManejo of (localManejos || [])) {
      const key = matchManejoKey(lManejo);
      const pManejo = portalManejosByKey.get(key);

      if (pManejo) {
        if (lManejo.id !== pManejo.id) {
          console.log(`Unifying Manejo ID for fazenda ${lManejo.nome_fazenda}: old local ${lManejo.id} -> new portal ${pManejo.id}`);
          await supabase.from('autorizacoes_manejo').delete().eq('id', lManejo.id);
          const payload = {
            id: pManejo.id,
            cliente_id: localClienteId,
            numero_car: pManejo.numero_car || lManejo.numero_car,
            nome_fazenda: pManejo.nome_fazenda || lManejo.nome_fazenda,
            nome_proprietario: pManejo.nome_proprietario || lManejo.nome_proprietario,
            cidade: pManejo.cidade || lManejo.cidade,
            vencimento: pManejo.vencimento || lManejo.vencimento,
            status: pManejo.status || lManejo.status,
            arquivo_url: pManejo.arquivo_url || lManejo.arquivo_url,
            manejo_em_renovacao: pManejo.manejo_em_renovacao !== undefined ? pManejo.manejo_em_renovacao : lManejo.manejo_em_renovacao,
            empresa_id: localEmpresaId
          };
          await supabase.from('autorizacoes_manejo').insert([payload]);
        } else {
          console.log(`Updating local Manejo fields for ${lManejo.nome_fazenda}`);
          const payload = {
            cliente_id: localClienteId,
            numero_car: pManejo.numero_car || lManejo.numero_car,
            nome_fazenda: pManejo.nome_fazenda || lManejo.nome_fazenda,
            nome_proprietario: pManejo.nome_proprietario || lManejo.nome_proprietario,
            cidade: pManejo.cidade || lManejo.cidade,
            vencimento: pManejo.vencimento || lManejo.vencimento,
            status: pManejo.status || lManejo.status,
            arquivo_url: pManejo.arquivo_url || lManejo.arquivo_url,
            manejo_em_renovacao: pManejo.manejo_em_renovacao !== undefined ? pManejo.manejo_em_renovacao : lManejo.manejo_em_renovacao,
          };
          await supabase.from('autorizacoes_manejo').update(payload).eq('id', lManejo.id);
        }
      } else {
        console.log(`Uploading local Manejo to portal for fazenda ${lManejo.nome_fazenda}`);
        const payload = {
          id: lManejo.id,
          cliente_id: linkedClienteId,
          numero_car: lManejo.numero_car,
          nome_fazenda: lManejo.nome_fazenda,
          nome_proprietario: lManejo.nome_proprietario,
          cidade: lManejo.cidade,
          vencimento: lManejo.vencimento,
          status: lManejo.status || 'Ativo',
          arquivo_url: lManejo.arquivo_url,
          manejo_em_renovacao: !!lManejo.manejo_em_renovacao,
          empresa_id: cacEmpresaId
        };
        await supabase.from('autorizacoes_manejo').insert([payload]);
      }
    }

    for (const pManejo of (portalManejos || [])) {
      const key = matchManejoKey(pManejo);
      if (!localManejosByKey.has(key)) {
        console.log(`Downloading portal Manejo to local for fazenda ${pManejo.nome_fazenda}`);
        const payload = {
          id: pManejo.id,
          cliente_id: localClienteId,
          numero_car: pManejo.numero_car,
          nome_fazenda: pManejo.nome_fazenda,
          nome_proprietario: pManejo.nome_proprietario,
          cidade: pManejo.cidade,
          vencimento: pManejo.vencimento,
          status: pManejo.status || 'Ativo',
          arquivo_url: pManejo.arquivo_url,
          manejo_em_renovacao: !!pManejo.manejo_em_renovacao,
          empresa_id: localEmpresaId
        };
        await supabase.from('autorizacoes_manejo').insert([payload]);
      }
    }

    console.log('Deep sync finished successfully!');

  } catch (err) {
    console.error('Deep sync failed:', err);
  }
}

run();
