'use client';

import { useState, useEffect } from 'react';
import { 
  History, Search, ArrowUpRight, ArrowDownLeft, 
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
        // Usamos 'transacciones' que es el nombre real en tu SQL
        const { data, error } = await supabase
        .from('transacciones')
        .select(`
            id,
            tipo,
            timestamp,
            sku,
            hardware (modelo),
            perfiles (email)
        `)
        .order('timestamp', { ascending: false });
        
        if (error) {
        console.error("Error:", error.message);
        } else {
        setMovimientos(data);
        }
        setLoading(false);
    };

  const filteredMovimientos = movimientos.filter(mov => 
    mov.hardware?.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.perfiles?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.hardware?.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
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
          placeholder="Buscar por equipo, usuario o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
      </div>

      {/* Lista de Actividad */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Sincronizando movimientos...</p>
          </div>
        ) : filteredMovimientos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Clock className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No hay actividad registrada aún.</p>
          </div>
        ) : (
          filteredMovimientos.map((mov) => (
            <div 
              key={mov.id} 
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Icono dinámico según tipo de movimiento */}
                <div className={`rounded-full p-3 ${
                  mov.tipo === 'RETIRO' 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {mov.tipo === 'RETIRO' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {mov.tipo === 'RETIRO' ? 'Retiro de equipo' : 'Devolución de equipo'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">•</span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                      {mov.hardware?.sku}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      {mov.hardware?.modelo}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {mov.perfiles?.nombre_completo || 'Usuario desconocido'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(mov.fecha), "d 'de' MMMM, HH:mm", { locale: es })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block">
                <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                  mov.tipo === 'RETIRO' 
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