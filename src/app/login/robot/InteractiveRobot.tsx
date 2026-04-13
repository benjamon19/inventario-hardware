'use client';

import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export interface RobotHandle {
  playFocusEmail: () => void;
  playBlurEmail: () => void;
  playFocusPassword: (isHidden: boolean) => void;
  playBlurPassword: () => void;
  playTogglePasswordVisibility: (isHidden: boolean) => void;
  playError: () => void;
  playSuccess: () => void;
  playDespedida: () => Promise<void>;
}

const InteractiveRobot = forwardRef<RobotHandle>((_, ref) => {
  const robotRef = useRef<SVGSVGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const handsRef = useRef<SVGGElement>(null);
  const antennaLightRef = useRef<SVGCircleElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBusyRef = useRef(false);

  // ── Animaciones idle chistosas ──
  const idleAnimations = [
    // 1. Parpadeo doble rápido
    () => {
      gsap.timeline()
        .to(eyesRef.current, { scaleY: 0.05, transformOrigin: '50% 50%', duration: 0.06 })
        .to(eyesRef.current, { scaleY: 1, duration: 0.06 })
        .to(eyesRef.current, { scaleY: 0.05, duration: 0.06, delay: 0.08 })
        .to(eyesRef.current, { scaleY: 1, duration: 0.06 });
    },
    // 2. Mirada curiosa a la derecha y vuelve
    () => {
      gsap.timeline()
        .to(eyesRef.current, { x: 5, duration: 0.3, ease: 'power2.out' })
        .to(robotRef.current, { rotation: 4, duration: 0.3, ease: 'power1.out' }, '<')
        .to(eyesRef.current, { x: 0, duration: 0.4, ease: 'power2.inOut', delay: 0.8 })
        .to(robotRef.current, { rotation: 0, duration: 0.4, ease: 'power1.inOut' }, '<');
    },
    // 3. Mirada curiosa a la izquierda
    () => {
      gsap.timeline()
        .to(eyesRef.current, { x: -5, duration: 0.3, ease: 'power2.out' })
        .to(robotRef.current, { rotation: -4, duration: 0.3, ease: 'power1.out' }, '<')
        .to(eyesRef.current, { x: 0, duration: 0.4, ease: 'power2.inOut', delay: 0.8 })
        .to(robotRef.current, { rotation: 0, duration: 0.4, ease: 'power1.inOut' }, '<');
    },
    // 4. Se aburre — cabeza para abajo y "despierta"
    () => {
      gsap.timeline()
        .to(robotRef.current, { rotation: 8, y: '-=5', duration: 0.6, ease: 'power1.inOut' })
        .to(eyesRef.current, { scaleY: 0.3, transformOrigin: '50% 50%', duration: 0.4 }, '<')
        .to(robotRef.current, { rotation: -5, duration: 0.15, ease: 'power3.out', delay: 0.5 })
        .to(eyesRef.current, { scaleY: 1.4, duration: 0.1 }, '<')
        .to(robotRef.current, { rotation: 0, y: '+=5', duration: 0.4, ease: 'elastic.out(1, 0.5)' })
        .to(eyesRef.current, { scaleY: 1, duration: 0.3 }, '<');
    },
    // 5. Saludo con mano — brazo derecho sube y baja
    () => {
      gsap.timeline()
        .to(handsRef.current, { y: -30, rotation: 5, duration: 0.3, ease: 'back.out(2)' })
        .to(handsRef.current, { rotation: -5, duration: 0.15, yoyo: true, repeat: 3 })
        .to(handsRef.current, { y: 0, rotation: 0, duration: 0.4, ease: 'power3.inOut' });
    },
    // 6. Ojos enormes de sorpresa y vuelven
    () => {
      gsap.timeline()
        .to(eyesRef.current, { scaleY: 1.6, scaleX: 1.3, transformOrigin: '50% 50%', duration: 0.15, ease: 'back.out(3)' })
        .to(eyesRef.current, { scaleY: 1.6, scaleX: 1.3, duration: 0.4 })
        .to(eyesRef.current, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'power2.inOut' });
    },
    // 7. Giro de cabeza nervioso
    () => {
      gsap.timeline()
        .to(robotRef.current, { rotation: -6, duration: 0.2, ease: 'power1.out' })
        .to(robotRef.current, { rotation: 6, duration: 0.2, ease: 'power1.inOut' })
        .to(robotRef.current, { rotation: -4, duration: 0.15 })
        .to(robotRef.current, { rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.6)' });
    },
    // 8. Antena parpadea de color — "pensando"
    () => {
      gsap.timeline()
        .to(antennaLightRef.current, { fill: '#F59E0B', duration: 0.2 })
        .to(antennaLightRef.current, { fill: '#10B981', duration: 0.2, delay: 0.2 })
        .to(antennaLightRef.current, { fill: '#0EA5E9', duration: 0.2, delay: 0.2 })
        .to(antennaLightRef.current, { fill: '#10B981', duration: 0.4, delay: 0.2 });
    },
  ];

  // ── Scheduler de idle ──
  const scheduleIdle = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    const delay = 3000 + Math.random() * 4000;
    idleTimerRef.current = setTimeout(() => {
      if (!isBusyRef.current) {
        const anim = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
        anim();
      }
      scheduleIdle();
    }, delay);
  };

  useEffect(() => {
    scheduleIdle();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  useGSAP(() => {
    // ── ANIMACIÓN DE ENTRADA CHISTOSA ──
    const tl = gsap.timeline();

    tl.from(robotRef.current, {
      scale: 0,
      rotation: 720,
      y: 50,
      duration: 1.5,
      ease: 'elastic.out(0.8, 0.4)'
    })
    .to(robotRef.current, {
      y: -15,
      rotationY: 2,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    }, "-=0.2");

    gsap.from('.robot-shadow', { scale: 0, opacity: 0, duration: 1.5, ease: 'elastic.out(0.8, 0.4)' });
    gsap.to('.robot-shadow', {
      scale: 0.8,
      opacity: 0.2,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 1.3
    });
  });

  useImperativeHandle(ref, () => ({
    playFocusEmail: () => {
      isBusyRef.current = true;
      gsap.to(eyesRef.current, { y: 6, x: -2, scaleY: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(antennaLightRef.current, { fill: '#0EA5E9', duration: 0.3 });
      gsap.to(robotRef.current, { rotation: -3, duration: 0.2, ease: 'power1.out', yoyo: true, repeat: 1 });
    },
    playBlurEmail: () => {
      isBusyRef.current = false;
      gsap.to(eyesRef.current, { y: 0, x: 0, duration: 0.3 });
      gsap.to(robotRef.current, { rotation: 0, duration: 0.3 });
    },
    playFocusPassword: (isHidden: boolean) => {
      isBusyRef.current = true;
      gsap.to(antennaLightRef.current, { fill: '#F59E0B', duration: 0.3 });
      if (isHidden) {
        gsap.to(handsRef.current, { y: -52, duration: 0.4, ease: 'back.out(1.5)' });
        gsap.to(eyesRef.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.2 });
        gsap.to(robotRef.current, { rotation: 5, duration: 0.3, ease: 'power1.inOut', yoyo: true, repeat: 1 });
      } else {
        gsap.to(handsRef.current, { y: 0, duration: 0.4 });
        gsap.to(eyesRef.current, { y: 6, x: 0, scaleY: 1, transformOrigin: '50% 50%', duration: 0.3 });
      }
    },
    playTogglePasswordVisibility: (isHidden: boolean) => {
      if (isHidden) {
        gsap.to(handsRef.current, { y: -52, duration: 0.4, ease: 'back.out(1.5)' });
        gsap.to(eyesRef.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.2 });
      } else {
        gsap.to(handsRef.current, { y: 0, duration: 0.4, ease: 'power3.out' });
        gsap.to(eyesRef.current, { scaleY: 1, y: 6, x: 0, transformOrigin: '50% 50%', duration: 0.3 });
      }
    },
    playBlurPassword: () => {
      isBusyRef.current = false;
      gsap.to(handsRef.current, { y: 0, duration: 0.4, ease: 'power3.inOut' });
      gsap.to(eyesRef.current, { scaleY: 1, scaleX: 1, y: 0, x: 0, transformOrigin: '50% 50%', duration: 0.2 });
      gsap.to(antennaLightRef.current, { fill: '#10B981', duration: 0.3 });
    },
    playError: () => {
      isBusyRef.current = true;
      gsap.to(antennaLightRef.current, { fill: '#EF4444', duration: 0.2 });

      gsap.to(robotRef.current, {
        x: 10, duration: 0.05, ease: 'none', yoyo: true, repeat: 9,
        onComplete: () => { gsap.to(robotRef.current, { x: 0, duration: 0.1 }); }
      });

      gsap.timeline()
        .to(eyesRef.current, { scaleY: 0.4, scaleX: 1.2, transformOrigin: '50% 50%', duration: 0.15 })
        .to(eyesRef.current, { scaleY: 0.4, scaleX: 1.2, duration: 0.6 })
        .to(eyesRef.current, { scaleY: 1, scaleX: 1, duration: 0.3 });

      gsap.timeline()
        .to(handsRef.current, { y: -20, rotation: -5, duration: 0.2, ease: 'power2.out' })
        .to(handsRef.current, { y: 0, rotation: 0, duration: 0.4, ease: 'bounce.out', delay: 0.3 });

      gsap.to(antennaLightRef.current, {
        fill: '#10B981', duration: 0.5, delay: 1.5,
        onComplete: () => { isBusyRef.current = false; }
      });
    },
    playSuccess: () => {
      isBusyRef.current = true;
      gsap.to(antennaLightRef.current, { fill: '#10B981', duration: 0.3 });

      gsap.timeline()
        .to(robotRef.current, { y: -30, duration: 0.3, ease: 'power2.out' })
        .to(robotRef.current, { y: -15, duration: 0.4, ease: 'bounce.out' });

      gsap.timeline()
        .to(eyesRef.current, { scaleY: 1.3, scaleX: 1.1, transformOrigin: '50% 50%', duration: 0.2 })
        .to(eyesRef.current, { scaleY: 1.3, scaleX: 1.1, duration: 0.5 })
        .to(eyesRef.current, { scaleY: 1, scaleX: 1, duration: 0.3 });

      gsap.timeline()
        .to(handsRef.current, { y: -60, rotation: 0, duration: 0.3, ease: 'back.out(2)' })
        .to(handsRef.current, { y: -55, duration: 0.15, yoyo: true, repeat: 3 })
        .to(handsRef.current, { y: 0, duration: 0.5, ease: 'power3.inOut', delay: 0.3 });

      gsap.timeline()
        .to(robotRef.current, { rotation: -8, duration: 0.2, ease: 'power1.out' })
        .to(robotRef.current, { rotation: 8, duration: 0.2, ease: 'power1.inOut' })
        .to(robotRef.current, { rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
    },
    // ── NUEVA ANIMACIÓN DE SALIDA ──
    playDespedida: () => {
      return new Promise<void>((resolve) => {
        isBusyRef.current = true;
        const tl = gsap.timeline({ onComplete: resolve });
        
        tl.to(robotRef.current, { y: 20, scaleY: 0.6, scaleX: 1.3, duration: 0.3, ease: "power2.out" })
          .to(eyesRef.current, { scaleY: 0.2, scaleX: 1.5, duration: 0.1 }, "<") 
          .to(antennaLightRef.current, { fill: '#EF4444', duration: 0.1 }, "<") 
          .to(robotRef.current, { y: -1000, scaleY: 1.5, scaleX: 0.5, duration: 0.6, ease: "back.in(1.5)" })
          .to('.robot-shadow', { opacity: 0, scale: 0, duration: 0.3 }, "-=0.5");
      });
    }
  }));

  return (
    <div className="absolute -top-27.5 md:-top-36 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="robot-shadow absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-md" />
      <svg ref={robotRef} viewBox="0 0 128 128" className="w-40 h-40 md:w-52 md:h-52 drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <line x1="64" y1="36" x2="64" y2="12" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
        <circle ref={antennaLightRef} cx="64" cy="12" r="6" fill="#10B981" />
        <circle cx="64" cy="12" r="12" fill="url(#antennaGlow)" opacity="0.4" />
        <rect x="24" y="36" width="80" height="64" rx="16" fill="url(#bodyGradient)" />
        <rect x="34" y="88" width="60" height="12" rx="4" fill="#B45309" />
        <rect x="34" y="48" width="60" height="34" rx="8" fill="#0F172A" />
        <g ref={eyesRef}>
          <circle cx="48" cy="65" r="7" fill="#38BDF8" />
          <circle cx="46" cy="63" r="2" fill="#FFFFFF" opacity="0.9" />
          <circle cx="80" cy="65" r="7" fill="#38BDF8" />
          <circle cx="78" cy="63" r="2" fill="#FFFFFF" opacity="0.9" />
        </g>
        <g ref={handsRef}>
          <path d="M 20 100 Q 20 85 36 85 L 50 85 Q 56 85 56 95 L 56 120 L 20 120 Z" fill="#FCD34D" />
          <path d="M 108 100 Q 108 85 92 85 L 78 85 Q 72 85 72 95 L 72 120 L 108 120 Z" fill="#FCD34D" />
        </g>
      </svg>
    </div>
  );
});

InteractiveRobot.displayName = 'InteractiveRobot';
export default InteractiveRobot;