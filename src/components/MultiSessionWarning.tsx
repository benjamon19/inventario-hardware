'use client';

import { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

export default function MultiSessionWarning() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    // Revisar el estado inicial
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detectar si la conexión es lenta usando la Network Information API (ideal para celulares Android en la bodega)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    const updateConnectionStatus = () => {
      if (connection) {
        // Consideramos 'slow-2g', '2g' o '3g' como conexión lenta
        const effectiveType = connection.effectiveType;
        if (['slow-2g', '2g', '3g'].includes(effectiveType)) {
          setIsSlow(true);
        } else {
          setIsSlow(false);
        }
      }
    };

    if (connection) {
      updateConnectionStatus();
      connection.addEventListener('change', updateConnectionStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  // Si está online y la conexión es buena, no mostramos nada
  if (!isOffline && !isSlow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-9999 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`rounded-2xl border p-4 shadow-xl flex gap-3 max-w-sm backdrop-blur-md ${
        isOffline 
          ? 'bg-red-50/95 border-red-200 text-red-800' 
          : 'bg-amber-50/95 border-amber-200 text-amber-800'
      }`}>
        {isOffline ? (
          <WifiOff className="h-5 w-5 shrink-0 mt-0.5 text-red-600 animate-pulse" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
        )}
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-bold">
            {isOffline ? 'Sin conexión a Internet' : 'Conexión inestable'}
          </span>
          <span className="opacity-90 text-xs font-medium">
            {isOffline 
              ? 'Los cambios no se guardarán hasta que recuperes la señal.'
              : 'La red está lenta. Puede que los registros de los equipos tarden en subir.'}
          </span>
        </div>
      </div>
    </div>
  );
}