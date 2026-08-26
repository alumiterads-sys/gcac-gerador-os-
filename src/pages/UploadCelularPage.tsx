import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, CheckCircle2, AlertTriangle, Loader2, Upload, RotateCcw, X, Plus } from 'lucide-react';
import { supabase } from '../db/supabase';

export function UploadCelularPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [status, setStatus] = useState<'carregando' | 'preparado' | 'enviando' | 'sucesso' | 'erro'>('carregando');
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
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

  useEffect(() => {
    return () => {
      // Limpar URLs de preview criadas ao desmontar
      fotosPreview.forEach(url => URL.revokeObjectURL(url));
    };
  }, [fotosPreview]);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setFotos(prev => [...prev, ...newFiles]);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setFotosPreview(prev => [...prev, ...newPreviews]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoverFoto = (index: number) => {
    URL.revokeObjectURL(fotosPreview[index]);
    setFotos(prev => prev.filter((_, i) => i !== index));
    setFotosPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleLimparFotos = () => {
    fotosPreview.forEach(url => URL.revokeObjectURL(url));
    setFotos([]);
    setFotosPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEnviar = async () => {
    if (fotos.length === 0 || !sessionId) return;
    setStatus('enviando');

    try {
      let fileToUpload: File | Blob;
      let ext: string;
      let mimeType: string;

      if (fotos.length === 1) {
        fileToUpload = fotos[0];
        ext = fotos[0].name.split('.').pop() || 'jpg';
        mimeType = fotos[0].type;
      } else {
        // Unificar as fotos em um único arquivo PDF usando jsPDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 0; i < fotos.length; i++) {
          const file = fotos[i];
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          if (i > 0) {
            doc.addPage();
          }

          let format = 'JPEG';
          if (file.type === 'image/png') {
            format = 'PNG';
          } else if (file.type === 'image/webp') {
            format = 'WEBP';
          }

          await new Promise<void>((resolve) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
              const imgWidth = img.width;
              const imgHeight = img.height;
              const ratio = imgWidth / imgHeight;
              const pageRatio = pageWidth / pageHeight;

              let width = pageWidth;
              let height = pageHeight;

              if (ratio > pageRatio) {
                height = pageWidth / ratio;
              } else {
                width = pageHeight * ratio;
              }

              const x = (pageWidth - width) / 2;
              const y = (pageHeight - height) / 2;

              doc.addImage(dataUrl, format, x, y, width, height);
              resolve();
            };
            img.onerror = () => {
              doc.addImage(dataUrl, format, 0, 0, pageWidth, pageHeight);
              resolve();
            };
          });
        }

        fileToUpload = doc.output('blob');
        ext = 'pdf';
        mimeType = 'application/pdf';
      }

      const storagePath = `temp-uploads/${sessionId}.${ext}`;

      // 1. Upload do arquivo para a pasta temp-uploads do bucket documentos-clientes
      const { error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(storagePath, fileToUpload, {
          contentType: mimeType,
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
      alert('Falha ao enviar: ' + (err.message || 'Erro desconhecido'));
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
            {fotosPreview.length === 0 ? (
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
                <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto p-1">
                  {fotosPreview.map((url, index) => (
                    <div key={url} className="relative rounded-lg overflow-hidden border border-brand-dark-5 bg-brand-dark-4 aspect-[3/4] flex items-center justify-center">
                      <img src={url} alt={`Foto ${index + 1}`} className="object-contain w-full h-full" />
                      <button
                        type="button"
                        onClick={() => handleRemoverFoto(index)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-md"
                      >
                        <X size={14} />
                      </button>
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-brand-dark-2/80 text-[10px] font-bold text-gray-300">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleEnviar}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase text-xs tracking-wider"
                  >
                    <Upload size={16} /> Enviar {fotos.length} {fotos.length === 1 ? 'Foto' : 'Fotos'}
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCameraClick}
                      className="btn-ghost flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-blue/30 text-brand-blue-light hover:bg-brand-blue/10 rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      <Plus size={14} /> Tirar Mais
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleLimparFotos}
                      className="btn-ghost flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-dark-5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-red-400 hover:border-red-400/30"
                    >
                      <RotateCcw size={14} /> Limpar Tudo
                    </button>
                  </div>
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
