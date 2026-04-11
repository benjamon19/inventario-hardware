// src/hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

let globalChannel: any = null;
let globalOnlineUsers: Record<string, boolean> = {};
const subscribers = new Set<React.Dispatch<React.SetStateAction<Record<string, boolean>>>>();

// NUEVO: El candado para evitar la condición de carrera
let isInitializing = false; 

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>(globalOnlineUsers);

  useEffect(() => {
    subscribers.add(setOnlineUsers);

    const initPresence = async () => {
      // 1. Si ya hay un canal, O si otro componente ya lo está creando, frenamos aquí.
      if (globalChannel || isInitializing) return;
      
      // 2. Ponemos el candado para que nadie más intente inicializar
      isInitializing = true; 

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          isInitializing = false; // Quitamos el candado si falla
          return;
        }

        // Doble validación por seguridad
        if (globalChannel) return;

        // 3. Creamos la conexión
        globalChannel = supabase.channel('app_presence', {
          config: { presence: { key: user.id } }
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
            await globalChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
          }
        });
      } catch (err) {
        console.error("Error iniciando presencia:", err);
        isInitializing = false; // Quitamos el candado si hay error
      }
    };

    initPresence();

    return () => {
      subscribers.delete(setOnlineUsers);
    };
  }, []);

  return onlineUsers;
}