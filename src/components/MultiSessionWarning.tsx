'use client';

import { useEffect, useState, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, X } from 'lucide-react';

export function MultiSessionWarning() {
  const [sessionCount, setSessionCount] = useState(1);
  // Estado para recordar si el usuario ya la cerró a mano
  const [isDismissed, setIsDismissed] = useState(false);

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
            console.log(`Dispositivos detectados para este usuario: ${count}`);
            setSessionCount(count);
            
            // ELIMINAMOS EL REINICIO DE VISIBILIDAD
            // Si el usuario la cierra, no la volvemos a abrir aunque entren más sesiones.
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

  return (
    <Transition
      // Solo se muestra si hay más de 1 sesión Y no la han cerrado manualmente
      show={sessionCount > 1 && !isDismissed}
      as={Fragment}
      enter="transition ease-out duration-300 transform"
      enterFrom="opacity-0 translate-y-10 scale-95"
      enterTo="opacity-100 translate-y-0 scale-100"
      leave="transition ease-in duration-200 transform"
      leaveFrom="opacity-100 translate-y-0 scale-100"
      leaveTo="opacity-0 translate-y-10 scale-95"
    >
      {/* Contenedor posicionado: 
        Móvil -> Centrado (left-0 right-0 justify-center)
        PC -> Esquina derecha (md:left-auto md:right-6)
      */}
      <div className="fixed bottom-6 left-0 right-0 z-[9999] px-4 flex justify-center md:left-auto md:right-6 md:px-0 pointer-events-none">
        
        {/* Tarjeta de la alerta */}
        <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-[0_8px_30px_rgb(234,179,8,0.15)]">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 mt-0.5" />
          
          <div className="flex-1">
            <h4 className="font-bold text-sm text-yellow-900">Doble Sesión Detectada</h4>
            <p className="text-xs mt-1 text-yellow-700 font-medium leading-relaxed">
              Tienes el sistema abierto en <span className="font-bold">{sessionCount} dispositivos</span> simultáneamente. Te sugerimos cerrar uno para evitar conflictos de stock.
            </p>
          </div>
          
          {/* Botón X redondo con efecto hover igual al resto de tu app */}
          <button 
            onClick={() => setIsDismissed(true)} 
            className="shrink-0 rounded-full p-1.5 text-yellow-500 hover:bg-yellow-200 hover:text-yellow-700 transition-all cursor-pointer"
            title="Cerrar advertencia"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
      </div>
    </Transition>
  );
}