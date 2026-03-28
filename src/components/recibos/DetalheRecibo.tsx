import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Share2, Receipt, 
  Calendar, User, CheckCircle, FileText, 
  ChevronRight, Trash2, Mail, Phone, MapPin
} from 'lucide-react';
import { Recibo } from '../../types';
import { formatarMoeda, formatarData } from '../../utils/formatters';

interface DetalheReciboProps {
  recibo: Recibo;
}

export function DetalheRecibo({ recibo }: DetalheReciboProps) {
  const navigate = useNavigate();

  const handleImprimir = () => {
    window.print();
  };

  const handleCompartilhar = () => {
    const texto = `Olá! Segue o recibo #${String(recibo.numero).padStart(4, '0')}\n` +
                 `Cliente: ${recibo.clienteNome}\n` +
                 `Valor: ${formatarMoeda(recibo.valorTotal)}\n` +
                 `Emitido em: ${formatarData(recibo.criadoEm)}\n\n` +
                 `Gerado por: GCAC - Gerador de O.S.`;
    
    if (navigator.share) {
      navigator.share({
        title: `Recibo #${String(recibo.numero).padStart(4, '0')}`,
        text: texto,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(texto).then(() => {
        alert('Resumo do recibo copiado para a área de transferência!');
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Barra de Ações (Escondida na impressão) */}
      <div className="flex justify-between items-center print:hidden border-b border-brand-dark-5 pb-6">
        <button 
          onClick={() => navigate('/recibos')}
          className="btn-ghost"
        >
          <ArrowLeft size={18} />
          Voltar para lista
        </button>
        <div className="flex gap-2">
          <button 
            onClick={handleCompartilhar}
            className="btn-ghost"
          >
            <Share2 size={18} />
            Compartilhar
          </button>
          <button 
            onClick={handleImprimir}
            className="btn-primary"
          >
            <Printer size={18} />
            Imprimir Recibo
          </button>
        </div>
      </div>

      {/* Recibo para Impressão */}
      <div id="print-area" className="bg-white text-gray-900 border border-brand-dark-5 rounded-2xl overflow-hidden shadow-2xl p-8 sm:p-12 animate-fade-in print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 border-b-2 border-brand-dark-5 pb-8 mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.jpg" 
              alt="Logo" 
              className="w-16 h-16 object-contain" 
              onError={e => (e.target as HTMLImageElement).style.display = 'none'}
            />
            <div>
              <h1 className="text-2xl font-black text-brand-dark leading-tight uppercase tracking-tighter">{recibo.emitenteNome}</h1>
              <p className="text-sm font-bold text-brand-blue uppercase">Soluções em Despachante e C.A.C.</p>
              <p className="text-[10px] text-gray-500 font-bold mt-1">CNPJ: {recibo.emitenteCNPJ}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-brand-dark text-white px-4 py-2 rounded-xl inline-block mb-3 print:bg-white print:text-gray-900 print:p-0">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Número do Recibo</p>
              <p className="text-2xl font-black"># {String(recibo.numero).padStart(4, '0')}</p>
            </div>
            <p className="text-xs font-bold text-gray-400">EMISSÃO: {formatarData(recibo.criadoEm)}</p>
          </div>
        </div>

        {/* Corpo do Recibo */}
        <div className="space-y-8">
          <div className="bg-brand-blue/5 border-l-4 border-brand-blue p-6 rounded-r-2xl print:bg-gray-100 print:rounded-none">
            <p className="text-lg leading-relaxed font-medium">
              Recebemos de <span className="font-bold border-b border-gray-400 pb-0.5">{recibo.clienteNome}</span>, 
              inscrito no CPF/CNPJ <span className="font-bold">{recibo.clienteCPF}</span>, 
              a importância de <span className="text-2xl font-black text-brand-blue-light print:text-gray-900">{formatarMoeda(recibo.valorTotal)}</span>.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <List size={14} /> Descrição dos Serviços e Produtos
            </h3>
            <div className="overflow-hidden rounded-xl border border-brand-dark-5 print:border-gray-200">
              <table className="w-full text-left">
                <thead className="bg-brand-dark text-white text-[10px] font-bold uppercase tracking-wider print:bg-gray-200 print:text-gray-900">
                  <tr>
                    <th className="px-6 py-4">Item / Serviço</th>
                    <th className="px-6 py-4 text-right">Valor Unitário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-dark-5 print:divide-gray-200">
                  {recibo.servicos.map((servico, index) => (
                    <tr key={index} className="hover:bg-brand-blue/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold uppercase">{servico.nome}</p>
                        {servico.detalhes && <p className="text-[10px] text-gray-500 font-medium italic mt-1">{servico.detalhes}</p>}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-sm">{formatarMoeda(servico.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-brand-dark-2/20 font-black text-lg print:bg-gray-50 print:text-gray-900 border-t-2 border-brand-dark-5">
                  <tr>
                    <td className="px-6 py-5 text-right uppercase text-xs tracking-widest text-gray-500">Valor Total do Recibo</td>
                    <td className="px-6 py-5 text-right text-2xl text-brand-blue-light print:text-gray-900">{formatarMoeda(recibo.valorTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {recibo.observacoes && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Observações Adicionais</h3>
              <p className="text-sm text-gray-600 leading-relaxed italic border border-brand-dark-5 p-4 rounded-xl print:p-0 print:border-none">
                {recibo.observacoes}
              </p>
            </div>
          )}

          {/* Assinaturas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-16 mt-16 border-t border-brand-dark-5 print:mt-12 print:pt-8 print:border-gray-200">
            <div className="text-center space-y-2">
              <div className="border-t border-brand-dark pt-2 mx-auto w-4/5 print:border-gray-900" />
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pelo Responsável / Emitente</p>
              <p className="text-sm font-bold uppercase">{recibo.emitenteNome}</p>
              <p className="text-[8px] text-gray-400 uppercase font-bold">CNPJ: {recibo.emitenteCNPJ}</p>
            </div>
            <div className="text-center space-y-2">
              <div className="border-t border-brand-dark pt-2 mx-auto w-4/5 print:border-gray-900" />
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pelo Cliente / Beneficiário</p>
              <p className="text-sm font-bold uppercase">{recibo.clienteNome}</p>
            </div>
          </div>
        </div>

        {/* Rodapé Interno */}
        <div className="mt-16 pt-8 border-t border-brand-dark-5 text-center print:mt-12">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
            Este recibo é um documento de quitação de pagamento emitido eletronicamente pela plataforma GCAC Gerador de O.S.<br/>
            Sistemas Alumiterads &copy; {new Date().getFullYear()} — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
