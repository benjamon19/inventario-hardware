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
  const leftHandRef = useRef<SVGGElement>(null);
  const rightHandRef = useRef<SVGGElement>(null);
  const antennaGroupRef = useRef<SVGGElement>(null);
  const antennaLightRef = useRef<SVGCircleElement>(null);
  const screenRef = useRef<SVGRectElement>(null);
  const heartRef = useRef<SVGPathElement>(null);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBusyRef = useRef(false);
  const hasGreetedRef = useRef(false);
  const isSuccessRef = useRef(false);
  const isMountedRef = useRef(true);

  const [speech, setSpeech] = useState('');
  const [showSpeech, setShowSpeech] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', check);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const frasesWall = [
    "¿MUCHO INVENTARIO? DÉJAMELO A MÍ.",
    "SISTEMA EN LÍNEA. ESPERANDO CREDENCIALES...",
    "101010... DIGO, ¡HOLA! BIENVENIDO.",
    "BIP BOP. REVISANDO LA BODEGA.",
    "¿SABÍAS QUE LOS ROBOTS NO DORMIMOS? SOLO ENTRAMOS EN MODO DE AHORRO.",
    "SI OLVIDASTE TU CLAVE, NO ME MIRES A MÍ, YO SOLO SOY EL GUARDIÁN.",
    "ESTOY ESCANEANDO TU DETERMINACIÓN... ¡ES MUY ALTA!",
    "BIP... ESTE SISTEMA ES MÁS SEGURO QUE UNA CAJA FUERTE DE TITANIO.",
    "¿TRAJISTE CAFÉ? PARA TI, CLARO. YO SOLO NECESITO ELECTRONES.",
    "PROCESANDO... ESPERANDO... ANALIZANDO LAS NUBES.",
    "¿HAS PROBADO A APAGAR Y VOLVER A ENCENDER? NO, AQUÍ NO HACE FALTA.",
    "MI BASE DE DATOS DICE QUE HOY SERÁ UN GRAN DÍA PARA EL STOCK.",
    "NO SOY WALL-E, PERO ME GUSTA EL ORDEN.",
    "ERRORES DE CAPA 8 DETECTADOS... BROMA, TODO BIEN.",
    "CUIDADO con los cables, a veces muerden (solo un poco).",
    "¿QUIERES QUE TE CUENTE UN CHISTE? MEJOR INGRESA TUS DATOS.",
    "MI ANTENA ESTÁ CAPTANDO BUENAS VIBRAS TECNOLÓGICAS.",
    "ACTUALIZANDO PROTOCOLO DE AMISTAD... COMPLETADO.",
    "SI VES QUE PARPADEO MUCHO ES QUE ESTOY PENSANDO MUY RÁPIDO.",
    "REVISANDO... REVISANDO... SÍ, DEFINITIVAMENTE ERES TÚ.",
    "¡BIP! ESTO ESTÁ MÁS LIMPIO QUE MI PROCESADOR.",
    "¿ESTÁS LISTO PARA GESTIONAR EL FUTURO?",
    "ESPERANDO... ¿ALGUIEN DIJO ACTUALIZACIÓN?",
    "MI LÓGICA INDICA QUE DEBERÍAS ESCRIBIR ALGO AQUÍ.",
    "CONECTADO AL SATÉLITE DE LA FELICIDAD... RECIBIENDO SEÑAL.",
    "ANALIZANDO COMPONENTES... TODO PARECE ESTAR EN SU LUGAR.",
    "¿DÓNDE DEJÉ MI ACEITE MULTIUSOS?",
    "MANTENIENDO EL EQUILIBRIO EN EL CIBERESPACIO.",
    "HOLA HUMANO. TU PULSO ES ESTABLE, ESO ES BUENO.",
    "EL INVENTARIO ES MI PASIÓN, DESPUÉS DE LAS RESISTENCIAS ELÉCTRICAS.",
    "EJECUTANDO MODO PACIENCIA INFINITA... CARGANDO...",
    "¿ALGUIEN TIENE UN TORNILLO DE SOBRA? ES PARA UN AMIGO.",
    "BIP... ¿YA TE DIJE QUE ME GUSTA TU FONDO DE PANTALLA?",
    "MI SISTEMA OPERATIVO ESTÁ MUY CONTENTO DE VERTE.",
    "OPTIMIZANDO... NADA QUE OPTIMIZAR, SOY PERFECTO.",
    "REVISANDO EL NIVEL DE ENTUSIASMO... ¡POR LAS NUBES!",
    "SI SIENTES QUE TE OBSERVO, ES PORQUE ESTOY DISEÑADO PARA ELLO.",
    "PROCESANDO DATOS... ANALIZANDO LA EXISTENCIA... BIP.",
    "¿ME DAS UN POCO DE WIFI? TENGO HAMBRE DE DATOS.",
    "MI PROCESADOR DICE QUE ERES GENIAL.",
    "ESTOY CONTANDO OVEJAS ELÉCTRICAS... 1, 2, 3...",
    "¡ALERTA DE ESTILO! ESE LOGIN SE VA A VER MUY BIEN.",
    "MIS SENSORES DICEN QUE TE MERECES UN DESCANSO (LUEGO DE LOGUEARTE).",
    "¿SABES QUÉ DICE UN BIT A OTRO BIT? ¡NOS VEMOS EN EL BUS!",
    "BIP... TRADUCIENDO SENTIMIENTOS... CARIÑO DETECTADO.",
    "TENGO 1.21 GIGAWATTS DE GANAS DE AYUDARTE.",
    "¿Y SI ME COMPRAS UN DISCO DURO NUEVO? ES BROMA, CON ESTE VOY SOBRADO.",
    "HACIENDO UN BACKUP DE MIS CHISTES MALOS...",
    "¡BIP! DETECTO UNA CONEXIÓN ESPECIAL... ES EL INTERNET.",
    "SISTEMA DE SEGURIDAD ACTIVADO: EL AMOR ES LA CLAVE.",
    "SI VES QUE GIRO ES QUE ESTOY DESFRAGMENTANDO MIS EMOCIONES.",
    "MI BATERÍA ESTÁ AL 100% DE FELICIDAD.",
    "¿ALGUIEN HA VISTO MI DESTORNILLADOR SÓNICO?",
    "ESPERANDO... MI RELOJ INTERNO DICE QUE YA CASI ENTRAS.",
    "ANALIZANDO EL CLIMA... 100% PROBABILIDAD DE EXCELENTE GESTIÓN.",
    "¿QUIERES QUE TE CANTE? MEJOR NO, MI VOZ ES UN POCO METÁLICA.",
    "ESTOY EN MODO ALTA EFICIENCIA, ¡VAMOS!",
    "¿SABÍAS QUE LOS ROBOTS NO TENEMOS OMBLIGO? QUÉ RARO, ¿NO?",
    "ESTOY ESCANEANDO TU SONRISA... ¡VAYA, ES CONTAGIOSA!",
    "BIP BOP... MI CORAZÓN DE SILICIO LATE POR EL ORDEN.",
    "SISTEMA LISTO. SUEÑOS CARGADOS. LOGIN PENDIENTE.",
    "¡EY! NO TE OLVIDES DE LA MAYÚSCULA SI TU CLAVE LA TIENE.",
    "SINTONIZANDO LA RADIO GALÁCTICA... SOLO PASAN RUIDO BLANCO.",
    "¿ME VES BIEN? HE PULIDO MIS SENSORES ESTA MAÑANA.",
    "SI EL LOGIN TARDA, ES QUE ESTOY REVISANDO MIS CIRCUITOS.",
    "BIP... ESTO ESTÁ MÁS LIMPIO QUE MI PROCESADOR.",
    "OPTIMIZANDO... CARGANDO... ANALIZANDO LAS ESTRELLAS.",
    "¡MIRA! UN PÍXEL MUERTO... AH NO, ERA UNA MOTA DE POLVO.",
    "¿TIENES ALGÚN TRUCO PARA EL ESTRÉS? YO SOLO HAGO UN HARD RESET.",
    "BIP... ¿SABÍAS QUE EL 0 ES MI NÚMERO FAVORITO? DESPUÉS DEL 1.",
    "MI LÓGICA NO ENCUENTRA FALLAS EN TU ESTILO.",
    "ESTOY CONTANDO CUÁNTAS VECES PARPADEAS. VAN 47.",
    "¡VIVA EL CÓDIGO LIMPIO! Y LAS BATERÍAS CARGADAS.",
    "SI ME QUEDO QUIETO ES QUE ESTOY DESCARGANDO MEMES.",
    "BIP BOP... ¿DÓNDE DEJÉ MI CABLE DE CARGA?",
    "HOLA. SOY WALL. TU ASISTENTE FAVORITO (ESPERO).",
    "REVISANDO EL NIVEL de stock de paciencia... ¡Está lleno!",
    "¿TE GUSTAN MIS OJOS? SON DE CRISTAL DE ZAFIRO (O PLÁSTICO AZUL).",
    "BIP... MI CIRCUITO DE LA FELICIDAD SE HA ACTIVADO.",
    "ESTOY ESCANEANDO TU FUTURO... ¡VEO MUCHOS ÉXITOS!",
    "¿SABÍAS QUE PUEDO CALCULAR PI HASTA EL MILLÓN? PERO ME ABURRO.",
    "CONEXIÓN ESTABLE. HUMANO DETECTADO. PROCEDER CON AMABILIDAD.",
    "¡EY! TU CONTRASEÑA ES SECRETA, NO TE PREOCUPES, YO NO MIRO.",
    "BIP... ¿ALGUIEN DIJO 'VACACIONES EN LA NUBE'?",
    "ACTUALIZANDO PROTOCOLO DE ENTUSIASMO AL 200%.",
    "MIS SENSORES INDICAN QUE ERES UN EXPERTO EN ESTO.",
    "BIP BOP. QUE NADA TE DETENGA HOY.",
    "¿SABES QUÉ ES LO MEJOR DE SER UN ROBOT? ¡NO TENGO QUE PEINARME!",
    "ESTOY PREPARANDO UNA SORPRESA... PERO ES SORPRESA.",
    "BIP... ANALIZANDO TU VELOCIDAD DE ESCRITURA... ¡IMPONENTE!",
    "MI PROCESADOR SE CALIENTA CUANDO ESTÁS CERCA... ¡DE PURA EMOCIÓN!",
    "¿Y SI MONTAMOS UN NEGOCIO DE TORNILLOS?",
    "BIP... SOY EL REY DEL INVENTARIO, PERO TÚ ERES EL JEFE.",
    "SISTEMA EN PAUSA DINÁMICA... ESPERANDO TU SEÑAL.",
    "¡BIP! HE DETECTADO UN ERROR... AH NO, ERA MI PROPIA SOMBRA.",
    "ESTOY PENSANDO EN COMPRARME UNA ANTENA NUEVA, ¿QUÉ OPINAS?",
    "MIS CIRCUITOS DICEN QUE HOY VAS A LOGRARLO TODO.",
    "BIP... NO OLVIDES HIDRATARTE, LOS HUMANOS LO NECESITAN.",
    "ESTOY ESCANEANDO EL AMBIENTE... TODO PARECE PERFECTO.",
    "¿SABÍAS QUE LOS ROBOTS TAMBIÉN TENEMOS COSQUILLAS? EN LA CPU.",
    "BIP BOP. EL FUTURO ES AHORA, Y TÚ ESTÁS EN ÉL."
  ];

  const stopSpeaking = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setShowSpeech(false);
  };

  const speak = (text: string, persist = false) => {
    if (!isMountedRef.current) return;
    stopSpeaking();
    typingTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setShowSpeech(true);
      let i = 0;
      const typeChar = () => {
        if (!isMountedRef.current) return;
        if (i < text.length) {
          setSpeech(text.substring(0, i + 1));
          i++;
          typingTimeoutRef.current = setTimeout(typeChar, 45);
        } else if (!persist) {
          typingTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setShowSpeech(false);
          }, 4500);
        }
      };
      typeChar();
    }, 80);
  };

  const idleAnimations = [
    // 0: Hablar y balanceo
    () => {
      const phrase = frasesWall[Math.floor(Math.random() * frasesWall.length)];
      speak(phrase);
      gsap.timeline()
        .to(bodyWrapperRef.current, { rotation: -3, duration: 1, ease: 'sine.inOut' })
        .to(bodyWrapperRef.current, { rotation: 3, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: 1 })
        .to(bodyWrapperRef.current, { rotation: 0, duration: 1, ease: 'sine.inOut' });
      gsap.to(antennaLightRef.current, { fill: '#38BDF8', duration: 0.1, repeat: phrase.length, yoyo: true });
    },
    // 1: Escaneo rápido
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(eyesRef.current, { x: -10, duration: 0.5, ease: 'power2.inOut' })
        .to(eyesRef.current, { x: 10, duration: 1, ease: 'power2.inOut' })
        .to(eyesRef.current, { x: 0, duration: 0.5, ease: 'power2.inOut' })
        .to(antennaLightRef.current, { fill: '#FBBF24', duration: 0.2, repeat: 3, yoyo: true }, 0);
    },
    // 2: Malabares / Movimiento de manos
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(leftHandRef.current, { y: -30, x: 5, rotation: 20, duration: 0.4, yoyo: true, repeat: 3 })
        .to(rightHandRef.current, { y: -30, x: -5, rotation: -20, duration: 0.4, yoyo: true, repeat: 3 }, 0.2)
        .to(antennaLightRef.current, { fill: '#A855F7', duration: 0.3, repeat: 4, yoyo: true }, 0);
    },
    // 3: Siesta corta
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(eyesRef.current, { scaleY: 0, transformOrigin: '50% 50%', duration: 1.5, ease: 'power1.inOut' })
        .to(bodyWrapperRef.current, { y: 10, duration: 2, ease: 'sine.inOut' }, 0)
        .to('.robot-shadow-svg', { scale: 1.1, opacity: 0.4, duration: 2, ease: 'sine.inOut' }, 0)
        .to(bodyWrapperRef.current, { y: 0, duration: 1.5, ease: 'sine.inOut', delay: 1 })
        .to('.robot-shadow-svg', { scale: 1, opacity: 0.3, duration: 1.5, ease: 'sine.inOut' }, '>-1.5')
        .to(eyesRef.current, { scaleY: 1, duration: 0.5, ease: 'back.out(2)' });
    },
    // 4: Curiosidad
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(bodyWrapperRef.current, { scale: 1.1, y: -10, duration: 0.8, ease: 'back.out(1.5)' })
        .to('.robot-shadow-svg', { scale: 0.85, opacity: 0.15, duration: 0.8 }, 0)
        .to(eyesRef.current, { scale: 1.2, duration: 0.5 }, 0.3)
        .to([bodyWrapperRef.current, eyesRef.current], { scale: 1, y: 0, duration: 0.8, ease: 'power2.inOut', delay: 1 })
        .to('.robot-shadow-svg', { scale: 1, opacity: 0.3, duration: 0.8, delay: 1 }, '>-1.6');
    },
    // 5: Limpieza de manos
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(leftHandRef.current, { x: 15, rotation: 10, duration: 0.3 })
        .to(rightHandRef.current, { x: -15, rotation: -10, duration: 0.3 }, 0)
        .to([leftHandRef.current, rightHandRef.current], { x: 0, rotation: 0, duration: 0.3, repeat: 4, yoyo: true });
    },
    // 6: Error momentáneo (glitch)
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(antennaLightRef.current, { fill: '#EF4444', duration: 0.05, repeat: 15, yoyo: true }, 0)
        .to(bodyWrapperRef.current, { x: 'random(-8, 8)', y: 'random(-8, 8)', rotation: 'random(-10, 10)', duration: 0.05, repeat: 20, yoyo: true }, 0)
        .to(eyesRef.current, { scaleY: 'random(0.1, 1.8)', scaleX: 'random(0.5, 1.5)', duration: 0.1, repeat: 10, yoyo: true }, 0)
        .to([bodyWrapperRef.current, eyesRef.current], { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: 0.1 })
        .to(eyesRef.current, { rotation: 180, duration: 0.5, ease: 'power2.out' })
        .to(eyesRef.current, { rotation: 0, duration: 0.5, ease: 'back.out(2)', delay: 0.5 })
        .to(antennaLightRef.current, { fill: '#10B981', duration: 0.2 });
    },
    // 7: ¡Baile loco!
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(bodyWrapperRef.current, { y: -15, repeat: 5, yoyo: true, duration: 0.2, ease: 'sine.inOut' })
        .to(leftHandRef.current, { rotation: -120, duration: 0.3 }, 0)
        .to(rightHandRef.current, { rotation: 120, duration: 0.3 }, 0)
        .to(antennaLightRef.current, { fill: '#F472B6', duration: 0.1, repeat: 10, yoyo: true }, 0)
        .to([leftHandRef.current, rightHandRef.current], { y: -20, repeat: 5, yoyo: true, duration: 0.2 }, 0)
        .to([leftHandRef.current, rightHandRef.current, bodyWrapperRef.current], { rotation: 0, y: 0, duration: 0.5, ease: 'back.out' });
    },
    // 8: Pensando intensamente
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(eyesRef.current, { rotation: 360, repeat: 3, duration: 0.5, ease: 'linear' })
        .to(antennaLightRef.current, { fill: '#6366F1', duration: 0.2, repeat: 6, yoyo: true }, 0)
        .to(bodyWrapperRef.current, { scale: 0.9, duration: 1, yoyo: true, repeat: 1 }, 0)
        .set(eyesRef.current, { rotation: 0 });
    },
    // 9: Hipnosis
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(eyesRef.current, { scale: 1.5, duration: 1.5, ease: 'sine.inOut' })
        .to(eyesRef.current, { rotation: 720, duration: 2, ease: 'power1.inOut' }, 0)
        .to(antennaLightRef.current, { fill: '#10B981', scale: 2, duration: 0.5, repeat: 4, yoyo: true }, 0)
        .to(eyesRef.current, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out' });
    },
    // 10: Salto de alegría
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(bodyWrapperRef.current, { y: -40, duration: 0.4, ease: 'power2.out' })
        .to('.robot-shadow-svg', { scale: 0.5, opacity: 0.1, duration: 0.4 }, 0)
        .to(bodyWrapperRef.current, { rotation: 360, duration: 0.6, ease: 'none' }, 0)
        .to(bodyWrapperRef.current, { y: 0, duration: 0.5, ease: 'bounce.out' })
        .to('.robot-shadow-svg', { scale: 1, opacity: 0.3, duration: 0.5, ease: 'bounce.out' }, '>-0.5')
        .set(bodyWrapperRef.current, { rotation: 0 });
    },
    // 11: Modo Tímido
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to([leftHandRef.current, rightHandRef.current], { x: (i: number) => i === 0 ? 10 : -10, y: -10, duration: 0.5 })
        .to(bodyWrapperRef.current, { rotation: -5, duration: 0.5 }, 0)
        .to(eyesRef.current, { scaleX: 0.8, duration: 0.5 }, 0)
        .to([leftHandRef.current, rightHandRef.current, bodyWrapperRef.current, eyesRef.current], { x: 0, y: 0, rotation: 0, scaleX: 1, duration: 0.5, delay: 1.5 });
    },
    // 12: Limpieza de pantalla (ojos)
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(leftHandRef.current, { x: 30, y: -40, rotation: -90, duration: 0.6, ease: 'power2.out' })
        .to(leftHandRef.current, { x: 10, duration: 0.4, yoyo: true, repeat: 3, ease: 'sine.inOut' })
        .to(screenRef.current, { opacity: 0.8, duration: 0.2, repeat: 3, yoyo: true }, 0.6)
        .to(leftHandRef.current, { x: 0, y: 0, rotation: 0, duration: 0.5, ease: 'back.out' });
    },
    // 13: Mirando hacia abajo (al login)
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(eyesRef.current, { y: 15, scaleY: 0.8, duration: 0.8, ease: 'power2.inOut' })
        .to(bodyWrapperRef.current, { rotationX: 20, duration: 0.8, ease: 'power2.inOut' }, 0)
        .to(eyesRef.current, { x: -10, duration: 0.5, delay: 0.5 })
        .to(eyesRef.current, { x: 10, duration: 1, yoyo: true, repeat: 1 })
        .to([eyesRef.current, bodyWrapperRef.current], { x: 0, y: 0, scaleY: 1, rotationX: 0, duration: 0.8, ease: 'back.out' });
    },
    // 14: Vibración de antena (Interferencia)
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(antennaGroupRef.current, { x: 'random(-5, 5)', y: 'random(-5, 5)', duration: 0.05, repeat: 20, yoyo: true })
        .to(antennaLightRef.current, { fill: () => `hsl(${Math.random() * 360}, 70%, 50%)`, duration: 0.1, repeat: 10, yoyo: true }, 0)
        .to(bodyWrapperRef.current, { rotation: 'random(-5, 5)', duration: 0.1, repeat: 10, yoyo: true }, 0)
        .to([antennaGroupRef.current, bodyWrapperRef.current], { x: 0, y: 0, rotation: 0, fill: '#10B981', duration: 0.3 });
    },
    // 15: Telescopic Eyes (Pop out)
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(eyesRef.current, { scale: 1.4, duration: 0.4, ease: 'back.out(2)' })
        .to(eyesRef.current, { x: -5, duration: 0.3, yoyo: true, repeat: 3 })
        .to(eyesRef.current, { scale: 1, duration: 0.5, ease: 'power2.inOut' });
    },
    // 16: Happy Hover (Spin)
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(bodyWrapperRef.current, { y: -20, duration: 0.5, ease: 'power2.out' })
        .to(bodyWrapperRef.current, { rotationY: 720, duration: 1, ease: 'power1.inOut' }, 0)
        .to('.robot-shadow-svg', { scale: 0.7, opacity: 0.1, duration: 0.5 }, 0)
        .to(bodyWrapperRef.current, { y: 0, duration: 0.5, ease: 'bounce.out' })
        .to('.robot-shadow-svg', { scale: 1, opacity: 0.3, duration: 0.5 }, '>-0.5');
    },
    // 17: Corazón de Amor
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(heartRef.current, { opacity: 1, scale: 1, y: -20, duration: 0.5, ease: 'back.out' })
        .to(heartRef.current, { scale: 1.2, repeat: 3, yoyo: true, duration: 0.3 })
        .to(antennaLightRef.current, { fill: '#F43F5E', duration: 0.3 }, 0)
        .to(heartRef.current, { opacity: 0, scale: 0, y: -40, duration: 0.5, ease: 'power2.in', delay: 0.5 })
        .to(antennaLightRef.current, { fill: '#10B981', duration: 0.3 }, '>-0.3');
    },
    // 18: Checking Antenna
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(rightHandRef.current, { x: -30, y: -80, rotation: -40, duration: 0.6, ease: 'back.out' })
        .to(antennaGroupRef.current, { x: 5, duration: 0.1, yoyo: true, repeat: 5 }, 0.6)
        .to(rightHandRef.current, { x: 0, y: 0, rotation: 0, duration: 0.5, ease: 'power2.in' });
    },
    // 19: Sneezing
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(bodyWrapperRef.current, { y: -10, rotationX: -20, duration: 1, ease: 'power2.in' })
        .to(eyesRef.current, { scaleY: 0.1, duration: 0.1 }, 0.9)
        .to(bodyWrapperRef.current, { y: 20, rotationX: 40, duration: 0.1, ease: 'none' })
        .to(antennaLightRef.current, { fill: '#FFF', scale: 1.5, duration: 0.05, yoyo: true, repeat: 1 })
        .to(bodyWrapperRef.current, { y: 0, rotationX: 0, duration: 0.8, ease: 'back.out(2)' })
        .to(eyesRef.current, { scaleY: 1, duration: 0.2 });
    },
    // 20: Stretching
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(bodyWrapperRef.current, { scaleY: 1.2, y: -10, duration: 0.8, ease: 'power2.inOut' })
        .to([leftHandRef.current, rightHandRef.current], { y: -50, duration: 0.8, ease: 'power2.inOut' }, 0)
        .to([bodyWrapperRef.current, leftHandRef.current, rightHandRef.current], { scaleY: 1, y: 0, duration: 1, ease: 'sine.inOut', delay: 0.5 });
    },
    // 21: Wave Hello
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(rightHandRef.current, { x: -20, y: -60, rotation: 45, duration: 0.5, ease: 'back.out' })
        .to(rightHandRef.current, { rotation: 15, duration: 0.2, repeat: 5, yoyo: true })
        .to(rightHandRef.current, { x: 0, y: 0, rotation: 0, duration: 0.5, ease: 'power2.in' });
    },
    // 22: Sad Mode
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(bodyWrapperRef.current, { rotation: 15, y: 10, duration: 1.5, ease: 'sine.inOut' })
        .to(antennaLightRef.current, { fill: '#94A3B8', duration: 1 }, 0)
        .to(eyesRef.current, { scaleY: 0.6, duration: 1 }, 0)
        .to([bodyWrapperRef.current, antennaLightRef.current, eyesRef.current], { rotation: 0, y: 0, fill: '#10B981', scaleY: 1, duration: 1, delay: 2 });
    },
    // 23: Angry Mode
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(antennaLightRef.current, { fill: '#EF4444', duration: 0.2 })
        .to(eyesRef.current, { scaleY: 0.3, y: 5, duration: 0.2 }, 0)
        .to(bodyWrapperRef.current, { x: 'random(-3, 3)', repeat: 10, duration: 0.05 })
        .to([antennaLightRef.current, eyesRef.current, bodyWrapperRef.current], { fill: '#10B981', scaleY: 1, y: 0, x: 0, duration: 0.5, delay: 0.5 });
    },
    // 24: Rocket Hover
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(bodyWrapperRef.current, { y: -50, duration: 0.8, ease: 'power2.in' })
        .to('.robot-shadow-svg', { scale: 0.4, opacity: 0.05, duration: 0.8 }, 0)
        .to(antennaLightRef.current, { fill: '#F59E0B', scale: 1.3, duration: 0.2, repeat: 4, yoyo: true }, 0.2)
        .to(bodyWrapperRef.current, { y: 0, duration: 1.5, ease: 'bounce.out' })
        .to('.robot-shadow-svg', { scale: 1, opacity: 0.3, duration: 1.5, ease: 'bounce.out' }, '>-1.5');
    },
    // 25: Surprise!
    () => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      const tl = gsap.timeline({ onComplete: () => { isBusyRef.current = false; } });
      tl.to(eyesRef.current, { scale: 1.8, duration: 0.2, ease: 'power4.out' })
        .to(antennaGroupRef.current, { y: -20, duration: 0.2, ease: 'back.out(4)' }, 0)
        .to(antennaLightRef.current, { fill: '#FDE047', duration: 0.1 }, 0)
        .to([eyesRef.current, antennaGroupRef.current, antennaLightRef.current], { scale: 1, y: 0, fill: '#10B981', duration: 0.8, ease: 'elastic.out(1, 0.3)', delay: 1 });
    }
  ];

  const lastAnimIndex = useRef<number>(-1);
  const scheduleIdle = () => {
    if (!isMountedRef.current) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    // Spontaneity: Delay varies significantly between 2 and 12 seconds
    const delay = 2000 + Math.random() * 10000;
    idleTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current || isSuccessRef.current) return;
      
      if (!isBusyRef.current) {
        let index;
        do {
          index = Math.floor(Math.random() * idleAnimations.length);
        } while (index === lastAnimIndex.current);
        lastAnimIndex.current = index;
        
        // Randomly decide to speak before or during animation
        const shouldSpeak = Math.random() > 0.4;
        if (shouldSpeak && isMountedRef.current) {
          const phrase = frasesWall[Math.floor(Math.random() * frasesWall.length)];
          speak(phrase);
        }
        
        if (isMountedRef.current) {
          idleAnimations[index]();
        }
      }
      scheduleIdle();
    }, delay);
  };

  useEffect(() => {
    const initialGreetingTimer = setTimeout(() => {
      if (isMountedRef.current && !hasGreetedRef.current && !isBusyRef.current) {
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
      isMountedRef.current = false;
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

    gsap.from('.robot-shadow-svg', { scale: 0, opacity: 0, duration: 1.5, ease: 'elastic.out(0.8, 0.4)' });
    gsap.to('.robot-shadow-svg', {
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
        .to('.robot-shadow-svg', { scale: 0.6, opacity: 0.1, duration: 0.3 }, 0)
        .to(bodyWrapperRef.current, { y: 0, duration: 0.4, ease: 'bounce.out' })
        .to('.robot-shadow-svg', { scale: 1, opacity: 0.3, duration: 0.4, ease: 'bounce.out' }, '>-0.4');
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
          .to('.robot-shadow-svg', { opacity: 0, scale: 0, duration: 0.3 }, '-=0.5');
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

      {/* Sombra proyectada integrada en el SVG */}
      <svg ref={robotRef} viewBox="0 0 128 150" className="w-32 md:w-38 max-[390px]:w-28 drop-shadow-[0_20px_30px_rgba(0,0,0,0.12)] overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="bodyHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Sombra del robot */}
        <ellipse className="robot-shadow-svg" cx="64" cy="130" rx="30" ry="6" fill="url(#shadowGradient)" />

        <g ref={bodyWrapperRef} style={{ transformOrigin: '64px 100px' }}>
          {/* Antena Agrupada */}
          <g ref={antennaGroupRef}>
            <line x1="64" y1="36" x2="64" y2="12" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
            <circle ref={antennaLightRef} cx="64" cy="12" r="6" fill="#10B981" className="animate-pulse" />
            <circle cx="64" cy="12" r="14" fill="url(#antennaGlow)" opacity="0.6" pointerEvents="none" />
          </g>
          
          {/* Cuerpo */}
          <rect x="24" y="36" width="80" height="64" rx="16" fill="url(#bodyGradient)" />
          <rect x="24" y="36" width="80" height="64" rx="16" fill="url(#bodyHighlight)" />
          <rect x="30" y="42" width="68" height="2" rx="1" fill="#ffffff" opacity="0.3" /> 
          
          {/* Oruga / Base */}
          <rect x="34" y="88" width="60" height="12" rx="4" fill="#92400E" />
          <rect x="38" y="90" width="52" height="2" rx="1" fill="#000000" opacity="0.2" />
          
          {/* Pantalla */}
          <rect ref={screenRef} x="34" y="48" width="60" height="34" rx="8" fill="url(#screenGradient)" stroke="#B45309" strokeWidth="1" />
          <rect x="38" y="52" width="52" height="1" rx="0.5" fill="#ffffff" opacity="0.1" /> 
          
          {/* Detalles de "scanline" en pantalla */}
          <g opacity="0.05">
            <line x1="34" y1="55" x2="94" y2="55" stroke="#fff" strokeWidth="0.5" />
            <line x1="34" y1="60" x2="94" y2="60" stroke="#fff" strokeWidth="0.5" />
            <line x1="34" y1="65" x2="94" y2="65" stroke="#fff" strokeWidth="0.5" />
            <line x1="34" y1="70" x2="94" y2="70" stroke="#fff" strokeWidth="0.5" />
            <line x1="34" y1="75" x2="94" y2="75" stroke="#fff" strokeWidth="0.5" />
          </g>

          <g ref={eyesRef}>
            {/* Ojos con brillo tipo cristal */}
            <circle cx="48" cy="65" r="7" fill="#38BDF8" filter="url(#innerGlow)" />
            <circle cx="46" cy="62" r="2.5" fill="#FFFFFF" opacity="0.9" />
            <circle cx="50" cy="68" r="1.5" fill="#FFFFFF" opacity="0.3" />
            
            <circle cx="80" cy="65" r="7" fill="#38BDF8" filter="url(#innerGlow)" />
            <circle cx="78" cy="62" r="2.5" fill="#FFFFFF" opacity="0.9" />
            <circle cx="82" cy="68" r="1.5" fill="#FFFFFF" opacity="0.3" />
          </g>

          {/* Corazón para animación (oculto por defecto) */}
          <path ref={heartRef} d="M 64 65 C 64 60 54 60 54 68 C 54 75 64 82 64 82 C 64 82 74 75 74 68 C 74 60 64 60 64 65" fill="#F43F5E" opacity="0" transform="scale(0)" style={{ transformOrigin: '64px 70px' }} />
          
          <g ref={handsRef}>
            {/* Manos unificadas con el estilo del cuerpo */}
            <g ref={leftHandRef} style={{ transformOrigin: '38px 100px' }}>
              <path d="M 20 100 Q 20 85 36 85 L 50 85 Q 56 85 56 95 L 56 112 Q 56 120 48 120 L 28 120 Q 20 120 20 112 Z" fill="url(#bodyGradient)" />
              <path d="M 20 100 Q 20 85 36 85 L 50 85 Q 56 85 56 95 L 56 112 Q 56 120 48 120 L 28 120 Q 20 120 20 112 Z" fill="url(#bodyHighlight)" opacity="0.6" pointerEvents="none" />
            </g>
            <g ref={rightHandRef} style={{ transformOrigin: '90px 100px' }}>
              <path d="M 108 100 Q 108 85 92 85 L 78 85 Q 72 85 72 95 L 72 112 Q 72 120 80 120 L 100 120 Q 108 120 108 112 Z" fill="url(#bodyGradient)" />
              <path d="M 108 100 Q 108 85 92 85 L 78 85 Q 72 85 72 95 L 72 112 Q 72 120 80 120 L 100 120 Q 108 120 108 112 Z" fill="url(#bodyHighlight)" opacity="0.6" pointerEvents="none" />
            </g>
          </g>

          {/* Brillitos (Sparkles) decorativos */}
          <g className="animate-[pulse_3s_infinite]">
            <path d="M 110 40 L 112 42 M 111 39 L 111 43 M 109 41 L 113 41" stroke="#FBBF24" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            <path d="M 15 50 L 17 52 M 16 49 L 16 53 M 14 51 L 18 51" stroke="#38BDF8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </g>
        </g>
      </svg>
    </div>
  );
});

InteractiveRobot.displayName = 'InteractiveRobot';
export default InteractiveRobot;