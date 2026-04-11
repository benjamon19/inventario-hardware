'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useScanner } from '@/hooks/useScanner';
import { Camera, XCircle, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, PlusCircle } from 'lucide-react';
import { currentTheme } from '@/config/theme';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(useGSAP);

export default function ScannerView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerBoxRef = useRef<HTMLDivElement>(null);
  
  // Estados para la lógica del negocio
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [scannedHardware, setScannedHardware] = useState<any>(null);
  const [isNewHardware, setIsNewHardware] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 1. Obtener el usuario en sesión al cargar
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 2. Lógica principal al detectar un código
  const handleScanResult = async (sku: string) => {
    setScannedCode(sku);
    
    // Animación de éxito GSAP
    gsap.fromTo(".success-badge", 
      { y: 20, autoAlpha: 0, scale: 0.9 }, 
      { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
    );

    // Detenemos la cámara para que no siga leyendo a lo loco
    stopScanner();

    // Buscamos si el equipo ya existe en la base de datos
    const { data: hardware, error } = await supabase
      .from('hardware')
      .select('*')
      .eq('sku', sku)
      .single();

    if (hardware) {
      // CASO A: El equipo existe
      console.log("Equipo encontrado:", hardware.modelo);
      setScannedHardware(hardware);
      setIsNewHardware(false);
    } else {
      // CASO B: El equipo es nuevo
      console.log("Equipo nuevo detectado. SKU:", sku);
      setScannedHardware(null);
      setIsNewHardware(true);
    }
  };

  // 3. Registrar el movimiento en la BD
  const registrarMovimiento = async (hardwareId: string, tipo: 'INGRESO' | 'SALIDA') => {
    if (!user) return alert("Error: No hay usuario en sesión");
    setIsProcessing(true);

    const { error } = await supabase
      .from('transacciones')
      .insert({
        hardware_id: hardwareId,
        sku: scannedCode, // Guardamos el SKU escaneado
        tipo: tipo,
        operador_id: user.id, // <--- AQUÍ queda grabado quién fue
        timestamp: new Date().toISOString()
      });
      
    setIsProcessing(false);

    if (!error) {
      alert(`Movimiento de ${tipo} registrado con éxito`);
      // Limpiamos la pantalla para el siguiente escaneo
      setScannedCode(null);
      setScannedHardware(null);
      setIsNewHardware(false);
    } else {
      alert("Error al registrar en la base de datos");
      console.error(error);
    }
  };

  // Conectamos el hook del escáner con nuestra función
  const { startScanner, stopScanner, isScanning, error: scannerError } = useScanner({
    onScanSuccess: handleScanResult
  });

  useGSAP(() => {
    gsap.fromTo(scannerBoxRef.current,
      { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  const handleToggleScan = (): void => {
    if (isScanning) {
      stopScanner();
      setScannedCode(null);
      setScannedHardware(null);
      setIsNewHardware(false);
    } else {
      // Limpiamos estados antes de volver a escanear
      setScannedCode(null);
      setScannedHardware(null);
      setIsNewHardware(false);
      startScanner();
    }
  };

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center justify-center">
      <div 
        ref={scannerBoxRef}
        className={`invisible flex w-full max-w-md flex-col justify-between min-h-560px rounded-2xl border ${currentTheme.border} ${currentTheme.card} p-6 shadow-xl`}
      >
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className={`flex items-center gap-2 text-lg font-medium tracking-tight ${currentTheme.text}`}>
              <Camera className={`h-5 w-5 ${currentTheme.icon}`} />
              Lector de Hardware
            </h2>
            <span className={`flex h-2.5 w-2.5 rounded-full ${isScanning ? 'animate-pulse bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-300'}`}></span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className={`relative w-full overflow-hidden rounded-xl border ${currentTheme.border} bg-black shadow-inner transition-all duration-300 ${isScanning ? 'aspect-square' : 'h-48'}`}>
            {!isScanning && (
              <p className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-sm text-white/70">
                {scannedCode ? 'Escaneo completado' : 'Cámara inactiva'}
              </p>
            )}
            <div id="reader" className="z-20 h-full w-full [&>video]:object-cover"></div>
          </div>

          <div className="w-full min-h-140px flex flex-col justify-center">
            {scannerError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-center text-sm text-red-600">{scannerError}</p>
              </div>
            )}
            
            {/* Badge de detección */}
            {scannedCode && (
              <div className={`success-badge invisible flex items-center gap-3 rounded-xl border p-4 ${currentTheme.success}`}>
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Código Detectado</p>
                  <p className="truncate font-mono text-lg font-semibold">{scannedCode}</p>
                </div>
              </div>
            )}

            {/* Opciones tras escanear: Equipo Existe */}
            {scannedHardware && (
              <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                  disabled={isProcessing}
                  onClick={() => registrarMovimiento(scannedHardware.id, 'INGRESO')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-100 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-200 disabled:opacity-50"
                >
                  <ArrowDownToLine className="h-4 w-4" /> Ingreso
                </button>
                <button 
                  disabled={isProcessing}
                  onClick={() => registrarMovimiento(scannedHardware.id, 'SALIDA')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-100 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-200 disabled:opacity-50"
                >
                  <ArrowUpFromLine className="h-4 w-4" /> Salida
                </button>
              </div>
            )}

            {/* Opciones tras escanear: Equipo Nuevo */}
            {isNewHardware && (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-sm font-medium text-slate-600">Este equipo no está en la base de datos.</p>
                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
                  <PlusCircle className="h-4 w-4" /> Registrar Nuevo Equipo
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleToggleScan}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-all hover:cursor-pointer active:scale-[0.98] ${
            isScanning 
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
              : currentTheme.primary + ' shadow-md'
          }`}
        >
          {isScanning ? (
            <>
              <XCircle className="h-5 w-5" /> Detener Escáner
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" /> {scannedCode ? 'Escanear Otro' : 'Iniciar Escáner'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}