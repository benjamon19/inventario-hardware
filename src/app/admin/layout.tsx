import { cookies } from 'next/headers';
import AdminLayoutClient from './AdminLayoutClient'; 

// 1. Añadimos "async" aquí para poder usar await adentro
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  
  // 2. Añadimos "await" aquí porque en tu versión de Next.js es una Promesa
  const cookieStore = await cookies(); 
  const cookieValue = cookieStore.get('ti_bodega_sidebar_expanded')?.value;
  
  const initialAvatarInitials = cookieStore.get('ti_bodega_avatar_initials')?.value;
  const initialAvatarGradient = cookieStore.get('ti_bodega_avatar_gradient')?.value;
  
  // LÓGICA ESTRICTA
  const isExpanded = cookieValue === 'false' ? false : true;

  const initialAvatar = {
    initials: initialAvatarInitials ? decodeURIComponent(initialAvatarInitials) : undefined,
    avatarGradient: initialAvatarGradient ? decodeURIComponent(initialAvatarGradient) : undefined,
  };

  return (
    <AdminLayoutClient initialExpanded={isExpanded} initialAvatar={initialAvatar}>
      {children}
    </AdminLayoutClient>
  );
}