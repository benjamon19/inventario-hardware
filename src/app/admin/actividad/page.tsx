'use client';

import { useState, useEffect } from 'react';
import { 
  Search, ArrowUpRight, ArrowDownLeft, 
  User, Calendar, Package, Loader2, Clock 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ActividadPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActividad();
  }, []);

  const fetchActividad = async () => {
    setLoading(true);
    try {
      // 1. Traemos solo las transacciones
      const { data: trans, error: transError } = await supabase
        .from('transacciones')
        .select('*')
        .order('timestamp', { ascending: false });

      if (transError) throw transError;

      // 2. Traemos todos los perfiles y hardware para cruzar
      const [{ data: perfiles }, { data: hardware }] = await Promise.all([
        supabase.from('perfiles').select('id, email'),
        supabase.from('hardware').select('id, modelo')
      ]);

      // 3. Cruzamos los datos manualmente (el famoso "Join" en JS)
      const dataFormateada = trans.map(t => ({
        ...t,
        perfiles: perfiles?.find(p => p.id === t.operador_id) || { email: 'Desconocido' },
        hardware: hardware?.find(h => h.id === t.hardware_id) || { modelo: 'Desconocido' }
      }));

      setMovimientos(dataFormateada);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizamos el filtro para buscar solo por email, sku o modelo
  const filteredMovimientos = movimientos.filter(mov => 
    mov.hardware?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.perfiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial de Actividad</h1>
        <p className="text-sm text-slate-500">Registro detallado de retiros y devoluciones de hardware.</p>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por equipo, correo o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
        />
      </div>

      {/* Lista de Actividad */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="font-medium">Sincronizando movimientos...</p>
          </div>
        ) : filteredMovimientos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Clock className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron movimientos.</p>
          </div>
        ) : (
          filteredMovimientos.map((mov) => (
            <div 
              key={mov.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 shadow-sm ${
                  mov.tipo === 'SALIDA' 
                    ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {mov.tipo === 'SALIDA' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {mov.tipo === 'SALIDA' ? 'Retiro de equipo' : 'Devolución de equipo'}
                    </span>
                    <span className="text-xs font-bold text-slate-300">•</span>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {mov.sku}
                    </span>
                  </div>
                  
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{mov.hardware?.modelo || 'Hardware desconocido'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-slate-400" />
                      {/* Mostramos solo el email */}
                      <span>{mov.perfiles?.email || 'Operador desconocido'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="capitalize">
                        {mov.timestamp 
                          ? format(new Date(mov.timestamp), "d 'de' MMMM, HH:mm", { locale: es })
                          : 'Fecha no disponible'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                  mov.tipo === 'SALIDA' 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {mov.tipo}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}