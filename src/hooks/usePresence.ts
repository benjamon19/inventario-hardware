import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

let globalChannel: any = null;
let globalOnlineUsers: Record<string, boolean> = {};
let cachedUserId: string | null = null;
let isInitializing = false;
const subscribers = new Set<React.Dispatch<React.SetStateAction<Record<string, boolean>>>>();

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>(globalOnlineUsers);

  useEffect(() => {
    subscribers.add(setOnlineUsers);

    const initPresence = async () => {
      if (globalChannel || isInitializing) return;
      isInitializing = true;

      try {
        if (!cachedUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { isInitializing = false; return; }
          cachedUserId = user.id;
        }

        if (globalChannel) return;

        globalChannel = supabase.channel('app_presence', {
          config: { presence: { key: cachedUserId } }
        });

        globalChannel
          .on('presence', { event: 'sync' }, () => {
            const state = globalChannel.presenceState();
            const online: Record<string, boolean> = {};
            Object.keys(state).forEach((key) => { online[key] = true; });
            globalOnlineUsers = online;
            subscribers.forEach(sub => sub(globalOnlineUsers));
          })
          .on('presence', { event: 'join' }, ({ key }: any) => {
            globalOnlineUsers = { ...globalOnlineUsers, [key]: true };
            subscribers.forEach(sub => sub(globalOnlineUsers));
          })
          .on('presence', { event: 'leave' }, ({ key }: any) => {
            const updated = { ...globalOnlineUsers };
            delete updated[key];
            globalOnlineUsers = updated;
            subscribers.forEach(sub => sub(globalOnlineUsers));
          });

        globalChannel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await globalChannel.track({
              user_id: cachedUserId,
              online_at: new Date().toISOString(),
            });
          }
        });
      } catch (err) {
        console.error('Error iniciando presencia:', err);
        isInitializing = false;
      }
    };

    initPresence();

    return () => {
      subscribers.delete(setOnlineUsers);
    };
  }, []);

  return onlineUsers;
}