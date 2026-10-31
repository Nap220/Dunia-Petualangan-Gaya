import React, { useState, useEffect, useRef } from 'react';
import { ASSETS } from '../../utils/assets';
import { sound } from '../../utils/audio';
import {
  SurfaceType,
  PushDirection,
  SURFACES,
} from '../../utils/physics';
import { RotateCcw, Play, ArrowLeft, ArrowRight, Activity } from 'lucide-react';

export const GesekSim: React.FC = () => {
  const [surface, setSurface] = useState<SurfaceType>('biasa');
  const [direction, setDirection] = useState<PushDirection>('kanan');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [distanceCm, setDistanceCm] = useState<number>(0);
  const [boxPositionPx, setBoxPositionPx] = useState<number>(0);

  const animRef = useRef<number | null>(null);
  const currentDistRef = useRef<number>(0);

  const surfaceProps = SURFACES[surface];

  const handleStart = () => {
    if (isRunning) return;
    sound.playWhoosh();
    setIsRunning(true);

    const maxDist = surfaceProps.maxDistanceCm;
    const speed = 120 * surfaceProps.speedMultiplier; // cm/s
    const startTime = performance.now();
    const initialDist = currentDistRef.current;

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progressDist = Math.min(initialDist + speed * elapsed, maxDist);
      currentDistRef.current = progressDist;
      setDistanceCm(Math.round(progressDist));

      // 1 cm = ~1.6 px on screen
      setBoxPositionPx(progressDist * 1.6);

      if (progressDist < maxDist) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setIsRunning(false);
        sound.playThud();
      }
    };

    animRef.current = requestAnimationFrame(tick);
  };

  const handleReset = () => {
    sound.playClick();
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    setIsRunning(false);
    currentDistRef.current = 0;
    setDistanceCm(0);
    setBoxPositionPx(0);
  };

  useEffect(() => {
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, []);

  // When surface or direction is changed during idle, adjust
  const handleSurfaceChange = (newSurface: SurfaceType) => {
    if (isRunning) return;
    sound.playClick();
    setSurface(newSurface);
    handleReset();
  };

  const handleDirectionChange = (newDir: PushDirection) => {
    if (isRunning) return;
    sound.playClick();
    setDirection(newDir);
    handleReset();
  };

  // Road styling based on surface
  const getSurfaceVisual = () => {
    switch (surface) {
      case 'licin':
        return 'bg-gradient-to-r from-cyan-200 via-sky-100 to-cyan-200 border-cyan-400 shadow-[inset_0_2px_10px_rgba(6,182,212,0.5)]';
      case 'biasa':
        return 'bg-gradient-to-r from-stone-400 via-stone-300 to-stone-400 border-stone-500';
      case 'berbatuan':
        return 'bg-gradient-to-r from-amber-800 via-stone-700 to-stone-800 border-amber-900';
    }
  };

  // Direction signed multiplier
  const signedOffset = direction === 'kanan' ? boxPositionPx : -boxPositionPx;

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Controls & Distance Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 px-5 py-2.5 rounded-2xl border-2 border-amber-300 shadow-md z-20">
        {/* Real-time Distance Meter */}
        <div className="flex items-center space-x-3 bg-amber-50 px-4 py-1.5 rounded-xl border border-amber-300">
          <Activity className="w-5 h-5 text-amber-600" />
          <div className="flex items-baseline space-x-2">
            <span className="text-xs font-bold text-slate-600 uppercase">Jarak Perpindahan:</span>
            <span className="text-xl md:text-2xl font-black font-mono text-amber-900">
              {distanceCm} cm
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleStart}
            disabled={isRunning || distanceCm >= surfaceProps.maxDistanceCm}
            className={`flex items-center space-x-2 px-6 py-2 rounded-xl font-black text-sm md:text-base shadow-md transition-all active:scale-95 cursor-pointer ${
              !isRunning && distanceCm < surfaceProps.maxDistanceCm
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/40 ring-2 ring-emerald-300'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-75'
            }`}
            aria-label="Mulai Dorongan"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isRunning ? 'Bergerak...' : 'MULAI'}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold rounded-xl text-sm transition cursor-pointer shadow-xs"
            aria-label="Reset simulasi gaya gesek"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Surface & Direction Switchers */}
      <div className="my-2 grid grid-cols-1 md:grid-cols-2 gap-3 z-20">
        {/* Slider / Segmented Control for 3 Surfaces */}
        <div className="bg-white/95 p-3 rounded-2xl border-2 border-sky-300 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              1. Jenis Permukaan Jalan (Gaya Gesek)
            </span>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
              {surfaceProps.label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSurfaceChange('licin')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex flex-col items-center border-2 transition cursor-pointer ${
                surface === 'licin'
                  ? 'bg-cyan-100 border-cyan-500 text-cyan-950 ring-2 ring-cyan-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Jalan Licin (Es)</span>
              <span className="text-[10px] text-cyan-700 font-bold">Gesek: Sangat Kecil</span>
            </button>

            <button
              onClick={() => handleSurfaceChange('biasa')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex flex-col items-center border-2 transition cursor-pointer ${
                surface === 'biasa'
                  ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Jalan Biasa</span>
              <span className="text-[10px] text-amber-700 font-bold">Gesek: Sedang</span>
            </button>

            <button
              onClick={() => handleSurfaceChange('berbatuan')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex flex-col items-center border-2 transition cursor-pointer ${
                surface === 'berbatuan'
                  ? 'bg-stone-200 border-stone-600 text-stone-950 ring-2 ring-stone-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Jalan Berbatuan</span>
              <span className="text-[10px] text-stone-700 font-bold">Gesek: Sangat Besar</span>
            </button>
          </div>
        </div>

        {/* Direction Selector (Kiri vs Kanan) */}
        <div className="bg-white/95 p-3 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              2. Arah Dorongan
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              Mendorong ke {direction === 'kanan' ? 'Kanan ➡' : '⬅ Kiri'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDirectionChange('kiri')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 border-2 transition cursor-pointer ${
                direction === 'kiri'
                  ? 'bg-blue-100 border-blue-500 text-blue-900 ring-2 ring-blue-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dorong ke Kiri</span>
            </button>

            <button
              onClick={() => handleDirectionChange('kanan')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 border-2 transition cursor-pointer ${
                direction === 'kanan'
                  ? 'bg-blue-100 border-blue-500 text-blue-900 ring-2 ring-blue-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Dorong ke Kanan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Track Simulation Area */}
      <div className="relative flex-1 w-full bg-sky-200/40 rounded-2xl border-2 border-white/70 overflow-hidden flex flex-col justify-end p-4">
        {/* Moving Actor + Box + Force Vectors */}
        <div
          className="relative z-20 flex items-end transition-transform"
          style={{
            transform: `translateX(${signedOffset}px)`,
            marginBottom: '46px',
            left: direction === 'kanan' ? '60px' : 'calc(100% - 240px)',
          }}
        >
          {/* Character */}
          <div
            className={`w-28 h-40 flex items-end justify-center transition-transform ${
              direction === 'kiri' ? 'scale-x-[-1] order-2' : 'order-1'
            }`}
          >
            <img
              src={ASSETS.karakterPendorongGesek}
              alt="Anak Mendorong"
              className="w-full h-full object-contain filter drop-shadow-md"
              draggable={false}
            />
          </div>

          {/* Box */}
          <div
            className={`relative w-28 h-28 flex items-end justify-center ${
              direction === 'kiri' ? 'order-1 mr-[-8px]' : 'order-2 ml-[-8px]'
            }`}
          >
            <img
              src={ASSETS.kotakGesek}
              alt="Kotak"
              className="w-full h-full object-contain filter drop-shadow-lg"
              draggable={false}
            />

            {/* FORCE VECTORS ANCHORED TO BOX */}
            {/* 1. Gaya Dorong (Blue Arrow, in direction of push) */}
            <div
              className={`absolute -top-12 z-30 flex items-center ${
                direction === 'kanan' ? 'left-4' : 'right-4 flex-row-reverse'
              }`}
            >
              <div className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                Gaya Dorong ({surfaceProps.pushForceN} N)
              </div>
              <ArrowRight
                className={`w-7 h-7 text-blue-600 stroke-[3] ${
                  direction === 'kiri' ? 'rotate-180' : ''
                }`}
              />
            </div>

            {/* 2. Gaya Gesek (Red Arrow, opposite to push) */}
            <div
              className={`absolute -bottom-6 z-30 flex items-center ${
                direction === 'kanan' ? 'right-4 flex-row-reverse' : 'left-4'
              }`}
            >
              <div className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                Gaya Gesek ({surfaceProps.frictionForceN} N)
              </div>
              <ArrowLeft
                className={`w-7 h-7 text-rose-600 stroke-[3] ${
                  direction === 'kiri' ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </div>

        {/* Road Surface Track with clear visual textures */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-20 border-t-4 transition-all duration-500 z-10 flex flex-col justify-between px-6 py-2 ${getSurfaceVisual()}`}
        >
          {/* Surface label & texture pattern */}
          <div className="flex justify-between items-center text-xs font-black tracking-widest uppercase">
            <span className={surface === 'berbatuan' ? 'text-amber-200' : 'text-slate-800'}>
              {surfaceProps.label}
            </span>
            <span className={surface === 'berbatuan' ? 'text-amber-300' : 'text-slate-700'}>
              Koefisien Gesek: {surfaceProps.frictionCoef}
            </span>
          </div>

          {/* Rulers / Distance markings */}
          <div className="w-full flex justify-between text-[10px] font-mono opacity-60">
            <span>| 0 cm</span>
            <span>| 75 cm</span>
            <span>| 150 cm</span>
            <span>| 225 cm</span>
            <span>| 300 cm</span>
            <span>| 350 cm</span>
          </div>
        </div>
      </div>

      {/* Scientific Concept Note */}
      <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-2xl text-amber-950 text-xs md:text-sm font-semibold shadow-xs z-20 flex items-center justify-between">
        <p>
          <span className="font-black text-amber-800 mr-1">Konsep Ilmiah:</span>
          &ldquo;Gaya gesek adalah gaya yang menghambat gerakan ketika dua permukaan saling bersentuhan. Semakin besar gaya gesek, semakin sulit benda bergerak.&rdquo;
        </p>
      </div>
    </div>
  );
};
