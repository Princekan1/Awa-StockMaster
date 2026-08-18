import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

// Minimal ambient typing for the BarcodeDetector API (not yet in lib.dom.d.ts everywhere)
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

export default function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    async function start() {
      if (!window.BarcodeDetector) {
        setSupported(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });

        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) {
              onDetected(results[0].rawValue);
              return;
            }
          } catch {
            // ignore per-frame errors
          }
          raf = requestAnimationFrame(scan);
        };
        raf = requestAnimationFrame(scan);
      } catch {
        setError('Could not access the camera. You can still type the barcode below.');
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onDetected]);

  return (
    <Modal open={open} onClose={onClose} title="Scan Barcode">
      <div className="flex flex-col gap-4">
        {supported && !error ? (
          <div
            className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center"
          >
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-8 border-2 rounded-lg pointer-events-none" style={{ borderColor: 'var(--color-amber)' }} />
          </div>
        ) : (
          <p className="text-sm rounded-xl p-3" style={{ background: 'var(--color-amber-soft)', color: '#8a5a10' }}>
            {error ?? 'Camera scanning is not supported on this device/browser.'} Type the barcode instead — this
            also works with a USB barcode scanner on Windows, since scanners type like a keyboard.
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) onDetected(manualCode.trim());
          }}
          className="flex gap-2"
        >
          <input
            autoFocus={!supported || !!error}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter barcode number"
            className="flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--color-line)' }}
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--color-brand)' }}
          >
            Go
          </button>
        </form>
      </div>
    </Modal>
  );
}
