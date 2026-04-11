import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface UseScannerProps {
  onScanSuccess: (decodedText: string) => void;
  fps?: number;
  qrbox?: number;
}

export const useScanner = ({ onScanSuccess, fps = 10, qrbox = 250 }: UseScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("reader");
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async (): Promise<void> => {
    setError(null);
    try {
      if (!scannerRef.current) return;
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps, qrbox },
        (decodedText: string) => {
          if (decodedText !== lastScannedRef.current) {
            lastScannedRef.current = decodedText;
            onScanSuccess(decodedText);
            setTimeout(() => {
              lastScannedRef.current = null;
            }, 3000);
          }
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(errorMessage);
      setError("No se pudo acceder a la cámara. Verifica permisos.");
    }
  };

  const stopScanner = async (): Promise<void> => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return { startScanner, stopScanner, isScanning, error };
};