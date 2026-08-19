-- 1. Criar Tabela de Locais
CREATE TABLE IF NOT EXISTS public.locais_laudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (empresa_id, nome)
);

ALTER TABLE public.locais_laudos DISABLE ROW LEVEL SECURITY;

-- 2. Criar Tabela de Profissionais
CREATE TABLE IF NOT EXISTS public.profissionais_laudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Tiro', 'Psicológico')),
    locais_ids UUID[] DEFAULT '{}'::uuid[],
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (empresa_id, nome, tipo)
);

ALTER TABLE public.profissionais_laudos DISABLE ROW LEVEL SECURITY;

-- 3. Inserir sementes (seeds) para a empresa padrão
DO $$
DECLARE
    empresa_default_id UUID := '00000000-0000-0000-0000-000000000001';
    local_pro_tiro_id UUID := gen_random_uuid();
    local_armazem_id UUID := gen_random_uuid();
    local_pantanal_id UUID := gen_random_uuid();
    local_metra_id UUID := gen_random_uuid();
    local_hunter_id UUID := gen_random_uuid();
BEGIN
    -- Verifica se a empresa existe antes de inserir
    IF EXISTS (SELECT 1 FROM public.empresas WHERE id = empresa_default_id) THEN
        
        -- Inserir locais
        INSERT INTO public.locais_laudos (id, empresa_id, nome, ativo)
        VALUES 
            (local_pro_tiro_id, empresa_default_id, 'CLUBE DE TIRO E CAÇA PRÓ TIRO (JATAÍ)', true),
            (local_armazem_id, empresa_default_id, 'CLUBE DE TIRO ARMAZÉM DO CAC', true),
            (local_pantanal_id, empresa_default_id, 'CLUBE DE TIRO E CAÇA DO PANTANAL', true),
            (local_metra_id, empresa_default_id, 'CLÍNICA METRA', true),
            (local_hunter_id, empresa_default_id, 'HUNTER', true)
        ON CONFLICT (empresa_id, nome) DO NOTHING;

        -- Obter os UUIDs reais caso já existissem para evitar conflito de UUID gerado aleatoriamente
        SELECT id INTO local_pro_tiro_id FROM public.locais_laudos WHERE empresa_id = empresa_default_id AND nome = 'CLUBE DE TIRO E CAÇA PRÓ TIRO (JATAÍ)';
        SELECT id INTO local_metra_id FROM public.locais_laudos WHERE empresa_id = empresa_default_id AND nome = 'CLÍNICA METRA';
        SELECT id INTO local_hunter_id FROM public.locais_laudos WHERE empresa_id = empresa_default_id AND nome = 'HUNTER';

        -- Inserir profissionais vinculando aos locais
        INSERT INTO public.profissionais_laudos (empresa_id, nome, tipo, locais_ids, ativo)
        VALUES 
            (empresa_default_id, 'KEOMA MARQUES', 'Tiro', ARRAY[local_pro_tiro_id, local_hunter_id], true),
            (empresa_default_id, 'MILLENA QUELUZ', 'Psicológico', ARRAY[local_metra_id], true)
        ON CONFLICT (empresa_id, nome, tipo) DO NOTHING;

    END IF;
END $$;
