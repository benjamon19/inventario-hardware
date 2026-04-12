'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
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
}

const InteractiveRobot = forwardRef<RobotHandle>((_, ref) => {
  const robotRef = useRef<SVGSVGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const handsRef = useRef<SVGGElement>(null);
  const antennaLightRef = useRef<SVGCircleElement>(null);

  useGSAP(() => {
    // Animación de flotado constante
    gsap.to(robotRef.current, {
      y: -15,
      rotationY: 2,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    gsap.to('.robot-shadow', {
      scale: 0.8,
      opacity: 0.2,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });
  });

  useImperativeHandle(ref, () => ({
    playFocusEmail: () => {
      gsap.to(eyesRef.current, { y: 6, x: -2, scaleY: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(antennaLightRef.current, { fill: '#0EA5E9', duration: 0.3 });
    },
    playBlurEmail: () => {
      gsap.to(eyesRef.current, { y: 0, x: 0, duration: 0.3 });
    },
    playFocusPassword: (isHidden: boolean) => {
      gsap.to(antennaLightRef.current, { fill: '#F59E0B', duration: 0.3 });
      if (isHidden) {
        gsap.to(handsRef.current, { y: -52, duration: 0.4, ease: 'back.out(1.5)' });
        gsap.to(eyesRef.current, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.2 });
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
      gsap.to(handsRef.current, { y: 0, duration: 0.4, ease: 'power3.inOut' });
      gsap.to(eyesRef.current, { scaleY: 1, scaleX: 1, y: 0, x: 0, transformOrigin: '50% 50%', duration: 0.2 });
      gsap.to(antennaLightRef.current, { fill: '#10B981', duration: 0.3 });
    },
    playError: () => {
      gsap.to(antennaLightRef.current, { fill: '#EF4444', opacity: 1, duration: 0.3 });
      gsap.to(robotRef.current, { x: 8, duration: 0.05, yoyo: true, repeat: 5 });
    },
    playSuccess: () => {
      gsap.to(antennaLightRef.current, { fill: '#10B981', opacity: 1, duration: 0.3 });
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