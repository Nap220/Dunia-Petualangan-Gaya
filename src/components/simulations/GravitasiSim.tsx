import React, { useState, useEffect, useRef } from 'react';
import { ASSETS } from '../../utils/assets';
import { sound } from '../../utils/audio';
import { RotateCcw, Power, Sparkles } from 'lucide-react';
import { updateGravityApple, AppleState } from '../../utils/physics';

// Branch spawn positions relative to the tree container (in % or px)
const BRANCH_POINTS = [
  { x: 38, y: 22 },
  { x: 55, y: 18 },
  { x: 28, y: 35 },
  { x: 68, y: 32 },
  { x: 48, y: 38 },
  { x: 74, y: 24 },
];

export const GravitasiSim: React.FC = () => {
  const [gravityOn, setGravityOn] = useState<boolean>(true);
  const [apples, setApples] = useState<AppleState[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const appleCountRef = useRef<number>(0);

  // Spawn a new apple on the tree upon clicking the tree
  const handleTreeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    sound.playPop();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Pick a branch position
    const branchIdx = appleCountRef.current % BRANCH_POINTS.length;
    const branch = BRANCH_POINTS[branchIdx];
    appleCountRef.current += 1;

    // Convert branch percentages to container px
    const startX = (branch.x / 100) * rect.width;
    const startY = (branch.y / 100) * rect.height;

    const newApple: AppleState = {
      id: `apple-${Date.now()}-${appleCountRef.current}`,
      x: startX,
      y: startY,
      vy: gravityOn ? 20 : -30,
      isLanded: false,
      branchOrigin: startY,
    };

    setApples((prev) => [...prev, newApple]);
  };

  const handleToggleGravity = () => {
    sound.playClick();
    setGravityOn((prev) => !prev);
  };

  const handleReset = () => {
    sound.playClick();
    setApples([]);
  };

  // Main physics animation loop for apples - only runs when apples need moving
  useEffect(() => {
    // If no apples or all apples are landed with gravity ON, do not burn CPU
    const needsAnimation = apples.some((a) => !a.isLanded || !gravityOn);
    if (!needsAnimation) {
      return;
    }

    let isCancelled = false;

    const loop = (now: number) => {
      if (isCancelled) return;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      if (containerRef.current) {
        const groundY = containerRef.current.clientHeight - 80;

        setApples((prevApples) => {
          if (prevApples.length === 0) return prevApples;

          let hasActiveApples = false;
          const updated = prevApples.map((apple) => {
            const next = updateGravityApple(apple, gravityOn, groundY, dt);
            if (!next.isLanded || !gravityOn) {
              hasActiveApples = true;
            }
            return next;
          });

          return updated;
        });
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isCancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [apples, gravityOn]);

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 md:p-5 select-none relative">
      {/* Compact, Unobtrusive Top Controls Bar */}
      <div className="flex items-center justify-between z-20 bg-white/95 px-4 py-2 rounded-2xl border-2 border-amber-300 shadow-md mb-1">
        <div className="flex items-center space-x-3">
          {/* Gravitasi Toggle Button */}
          <button
            onClick={handleToggleGravity}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl font-black text-xs md:text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
              gravityOn
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-300'
                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-300'
            }`}
            aria-label={gravityOn ? 'Gravitasi Sedang Aktif' : 'Gravitasi Sedang Nonaktif'}
          >
            <Power className="w-4 h-4" />
            <span>{gravityOn ? 'GRAVITASI ON' : 'GRAVITASI OFF'}</span>
          </button>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gravityOn ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="hidden sm:inline">
              {gravityOn ? 'Bumi menarik apel jatuh ke tanah' : 'Gravitasi OFF: Apel melayang ke atas'}
            </span>
          </div>
        </div>

        {/* Tree Click Prompt & Reset Button */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 bg-amber-100 border border-amber-300 rounded-lg text-amber-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Klik pohon untuk menjatuhkan apel!</span>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            aria-label="Reset simulasi gravitasi"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Zero Gravity Atmospheric Effect overlay */}
      {!gravityOn && (
        <div className="absolute inset-0 z-10 pointer-events-none bg-indigo-500/10 border-4 border-indigo-400/50 rounded-2xl flex items-center justify-center">
          <div className="absolute top-16 bg-indigo-600/90 text-white px-4 py-1 rounded-full font-black text-xs shadow-lg tracking-wider">
            RUANG TANPA GRAVITASI (SIMULASI MELAYANG)
          </div>
        </div>
      )}

      {/* Main Simulation Stage with ample vertical clearance */}
      <div
        ref={containerRef}
        onClick={handleTreeClick}
        className="relative flex-1 w-full my-1 rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-end items-center"
      >
        {/* Tree Click Hint on tree hover */}
        <div className="absolute top-3 z-10 bg-white/80 border border-amber-300 text-amber-950 font-bold text-xs px-3 py-1 rounded-full shadow-xs pointer-events-none">
          👆 Klik pada pohon apel untuk menjatuhkan buah apel
        </div>

        {/* Apple Tree Container: centered with comfortable height */}
        <div className="relative w-72 md:w-80 lg:w-[350px] aspect-square flex items-end justify-center mb-8 z-10 hover:scale-[1.02] active:scale-98 transition-transform duration-150">
          <img
            src={ASSETS.pohonApel}
            alt="Pohon Apel"
            className="w-full h-full object-contain filter drop-shadow-xl"
            draggable={false}
          />
        </div>

        {/* Dynamic Apples Layer */}
        {apples.map((apple) => {
          return (
            <div
              key={apple.id}
              className="absolute pointer-events-none transition-transform"
              style={{
                left: `${apple.x}px`,
                top: `${apple.y}px`,
                width: '42px',
                height: '42px',
                transform: 'translate(-50%, -50%)',
                zIndex: apple.isLanded ? 12 : 15,
              }}
            >
              <img
                src={
                  !gravityOn
                    ? ASSETS.buahApel
                    : apple.isLanded
                    ? ASSETS.buahApel
                    : ASSETS.buahApelJatuh
                }
                alt="Buah Apel"
                className="w-full h-full object-contain drop-shadow-md"
                draggable={false}
              />
            </div>
          );
        })}

        {/* Ground Surface Grass Line */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-emerald-800 via-lime-700 to-lime-600 border-t-4 border-lime-400 z-10 flex items-center justify-center">
          <span className="text-white/80 font-black text-xs uppercase tracking-widest drop-shadow-sm">
            Permukaan Tanah
          </span>
        </div>
      </div>

      {/* Scientific Concept Note */}
      <div className="relative z-20 px-4 py-2 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-semibold shadow-xs flex items-center justify-between">
        <p className="flex-1">
          <span className="font-black text-amber-800 mr-1">Konsep Ilmiah:</span>
          &ldquo;Gaya gravitasi adalah gaya tarik bumi yang menyebabkan benda jatuh ke arah permukaan bumi.&rdquo;
        </p>
        <span className="ml-3 font-extrabold text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-md text-xs whitespace-nowrap">
          Apel Jatuh: {apples.length}
        </span>
      </div>
    </div>
  );
};
