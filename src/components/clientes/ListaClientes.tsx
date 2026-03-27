import React, { useState } from 'react';
import { useClientes } from '../../context/ClientesContext';
import { Users, Search, Edit2, Trash2 } from 'lucide-react';
import { Cliente } from '../../types';
import { formatarCPF, formatarTelefone } from '../../utils/formatters';
import { FormularioCliente } from './FormularioCliente';

export function ListaClientes() {
  const { clientes, deletarCliente } = useClientes();
  const [busca, setBusca] = useState('');
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf.replace(/\D/g, '').includes(busca.replace(/\D/g, ''))
  );

  const handleExcluir = async (cliente: Cliente) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${cliente.nome}? Apenas o cadastro será apagado, as OS antigas continuam salvas.`)) {
      await deletarCliente(cliente.id);
    }
  };

  const abrirEdicao = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setModalAberto(true);
  };

  const abrirNovo = () => {
    setClienteEditando(null);
    setModalAberto(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-brand-blue-light" />
            Meus Clientes
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie a agenda de contatos para preenchimento rápido nas O.S.</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary">
          <Users size={16} />
          Novo Cliente
        </button>
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-10">
            <Users size={48} className="text-brand-dark-5 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {busca ? 'Nenhum cliente encontrado nessa busca.' : 'Sua lista de clientes está vazia. Comece criando uma O.S. ou clique em Novo Cliente.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-brand-dark-3 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-semibold">Nome / CPF</th>
                  <th className="px-4 py-3 font-semibold">Contato</th>
                  <th className="px-4 py-3 font-semibold">Pró-Tiro</th>
                  <th className="px-4 py-3 rounded-r-lg font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark-5">
                {clientesFiltrados.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-brand-dark-4 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{cliente.nome}</p>
                      <p className="text-xs text-brand-metal">{formatarCPF(cliente.cpf)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatarTelefone(cliente.contato)}
                    </td>
                    <td className="px-4 py-3">
                      {cliente.filiadoProTiro ? (
                        <span className="bg-brand-green/20 text-brand-green border border-brand-green/30 px-2.5 py-1 rounded-full text-xs font-semibold">
                          Sim
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Não ({cliente.clubeFiliado || 'sem clube'})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => abrirEdicao(cliente)}
                        className="p-1.5 text-gray-400 hover:text-brand-blue-light transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleExcluir(cliente)}
                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors ml-2"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <FormularioCliente
          clienteEditando={clienteEditando}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
