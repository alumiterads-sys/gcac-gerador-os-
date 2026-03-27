import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw, Check } from 'lucide-react';

export interface PadAssinaturaRef {
  limpar: () => void;
  obterImagem: () => string | null;
  estaVazio: () => boolean;
}

interface PadAssinaturaProps {
  valorInicial?: string | null;
  onChange?: (dataUrl: string | null) => void;
}

export const PadAssinatura = forwardRef<PadAssinaturaRef, PadAssinaturaProps>(
  ({ valorInicial, onChange }, ref) => {
    const sigCanvasRef = useRef<SignatureCanvas>(null);
    const [iniciou, setIniciou] = React.useState(false);

    React.useEffect(() => {
      if (valorInicial && sigCanvasRef.current) {
        const canvas = sigCanvasRef.current.getCanvas();
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = valorInicial;
          setIniciou(true);
        }
      }
    }, [valorInicial]);

    useImperativeHandle(ref, () => ({
      limpar: () => {
        sigCanvasRef.current?.clear();
        setIniciou(false);
        onChange?.(null);
      },
      obterImagem: () => {
        if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return null;
        return sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      },
      estaVazio: () => {
        return !iniciou && (sigCanvasRef.current?.isEmpty() ?? true);
      },
    }));

    const handleEnd = () => {
      setIniciou(true);
      const dataUrl = sigCanvasRef.current?.getTrimmedCanvas().toDataURL('image/png') ?? null;
      onChange?.(dataUrl);
    };

    const handleLimpar = () => {
      sigCanvasRef.current?.clear();
      setIniciou(false);
      onChange?.(null);
    };

    return (
      <div className="space-y-2">
        <div className="relative border-2 border-dashed border-brand-dark-5 rounded-xl overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="#1B6FBF"
            canvasProps={{
              className: 'w-full',
              style: { height: '180px', display: 'block' },
            }}
            onEnd={handleEnd}
          />
          {!iniciou && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm font-medium">✍️ Assine aqui</p>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {iniciou ? '✅ Assinatura registrada' : 'Aguardando assinatura...'}
          </span>
          <button
            type="button"
            onClick={handleLimpar}
            className="btn-ghost btn-sm"
          >
            <RotateCcw size={14} />
            Limpar
          </button>
        </div>
      </div>
    );
  }
);

PadAssinatura.displayName = 'PadAssinatura';
