'use client';

import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Transition, Dialog } from '@headlessui/react';
import {
  Mail, Shield, Activity, Calendar,
  Fingerprint, Copy, Check, Info, Palette, Save, X,
  Type, Image, Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TailChase } from 'ldrs/react';
import 'ldrs/react/TailChase.css';
import { useAvatar, AVATAR_GRADIENTS, BANNER_PATTERNS, patternCSS } from '@/components/useAvatar';

const ROL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  ADMIN:       { label: 'Admin',       color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  OPERADOR:    { label: 'Operador',    color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  PENDIENTE:   { label: 'Pendiente',   color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
};

const COLOR_ROWS = [
  { label: 'Azules',   start: 0,  end: 5  },
  { label: 'Lilas',    start: 5,  end: 10 },
  { label: 'Rosas',    start: 10, end: 15 },
  { label: 'Naranjas', start: 15, end: 20 },
  { label: 'Verdes',   start: 20, end: 25 },
  { label: 'Neutros',  start: 25, end: 30 },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} title="Copiar"
      className="ml-2 p-1.5 rounded-lg transition-colors duration-150 cursor-pointer flex-shrink-0"
      style={{ color: copied ? '#10b981' : 'var(--text-muted)' }}
      onMouseEnter={e => { if (!copied) e.currentTarget.style.backgroundColor = 'var(--bg-surface-3)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function InfoField({ icon, label, value, mono = false, copiable = false, last = false }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; copiable?: boolean; last?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-4" style={last ? {} : { borderBottom: '1px solid var(--border-soft)' }}>
      <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className={`text-sm font-semibold truncate ${mono ? 'font-mono text-xs' : ''}`} style={{ color: 'var(--text-primary)' }} title={value}>{value}</p>
      </div>
      {copiable && <CopyButton text={value} />}
    </div>
  );
}

function ColorGrid({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div className="space-y-3">
      {COLOR_ROWS.map(row => (
        <div key={row.label}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)', opacity: 0.55 }}>{row.label}</p>
          <div className="grid grid-cols-5 gap-1.5">
            {AVATAR_GRADIENTS.slice(row.start, row.end).map(g => (
              <button key={g.id} onClick={() => onSelect(g.class)} title={g.id}
                className={`h-8 rounded-xl bg-gradient-to-br ${g.class} cursor-pointer transition-all duration-150 ${
                  selected === g.class ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : 'opacity-80 hover:opacity-100 hover:scale-105'
                }`}
                style={{ '--tw-ring-offset-color': 'var(--bg-surface)', boxShadow: selected === g.class ? undefined : 'inset 0 0 0 1px rgba(0,0,0,0.12)' } as any}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-modales por sección ─────────────────────────────────────────────────
function SubModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px]" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment}
              enter="ease-out duration-250" enterFrom="opacity-0 scale-95 translate-y-2" enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-2">
              <Dialog.Panel className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden bg-white border border-slate-100">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                  <Dialog.Title className="text-base font-bold text-slate-900">{title}</Dialog.Title>
                  <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer transition-colors text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-6 py-5">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function MiPerfilPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { initials, avatarGradient, bannerGradient, bannerPattern, updateAvatar } = useAvatar();

  // Estado del menú bottom-sheet
  const [menuOpen, setMenuOpen] = useState(false);
  // Estado de los sub-modales
  const [subModal, setSubModal] = useState<'initials' | 'avatar' | 'banner' | null>(null);

  // Valores de edición
  const [editInitials,       setEditInitials]       = useState('');
  const [editAvatarGradient, setEditAvatarGradient] = useState('');
  const [editBannerGradient, setEditBannerGradient] = useState('');
  const [editBannerPattern,  setEditBannerPattern]  = useState('none');

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
        setPerfil({ ...data, email: user.email, created_at: data?.created_at || user.created_at });
      }
      setLoading(false);
    };
    fetchPerfil();
  }, []);

  const openMenu = () => {
    setEditInitials(initials);
    setEditAvatarGradient(avatarGradient);
    setEditBannerGradient(bannerGradient);
    setEditBannerPattern(bannerPattern);
    setMenuOpen(true);
  };

  const openSub = (key: 'initials' | 'avatar' | 'banner') => {
    setMenuOpen(false);
    setTimeout(() => setSubModal(key), 180);
  };

  const closeSub = () => setSubModal(null);

  const save = () => {
    updateAvatar(editInitials, editAvatarGradient, editBannerGradient, editBannerPattern);
    closeSub();
  };

  const currentPatternSVG = BANNER_PATTERNS.find(p => p.id === bannerPattern)?.svg ?? '';
  const editPatternSVG    = BANNER_PATTERNS.find(p => p.id === editBannerPattern)?.svg ?? '';

  if (loading) {
    return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-slate-500">
      <TailChase size="40" speed="1.75" color="#cbd5e1" />
      <p className="text-sm font-semibold tracking-wide">Cargando tu información...</p>
    </div>
    );
  }

  if (!perfil) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-dashed" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-surface)' }}>
        <p className="text-sm font-medium">No se pudo cargar el perfil.</p>
      </div>
    );
  }

  const rolCfg   = ROL_CONFIG[perfil.rol] ?? { label: perfil.rol ?? 'Sin Rol', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
  const isActive = perfil.estado === 'ACTIVO';

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Mi Perfil</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Información de tu cuenta · Solo lectura</p>
      </div>

      {/* Tarjeta principal */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>

        {/* Banner */}
        <div className={`relative h-32 sm:h-36 bg-gradient-to-br ${bannerGradient} overflow-hidden`}>
          {currentPatternSVG && (
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: patternCSS(currentPatternSVG), backgroundRepeat: 'repeat' }} />
          )}
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <button onClick={openMenu}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all bg-white/20 hover:bg-white/35 text-white border border-white/25 backdrop-blur-sm">
            <Palette className="h-3.5 w-3.5" /> Personalizar
          </button>
        </div>

        {/* Avatar + info */}
        <div className="px-4 sm:px-6 pb-5 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 -mt-10 sm:-mt-12 relative z-10">
            <div
              className={`h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 flex items-center justify-center rounded-[1.6rem] text-3xl sm:text-4xl font-black text-white bg-gradient-to-br ${avatarGradient} ring-4 shadow-xl`}
              style={{ '--tw-ring-color': 'var(--bg-surface)' } as any}>
              {initials}
            </div>
            <div className="flex flex-wrap gap-2 sm:mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                style={{ color: rolCfg.color, backgroundColor: rolCfg.bg, border: `1px solid ${rolCfg.border}` }}>
                <Shield className="h-3 w-3" />{rolCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                isActive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <Activity className="h-3 w-3" />{perfil.estado || 'N/A'}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{perfil.email}</h2>
            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <Info className="h-3.5 w-3.5 flex-shrink-0" /> Cuenta gestionada por el administrador
            </p>
          </div>
        </div>
      </div>

      {/* Datos */}
      <div className="rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>
        <div className="px-6 pt-5 pb-1">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Datos de la cuenta</p>
        </div>
        <div className="px-6 pb-2">
          <InfoField icon={<Mail className="h-4 w-4" />}        label="Correo electrónico" value={perfil.email}      copiable />
          <InfoField icon={<Shield className="h-4 w-4" />}      label="Nivel de acceso"    value={rolCfg.label} />
          <InfoField icon={<Fingerprint className="h-4 w-4" />} label="ID de usuario"      value={perfil.id}         mono copiable />
          <InfoField icon={<Calendar className="h-4 w-4" />}    label="Miembro desde"
            value={perfil.created_at ? format(new Date(perfil.created_at), "d 'de' MMMM, yyyy — HH:mm", { locale: es }) : 'No disponible'} last />
        </div>
      </div>

      {/* ── Bottom Sheet — menú principal (idéntico al de inventario) ── */}
      {typeof document !== 'undefined' && createPortal(
        <Transition show={menuOpen} as={Fragment}>
          <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center">
            <Transition.Child as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
              leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="absolute inset-0 pointer-events-auto bg-slate-900/10 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} />
            </Transition.Child>

            <Transition.Child as={Fragment}
              enter="transition ease-out duration-300 transform" enterFrom="translate-y-full" enterTo="translate-y-0"
              leave="transition ease-in duration-200 transform" leaveFrom="translate-y-0" leaveTo="translate-y-full">
              <div className="relative pointer-events-auto w-full max-w-[340px] bg-white shadow-[0_-10px_40px_rgba(15,23,42,0.1)] rounded-t-4xl border-x border-t border-slate-100 overflow-hidden pb-safe">
                <div className="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-slate-100" />
                <div className="px-3 pb-5 pt-1 space-y-1">

                  <button onClick={() => openSub('initials')}
                    className="flex w-full items-center gap-4 px-5 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors rounded-2xl">
                    <Type className="h-5 w-5 text-slate-400" /> Cambiar iniciales
                  </button>
                  <div className="mx-4 border-t border-slate-50" />

                  <button onClick={() => openSub('avatar')}
                    className="flex w-full items-center gap-4 px-5 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors rounded-2xl">
                    <Image className="h-5 w-5 text-slate-400" /> Color del avatar
                  </button>
                  <div className="mx-4 border-t border-slate-50" />

                  <button onClick={() => openSub('banner')}
                    className="flex w-full items-center gap-4 px-5 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors rounded-2xl">
                    <Layers className="h-5 w-5 text-slate-400" /> Color y patrón del banner
                  </button>

                </div>
              </div>
            </Transition.Child>
          </div>
        </Transition>,
        document.body
      )}

      {/* ── Sub-modal: Iniciales ── */}
      <SubModal open={subModal === 'initials'} onClose={closeSub} title="Cambiar iniciales">
        <div className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
            <div className={`h-14 w-14 flex-shrink-0 flex items-center justify-center rounded-2xl text-xl font-black text-white bg-gradient-to-br ${editAvatarGradient} shadow-md`}>
              {editInitials || '??'}
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Vista previa del avatar</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{editInitials || '—'}</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>Iniciales (máx. 2 caracteres)</label>
            <input type="text" value={editInitials} maxLength={2}
              onChange={e => setEditInitials(e.target.value.toUpperCase())}
              placeholder="AB"
              className="w-full px-4 py-3 rounded-xl text-lg font-black text-center tracking-widest focus:outline-none transition-all"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--input-border)'} />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button onClick={save} className="w-full flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all cursor-pointer">
              <Save className="h-4 w-4" /> Guardar
            </button>
            <button onClick={closeSub} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      </SubModal>

      {/* ── Sub-modal: Color del avatar ── */}
      <SubModal open={subModal === 'avatar'} onClose={closeSub} title="Color del avatar">
        <div className="space-y-5">
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
            <div className={`h-14 w-14 flex-shrink-0 flex items-center justify-center rounded-2xl text-xl font-black text-white bg-gradient-to-br ${editAvatarGradient} shadow-md`}>
              {editInitials || initials}
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Vista previa del avatar</p>
          </div>
          <ColorGrid selected={editAvatarGradient} onSelect={setEditAvatarGradient} />
          <div className="flex flex-col gap-2 pt-2">
            <button onClick={save} className="w-full flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all cursor-pointer">
              <Save className="h-4 w-4" /> Guardar
            </button>
            <button onClick={closeSub} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      </SubModal>

      {/* ── Sub-modal: Banner (color + patrón) ── */}
      <SubModal open={subModal === 'banner'} onClose={closeSub} title="Banner — color y patrón">
        <div className="space-y-5">
          {/* Preview banner */}
          <div className={`relative h-20 rounded-2xl overflow-hidden bg-gradient-to-br ${editBannerGradient}`}>
            {editPatternSVG && (
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: patternCSS(editPatternSVG), backgroundRepeat: 'repeat' }} />
            )}
          </div>

          {/* Color banner */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Color</p>
            <ColorGrid selected={editBannerGradient} onSelect={setEditBannerGradient} />
          </div>

          {/* Patrón */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Patrón</p>
            <div className="grid grid-cols-4 gap-2">
              {BANNER_PATTERNS.map(p => {
                const isSel = editBannerPattern === p.id;
                return (
                  <button key={p.id} onClick={() => setEditBannerPattern(p.id)} title={p.label}
                    className={`relative h-11 rounded-xl overflow-hidden cursor-pointer transition-all bg-gradient-to-br ${editBannerGradient} ${isSel ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.04]' : 'opacity-75 hover:opacity-100'}`}
                    style={{ '--tw-ring-offset-color': 'var(--bg-surface)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' } as any}>
                    {p.svg && <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: patternCSS(p.svg), backgroundRepeat: 'repeat' }} />}
                    <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] font-bold text-white drop-shadow-sm leading-none">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button onClick={save} className="w-full flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all cursor-pointer">
              <Save className="h-4 w-4" /> Guardar
            </button>
            <button onClick={closeSub} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      </SubModal>

    </div>
  );
}