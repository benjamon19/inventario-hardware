import { supabase } from './supabase';

export async function registrarLog(accion: string, entidad: string, entidad_id: string | null, detalles: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('auditoria_logs').insert([{
    usuario_id: user.id,
    accion,
    entidad,
    entidad_id,
    detalles
  }]);
}