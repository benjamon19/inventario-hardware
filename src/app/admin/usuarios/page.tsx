'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Shield, User, 
  CheckCircle2, Clock, ShieldCheck, Loader2, Activity, Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    
    // 0. Obtenemos el usuario que está usando la app ahora mismo
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    // 1. Traemos TODOS los perfiles
    const { data: perfilesData, error: perfilesError } = await supabase
      .from('perfiles')
      .select('*')
      .order('rol', { ascending: true });
    
    if (perfilesError) {
      console.error("Error al cargar perfiles:", perfilesError);
      setLoading(false);
      return;
    }

    // 2. Traemos las transacciones para saber qué han hecho
    const { data: transaccionesData } = await supabase
      .from('transacciones')
      .select('operador_id, timestamp');

    // 3. Cruzamos los datos: Le asignamos a cada perfil sus estadísticas
    const perfilesConStats = perfilesData?.map(perfil => {
      // Buscamos las transacciones que coincidan con el ID de este usuario
      const misMovimientos = transaccionesData?.filter(t => t.operador_id === perfil.id) || [];
      
      // Ordenamos para encontrar la fecha más reciente
      const ordenados = misMovimientos.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return {
        ...perfil,
        totalMovimientos: misMovimientos.length,
        ultimaActividad: ordenados.length > 0 ? ordenados[0].timestamp : null
      };
    }) || [];

    setUsuarios(perfilesConStats);
    setLoading(false);
  };

  const cambiarRol = async (userId: string, nuevoRol: string) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', userId);

    if (!error) {
      await fetchUsuarios(); // Refrescamos la lista
    } else {
      alert("No se pudo actualizar el rol: " + error.message);
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
        <p className="text-sm text-slate-500">Controla quién tiene acceso al sistema y monitorea su actividad.</p>
      </div>

      {/* Grid de Usuarios */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-3 text-slate-400" />
            <p className="text-slate-500 font-medium">Buscando personal y su actividad...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <User className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No hay usuarios registrados.</p>
          </div>
        ) : (
          usuarios.map((perfil) => (
            <div 
              key={perfil.id} 
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-blue-100 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl font-bold text-xl shadow-inner ${
                    perfil.rol === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {perfil.email?.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg truncate max-w-50 sm:max-w-xs">{perfil.email}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                        perfil.rol === 'ADMIN' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : perfil.rol === 'OPERADOR'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {perfil.rol === 'ADMIN' && <ShieldCheck className="h-3.5 w-3.5" />}
                        {perfil.rol === 'OPERADOR' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {perfil.rol === 'PENDIENTE' && <Clock className="h-3.5 w-3.5" />}
                        {perfil.rol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Estadísticas Interna */}
              <div className="mt-6 flex items-center gap-4 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" /> Equipos procesados
                  </span>
                  <span className="font-bold text-slate-900 text-base">{perfil.totalMovimientos}</span>
                </div>
                <div className="h-10 w-px bg-slate-200"></div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> Último escaneo
                  </span>
                  <span className="font-bold text-slate-900">
                    {perfil.ultimaActividad 
                      ? format(new Date(perfil.ultimaActividad), "d MMM, HH:mm", { locale: es }) 
                      : 'Sin actividad'}
                  </span>
                </div>
              </div>

              {/* Botones de acción rápida */}
              <div className="mt-5 flex items-center justify-end gap-2">
                <p className="mr-auto text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 hidden sm:block">
                  ID: {perfil.id.substring(0, 8)}...
                </p>
                
                {perfil.id === currentUserId ? (
                  <span className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100">
                    Tu cuenta
                  </span>
                ) : (
                  <>
                    {perfil.rol !== 'OPERADOR' && (
                      <button
                        disabled={updatingId === perfil.id}
                        onClick={() => cambiarRol(perfil.id, 'OPERADOR')}
                        className="rounded-xl px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-emerald-100"
                      >
                        Hacer Operador
                      </button>
                    )}
                    
                    {perfil.rol !== 'ADMIN' && (
                      <button
                        disabled={updatingId === perfil.id}
                        onClick={() => cambiarRol(perfil.id, 'ADMIN')}
                        className="rounded-xl px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-blue-100"
                      >
                        Hacer Admin
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nota de seguridad */}
      <div className="flex items-start gap-3 rounded-2xl bg-blue-50 border border-blue-100 p-5 mt-8">
        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Niveles de Acceso</h4>
          <p className="text-xs font-medium text-blue-700 mt-1 opacity-90 leading-relaxed">
            Los Administradores pueden ver estadísticas y modificar configuraciones. Los Operadores solo tienen acceso a la herramienta de escaneo de bodega.
          </p>
        </div>
      </div>
    </div>
  );
}