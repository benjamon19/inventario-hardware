import {
  Laptop, Monitor, Tablet, Keyboard, Cpu, HardDrive, Package,
} from 'lucide-react';

/**
 * Devuelve el ícono correspondiente a la categoría del equipo.
 * Compartido entre inventario y generar-qr.
 */
export function getIconoCategoria(nombre: string, size: 'sm' | 'md' | 'lg' = 'sm') {
  const clsMap = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-12 w-12' };
  const cls = clsMap[size];
  const n = (nombre ?? '').toLowerCase();

  if (n.includes('laptop') || n.includes('notebook')) return <Laptop className={cls} />;
  if (n.includes('monitor') || n.includes('pantalla')) return <Monitor className={cls} />;
  if (n.includes('tablet')) return <Tablet className={cls} />;
  if (n.includes('periferico') || n.includes('periférico') || n.includes('teclado') || n.includes('mouse')) return <Keyboard className={cls} />;
  if (n.includes('componente') || n.includes('cpu') || n.includes('ram')) return <Cpu className={cls} />;
  if (n.includes('pc') || n.includes('escritorio')) return <HardDrive className={cls} />;
  return <Package className={cls} />;
}
