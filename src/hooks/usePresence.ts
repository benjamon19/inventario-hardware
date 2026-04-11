'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * usePresence
 * 
 * Hook para emitir la presencia del usuario activo en el canal 'app_presence'.
 * queda cualquier usuario con "sesión activa".
 * 
 * Uso:
 *   import { usePresence } from '@/hooks/usePresence';
 *   export default function AdminLayout({ children }) {
 *     usePresence();
 *     ...
 *   }
 */
export function usePresence() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const channel = supabase.channel('app_presence', {
        config: { presence: { key: user.id } }
      });

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

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);
}