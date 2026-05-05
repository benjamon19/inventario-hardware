'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Paleta de colores (pasteles + profundos) ────────────────────────────────
export const AVATAR_GRADIENTS = [
  // Azules
  { id: 'sky', class: 'from-sky-200 to-blue-300' },
  { id: 'blue-mid', class: 'from-blue-300 to-indigo-400' },
  { id: 'blue-deep', class: 'from-blue-500 to-indigo-700' },
  { id: 'slate-blue', class: 'from-slate-400 to-blue-600' },
  { id: 'midnight', class: 'from-slate-800 to-indigo-900' },
  // Lilas
  { id: 'lavender', class: 'from-violet-200 to-purple-300' },
  { id: 'lilac', class: 'from-purple-200 to-pink-300' },
  { id: 'mauve', class: 'from-fuchsia-200 to-violet-400' },
  { id: 'grape', class: 'from-purple-400 to-indigo-500' },
  { id: 'plum', class: 'from-purple-500 to-violet-700' },
  // Rosas
  { id: 'blush', class: 'from-rose-200 to-pink-300' },
  { id: 'flamingo', class: 'from-pink-200 to-rose-400' },
  { id: 'coral', class: 'from-rose-300 to-orange-300' },
  { id: 'rose-deep', class: 'from-rose-400 to-pink-600' },
  { id: 'berry', class: 'from-pink-500 to-rose-700' },
  // Naranjas
  { id: 'peach', class: 'from-amber-200 to-orange-300' },
  { id: 'apricot', class: 'from-orange-200 to-amber-300' },
  { id: 'mango', class: 'from-yellow-300 to-orange-400' },
  { id: 'sun', class: 'from-amber-300 to-yellow-400' },
  { id: 'tangerine', class: 'from-orange-400 to-red-400' },
  // Verdes
  { id: 'mint', class: 'from-emerald-200 to-teal-300' },
  { id: 'sage', class: 'from-green-200 to-emerald-300' },
  { id: 'seafoam', class: 'from-teal-200 to-cyan-300' },
  { id: 'jade', class: 'from-emerald-400 to-teal-500' },
  { id: 'forest', class: 'from-green-500 to-emerald-700' },
  // Neutros
  { id: 'silver', class: 'from-slate-300 to-gray-400' },
  { id: 'stone', class: 'from-stone-300 to-slate-400' },
  { id: 'charcoal', class: 'from-zinc-500 to-slate-700' },
  { id: 'noir', class: 'from-zinc-700 to-zinc-900' },
  { id: 'indigo-dk', class: 'from-indigo-200 to-violet-300' },
];

// ─── Patrones SVG para el banner ─────────────────────────────────────────────
const S = "rgba(255,255,255,0.22)";
const mk = (inner: string, w = 20, h = 20) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${inner}</svg>`;

export const BANNER_PATTERNS: { id: string; label: string; svg: string }[] = [
  { id: 'none', label: 'Limpio', svg: '' },
  { id: 'dots', label: 'Puntos', svg: mk(`<circle cx='10' cy='10' r='2' fill='${S}'/>`) },
  { id: 'dots-sm', label: 'Mini pts', svg: mk(`<circle cx='5' cy='5' r='1' fill='${S}'/>`, 10, 10) },
  { id: 'zigzag', label: 'Rayos', svg: mk(`<polyline points='0,10 5,0 10,10 15,0 20,10' fill='none' stroke='${S}' stroke-width='1.5' stroke-linejoin='round'/><polyline points='0,20 5,10 10,20 15,10 20,20' fill='none' stroke='${S}' stroke-width='1.5' stroke-linejoin='round'/>`) },
  { id: 'diag', label: 'Diagonal', svg: mk(`<line x1='0' y1='0' x2='20' y2='20' stroke='${S}' stroke-width='1.5'/><line x1='10' y1='0' x2='20' y2='10' stroke='${S}' stroke-width='1.5'/><line x1='0' y1='10' x2='10' y2='20' stroke='${S}' stroke-width='1.5'/>`) },
  { id: 'lines', label: 'Líneas', svg: mk(`<line x1='0' y1='10' x2='20' y2='10' stroke='${S}' stroke-width='1'/><line x1='0' y1='0' x2='20' y2='0' stroke='${S}' stroke-width='1'/>`) },
  { id: 'grid', label: 'Cuadrícl.', svg: mk(`<path d='M20 0L0 0 0 20' fill='none' stroke='${S}' stroke-width='1'/>`) },
  { id: 'waves', label: 'Ondas', svg: mk(`<path d='M0 8C5 2 10 2 15 8S25 14 30 8' fill='none' stroke='${S}' stroke-width='1.5'/>`, 30, 16) },
  { id: 'crosses', label: 'Cruces', svg: mk(`<line x1='10' y1='4' x2='10' y2='16' stroke='${S}' stroke-width='1.5' stroke-linecap='round'/><line x1='4' y1='10' x2='16' y2='10' stroke='${S}' stroke-width='1.5' stroke-linecap='round'/>`) },
  { id: 'hexagons', label: 'Hexágonos', svg: mk(`<polygon points='14,2 22,7 22,17 14,22 6,17 6,7' fill='none' stroke='${S}' stroke-width='1.5'/>`, 28, 24) },
  { id: 'triangles', label: 'Triángulos', svg: mk(`<polygon points='10,3 18,17 2,17' fill='none' stroke='${S}' stroke-width='1.5'/>`) },
  { id: 'diamonds', label: 'Rombos', svg: mk(`<polygon points='10,2 18,10 10,18 2,10' fill='none' stroke='${S}' stroke-width='1.5'/>`) },
];

export function patternCSS(svg: string): string {
  if (!svg) return 'none';
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export interface InitialAvatarData {
  initials?: string;
  avatarGradient?: string;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAvatar(initialData?: InitialAvatarData) {
  const [initials, setInitials] = useState(initialData?.initials || 'U');
  const [avatarGradient, setAvatarGradient] = useState(initialData?.avatarGradient || AVATAR_GRADIENTS[1].class);
  const [bannerGradient, setBannerGradient] = useState(AVATAR_GRADIENTS[2].class);
  const [bannerPattern, setBannerPattern] = useState('none');

  const loadAvatar = useCallback(async () => {
    const setCookie = (name: string, value: string) => {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
    };

    // 1. Cargar desde localStorage como estado inicial rápido
    const si = localStorage.getItem('ti_bodega_avatar_initials');
    const sag = localStorage.getItem('ti_bodega_avatar_gradient');
    const sbg = localStorage.getItem('ti_bodega_banner_gradient');
    const sbp = localStorage.getItem('ti_bodega_banner_pattern');

    if (si) setInitials(si);
    if (sag) setAvatarGradient(sag);
    if (sbg) setBannerGradient(sbg);
    if (sbp) setBannerPattern(sbp);

    // 2. Siempre sincronizar desde DB (fuente de verdad)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Si no hay nada en localStorage, generar defaults desde el email
    if (!si && !sag) {
      const namePart = user.email?.split('@')[0].split('.')[0] ?? '';
      const gen = namePart.substring(0, 2).toUpperCase() || 'U';
      const isFemale = namePart.toLowerCase().endsWith('a');
      const grad = isFemale ? AVATAR_GRADIENTS[10].class : AVATAR_GRADIENTS[1].class;
      const ban = isFemale ? AVATAR_GRADIENTS[11].class : AVATAR_GRADIENTS[2].class;

      setInitials(gen);
      setAvatarGradient(grad);
      setBannerGradient(ban);

      localStorage.setItem('ti_bodega_avatar_initials', gen);
      localStorage.setItem('ti_bodega_avatar_gradient', grad);
      setCookie('ti_bodega_avatar_initials', gen);
      setCookie('ti_bodega_avatar_gradient', grad);
    }

    // 3. Sync desde DB — SIEMPRE, sin condición que lo bloquee
    const { data, error } = await supabase
      .from('perfiles')
      .select('avatar_initials, avatar_gradient, banner_gradient, banner_pattern')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('[useAvatar] Error al leer perfil desde DB:', error.message);
      return;
    }

    if (!data) return;

    // Aplicar cada campo si existe en DB (DB siempre gana sobre localStorage)
    if (data.avatar_initials) {
      setInitials(data.avatar_initials);
      localStorage.setItem('ti_bodega_avatar_initials', data.avatar_initials);
      setCookie('ti_bodega_avatar_initials', data.avatar_initials);
    }
    if (data.avatar_gradient) {
      setAvatarGradient(data.avatar_gradient);
      localStorage.setItem('ti_bodega_avatar_gradient', data.avatar_gradient);
      setCookie('ti_bodega_avatar_gradient', data.avatar_gradient);
    }
    if (data.banner_gradient) {
      setBannerGradient(data.banner_gradient);
      localStorage.setItem('ti_bodega_banner_gradient', data.banner_gradient);
    }
    if (data.banner_pattern) {
      setBannerPattern(data.banner_pattern);
      localStorage.setItem('ti_bodega_banner_pattern', data.banner_pattern);
    }
  }, []);

  useEffect(() => {
    loadAvatar();
    const handler = () => loadAvatar();
    window.addEventListener('avatar-update', handler);
    return () => window.removeEventListener('avatar-update', handler);
  }, [loadAvatar]);

  const updateAvatar = async (
    newInitials: string,
    newAvatarGradient: string,
    newBannerGradient: string,
    newBannerPattern: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const setCookie = (name: string, value: string) => {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
    };

    const fin = newInitials.trim().substring(0, 2).toUpperCase() || 'U';

    // Actualizar estado local inmediatamente (optimistic)
    setInitials(fin);
    setAvatarGradient(newAvatarGradient);
    setBannerGradient(newBannerGradient);
    setBannerPattern(newBannerPattern);

    // Persistir en localStorage y cookies
    localStorage.setItem('ti_bodega_avatar_initials', fin);
    localStorage.setItem('ti_bodega_avatar_gradient', newAvatarGradient);
    localStorage.setItem('ti_bodega_banner_gradient', newBannerGradient);
    localStorage.setItem('ti_bodega_banner_pattern', newBannerPattern);
    setCookie('ti_bodega_avatar_initials', fin);
    setCookie('ti_bodega_avatar_gradient', newAvatarGradient);

    window.dispatchEvent(new Event('avatar-update'));

    // Guardar en DB — ahora con manejo de error visible
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No hay sesión activa' };

    const { error } = await supabase
      .from('perfiles')
      .update({
        avatar_initials: fin,
        avatar_gradient: newAvatarGradient,
        banner_gradient: newBannerGradient,
        banner_pattern: newBannerPattern,
      })
      .eq('id', user.id);

    if (error) {
      console.error('[useAvatar] Error al guardar en DB:', error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return { initials, avatarGradient, bannerGradient, bannerPattern, updateAvatar };
}