'use client';

import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'bodega-theme';

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system';
    const systemRes = getSystemPreference();
    
    // Si no hay nada guardado, usamos la del sistema de una
    const finalRes = saved === 'system' ? systemRes : saved;
    
    setMode(saved);
    setResolved(finalRes as 'light' | 'dark');
    applyTheme(finalRes as 'light' | 'dark');
  }, []);

  // Escuchar cambios del sistema en tiempo real
  useEffect(() => {
    if (mode !== 'system') return;
    
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const res = e.matches ? 'dark' : 'light';
      setResolved(res);
      applyTheme(res);
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setTheme = (newMode: ThemeMode) => {
    const res = newMode === 'system' ? getSystemPreference() : newMode;
    localStorage.setItem(STORAGE_KEY, newMode);
    setMode(newMode);
    setResolved(res as 'light' | 'dark');
    applyTheme(res as 'light' | 'dark');
  };

  return { mode, resolved, setTheme, isDark: resolved === 'dark' };
}