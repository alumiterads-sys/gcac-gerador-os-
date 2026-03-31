-- Script de reversão da plataforma instrutores
-- Este script limpa a tabela de perfis e remove a obrigatoriedade de usuario_id nos agendamentos.

-- 1. Remove a tabela de perfis (se desejar limpar completamente o banco)
-- DROP TABLE IF EXISTS public.perfis CASCADE;

-- 2. Limpa os IDs de usuários dos agendamentos (opcional)
-- UPDATE public.agendamentos SET usuario_id = NULL;

-- OBSERVAÇÃO: O sistema no código já ignora o usuario_id agora.
-- Este script é apenas para referência de limpeza manual se necessário.
