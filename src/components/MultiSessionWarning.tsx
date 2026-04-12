'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, X } from 'lucide-react';

export function MultiSessionWarning() {
  const [sessionCount, setSessionCount] = useState(1);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let channel: any;

    const initPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Canal único por usuario para rastrear sus dispositivos
      channel = supabase.channel(`device_tracker_${user.id}`, {
        config: {
          presence: { key: user.id },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          
          if (state[user.id]) {
            // state[user.id] es un array. Si hay 2 elementos, hay 2 dispositivos.
            const count = state[user.id].length;
            console.log(`Dispositivos detectados para este usuario: ${count}`, state);
            setSessionCount(count);
            
            // Si sube de 1, volvemos a mostrar la alerta por si la había cerrado
            if (count > 1) setIsVisible(true);
          }
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ 
              device: navigator.userAgent,
              connected_at: new Date().toISOString()
            });
          }
        });
    };

    initPresence();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Si solo hay 1 sesión o el usuario cerró la alerta, no mostramos nada
  if (sessionCount <= 1 || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex max-w-sm items-start gap-3 rounded-lg border border-yellow-400 bg-yellow-50 p-4 text-yellow-900 shadow-2xl animate-in slide-in-from-bottom-5">
      <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-bold text-sm">Doble Sesión Detectada</h4>
        <p className="text-xs mt-1 text-yellow-800 font-medium">
          Tienes el sistema abierto en {sessionCount} dispositivos simultáneamente. Te sugerimos cerrar uno para evitar conflictos de stock.
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)} 
        className="shrink-0 rounded-md p-1 text-yellow-600 hover:bg-yellow-200 hover:text-yellow-900 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}