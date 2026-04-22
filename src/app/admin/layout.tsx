import { cookies } from 'next/headers';
import AdminLayoutClient from './AdminLayoutClient'; 

// 1. Añadimos "async" aquí para poder usar await adentro
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  
  // 2. Añadimos "await" aquí porque en tu versión de Next.js es una Promesa
  const cookieStore = await cookies(); 
  const cookieValue = cookieStore.get('ti_bodega_sidebar_expanded')?.value;
  
  // LÓGICA ESTRICTA
  const isExpanded = cookieValue === 'false' ? false : true;

  return (
    <AdminLayoutClient initialExpanded={isExpanded}>
      {children}
    </AdminLayoutClient>
  );
}