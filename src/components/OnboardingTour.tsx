'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Joyride, EventData, STATUS, Step, EVENTS, ACTIONS, TooltipRenderProps } from 'react-joyride';
import { Sparkles, Camera, Search, CheckCircle } from 'lucide-react';
import wallIco from '@/app/wall-ico.svg';
import { supabase } from '@/lib/supabase';

// Temporalmente activado para pruebas
const FORCE_TOUR = false;

/* ─── CSS global ─── */
const TOUR_CSS = `
  /* Overlay fijo en mobile */
  .react-joyride__overlay { position: fixed !important; }
  .__floater { z-index: 100010 !important; }
  @media (max-width: 480px) { .__floater { padding: 0 4px !important; } }

  @keyframes ti-slide-in {
    from { opacity: 0; transform: scale(0.94) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }

  .react-joyride__overlay { transition: opacity 0.3s ease !important; }

  .ti-card {
    animation: ti-slide-in 0.22s cubic-bezier(0.34, 1.3, 0.64, 1) both;
    background: #ffffff;
    border-radius: 20px;
    width: min(380px, calc(100vw - 28px));
    overflow: hidden;
    font-family: inherit;
    box-shadow:
      0 0 0 1px rgba(15,23,42,0.06),
      0 4px 6px -1px rgba(15,23,42,0.07),
      0 20px 48px -8px rgba(15,23,42,0.20);
  }
  @media (max-width: 480px) { .ti-card { border-radius: 16px; width: calc(100vw - 20px); } }

  .ti-prog-track { height: 3px; background: #f1f5f9; }
  .ti-prog-fill  {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #0f172a);
    border-radius: 0 3px 3px 0;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ti-body { padding: 18px 20px 12px; }
  @media (max-width:480px) { .ti-body { padding: 14px 16px 10px; } }

  .ti-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .ti-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 9.5px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: #6366f1;
    background: #eef2ff; padding: 3px 8px; border-radius: 99px;
    border: 1px solid #e0e7ff;
  }
  .ti-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #6366f1; box-shadow: 0 0 5px rgba(99,102,241,0.6); }
  .ti-counter { font-size: 11px; font-weight: 600; color: #94a3b8; }

  .ti-title { font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; line-height: 1.3; margin-bottom: 6px; }
  @media (max-width:480px) { .ti-title { font-size: 14px; } }

  .ti-content { font-size: 13.5px; color: #64748b; line-height: 1.65; }
  @media (max-width:480px) { .ti-content { font-size: 13px; } }

  .ti-foot {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 20px 16px; border-top: 1px solid #f1f5f9; gap: 10px; background: #fff;
  }
  @media (max-width:480px) { .ti-foot { padding: 8px 16px 14px; } }

  .ti-skip { font-size: 11.5px; font-weight: 500; color: #cbd5e1; background: none; border: none; cursor: pointer; padding: 6px 0; transition: color 0.15s; flex-shrink: 0; }
  .ti-skip:hover { color: #94a3b8; }

  .ti-dots { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center; }
  .ti-dot  { width: 5px; height: 5px; border-radius: 50%; background: #e2e8f0; transition: all 0.22s ease; flex-shrink: 0; }
  .ti-dot.cur { width: 16px; border-radius: 3px; background: #0f172a; }
  .ti-dot.old { background: #cbd5e1; }

  .ti-nav { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
  .ti-back {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 10px;
    border: 1.5px solid #e2e8f0; background: #fff;
    color: #64748b; cursor: pointer; font-size: 15px; transition: all 0.15s ease;
  }
  .ti-back:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateX(-1px); }

  .ti-next {
    display: flex; align-items: center; gap: 5px;
    height: 36px; padding: 0 16px; border-radius: 10px; border: none;
    background: #0f172a; color: #fff;
    font-size: 12.5px; font-weight: 700; letter-spacing: -0.01em;
    cursor: pointer; white-space: nowrap; transition: all 0.15s ease;
    box-shadow: 0 2px 8px rgba(15,23,42,0.18);
  }
  .ti-next:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 5px 16px rgba(15,23,42,0.25); }
  .ti-next:active { transform: translateY(0); }
  .ti-next.last { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); box-shadow: 0 2px 10px rgba(99,102,241,0.35); }
  .ti-next.last:hover { box-shadow: 0 5px 20px rgba(99,102,241,0.45); }

  @media (max-width:480px) {
    .ti-back { width: 40px; height: 40px; }
    .ti-next { height: 40px; padding: 0 18px; font-size: 13px; }
  }

  /* ── Spotlight manual ── */
  #ti-spotlight-manual {
    position: fixed;
    /* pointer-events: auto para que los clicks pasen al elemento real debajo */
    pointer-events: none;
    z-index: 9999;
    border-radius: 12px;
    box-shadow: 0 0 0 9999px rgba(15,23,42,0.55), 0 0 0 3px rgba(255,255,255,0.85);
    cursor: pointer;
  }

  /* Hint visual: el spotlight pulsa suavemente para indicar que es clickeable */
  @keyframes ti-spotlight-pulse {
    0%, 100% { box-shadow: 0 0 0 9999px rgba(15,23,42,0.55), 0 0 0 3px rgba(255,255,255,0.85); }
    50%       { box-shadow: 0 0 0 9999px rgba(15,23,42,0.55), 0 0 0 5px rgba(255,255,255,0.95), 0 0 20px 4px rgba(99,102,241,0.4); }
  }
  #ti-spotlight-manual.clickable {
    animation: ti-spotlight-pulse 1.8s ease-in-out infinite;
  }
`;

/* ─── Dots de progreso ─── */
function DotProgress({ cur, total }: { cur: number; total: number }) {
  if (total <= 10) {
    return (
      <div className="ti-dots">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`ti-dot${i === cur ? ' cur' : i < cur ? ' old' : ''}`} />
        ))}
      </div>
    );
  }
  const pct = Math.round(((cur + 1) / total) * 100);
  return (
    <div className="ti-dots" style={{ padding: '0 4px' }}>
      <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#0f172a', borderRadius: 99, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

/* ─── Tooltip personalizado ─── */
function CustomTooltip({ backProps, primaryProps, skipProps, tooltipProps, index, size, step, isLastStep }: TooltipRenderProps) {
  const progress = ((index + 1) / size) * 100;
  return (
    <>
      <style>{TOUR_CSS}</style>
      <div {...tooltipProps} className="ti-card">
        <div className="ti-prog-track">
          <div className="ti-prog-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="ti-body">
          <div className="ti-meta">
            <span className="ti-badge"><span className="ti-badge-dot" />Tour guiado</span>
            <span className="ti-counter">{index + 1} de {size}</span>
          </div>
          {step.title && <div className="ti-title">{step.title}</div>}
          <p className="ti-content">{step.content}</p>
        </div>
        <div className="ti-foot">
          <button className="ti-skip" {...skipProps}>Omitir</button>
          <DotProgress cur={index} total={size} />
          <div className="ti-nav">
            {index > 0 && <button className="ti-back" {...backProps} title="Atrás">←</button>}
            <button className={`ti-next${isLastStep ? ' last' : ''}`} {...primaryProps}>
              {isLastStep ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>¡Listo! <CheckCircle size={14} /></span> : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   useManualSpotlight
   - Sigue al elemento con rAF continuo
   - Oculta el overlay nativo de Joyride
   - Llama onTargetClick cuando el usuario hace click sobre la zona iluminada
───────────────────────────────────────────────────────────────────────────── */
function useManualSpotlight(
  active: boolean,
  targetId: string,
  onTargetClick: () => void,
  padding = 8,
) {
  const rafRef = useRef<number | null>(null);
  const onClickRef = useRef(onTargetClick);
  onClickRef.current = onTargetClick; // siempre la última versión sin re-crear el effect

  useEffect(() => {
    const cleanup = () => {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      document.getElementById('ti-spotlight-manual')?.remove();
      const overlay = document.querySelector('.react-joyride__overlay') as HTMLElement | null;
      if (overlay) overlay.style.opacity = '';
    };

    if (!active) { cleanup(); return; }

    // Ocultar overlay nativo (el nuestro lo reemplaza vía box-shadow)
    const joyrideOverlay = document.querySelector('.react-joyride__overlay') as HTMLElement | null;
    if (joyrideOverlay) joyrideOverlay.style.opacity = '0';

    // Crear spotlight
    let spotlight = document.getElementById('ti-spotlight-manual');
    if (!spotlight) {
      spotlight = document.createElement('div');
      spotlight.id = 'ti-spotlight-manual';
      spotlight.className = 'clickable';
      document.body.appendChild(spotlight);
    }

    // Handler de click: primero dispara el click real en el elemento, luego avanza el tour
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      const target = document.getElementById(targetId);
      if (target) target.click(); // dispara el comportamiento real del elemento
      onClickRef.current();       // avanza el paso del tour
    };
    spotlight.addEventListener('click', handleClick);

    // rAF loop: actualiza posición y pointer-events dinámicamente
    const track = () => {
      const el = document.getElementById(targetId);
      const s = document.getElementById('ti-spotlight-manual');
      if (!s) return;

      if (el) {
        const r = el.getBoundingClientRect();
        s.style.top = `${r.top - padding}px`;
        s.style.left = `${r.left - padding}px`;
        s.style.width = `${r.width + padding * 2}px`;
        s.style.height = `${r.height + padding * 2}px`;
        s.style.display = 'block';
        // Activar clicks solo cuando el elemento es visible en viewport
        s.style.pointerEvents = (r.top >= 0 && r.bottom <= window.innerHeight) ? 'auto' : 'none';
      } else {
        s.style.display = 'none';
      }

      rafRef.current = requestAnimationFrame(track);
    };
    rafRef.current = requestAnimationFrame(track);

    return () => {
      spotlight?.removeEventListener('click', handleClick);
      cleanup();
    };
  }, [active, targetId, padding]);
}

/* ─── Pasos: dinámicos según breakpoint ─── */
function buildSteps(isMobile: boolean, isSmall: boolean, wallIcoSrc: string): Step[] {
  const C = 'center' as const;
  const sT = (id: string) => isMobile ? 'body' : id;
  const sP = (p: Step['placement']) => (isMobile ? C : p) as Step['placement'];

  const baseSteps: Step[] = [
    {
      target: '#tour-main-content', title: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><img src={wallIcoSrc} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />¡Bienvenido a Wall!</div>,
      content: '¡Hola! Soy Wall, tu asistente virtual. He preparado este breve recorrido para mostrarte cómo funciona mi sistema de inventario y ayudarte a gestionar tus equipos.',
      placement: C, skipBeacon: true, skipScroll: true, data: { route: '/admin' }
    },
    {
      target: '#tour-main-content', title: 'Panel Principal',
      content: 'Muestra en tiempo real las métricas globales: total de equipos, disponibles, en uso y más.',
      placement: C, skipBeacon: true, skipScroll: true, data: { route: '/admin' }
    },
    {
      target: '#tour-main-content', title: 'Inventario',
      content: 'Consulta, busca y filtra todos los activos de hardware registrados en el sistema.',
      placement: C, skipBeacon: true, skipScroll: true, data: { route: '/admin/inventario' }
    },
    {
      target: '#tour-nuevo-equipo', title: 'Registrar equipo',
      content: 'Con este botón abres el formulario de registro. Haz clic aquí o pulsa Siguiente para verlo en acción.',
      placement: 'bottom', skipBeacon: true, data: { route: '/admin/inventario' }
    },
    {
      target: '#tour-modal-nuevo-equipo-ghost', title: 'Formulario de registro',
      content: 'Completa el modelo, categoría, estado y ubicación para registrar un equipo nuevo.',
      placement: sP('left'), skipBeacon: true, skipScroll: true, data: { route: '/admin/inventario', action: 'open_modal_nuevo_equipo' }
    },
    {
      target: sT('#tour-enhance-btn'),
      title: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} className="text-amber-500" /> Auto-relleno con IA</span>,
      content: 'Escribe una descripción corta y pulsa «Mejorar con Wall» — la IA de Wall completará y enriquecerá el texto automáticamente para que el inventario quede más detallado.',
      placement: sP('left'), skipBeacon: true, skipScroll: true,
      data: { route: '/admin/inventario', action: 'open_modal_nuevo_equipo' }
    },
    {
      target: isMobile ? '#tour-camera-btn' : 'body',
      title: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Camera size={16} /> Cámara inteligente</span>,
      content: isMobile
        ? 'En móvil verás este botón «Cámara» junto al título. Ábrelo y apunta a cualquier etiqueta o código QR del equipo — Wall usará IA para extraer el modelo y número de serie automáticamente.'
        : 'Cuando entres desde tu celular, verás un botón «Cámara» en este formulario. Podrás apuntar a la etiqueta de cualquier equipo y Wall extraerá el modelo y N° de serie con IA, ¡sin escribir nada!',
      placement: isMobile ? 'bottom' : C, skipBeacon: true, skipScroll: true,
      data: { route: '/admin/inventario', action: 'open_modal_nuevo_equipo' }
    },
    {
      target: 'body',
      title: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Search size={16} /> Dos modos de escaneo</span>,
      content: 'La cámara móvil tiene dos modos: «QR» detecta códigos instantáneamente, y «Foto» captura la imagen para que la IA lea y procese el texto del equipo (OCR). ¡Todo automatizado!',
      placement: C, skipBeacon: true, skipScroll: true,
      data: { route: '/admin/inventario', action: 'open_modal_nuevo_equipo' }
    },
    // Condicionales de móvil se insertan más abajo (si hubieran más)
    {
      target: '#tour-generar-qr-general', title: 'Generar QR',
      content: 'Busca cualquier equipo y obtén su etiqueta QR lista para imprimir y pegar al activo físico.',
      placement: 'bottom', skipBeacon: true, skipScroll: true, data: { route: '/admin/generar-qr' }
    },
    {
      target: '#tour-qr-item-0', title: 'Seleccionar equipo',
      content: 'Pulsa el botón siguiente para generar su código QR al instante.',
      placement: 'top', skipBeacon: true, skipScroll: true,
      data: { id: 'qr-item', route: '/admin/generar-qr', manualSpotlight: 'tour-qr-item-0' }
    },
    {
      target: isMobile ? 'body' : '#tour-qr-code-only',
      title: 'Previsualización QR',
      content: 'Aquí tienes la etiqueta generada, lista para imprimir y adherir al equipo (la función de impresión no está disponible en móviles).',
      placement: isMobile ? C : 'right', skipBeacon: true, skipScroll: true,
      data: { id: 'qr-preview', route: '/admin/generar-qr', action: 'click_qr_item' }
    },
    {
      target: '#tour-scanner-view', title: 'Escáner QR',
      content: 'Usa la cámara para leer códigos QR y agilizar el registro de movimientos de stock.',
      placement: 'bottom', skipBeacon: true, skipScroll: true, data: { route: '/admin/escaner' }
    },
    {
      target: '#tour-mover-stock', title: 'Modo Mover Stock',
      content: 'Registra retiradas o devoluciones de equipos escaneando su código QR.',
      placement: 'bottom', skipBeacon: true, skipScroll: true, data: { route: '/admin/escaner' }
    },
    {
      target: '#tour-buscar-detalles', title: 'Modo Buscar Detalles',
      content: 'Muestra todos los detalles de un equipo escaneado sin mover el stock.',
      placement: 'bottom', skipBeacon: true, skipScroll: true, data: { route: '/admin/escaner' }
    },
    {
      target: sT('#tour-actividad-menu'), title: 'Actividad',
      content: 'Historial completo del sistema: creaciones, movimientos y cambios de estado.',
      placement: sP('right'), skipBeacon: true, skipScroll: true, data: { route: '/admin/actividad' }
    },
    {
      target: sT('#tour-usuarios-menu'), title: 'Usuarios',
      content: 'Administra los accesos y roles de las personas que pueden ingresar a la plataforma.',
      placement: sP('right'), skipBeacon: true, skipScroll: true, data: { route: '/admin/usuarios' }
    },
    {
      target: '#tour-nuevo-usuario', title: 'Crear Usuario',
      content: 'Con este botón puedes registrar a nuevos miembros en el sistema. Haz clic aquí o pulsa Siguiente para verlo en acción.',
      placement: 'bottom', skipBeacon: true, data: { route: '/admin/usuarios' }
    },
    {
      target: '#tour-modal-nuevo-usuario-ghost', title: 'Formulario de registro',
      content: 'Ingresa el correo y asigna una contraseña inicial. Por defecto, los usuarios nuevos tendrán rol de OPERADOR.',
      placement: sP('right'), skipBeacon: true, skipScroll: true, data: { id: 'nuevo-usuario', route: '/admin/usuarios', action: 'open_modal_nuevo_usuario' }
    },
    {
      target: sT('#tour-configuracion'), title: 'Configuración',
      content: 'Aquí puedes volver a ver este recorrido cuando lo necesites, además de ajustar tu contraseña y otras opciones de tu cuenta.',
      placement: sP('right'), skipBeacon: true, skipScroll: true, data: { route: '/admin/configuracion' }
    },
    {
      target: '#tour-perfil', title: 'Mi Perfil',
      content: 'Accede a tu perfil para consultar tu información personal y los detalles de tu cuenta.',
      placement: 'bottom', skipBeacon: true, skipScroll: true, data: { route: '/admin/perfil' }
    },
    {
      target: sT('#tour-cerrar-sesion'), title: '¡Todo listo!',
      content: 'Cuando termines, cierra sesión desde aquí de forma segura. ¡Ya conoces toda la plataforma!',
      placement: sP('right'), skipBeacon: true, skipScroll: true, data: { route: '/admin/perfil' }
    },
  ];

  return baseSteps;
}

/* ─── Componente principal ─── */
export default function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmall, setIsSmall] = useState(false);

  const icoSrc = typeof wallIco === 'object' ? (wallIco as any).src ?? String(wallIco) : String(wallIco);
  const steps = useMemo(
    () => buildSteps(isMobile, isSmall, icoSrc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMobile, isSmall]
  );

  const isFinishingRef = useRef(false);
  const skipRouteRef = useRef(false);
  const qrScrolledRef = useRef(false);
  const qrPreviewScrolledRef = useRef(false);
  const nuevoUsuarioScrolledRef = useRef(false);

  // ── Callback que avanza el tour cuando se hace click en el spotlight manual ──
  const handleManualSpotlightClick = useCallback(() => {
    setStepIndex(prev => prev + 1);
  }, []);

  // ── Spotlight manual: activo solo en steps con data.manualSpotlight ──
  const currentStep = steps[stepIndex];
  const manualSpotlightId = currentStep?.data?.manualSpotlight as string | undefined;
  const manualSpotlightActive = run && !isDone && !!manualSpotlightId && pathname === currentStep?.data?.route;
  useManualSpotlight(manualSpotlightActive, manualSpotlightId ?? '', handleManualSpotlightClick, 8);

  useEffect(() => {
    setIsMounted(true);
    const checkBreakpoints = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsSmall(w < 1350);
    };
    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);

    const checkTourStatus = async () => {
      if (FORCE_TOUR) {
        setRun(true);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsDone(true);
          return;
        }

        const { data: perfil } = await supabase
          .from('perfiles')
          .select('ha_visto_tour')
          .eq('id', user.id)
          .single();

        const localDone = localStorage.getItem('wall_tour_completed');

        if (perfil?.ha_visto_tour === true || localDone === 'true') {
          setIsDone(true);
          if (localDone !== 'true' && perfil?.ha_visto_tour === true) {
            localStorage.setItem('wall_tour_completed', 'true');
          }
        } else {
          setRun(true);
        }
      } catch (err) {
        console.error('Error checking tour status:', err);
        setIsDone(true);
      } finally {
        setHasCheckedStatus(true);
      }
    };
    checkTourStatus();

    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  // ── Scroll manual al QR item ──
  useEffect(() => {
    if (steps[stepIndex]?.data?.id !== 'qr-item' || pathname !== '/admin/generar-qr') {
      qrScrolledRef.current = false;
      return;
    }
    if (!isMounted || !run || isDone || qrScrolledRef.current) return;

    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById('tour-qr-item-0');
      if (el) {
        qrScrolledRef.current = true;
        if (isMobile) {
          const y = el.getBoundingClientRect().top + window.scrollY - 280;
          window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' });
          setTimeout(() => {
            const y = el.getBoundingClientRect().top + window.scrollY - 250;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }, 50);
        }
      } else if (attempts < 25) {
        attempts++;
        setTimeout(tryScroll, 200);
      }
    };
    tryScroll();
  }, [stepIndex, pathname, isMounted, run, isDone, isMobile]);

  // ── Scroll QR preview ──
  useEffect(() => {
    if (steps[stepIndex]?.data?.id !== 'qr-preview' || pathname !== '/admin/generar-qr') {
      qrPreviewScrolledRef.current = false;
      return;
    }
    if (!isMounted || !run || isDone || qrPreviewScrolledRef.current) return;

    let attempts = 0;
    const tryWaitAndScroll = () => {
      const preview = document.getElementById('tour-qr-preview');
      if (preview) {
        qrPreviewScrolledRef.current = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (attempts < 20) {
        attempts++;
        setTimeout(tryWaitAndScroll, 200);
      }
    };
    tryWaitAndScroll();
  }, [stepIndex, pathname, isMounted, run, isDone]);

  // ── Scroll al top en #tour-nuevo-usuario en móvil ──
  // El botón "Crear Usuario" suele quedar en la parte superior de la página,
  // pero si el usuario hizo scroll previo, el tooltip placement:bottom puede
  // quedar cortado. Forzamos scroll al top para que encaje bien.
  useEffect(() => {
    if (steps[stepIndex]?.data?.id !== 'nuevo-usuario' || pathname !== '/admin/usuarios') {
      nuevoUsuarioScrolledRef.current = false;
      return;
    }
    if (!isMounted || !run || isDone || !isMobile || nuevoUsuarioScrolledRef.current) return;

    nuevoUsuarioScrolledRef.current = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepIndex, pathname, isMounted, run, isDone, isMobile]);

  // ── Clicks nativos del tour (nuevo equipo y qr item via listener global) ──
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!run || !isMounted || isDone) return;
      const t = e.target as HTMLElement;
      const step = steps[stepIndex];
      if (t.closest('#tour-nuevo-equipo') && step?.target === '#tour-nuevo-equipo') { setStepIndex(stepIndex + 1); return; }
      if (t.closest('#tour-nuevo-usuario') && step?.target === '#tour-nuevo-usuario') { setStepIndex(stepIndex + 1); return; }
      // El spotlight manual maneja el click real, pero esto es por si acaso
      if (t.closest('#tour-qr-item-0') && step?.target === 'body' && step?.data?.manualSpotlight === 'tour-qr-item-0') { setStepIndex(stepIndex + 1); return; }
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [stepIndex, run, isMounted, isDone]);

  useEffect(() => {
    if (!isMounted || !hasCheckedStatus || isDone || isFinishingRef.current || skipRouteRef.current) return;
    const step = steps[stepIndex];
    if (step?.data?.route && step.data.route !== pathname) {
      setRun(false);
      router.push(step.data.route);
    }
  }, [stepIndex, isMounted, hasCheckedStatus, isDone, pathname, router]);

  useEffect(() => {
    if (!isMounted || !hasCheckedStatus || isDone || isFinishingRef.current) return;
    const step = steps[stepIndex];
    if (!run && step?.data?.route === pathname) {
      const t = setTimeout(() => setRun(true), 700);
      return () => clearTimeout(t);
    }
  }, [pathname, stepIndex, run, isMounted, hasCheckedStatus, isDone]);

  const finishTour = useCallback(async () => {
    isFinishingRef.current = true;
    skipRouteRef.current = true;
    setRun(false);
    setIsDone(true);
    setStepIndex(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem('wall_tour_completed', 'true');
        await supabase
          .from('perfiles')
          .update({ ha_visto_tour: true })
          .eq('id', user.id);
      }
    } catch (e) {
      console.error('Error updating tour status:', e);
    }

    requestAnimationFrame(() => {
      router.push('/admin');
      setTimeout(() => {
        isFinishingRef.current = false;
        skipRouteRef.current = false;
      }, 600);
    });
  }, [router]);

  const handleEvent = useCallback((data: EventData) => {
    const { action, index, status, type } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) { finishTour(); return; }
    if (([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)) {
      const next = index + (action === ACTIONS.PREV ? -1 : 1);
      if (next < 0 || next >= steps.length) { finishTour(); return; }
      const nextStep = steps[next];
      if (nextStep.data?.route && nextStep.data.route !== pathname) {
        setRun(false);
      } else {
        if (nextStep.data?.action === 'open_modal_nuevo_equipo') document.getElementById('tour-nuevo-equipo')?.click();
        if (nextStep.data?.action === 'open_modal_nuevo_usuario') document.getElementById('tour-nuevo-usuario')?.click();
        if (nextStep.data?.action === 'click_qr_item') document.getElementById('tour-qr-item-0')?.click();
      }
      setStepIndex(next);
    }
  }, [pathname, finishTour]);

  if (!isMounted || isDone) return null;

  return (
    <Joyride
      onEvent={handleEvent}
      continuous
      run={run}
      stepIndex={stepIndex}
      steps={steps}
      scrollToFirstStep
      tooltipComponent={CustomTooltip}
      floatingOptions={{
        shiftOptions: { padding: 16 },
        flipOptions: { crossAxis: false, padding: 16 },
      }}
      options={{
        primaryColor: '#0f172a',
        zIndex: 100000,
        overlayColor: 'rgba(15,23,42,0.55)',
        overlayClickAction: false,
        spotlightRadius: 12,
        spotlightPadding: 8,
        offset: 14,
        scrollOffset: 250,
        targetWaitTimeout: 3000,
      }}
    />
  );
}