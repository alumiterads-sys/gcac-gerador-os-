import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrdensProvider } from './context/OrdensContext';
import { OrcamentosProvider } from './context/OrcamentosContext';
import { AppShell } from './components/layout/AppShell';
import { PaginaLogin } from './components/auth/PaginaLogin';
import { Dashboard } from './components/dashboard/Dashboard';
import { ListaOrdens } from './components/ordens/ListaOrdens';
import { FormularioOrdem } from './components/ordens/FormularioOrdem';
import { DetalheOrdem } from './components/ordens/DetalheOrdem';
import { Configuracoes } from './components/config/Configuracoes';
import { ClientesProvider } from './context/ClientesContext';
import { ServicosProvider } from './context/ServicosContext';
import { ListaClientes } from './components/clientes/ListaClientes';
import { useOrdens } from './context/OrdensContext';
import { useOrcamentos } from './context/OrcamentosContext';

// Importações dos Orçamentos
import { ListaOrcamentos } from './components/orcamentos/ListaOrcamentos';
import { FormularioOrcamento } from './components/orcamentos/FormularioOrcamento';
import { DetalheOrcamento } from './components/orcamentos/DetalheOrcamento';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ── Páginas de Ordens ────────────────────────────────────────────────────

function PaginaDetalheOrdem() {
  const { id } = useParams<{ id: string }>();
  const { ordens } = useOrdens();
  const ordem = ordens.find(o => o.id === id);
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
  const { ordens } = useOrdens();
  const ordem = ordens.find(o => o.id === id);

  if (!ordem) return <Navigate to="/ordens" replace />;
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Editar OS-{String(ordem.numero).padStart(4, '0')}</h1>
      <FormularioOrdem ordemExistente={ordem} />
    </div>
  );
}

// ── Páginas de Orçamentos ────────────────────────────────────────────────

function PaginaDetalheOrcamento() {
  const { id } = useParams<{ id: string }>();
  const { orcamentos } = useOrcamentos();
  const orcamento = orcamentos.find(o => o.id === id);
  const navigate = useNavigate();

  if (orcamento === undefined) return <div className="text-center py-20 text-gray-400">Carregando...</div>;
  if (!orcamento) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Orçamento não encontrado</p>
        <button onClick={() => navigate('/orcamentos')} className="btn-primary">← Voltar para lista</button>
      </div>
    );
  }
  return <DetalheOrcamento orcamento={orcamento} />;
}

function PaginaEditarOrcamento() {
  const { id } = useParams<{ id: string }>();
  const { orcamentos } = useOrcamentos();
  const orcamento = orcamentos.find(o => o.id === id);

  if (!orcamento) return <Navigate to="/orcamentos" replace />;
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Editar Orçamento #{String(orcamento.numero).padStart(4, '0')}</h1>
      <FormularioOrcamento orcamentoExistente={orcamento} />
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
          <OrcamentosProvider>
            <ClientesProvider>
              <ServicosProvider>
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
                      <Route path="clientes" element={<ListaClientes />} />
                      <Route path="configuracoes" element={<Configuracoes />} />
                      
                      {/* Orçamentos */}
                      <Route path="orcamentos" element={<ListaOrcamentos />} />
                      <Route path="orcamentos/novo" element={
                        <div>
                          <h1 className="text-2xl font-bold text-white mb-6">Novo Orçamento</h1>
                          <FormularioOrcamento />
                        </div>
                      } />
                      <Route path="orcamentos/:id" element={<PaginaDetalheOrcamento />} />
                      <Route path="orcamentos/:id/editar" element={<PaginaEditarOrcamento />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </BrowserRouter>
              </ServicosProvider>
            </ClientesProvider>
          </OrcamentosProvider>
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
