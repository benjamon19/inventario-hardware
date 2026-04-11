'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function usePresence() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // 1. Se Crea la instancia del canal
      const channel = supabase.channel('app_presence', {
        config: { presence: { key: user.id } }
      });

      // 2. SE AÑADEN LOS EVENTOS ANTES DE SUSCRIBIRNOS (Fix del error)
      channel
        .on('presence', { event: 'sync' }, () => {
          if (mounted) {
            console.log('Sincronizando presencia', channel.presenceState());
          }
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('Usuario entró:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('Usuario salió:', leftPresences);
        });

      // 3. FINALMENTE NOS SUSCRIBIMOS
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && mounted) {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

      channelRef.current = channel;
    };

    init();

    // 4. Limpieza para que el Fast Refresh de Next.js no rompa el WebSocket
    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);
}