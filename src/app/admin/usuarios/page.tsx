'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Shield, User, Mail, 
  CheckCircle2, Clock, ShieldCheck, Loader2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    // Traemos los perfiles de la base de datos
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('rol', { ascending: true });
    
    if (!error) setUsuarios(data);
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
        <p className="text-sm text-slate-500">Controla quién tiene acceso al sistema y sus niveles de permiso.</p>
      </div>

      {/* Grid de Usuarios */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-slate-500">Cargando lista de personal...</p>
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
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg ${
                    perfil.rol === 'ADMIN' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {perfil.email?.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{perfil.email}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        perfil.rol === 'ADMIN' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : perfil.rol === 'OPERADOR'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {perfil.rol === 'ADMIN' && <ShieldCheck className="h-3 w-3" />}
                        {perfil.rol === 'OPERADOR' && <CheckCircle2 className="h-3 w-3" />}
                        {perfil.rol === 'PENDIENTE' && <Clock className="h-3 w-3" />}
                        {perfil.rol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
                <p className="mr-auto text-[11px] font-medium text-slate-400 italic">
                  ID: {perfil.id.substring(0, 8)}...
                </p>
                
                {/* Botones de acción rápida */}
                {perfil.rol !== 'OPERADOR' && (
                  <button
                    disabled={updatingId === perfil.id}
                    onClick={() => cambiarRol(perfil.id, 'OPERADOR')}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Hacer Operador
                  </button>
                )}
                
                {perfil.rol !== 'ADMIN' && (
                  <button
                    disabled={updatingId === perfil.id}
                    onClick={() => cambiarRol(perfil.id, 'ADMIN')}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Hacer Admin
                  </button>
                )}

                {perfil.rol !== 'PENDIENTE' && (
                  <button
                    disabled={updatingId === perfil.id}
                    onClick={() => cambiarRol(perfil.id, 'PENDIENTE')}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Revocar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nota de seguridad */}
      <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-4 text-white">
        <Shield className="h-5 w-5 text-blue-400 shrink-0" />
        <p className="text-xs font-medium opacity-80">
          Como administrador, tienes el poder de cambiar roles. Ten cuidado al asignar permisos de administrador a otros usuarios.
        </p>
      </div>
    </div>
  );
}