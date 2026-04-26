import {
  Laptop, Monitor, Tablet, Keyboard, Cpu, HardDrive, Package,
  Camera, Video, Zap, Wrench, Printer, Tv, Box,
  Mouse, Headphones, Speaker, Smartphone, Radio, Wifi,
  Server, Database, Disc, Plug, Battery, MemoryStick,
  Usb, Files, ShieldCheck, Cable, Gamepad, Webcam, Mic,
  Router, Network, Power, Search, LayoutGrid
} from 'lucide-react';

/**
 * Mapeo inteligente de palabras clave a iconos.
 * Se busca por orden de prioridad.
 */
const ICON_MAPPING = [
  { icon: Laptop,      keywords: ['laptop', 'notebook', 'macbook', 'portatil', 'portátil'] },
  { icon: Tablet,      keywords: ['tablet', 'ipad', 'kindle'] },
  { icon: Monitor,     keywords: ['monitor', 'pantalla', 'display'] },
  { icon: Tv,          keywords: ['tv', 'televisor', 'smart tv', 'led'] },
  { icon: Printer,     keywords: ['impresora', 'scanner', 'escaner', 'multifuncional', 'plotter', 'tinta', 'toner'] },
  { icon: Keyboard,    keywords: ['teclado'] },
  { icon: Mouse,       keywords: ['mouse', 'raton', 'ratón', 'mousepad'] },
  { icon: Headphones,  keywords: ['audifonos', 'auriculares', 'cascos', 'headset', 'manos libres'] },
  { icon: Speaker,     keywords: ['parlante', 'altavoz', 'bocina', 'audio', 'sonido'] },
  { icon: Mic,         keywords: ['microfono', 'micrófono', 'mic'] },
  { icon: Camera,      keywords: ['cámara', 'camara', 'webcam', 'fotografica', 'video'] },
  { icon: Video,       keywords: ['capturador', 'grabador', 'deck', 'gopro'] },
  { icon: Smartphone,  keywords: ['celular', 'telefono', 'teléfono', 'smartphone', 'movil', 'móvil', 'iphone', 'android'] },
  { icon: Cpu,         keywords: ['componente', 'ram', 'memoria', 'gpu', 'video', 'tarjeta', 'procesador', 'cpu', 'placa', 'motherboard'] },
  { icon: HardDrive,   keywords: ['disco', 'ssd', 'hdd', 'almacenamiento', 'externo'] },
  { icon: Server,      keywords: ['servidor', 'server', 'rack', 'torre', 'pc', 'escritorio', 'desktop', 'tower', 'workstation'] },
  { icon: Router,      keywords: ['router', 'modem', 'módem', 'switch', 'hub', 'network', 'red', 'access point'] },
  { icon: Wifi,        keywords: ['wifi', 'inalambrico', 'inalámbrico', 'antena'] },
  { icon: Zap,         keywords: ['cargador', 'zap', 'energia', 'energía', 'transformador', 'fuente', 'power supply'] },
  { icon: Battery,     keywords: ['bateria', 'batería', 'pila', 'ups', 'no break'] },
  { icon: Wrench,      keywords: ['herramientas', 'wrench', 'desarmador', 'destornillador', 'mantenimiento', 'kit', 'set', 'herramienta'] },
  { icon: Cable,       keywords: ['cable', 'hdmi', 'usb', 'vga', 'displayport', 'ethernet', 'alimentacion', 'conector'] },
  { icon: ShieldCheck, keywords: ['software', 'licencia', 'windows', 'office', 'antivirus', 'sistema'] },
  { icon: Gamepad,     keywords: ['control', 'mando', 'joystick', 'gamepad', 'consola', 'playstation', 'xbox'] },
  { icon: Usb,         keywords: ['pendrive', 'memoria usb', 'flash drive', 'periferico', 'periférico'] },
  { icon: Disc,        keywords: ['cd', 'dvd', 'disco optico', 'blue ray'] },
  { icon: Files,       keywords: ['documento', 'manual', 'guia', 'papel'] },
  { icon: Box,         keywords: ['kit', 'pack', 'combo', 'caja', 'paquete'] },
];

/**
 * Devuelve el ícono correspondiente a la categoría del equipo.
 * Compartido entre inventario y generar-qr.
 */
export function getIconoCategoria(nombre: string, size: 'sm' | 'md' | 'lg' = 'sm') {
  const clsMap = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-12 w-12' };
  const cls = clsMap[size];
  const n = (nombre ?? '').toLowerCase();

  // Buscar el primer mapeo que coincida
  for (const entry of ICON_MAPPING) {
    if (entry.keywords.some(k => n.includes(k))) {
      const Icon = entry.icon;
      return <Icon className={cls} />;
    }
  }

  // Icono por defecto si no hay coincidencia
  return <Package className={cls} />;
}
