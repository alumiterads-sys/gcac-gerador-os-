import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UsuarioGoogle } from '../types';
import { supabase } from '../db/supabase';

interface AuthContextType {
  usuario: UsuarioGoogle | null;
  estaAutenticado: boolean;
  estaCarregando: boolean;
  login: (tokenResponse: { access_token: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioGoogle | null>(null);
  const [estaCarregando, setEstaCarregando] = useState(true);

  useEffect(() => {
    const dados = localStorage.getItem('gcac_usuario');
    if (dados) {
      try {
        setUsuario(JSON.parse(dados));
      } catch {
        localStorage.removeItem('gcac_usuario');
      }
    }
    setEstaCarregando(false);
  }, []);

  const login = useCallback(async (tokenResponse: { access_token: string }) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const info = await res.json();

      // 1. Busca o perfil pelo E-MAIL (forma mais segura de pré-cadastro)
      let { data: perfil, error: errorPerfil } = await supabase
        .from('perfis')
        .select('*')
        .eq('email', info.email.toLowerCase())
        .single();
      
      if (errorPerfil || !perfil) {
        console.error('Perfil não encontrado no banco:', info.email);
        throw new Error('ACESSO_REJEITADO');
      }

      // 2. Se o ID no banco for diferente do Google Sub (primeiro acesso ou troca de conta)
      // atualizamos o ID para garantir o funcionamento do RLS futuramente.
      if (perfil.id !== info.sub) {
        const { error: errorUpdate } = await supabase
          .from('perfis')
          .update({ id: info.sub })
          .eq('email', info.email.toLowerCase());
          
        if (!errorUpdate) {
          perfil.id = info.sub;
        }
      }

      if (!perfil.ativo) {
        throw new Error('CONTA_DESATIVADA');
      }

      const novoUsuario: UsuarioGoogle = {
        id: info.sub,
        nome: info.name,
        email: info.email,
        fotoPerfil: info.picture,
        accessToken: tokenResponse.access_token,
        role: perfil.role as 'admin' | 'instrutor',
      };

      setUsuario(novoUsuario);
      localStorage.setItem('gcac_usuario', JSON.stringify(novoUsuario));
      sessionStorage.setItem('gcac_token', tokenResponse.access_token);
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem('gcac_usuario');
    sessionStorage.removeItem('gcac_token');
  }, []);

  return (
    <AuthContext.Provider value={{
      usuario,
      estaAutenticado: !!usuario,
      estaCarregando,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem('gcac_token');
}
