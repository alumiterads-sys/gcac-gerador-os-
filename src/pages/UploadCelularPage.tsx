import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, CheckCircle2, AlertTriangle, Loader2, Upload, RotateCcw } from 'lucide-react';
import { supabase } from '../db/supabase';

export function UploadCelularPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [status, setStatus] = useState<'carregando' | 'preparado' | 'enviando' | 'sucesso' | 'erro'>('carregando');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function verificarSessao() {
      if (!sessionId) {
        setStatus('erro');
        setErroMsg('Código de sessão não fornecido.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('upload_sessoes')
          .select('status')
          .eq('id', sessionId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setStatus('erro');
          setErroMsg('Sessão de upload não encontrada ou expirada.');
          return;
        }

        if (data.status !== 'pendente') {
          setStatus('erro');
          setErroMsg('Esta sessão já foi concluída ou cancelada.');
          return;
        }

        setStatus('preparado');
      } catch (err: any) {
        console.error('Erro ao verificar sessão:', err);
        setStatus('erro');
        setErroMsg('Erro de conexão ao validar a sessão de upload.');
      }
    }

    verificarSessao();
  }, [sessionId]);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const url = URL.createObjectURL(file);
      setFotoPreview(url);
    }
  };

  const handleLimparFoto = () => {
    setFoto(null);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEnviar = async () => {
    if (!foto || !sessionId) return;
    setStatus('enviando');

    try {
      const ext = foto.name.split('.').pop() || 'jpg';
      const storagePath = `temp-uploads/${sessionId}.${ext}`;

      // 1. Upload do arquivo para a pasta temp-uploads do bucket documentos-clientes
      const { error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(storagePath, foto, {
          contentType: foto.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Obter a URL pública da foto enviada
      const { data: publicUrlData } = supabase.storage
        .from('documentos-clientes')
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData.publicUrl;

      // 3. Atualizar o status da sessão para concluído no banco
      const { error: updateError } = await supabase
        .from('upload_sessoes')
        .update({
          url: publicUrl,
          status: 'concluido'
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      setStatus('sucesso');
    } catch (err: any) {
      console.error('Erro ao enviar foto:', err);
      setStatus('preparado');
      alert('Falha ao enviar foto: ' + (err.message || 'Erro desconhecido'));
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-white font-sans">
      {/* Cabeçalho móvel */}
      <div className="w-full max-w-sm text-center mb-8">
        <h1 className="text-xl font-black text-brand-blue tracking-wide uppercase">Portal G CAC</h1>
        <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">Captura Mobile</p>
      </div>

      <div className="w-full max-w-sm card bg-brand-dark-2 border border-brand-dark-5 p-6 rounded-2xl shadow-2xl text-center">
        {status === 'carregando' && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="text-brand-blue animate-spin" />
            <p className="text-sm text-gray-400">Verificando sessão segura...</p>
          </div>
        )}

        {status === 'preparado' && (
          <div className="space-y-6">
            {!fotoPreview ? (
              <div className="space-y-4 py-8">
                <p className="text-sm text-gray-300">Tire uma foto nítida e legível do documento físico:</p>
                
                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="w-24 h-24 rounded-full bg-brand-blue/10 border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/20 transition-all flex items-center justify-center mx-auto"
                >
                  <Camera size={36} />
                </button>
                <p className="text-xs text-brand-blue-light font-bold uppercase tracking-wider">Abrir Câmera</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative rounded-lg overflow-hidden border border-brand-dark-5 bg-brand-dark-4 max-h-[320px] flex items-center justify-center">
                  <img src={fotoPreview} alt="Preview do documento" className="max-h-[320px] object-contain w-full" />
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleEnviar}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase text-xs tracking-wider"
                  >
                    <Upload size={16} /> Enviar Foto
                  </button>
                  <button
                    type="button"
                    onClick={handleLimparFoto}
                    className="btn-ghost w-full flex items-center justify-center gap-2 py-3 border border-brand-dark-5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400"
                  >
                    <RotateCcw size={16} /> Tirar Outra
                  </button>
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {status === 'enviando' && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Loader2 size={36} className="text-brand-blue animate-spin" />
            <p className="text-sm text-brand-blue-light font-bold uppercase tracking-wider">Enviando foto...</p>
            <p className="text-xs text-gray-400">Por favor, mantenha esta página aberta.</p>
          </div>
        )}

        {status === 'sucesso' && (
          <div className="py-8 space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 size={48} className="text-brand-green" />
            </div>
            <h2 className="text-lg font-bold text-white">FOTO ENVIADA COM SUCESSO!</h2>
            <p className="text-xs text-gray-400 leading-relaxed px-4">
              O arquivo foi enviado para o seu computador. Você já pode fechar este navegador no celular.
            </p>
          </div>
        )}

        {status === 'erro' && (
          <div className="py-8 space-y-4">
            <div className="flex justify-center">
              <AlertTriangle size={48} className="text-red-400" />
            </div>
            <h2 className="text-base font-bold text-red-400 uppercase">Acesso Bloqueado</h2>
            <p className="text-xs text-gray-400 leading-relaxed px-2">
              {erroMsg}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
