import {
  Laptop, Monitor, Tablet, Keyboard, Cpu, HardDrive, Package,
  Camera, Video, Zap, Wrench, Printer, Tv, Box,
  Mouse, Headphones, Speaker, Smartphone, Radio, Wifi,
  Server, Database, Disc, Plug, Battery, MemoryStick,
  Usb, Files, ShieldCheck, Cable, Gamepad, Webcam, Mic,
  Router, Network, Power, Search, LayoutGrid, Hammer,
  Construction, Drill, PenTool, Scissors, Settings,
  HardHat, Microscope, FlaskConical, Thermometer,
  Calculator, Gauge, Activity, HeartPulse
} from 'lucide-react';

/**
 * Normaliza una cadena: minúsculas y quita acentos.
 */
function normalize(str: string): string {
  return (str ?? '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Mapeo inteligente de palabras clave a iconos.
 * Se busca por orden de prioridad.
 */
const ICON_MAPPING = [
  // HERRAMIENTAS (Prioridad alta para evitar que caigan en Componentes o Packs)
  { icon: Wrench,       keywords: ['herramienta', 'wrench', 'ferreteria', 'taller', 'maquinaria', 'mantenimiento', 'soporte', 'reparacion', 'desarmador', 'destornillador', 'llave', 'pinza', 'alicate'] },
  { icon: Hammer,       keywords: ['martillo', 'hammer', 'construccion', 'obra'] },
  { icon: Drill,        keywords: ['taladro', 'perforadora', 'drill', 'rotomartillo', 'soplador', 'sopladora'] },
  { icon: Construction, keywords: ['casco', 'seguridad industrial', 'proteccion', 'obra', 'civil'] },
  
  // COMPUTACIÓN CORE
  { icon: Laptop,       keywords: ['laptop', 'notebook', 'macbook', 'portatil', 'portátil', 'thinkpad', 'dell', 'hp'] },
  { icon: Tablet,       keywords: ['tablet', 'ipad', 'kindle', 'fire', 'surface'] },
  { icon: Monitor,      keywords: ['monitor', 'pantalla', 'display', 'screen'] },
  { icon: Tv,           keywords: ['tv', 'televisor', 'smart tv', 'led', 'lcd', 'plasma', 'monitor tv'] },
  { icon: Server,       keywords: ['servidor', 'server', 'rack', 'torre', 'pc', 'escritorio', 'desktop', 'tower', 'workstation', 'clon', 'case'] },
  
  // COMPONENTES INTERNOS
  { icon: Cpu,          keywords: ['componente', 'ram', 'memoria', 'gpu', 'video', 'tarjeta', 'procesador', 'cpu', 'placa', 'motherboard', 'chip', 'circuito'] },
  { icon: HardDrive,    keywords: ['disco', 'ssd', 'hdd', 'almacenamiento', 'externo', 'solido', 'sólido'] },
  
  // PERIFÉRICOS E INPUT
  { icon: Keyboard,     keywords: ['teclado'] },
  { icon: Mouse,        keywords: ['mouse', 'raton', 'ratón', 'mousepad', 'touchpad'] },
  { icon: Gamepad,      keywords: ['control', 'mando', 'joystick', 'gamepad', 'consola', 'playstation', 'xbox', 'nintendo'] },
  { icon: Webcam,       keywords: ['webcam', 'camara web', 'cámara web'] },
  { icon: Mic,          keywords: ['microfono', 'micrófono', 'mic'] },
  { icon: Headphones,   keywords: ['audifonos', 'auriculares', 'cascos', 'headset', 'manos libres', 'sony', 'bose'] },
  { icon: Speaker,      keywords: ['parlante', 'altavoz', 'bocina', 'audio', 'sonido', 'woofer', 'subwoofer'] },
  
  // MULTIMEDIA Y OTROS
  { icon: Camera,       keywords: ['cámara', 'camara', 'fotografica', 'reflex', 'canon', 'nikon'] },
  { icon: Video,        keywords: ['capturador', 'grabador', 'deck', 'gopro', 'video', 'multimedia'] },
  { icon: Printer,      keywords: ['impresora', 'scanner', 'escaner', 'multifuncional', 'plotter', 'tinta', 'toner', 'laser', 'láser'] },
  { icon: Smartphone,   keywords: ['celular', 'telefono', 'teléfono', 'smartphone', 'movil', 'móvil', 'iphone', 'android', 'galaxy'] },
  
  // REDES
  { icon: Router,       keywords: ['router', 'modem', 'módem', 'switch', 'hub', 'network', 'red', 'access point', 'enrutador', 'ap'] },
  { icon: Wifi,         keywords: ['wifi', 'inalambrico', 'inalámbrico', 'antena', 'bluetooth'] },
  { icon: Cable,        keywords: ['cable', 'hdmi', 'usb', 'vga', 'displayport', 'ethernet', 'alimentacion', 'conector', 'adaptador', 'power'] },
  
  // ENERGÍA
  { icon: Zap,          keywords: ['cargador', 'zap', 'energia', 'energía', 'transformador', 'fuente', 'power supply', 'alimentador'] },
  { icon: Battery,      keywords: ['bateria', 'batería', 'pila', 'ups', 'no break', 'acumulador'] },
  
  // VARIOS
  { icon: ShieldCheck,  keywords: ['software', 'licencia', 'windows', 'office', 'antivirus', 'sistema', 'serial', 'key'] },
  { icon: Usb,          keywords: ['pendrive', 'memoria usb', 'flash drive', 'periferico', 'periférico', 'dongle'] },
  { icon: Disc,         keywords: ['cd', 'dvd', 'disco optico', 'blue ray'] },
  { icon: Files,        keywords: ['documento', 'manual', 'guia', 'papel', 'factura', 'guía'] },
  { icon: Box,          keywords: ['kit', 'pack', 'combo', 'caja', 'paquete', 'maletin', 'maletín', 'estuche'] },
  { icon: Settings,     keywords: ['ajuste', 'configuracion', 'setup'] },
];

/**
 * Devuelve el ícono correspondiente a la categoría del equipo.
 */
export function getIconoCategoria(nombre: string, size: 'sm' | 'md' | 'lg' = 'sm') {
  const clsMap = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-12 w-12' };
  const cls = clsMap[size];
  const n = normalize(nombre);

  // Buscar el primer mapeo que coincida
  for (const entry of ICON_MAPPING) {
    if (entry.keywords.some(k => n.includes(normalize(k)))) {
      const Icon = entry.icon;
      return <Icon className={cls} />;
    }
  }

  // Icono por defecto si no hay coincidencia
  return <Package className={cls} />;
}
