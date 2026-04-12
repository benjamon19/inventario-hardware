'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle } from 'lucide-react';

export function MultiSessionWarning() {
  const [hasMultipleSessions, setHasMultipleSessions] = useState(false);

  useEffect(() => {
    let channel: any;

    const initSessionTracker = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Se crea un canal exclusivo para monitorear a este usuario específico
      channel = supabase.channel(`session_tracker_${user.id}`, {
        config: { presence: { key: user.id } }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          
          // Si el array de presencias tiene más de 1 elemento,
          // el usuario tiene la app abierta en otra pestaña o dispositivo.
          if (state[user.id] && state[user.id].length > 1) {
            setHasMultipleSessions(true);
          } else {
            setHasMultipleSessions(false);
          }
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // Se registra esta instancia con un ID aleatorio
            await channel.track({ 
              instance_id: Math.random().toString(36).substring(7),
              device: navigator.userAgent 
            });
          }
        });
    };

    initSessionTracker();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  if (!hasMultipleSessions) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 shadow-lg">
      <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
      <div>
        <h4 className="font-semibold text-sm">Múltiples sesiones detectadas</h4>
        <p className="text-xs mt-1">
          Tienes el sistema abierto en otro dispositivo o pestaña. Se recomienda cerrar una sesión para evitar conflictos de inventario.
        </p>
      </div>
    </div>
  );
}