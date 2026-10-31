import React, { useState, useRef, useEffect } from 'react';
import { ASSETS } from '../../utils/assets';
import { sound } from '../../utils/audio';
import {
  calculateSpringEnergy,
  calculateSpringJumpHeight,
} from '../../utils/physics';
import { RotateCcw, ArrowDown, Zap } from 'lucide-react';

export const PegasSim: React.FC = () => {
  // Compression ratio 0 to 1
  const [compression, setCompression] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [ballOffsetY, setBallOffsetY] = useState<number>(0); // negative is upward jump
  const [springHeight, setSpringHeight] = useState<number>(180);
  const [lastJumpHeight, setLastJumpHeight] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number>(0);
  const currentCompressionRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const NATURAL_SPRING_HEIGHT = 180;
  const MIN_SPRING_HEIGHT = 80; // Natural mechanical limit to preserve realistic coil shapes
  const MAX_COMPRESSION_PX = NATURAL_SPRING_HEIGHT - MIN_SPRING_HEIGHT; // 100px

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isJumping) return;
    e.stopPropagation();
    sound.playClick();
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isJumping) return;
    const deltaY = e.clientY - dragStartYRef.current;

    // Only allow downward drag
    const clampedDelta = Math.max(0, Math.min(MAX_COMPRESSION_PX, deltaY));
    const ratio = clampedDelta / MAX_COMPRESSION_PX;
    currentCompressionRef.current = ratio;
    setCompression(ratio);
    setSpringHeight(NATURAL_SPRING_HEIGHT - clampedDelta);
    setBallOffsetY(clampedDelta);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const finalRatio = currentCompressionRef.current;

    if (finalRatio < 0.05) {
      // Very slight touch, just snap back
      setSpringHeight(NATURAL_SPRING_HEIGHT);
      setBallOffsetY(0);
      setCompression(0);
      return;
    }

    // Launch Ball with snappy, energetic realistic physics
    sound.playBoing(finalRatio);
    setIsJumping(true);

    // Spring instantly rebounds with slight recoil
    setSpringHeight(NATURAL_SPRING_HEIGHT);

    // Initial velocity proportional to compression: v0 (px/s)
    // Stronger compression = much higher initial speed
    const v0 = 350 + finalRatio * 850; // 350px/s to 1200px/s
    const g = 2600; // Realistic acceleration of gravity (px/s^2)
    const totalFlightTimeSeconds = (2 * v0) / g; // 0.3s to 0.9s snappy natural flight
    const maxJumpHeightPx = (v0 * v0) / (2 * g);

    setLastJumpHeight(Math.round(maxJumpHeightPx / 2.2)); // in cm for educational ruler

    const startTime = performance.now();

    const animateJump = (now: number) => {
      const elapsedSeconds = (now - startTime) / 1000;

      if (elapsedSeconds < totalFlightTimeSeconds) {
        // True physics equation of motion: y(t) = -(v0 * t - 0.5 * g * t^2)
        const displacementY = -(v0 * elapsedSeconds - 0.5 * g * elapsedSeconds * elapsedSeconds);
        setBallOffsetY(displacementY);
        animFrameRef.current = requestAnimationFrame(animateJump);
      } else {
        // Landed back on spring plate with crisp thud
        setBallOffsetY(0);
        setIsJumping(false);
        setCompression(0);
        currentCompressionRef.current = 0;
        sound.playThud();
      }
    };

    animFrameRef.current = requestAnimationFrame(animateJump);
  };

  const handleReset = () => {
    sound.playClick();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsDragging(false);
    setIsJumping(false);
    setCompression(0);
    setBallOffsetY(0);
    setSpringHeight(NATURAL_SPRING_HEIGHT);
    setLastJumpHeight(0);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const storedEnergyJoules = Math.round(calculateSpringEnergy(compression, 450));

  // Render realistic helical mechanical spring with layered coils
  const renderSpringSVG = () => {
    const coils = 6;
    const width = 80;
    const startY = 8;
    const endY = springHeight - 8;
    const coilHeight = (endY - startY) / coils;

    // Adaptive stroke width so coils never smudge when compressed
    const strokeW = Math.max(7, 9.5 - compression * 2);

    return (
      <svg
        width={width}
        height={springHeight}
        className="overflow-visible filter drop-shadow-md transition-all duration-75"
      >
        <defs>
          <linearGradient id="springFrontGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="25%" stopColor="#f1f5f9" />
            <stop offset="60%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="springBackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>

        {/* Top Metallic Plate */}
        <ellipse cx={width / 2} cy={4} rx={width / 2 - 6} ry={5} fill="#475569" />
        <ellipse cx={width / 2} cy={2} rx={width / 2 - 8} ry={3.5} fill="#e2e8f0" />

        {/* Realistic layered helical coils: back curves drawn first, front curves in front */}
        {Array.from({ length: coils }).map((_, i) => {
          const yTop = startY + i * coilHeight;
          const yMid = yTop + coilHeight * 0.5;
          const yBot = yTop + coilHeight;

          return (
            <g key={`coil-${i}`}>
              {/* Back half of the coil (darker, recessed) */}
              <path
                d={`M ${width * 0.85} ${yMid} C ${width * 0.95} ${yTop + coilHeight * 0.15}, ${width * 0.05} ${yTop}, ${width * 0.15} ${yTop}`}
                fill="none"
                stroke="url(#springBackGrad)"
                strokeWidth={strokeW - 1}
                strokeLinecap="round"
              />
              {/* Front half of the coil (bright metallic reflection) */}
              <path
                d={`M ${width * 0.15} ${yTop} C ${width * 0.05} ${yMid}, ${width * 0.95} ${yBot - coilHeight * 0.15}, ${width * 0.85} ${yBot}`}
                fill="none"
                stroke="url(#springFrontGrad)"
                strokeWidth={strokeW}
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Bottom Base Mounting Flange */}
        <ellipse cx={width / 2} cy={springHeight - 2} rx={width / 2} ry={6} fill="#1e293b" />
        <ellipse cx={width / 2} cy={springHeight - 4} rx={width / 2 - 4} ry={4} fill="#64748b" />
      </svg>
    );
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 md:p-5 select-none">
      {/* Top Controls & Energy Meter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 px-4 py-2 rounded-2xl border-2 border-amber-300 shadow-md z-20">
        {/* Compression Depth & Stored Energy */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-amber-500 fill-current" />
            <span className="text-xs font-black uppercase text-slate-700">Tekanan Pegas:</span>
            <span className="text-base font-black font-mono text-purple-700">
              {Math.round(compression * 100)}%
            </span>
          </div>

          {/* Energy Bar */}
          <div className="w-28 md:w-44 h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full transition-all duration-75"
              style={{ width: `${Math.round(compression * 100)}%` }}
            />
          </div>

          <div className="hidden sm:block text-xs font-bold text-slate-600">
            Energi Potensial: <span className="font-extrabold text-slate-800">{storedEnergyJoules} Joule</span>
          </div>
        </div>

        {/* Action button & Reset */}
        <div className="flex items-center space-x-2">
          {lastJumpHeight > 0 && (
            <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl text-xs font-black">
              Tinggi Lompatan: {lastJumpHeight} cm
            </div>
          )}

          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            aria-label="Reset simulasi gaya pegas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Main Physics Interactive Stage */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative flex-1 my-2 bg-gradient-to-b from-sky-200/50 via-purple-100/30 to-amber-100/50 rounded-2xl border-2 border-white/70 overflow-hidden flex flex-col justify-end items-center p-4"
        style={{ touchAction: 'none' }}
      >
        {/* Metric Height Ruler on Left Side */}
        <div className="absolute left-6 top-8 bottom-24 w-12 border-r-2 border-dashed border-slate-400 flex flex-col justify-between text-[11px] font-mono text-slate-600 font-bold">
          <span>- 150 cm</span>
          <span>- 100 cm</span>
          <span>- 50 cm</span>
          <span>- 0 cm</span>
        </div>

        {/* Guidance Prompt if idle */}
        {!isDragging && !isJumping && compression === 0 && (
          <div className="absolute top-10 bg-white/95 px-4 py-1.5 rounded-2xl border-2 border-purple-300 shadow-md text-center flex items-center space-x-2 z-20">
            <ArrowDown className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black text-slate-800">
              Tarik bola ke bawah untuk memampatkan per pegas, lalu lepaskan!
            </span>
          </div>
        )}

        {/* Mechanical Assembly (Ball + Spring + Pedestal Base) */}
        <div className="relative flex flex-col items-center justify-end z-10 mb-8">
          {/* Launchable Ball */}
          <div
            onPointerDown={handlePointerDown}
            className={`w-18 h-18 relative cursor-grab active:cursor-grabbing hover:scale-105 transition-transform z-30 ${
              isDragging ? 'cursor-grabbing scale-95' : ''
            }`}
            style={{
              transform: `translateY(${ballOffsetY}px)`,
              marginBottom: '-6px',
            }}
          >
            <img
              src={ASSETS.bola}
              alt="Bola"
              className="w-full h-full object-contain filter drop-shadow-xl pointer-events-none"
              draggable={false}
            />
          </div>

          {/* SVG Realistic Helical Spring */}
          <div className="flex items-end justify-center pointer-events-none">
            {renderSpringSVG()}
          </div>

          {/* Heavy Steel Pedestal Ground Base */}
          <div className="w-48 h-8 bg-gradient-to-t from-slate-800 to-slate-600 rounded-t-xl border-t-2 border-slate-400 shadow-xl flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
              Dudukan Pegas Baja
            </span>
          </div>
        </div>

        {/* Ground Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-emerald-800 to-lime-600 border-t-2 border-lime-400" />
      </div>

      {/* Scientific Concept Note */}
      <div className="bg-amber-50 border-2 border-amber-300 p-2.5 rounded-2xl text-amber-950 text-xs font-semibold shadow-xs z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <p className="flex-1">
          <span className="font-black text-amber-800 mr-1">Konsep Ilmiah:</span>
          &ldquo;Gaya pegas adalah gaya yang muncul ketika pegas ditekan atau diregangkan. Semakin besar perubahan bentuk pegas, semakin besar energi elastis yang dapat disimpan.&rdquo;
        </p>
        <span className="text-xs font-mono font-extrabold bg-purple-100 text-purple-900 px-3 py-1 rounded-lg border border-purple-300 whitespace-nowrap">
          Rumus: E = ½ k x²
        </span>
      </div>
    </div>
  );
};
