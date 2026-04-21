// theme.ts
// Con darkMode: 'class' en tailwind.config, las clases dark: se activan
// cuando <html> tiene la clase "dark". El hook useTheme se encarga de eso.
//
// USO en componentes:
//   import { t, sc } from '@/config/theme';
//   <div className={t.card}>...</div>
//   <span className={sc('DISPONIBLE')}>...</span>

export const t = {
  // Fondos
  background:   'bg-slate-50      dark:bg-zinc-950',
  card:         'bg-white         dark:bg-zinc-900',
  cardHover:    'hover:bg-slate-50 dark:hover:bg-zinc-800',
  cardElevated: 'bg-slate-100     dark:bg-zinc-800',

  // Texto
  text:         'text-slate-900   dark:text-zinc-100',
  textMuted:    'text-slate-500   dark:text-zinc-400',
  textSubtle:   'text-slate-400   dark:text-zinc-500',

  // Bordes y divisores
  border:       'border-slate-200 dark:border-zinc-800',
  borderSubtle: 'border-slate-100 dark:border-zinc-800/60',
  divider:      'divide-slate-100 dark:divide-zinc-800',

  // Inputs
  input:        'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-blue-500 dark:focus:ring-emerald-500',

  // Primario (azul en light, esmeralda en dark)
  primary:      'bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white',
  primaryText:  'text-blue-600 dark:text-emerald-400',

  // Éxito
  success:      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800/50',

  // Iconos de acento
  icon:         'text-blue-600 dark:text-emerald-400',

  // Skeleton / loading
  skeleton:     'bg-slate-200 dark:bg-zinc-800',

  // Sidebar
  sidebarActive:   'bg-blue-600 text-white shadow-md shadow-blue-200 dark:bg-zinc-800 dark:text-zinc-100 dark:shadow-none dark:border dark:border-zinc-700',
  sidebarInactive: 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
  sidebarLabel:    'text-slate-400 dark:text-zinc-600',

  // Badge genérico
  badge:        'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',

  // Modal overlay
  overlay:      'bg-slate-900/60 dark:bg-black/70',

  // Danger
  danger:       'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30',
  dangerCard:   'border-red-100 dark:border-red-900/40',

  // Header
  header:       'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800',
} as const;

// Status badges con variante dark automática
const STATUS_COLORS = {
  DISPONIBLE:    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
  EN_USO:        'bg-blue-100    text-blue-700    border-blue-200    dark:bg-blue-950/40    dark:text-blue-400    dark:border-blue-800/50',
  EN_MANTENCION: 'bg-amber-100   text-amber-700   border-amber-200   dark:bg-amber-950/40   dark:text-amber-400   dark:border-amber-800/50',
  DADO_DE_BAJA:  'bg-red-100     text-red-700     border-red-200     dark:bg-red-950/40     dark:text-red-400     dark:border-red-800/50',
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;

/** Devuelve las clases Tailwind del badge según estado */
export function sc(status: string): string {
  return STATUS_COLORS[status as StatusKey] ?? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
}

// Colores para Recharts (strings hex, no Tailwind)
// const isDark = document.documentElement.classList.contains('dark');
// const colors = isDark ? chartColors.dark : chartColors.light;
export const chartColors = {
  light: {
    grid:          '#e2e8f0',
    tick:          '#64748b',
    tooltipBg:     '#ffffff',
    tooltipBorder: '#e2e8f0',
    tooltipText:   '#0f172a',
    cursor:        '#f1f5f9',
  },
  dark: {
    grid:          '#27272a',
    tick:          '#71717a',
    tooltipBg:     '#18181b',
    tooltipBorder: '#3f3f46',
    tooltipText:   '#f4f4f5',
    cursor:        '#27272a',
  },
} as const;

// Retrocompatibilidad con imports existentes de currentTheme
export const THEMES = {
  light: {
    background: 'bg-slate-50',   card: 'bg-white',         text: 'text-slate-900',
    textMuted:  'text-slate-500', border: 'border-slate-200',
    primary:    'bg-blue-600 hover:bg-blue-700 text-white',
    success:    'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon:       'text-blue-600',
  },
  dark: {
    background: 'bg-zinc-950',   card: 'bg-zinc-900',       text: 'text-zinc-100',
    textMuted:  'text-zinc-400',  border: 'border-zinc-800',
    primary:    'bg-emerald-600 hover:bg-emerald-500 text-white',
    success:    'text-emerald-400 bg-emerald-950/20 border-emerald-900/40',
    icon:       'text-emerald-400',
  },
};
export const currentTheme = THEMES.light; // legacy, reemplazar gradualmente por `t`