'use client';

import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
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

const MOBILE_WRAP_THRESHOLD = 28;

const InteractiveRobot = forwardRef<RobotHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<SVGSVGElement>(null);
  const bodyWrapperRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const handsRef = useRef<SVGGElement>(null);
  const leftHandRef = useRef<SVGPathElement>(null);
  const rightHandRef = useRef<SVGPathElement>(null);
  const antennaLightRef = useRef<SVGCircleElement>(null);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBusyRef = useRef(false);
  const hasGreetedRef = useRef(false);
  const isSuccessRef = useRef(false);

  const [speech, setSpeech] = useState('');
  const [showSpeech, setShowSpeech] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const frasesWall = [
    "¿MUCHO INVENTARIO? DÉJAMELO A MÍ.",
    "SISTEMA EN LÍNEA. ESPERANDO CREDENCIALES...",
    "101010... DIGO, ¡HOLA! BIENVENIDO.",
    "BIP BOP. REVISANDO LA BODEGA."
  ];

  const stopSpeaking = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setShowSpeech(false);
  };

  const speak = (text: string, persist = false) => {
    stopSpeaking();
    typingTimeoutRef.current = setTimeout(() => {
      setShowSpeech(true);
      let i = 0;
      const typeChar = () => {
        if (i < text.length) {
          setSpeech(text.substring(0, i + 1));
          i++;
          typingTimeoutRef.current = setTimeout(typeChar, 45);
        } else if (!persist) {
          typingTimeoutRef.current = setTimeout(() => {
            setShowSpeech(false);
          }, 4000);
        }
      };
      typeChar();
    }, 80);
  };

  const idleAnimations = [
    () => {
      const phrase = frasesWall[Math.floor(Math.random() * frasesWall.length)];
      speak(phrase);
      gsap.timeline()
        .to(bodyWrapperRef.current, { rotation: -3, duration: 1, ease: 'sine.inOut' })
        .to(bodyWrapperRef.current, { rotation: 3, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: 1 })
        .to(bodyWrapperRef.current, { rotation: 0, duration: 1, ease: 'sine.inOut' });
      gsap.to(antennaLightRef.current, { fill: '#38BDF8', duration: 0.1, repeat: phrase.length, yoyo: true });
    },
    () => {
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      isBusyRef.current = true;
      tl.to(antennaLightRef.current, { fill: '#EF4444', duration: 0.05, repeat: 15, yoyo: true }, 0)
        .to(bodyWrapperRef.current, { x: 'random(-8, 8)', y: 'random(-8, 8)', rotation: 'random(-10, 10)', duration: 0.05, repeat: 20, yoyo: true }, 0)
        .to(eyesRef.current, { scaleY: 'random(0.1, 1.8)', scaleX: 'random(0.5, 1.5)', duration: 0.1, repeat: 10, yoyo: true }, 0)
        .to([bodyWrapperRef.current, eyesRef.current], { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: 0.1 })
        .to(eyesRef.current, { rotation: 180, duration: 0.5, ease: 'power2.out' })
        .to(eyesRef.current, { rotation: 0, duration: 0.5, ease: 'back.out(2)', delay: 0.5 })
        .to(antennaLightRef.current, { fill: '#10B981', duration: 0.2 });
    },
    () => {
      if (isBusyRef.current) return;
      gsap.timeline()
        .to(eyesRef.current, { scaleY: 0.05, transformOrigin: '50% 50%', duration: 0.06 })
        .to(eyesRef.current, { scaleY: 1, duration: 0.06 })
        .to(eyesRef.current, { scaleY: 0.05, duration: 0.06, delay: 0.08 })
        .to(eyesRef.current, { scaleY: 1, duration: 0.06 })
        .to(bodyWrapperRef.current, { rotation: 4, duration: 0.4, ease: 'power2.inOut', delay: 0.5 })
        .to(bodyWrapperRef.current, { rotation: 0, duration: 0.4, ease: 'power2.inOut', delay: 1 });
    }
  ];

  const scheduleIdle = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    const delay = 7500 + Math.random() * 7500;
    idleTimerRef.current = setTimeout(() => {
      if (!isBusyRef.current) {
        const anim = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
        anim();
      }
      scheduleIdle();
    }, delay);
  };

  useEffect(() => {
    const initialGreetingTimer = setTimeout(() => {
      if (!hasGreetedRef.current && !isBusyRef.current) {
        hasGreetedRef.current = true;
        speak('HOLA SOY WALL. POR FAVOR INICIA SESIÓN PARA COMENZAR A ORDENAR.');
        gsap.timeline()
          .to(bodyWrapperRef.current, { rotation: -3, duration: 1.5, ease: 'sine.inOut' })
          .to(bodyWrapperRef.current, { rotation: 3, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: 1 })
          .to(bodyWrapperRef.current, { rotation: 0, duration: 1, ease: 'sine.inOut' });
      }
    }, 2250);

    scheduleIdle();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearTimeout(initialGreetingTimer);
      stopSpeaking();
    };
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(robotRef.current, {
      scale: 0, rotation: 720, y: 50, duration: 1.5, ease: 'elastic.out(0.8, 0.4)'
    })
    .to(robotRef.current, {
      y: -15, rotationY: 2, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1
    }, '-=0.2');

    gsap.from('.robot-shadow', { scale: 0, opacity: 0, duration: 1.5, ease: 'elastic.out(0.8, 0.4)' });
    gsap.to('.robot-shadow', {
      scale: 0.8, opacity: 0.2, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.3
    });
  });

  useImperativeHandle(ref, () => ({
    playFocusEmail: () => {
      if (isSuccessRef.current) return;
      stopSpeaking();
      if (window.innerWidth < 768) {
        const isTiny = window.innerWidth <= 390;
        gsap.to(containerRef.current, { y: isTiny ? 120 : 145, duration: 0.4, ease: 'power2.out' });
      }
      gsap.killTweensOf([bodyWrapperRef.current, eyesRef.current, handsRef.current, leftHandRef.current, rightHandRef.current]);
      isBusyRef.current = true;
      gsap.to([bodyWrapperRef.current, leftHandRef.current, rightHandRef.current], { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: 0.2 });
      gsap.to(eyesRef.current, { y: 6, x: -2, scaleY: 1, rotation: 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(antennaLightRef.current, { fill: '#0EA5E9', duration: 0.3 });
      gsap.to(bodyWrapperRef.current, { rotation: -3, duration: 0.2, ease: 'power1.out', yoyo: true, repeat: 1 });
    },

    playBlurEmail: () => {
      if (isSuccessRef.current) return;
      isBusyRef.current = false;
      gsap.to(containerRef.current, { y: 0, duration: 0.4, ease: 'power2.inOut' });
      gsap.to(eyesRef.current, { y: 0, x: 0, duration: 0.3 });
      gsap.to(bodyWrapperRef.current, { rotation: 0, duration: 0.3 });
    },

    playFocusPassword: (isHidden: boolean) => {
      if (isSuccessRef.current) return;
      stopSpeaking();
      if (window.innerWidth < 768) {
        const isTiny = window.innerWidth <= 390;
        gsap.to(containerRef.current, { y: isTiny ? 225 : 250, duration: 0.4, ease: 'power2.out' });
      }
      gsap.killTweensOf([bodyWrapperRef.current, eyesRef.current, leftHandRef.current, rightHandRef.current]);
      isBusyRef.current = true;
      gsap.to(antennaLightRef.current, { fill: '#F59E0B', duration: 0.3 });
      gsap.to(bodyWrapperRef.current, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: 0.2 });
      gsap.to([leftHandRef.current, rightHandRef.current], { x: 0, rotation: 0, duration: 0.2 });
      if (isHidden) {
        gsap.to([leftHandRef.current, rightHandRef.current], { y: -44, duration: 0.4, ease: 'back.out(1.5)' });
        gsap.to(eyesRef.current, { scaleY: 0.1, rotation: 0, transformOrigin: '50% 50%', duration: 0.2 });
        gsap.to(bodyWrapperRef.current, { rotation: 5, duration: 0.3, ease: 'power1.inOut', yoyo: true, repeat: 1 });
      } else {
        gsap.to([leftHandRef.current, rightHandRef.current], { y: 0, duration: 0.4 });
        gsap.to(eyesRef.current, { y: 6, x: 0, scaleY: 1, rotation: 0, transformOrigin: '50% 50%', duration: 0.3 });
      }
    },

    playTogglePasswordVisibility: (isHidden: boolean) => {
      if (isSuccessRef.current) return;
      if (isHidden) {
        gsap.to([leftHandRef.current, rightHandRef.current], { y: -44, duration: 0.4, ease: 'back.out(1.5)' });
        gsap.to(eyesRef.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.2 });
      } else {
        gsap.to([leftHandRef.current, rightHandRef.current], { y: 0, duration: 0.4, ease: 'power3.out' });
        gsap.to(eyesRef.current, { scaleY: 1, y: 6, x: 0, transformOrigin: '50% 50%', duration: 0.3 });
      }
    },

    playBlurPassword: () => {
      if (isSuccessRef.current) return;
      isBusyRef.current = false;
      gsap.to(containerRef.current, { y: 0, duration: 0.4, ease: 'power2.inOut' });
      gsap.to([leftHandRef.current, rightHandRef.current], { y: 0, x: 0, rotation: 0, duration: 0.4, ease: 'power3.inOut' });
      gsap.to(eyesRef.current, { scaleY: 1, scaleX: 1, y: 0, x: 0, rotation: 0, transformOrigin: '50% 50%', duration: 0.2 });
      gsap.to(antennaLightRef.current, { fill: '#10B981', duration: 0.3 });
    },

    playError: () => {
      stopSpeaking();
      isSuccessRef.current = false;
      gsap.to(containerRef.current, { y: 0, duration: 0.3 });
      gsap.killTweensOf([bodyWrapperRef.current, eyesRef.current, leftHandRef.current, rightHandRef.current]);
      isBusyRef.current = true;
      gsap.to(antennaLightRef.current, { fill: '#EF4444', duration: 0.2 });
      gsap.to(bodyWrapperRef.current, {
        x: 12, duration: 0.05, ease: 'none', yoyo: true, repeat: 9,
        onComplete: () => { gsap.to(bodyWrapperRef.current, { x: 0, duration: 0.1 }); }
      });
      gsap.timeline()
        .to(eyesRef.current, { scaleY: 0.4, scaleX: 1.2, transformOrigin: '50% 50%', duration: 0.15 })
        .to(eyesRef.current, { scaleY: 0.4, scaleX: 1.2, duration: 0.6 })
        .to(eyesRef.current, { scaleY: 1, scaleX: 1, duration: 0.3 });
      gsap.timeline()
        .to([leftHandRef.current, rightHandRef.current], { y: -20, rotation: -5, duration: 0.2, ease: 'power2.out' })
        .to([leftHandRef.current, rightHandRef.current], { y: 0, rotation: 0, duration: 0.4, ease: 'bounce.out', delay: 0.3 });
      gsap.to(antennaLightRef.current, {
        fill: '#10B981', duration: 0.5, delay: 1.5,
        onComplete: () => { isBusyRef.current = false; }
      });
    },

    playSuccess: () => {
      isSuccessRef.current = true;
      gsap.killTweensOf(containerRef.current);
      gsap.killTweensOf([bodyWrapperRef.current, eyesRef.current, leftHandRef.current, rightHandRef.current]);
      isBusyRef.current = true;
      speak('¡ACCESO CONCEDIDO! INICIANDO SISTEMA...', true);
      gsap.to(antennaLightRef.current, { fill: '#10B981', duration: 0.3 });
      gsap.timeline()
        .to(bodyWrapperRef.current, { y: -30, duration: 0.3, ease: 'power2.out' })
        .to(bodyWrapperRef.current, { y: 0, duration: 0.4, ease: 'bounce.out' });
      gsap.timeline()
        .to(eyesRef.current, { scaleY: 1.3, scaleX: 1.1, transformOrigin: '50% 50%', duration: 0.2 })
        .to(eyesRef.current, { scaleY: 1.3, scaleX: 1.1, duration: 0.5 })
        .to(eyesRef.current, { scaleY: 1, scaleX: 1, duration: 0.3 });
      gsap.timeline()
        .to([leftHandRef.current, rightHandRef.current], { y: -60, rotation: 0, duration: 0.3, ease: 'back.out(2)' })
        .to([leftHandRef.current, rightHandRef.current], { y: -55, duration: 0.15, yoyo: true, repeat: 3 })
        .to([leftHandRef.current, rightHandRef.current], { y: 0, duration: 0.5, ease: 'power3.inOut', delay: 0.3 });
      gsap.timeline()
        .to(bodyWrapperRef.current, { rotation: -8, duration: 0.2, ease: 'power1.out' })
        .to(bodyWrapperRef.current, { rotation: 8, duration: 0.2, ease: 'power1.inOut' })
        .to(bodyWrapperRef.current, { rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
    },

    playDespedida: () => {
      return new Promise<void>((resolve) => {
        isBusyRef.current = true;
        const tl = gsap.timeline({
          onComplete: () => {
            if (containerRef.current) containerRef.current.style.display = 'none';
            resolve();
          }
        });
        setShowSpeech(false);
        tl.to(bodyWrapperRef.current, { y: 20, scaleY: 0.6, scaleX: 1.3, duration: 0.3, ease: 'power2.out' })
          .to(eyesRef.current, { scaleY: 0.2, scaleX: 1.5, duration: 0.1 }, '<')
          .to(antennaLightRef.current, { fill: '#EF4444', duration: 0.1 }, '<')
          .to(robotRef.current, { y: -1000, scaleY: 1.5, scaleX: 0.5, duration: 0.6, ease: 'back.in(1.5)' })
          .to('.robot-shadow', { opacity: 0, scale: 0, duration: 0.3 }, '-=0.5');
      });
    }
  }));

  const isLongOnMobile = isMobile && speech.length > MOBILE_WRAP_THRESHOLD;

  return (
    <div ref={containerRef} className="absolute -top-24 md:-top-[136px] max-[390px]:-top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none transform-origin-bottom flex flex-col items-center">

      {/* BURBUJA DE TEXTO (Speech Bubble) */}
      <div
        className={`
          absolute bottom-full mb-3
          left-1/2 -translate-x-1/2
          flex items-center gap-2
          backdrop-blur-sm border border-slate-200 bg-white shadow-md
          rounded-2xl px-3 py-1.5 md:px-4 md:py-2
          transition-all duration-300 origin-bottom
          ${isLongOnMobile ? 'w-48 md:w-52 whitespace-normal text-center' : 'whitespace-nowrap'}
          ${showSpeech ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}
        `}
      >
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
        <p className="text-slate-900 font-bold text-[9px] md:text-[11px] tracking-wide leading-snug">
          {speech}<span className="text-sky-500 animate-pulse">▍</span>
        </p>
      </div>

      <div className="robot-shadow absolute -bottom-4 left-1/2 -translate-x-1/2 w-18 h-2.5 md:w-20 md:h-3 max-[390px]:w-14 max-[390px]:h-2 bg-black/20 rounded-full blur-md" />
      
      <svg ref={robotRef} viewBox="0 0 128 128" className="w-32 h-32 md:w-36 md:h-36 max-[390px]:w-28 max-[390px]:h-28 drop-shadow-2xl overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <g ref={bodyWrapperRef} style={{ transformOrigin: '64px 100px' }}>
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
            <path ref={leftHandRef} d="M 20 100 Q 20 85 36 85 L 50 85 Q 56 85 56 95 L 56 112 Q 56 120 48 120 L 28 120 Q 20 120 20 112 Z" fill="#FCD34D" style={{ transformOrigin: '38px 100px' }} />
            <path ref={rightHandRef} d="M 108 100 Q 108 85 92 85 L 78 85 Q 72 85 72 95 L 72 112 Q 72 120 80 120 L 100 120 Q 108 120 108 112 Z" fill="#FCD34D" style={{ transformOrigin: '90px 100px' }} />
          </g>
        </g>
      </svg>
    </div>
  );
});

InteractiveRobot.displayName = 'InteractiveRobot';
export default InteractiveRobot;