import {
  Laptop, Monitor, Tablet, Keyboard, Cpu, HardDrive, Package,
  Camera, Video, Zap, Wrench, Printer, Tv, Box
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
  if (n.includes('torre') || n.includes('pc') || n.includes('escritorio')) return <HardDrive className={cls} />;
  if (n.includes('cámara') || n.includes('camara')) return <Camera className={cls} />;
  if (n.includes('capturador')) return <Video className={cls} />;
  if (n.includes('cargador')) return <Zap className={cls} />;
  if (n.includes('herramientas')) return <Wrench className={cls} />;
  if (n.includes('impresora')) return <Printer className={cls} />;
  if (n.includes('tv') || n.includes('televisor')) return <Tv className={cls} />;
  if (n.includes('kit')) return <Box className={cls} />;
  
  return <Package className={cls} />;
}
