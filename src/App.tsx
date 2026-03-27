import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrdensProvider } from './context/OrdensContext';
import { AppShell } from './components/layout/AppShell';
import { PaginaLogin } from './components/auth/PaginaLogin';
import { Dashboard } from './components/dashboard/Dashboard';
import { ListaOrdens } from './components/ordens/ListaOrdens';
import { FormularioOrdem } from './components/ordens/FormularioOrdem';
import { DetalheOrdem } from './components/ordens/DetalheOrdem';
import { Configuracoes } from './components/config/Configuracoes';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/database';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ── Páginas de Ordens ────────────────────────────────────────────────────

function PaginaDetalheOrdem() {
  const { id } = useParams<{ id: string }>();
  const ordem = useLiveQuery(() => id ? db.ordensDeServico.get(id) : undefined, [id]);
  const navigate = useNavigate();

  if (ordem === undefined) return <div className="text-center py-20 text-gray-400">Carregando...</div>;
  if (ordem === null || !ordem) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">OS não encontrada</p>
        <button onClick={() => navigate('/ordens')} className="btn-primary">← Voltar para lista</button>
      </div>
    );
  }
  return <DetalheOrdem ordem={ordem} />;
}

function PaginaEditarOrdem() {
  const { id } = useParams<{ id: string }>();
  const ordem = useLiveQuery(() => id ? db.ordensDeServico.get(id) : undefined, [id]);

  if (ordem === undefined) return <div className="text-center py-20 text-gray-400">Carregando...</div>;
  if (!ordem) return <Navigate to="/ordens" replace />;
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Editar OS-{String(ordem.numero).padStart(4, '0')}</h1>
      <FormularioOrdem ordemExistente={ordem} />
    </div>
  );
}

// ── Guard de Autenticação ────────────────────────────────────────────────

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { estaAutenticado, estaCarregando } = useAuth();

  if (estaCarregando) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!estaAutenticado) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── App Principal ────────────────────────────────────────────────────────

export default function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AuthProvider>
        <OrdensProvider>
          <BrowserRouter>
            <Routes>
              {/* Login */}
              <Route path="/login" element={<PaginaLoginGuard />} />

              {/* App protegido */}
              <Route path="/" element={
                <RotaProtegida>
                  <AppShell />
                </RotaProtegida>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="ordens" element={<ListaOrdens />} />
                <Route path="ordens/nova" element={
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-6">Nova Ordem de Serviço</h1>
                    <FormularioOrdem />
                  </div>
                } />
                <Route path="ordens/:id" element={<PaginaDetalheOrdem />} />
                <Route path="ordens/:id/editar" element={<PaginaEditarOrdem />} />
                <Route path="configuracoes" element={<Configuracoes />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </OrdensProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

function PaginaLoginGuard() {
  const { estaAutenticado, estaCarregando } = useAuth();
  if (estaCarregando) return null;
  if (estaAutenticado) return <Navigate to="/dashboard" replace />;
  return <PaginaLogin />;
}
