'use client';

import { useState, useEffect } from 'react';
import { 
  User, Mail, Shield, Activity, Calendar, 
  Fingerprint, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BouncyLoader from '@/components/TreadmillLoader';

export default function MiPerfilPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState({ initial: '', styles: '' });

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Generar el mismo estilo de avatar que en el layout
        const emailStr = user.email || '';
        const namePart = emailStr.split('@')[0].split('.')[0];
        const initial = namePart.charAt(0).toUpperCase() || 'U';
        const isFemale = namePart.toLowerCase().endsWith('a');
        const styles = isFemale
          ? 'bg-pink-100 text-pink-700 border-pink-200' 
          : 'bg-blue-100 text-blue-700 border-blue-200';
        
        setAvatar({ initial, styles });

        // Traer datos de la tabla pública 'perfiles'
        const { data } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setPerfil({ 
          ...data, 
          email: user.email, 
          created_at: data?.created_at || user.created_at 
        });
      }
      setLoading(false);
    };

    fetchPerfil();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center gap-4 text-slate-400">
        <BouncyLoader color="#94a3b8" />
        <p className="text-sm font-medium">Cargando tu información...</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <User className="h-12 w-12 mb-4 text-slate-300" />
        <p className="text-sm font-medium">No se pudo cargar la información del perfil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-slate-500">Información personal y detalles de tu cuenta (Solo lectura).</p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200">
        
        {/* --- CABECERA DEL PERFIL ACTUALIZADA --- */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-800 px-6 py-8 sm:px-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left relative overflow-hidden">
          
          {/* Decoración de fondo (luces sutiles) */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />
          
          <div className={`flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-full text-4xl font-black border-4 shadow-xl z-10 ${avatar.styles.replace('bg-', 'bg-').replace('border-', 'border-')}`}>
            {avatar.initial}
          </div>
          
          <div className="z-10">
            <h2 className="text-2xl font-bold text-white truncate drop-shadow-sm">{perfil.email}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-sm`}>
                <Shield className="h-3 w-3 opacity-80" />
                {perfil.rol?.replace('_', ' ') || 'SIN ROL'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm ${
                perfil.estado === 'ACTIVO' 
                  ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 backdrop-blur-sm' 
                  : 'bg-red-500/20 text-red-100 border border-red-400/30 backdrop-blur-sm'
              }`}>
                <Activity className="h-3 w-3 opacity-80" />
                {perfil.estado || 'DESCONOCIDO'}
              </span>
            </div>
          </div>
        </div>
        {/* -------------------------------------- */}

        {/* Detalles de solo lectura */}
        <div className="p-6 sm:p-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Info className="h-4 w-4" /> Datos del Sistema
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Correo */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-400 shrink-0 shadow-sm">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Correo Electrónico</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{perfil.email}</p>
              </div>
            </div>

            {/* ID Interno */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-400 shrink-0 shadow-sm">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ID de Usuario</p>
                <p className="text-sm font-mono font-medium text-slate-700 mt-0.5 truncate" title={perfil.id}>
                  {perfil.id}
                </p>
              </div>
            </div>

            {/* Fecha de Creación */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 sm:col-span-2 hover:border-blue-100 transition-colors">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-400 shrink-0 shadow-sm">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha de Registro</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 capitalize">
                  {perfil.created_at 
                    ? format(new Date(perfil.created_at), "EEEE d 'de' MMMM, yyyy - HH:mm", { locale: es }) 
                    : 'No disponible'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}