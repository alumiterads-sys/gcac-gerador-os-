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
        const u = JSON.parse(dados);
        setUsuario(u);
        // Recupera o token para o sessionStorage para não quebrar a sincronização no refresh
        if (u.accessToken) {
          sessionStorage.setItem('gcac_token', u.accessToken);
        }
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

      // Cadeado de segurança para Administrador Único (Guilherme)
      const USUARIOS_PERMITIDOS: Record<string, 'admin' | 'instrutor'> = {
        'gui.gomesassis@gmail.com': 'admin'
      };

      const emailLower = info.email.toLowerCase();
      if (!USUARIOS_PERMITIDOS[emailLower]) {
        throw new Error('ACESSO_REJEITADO');
      }

      const novoUsuario: UsuarioGoogle = {
        id: info.sub,
        nome: info.name,
        email: info.email,
        fotoPerfil: info.picture,
        accessToken: tokenResponse.access_token,
        role: USUARIOS_PERMITIDOS[emailLower],
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
