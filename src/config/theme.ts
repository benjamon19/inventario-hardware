export const THEMES = {
  light: {
    background: 'bg-slate-50',
    card: 'bg-white',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
    border: 'border-slate-200',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: 'text-blue-600',
  },
  dark: {
    background: 'bg-zinc-950',
    card: 'bg-zinc-900',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    border: 'border-zinc-800',
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    success: 'text-emerald-500 bg-emerald-950/20 border-emerald-900/40',
    icon: 'text-emerald-500',
  },
  statusColors: {
    DISPONIBLE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    EN_USO: 'bg-blue-100 text-blue-700 border-blue-200',
    REPARACION: 'bg-amber-100 text-amber-700 border-amber-200',
    BAJA: 'bg-red-100 text-red-700 border-red-200',
  } 
};

export const currentTheme = THEMES.light;