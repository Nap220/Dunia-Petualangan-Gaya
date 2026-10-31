import React, { useState, useEffect, useRef } from 'react';
import { ASSETS } from '../../utils/assets';
import { sound } from '../../utils/audio';
import {
  MagnetEntity,
  ObjectEntity,
  calculateMagnetPoleForce,
  calculateObjectAttraction,
} from '../../utils/physics';
import { RotateCcw, Info, Magnet as MagnetIcon } from 'lucide-react';

interface ShelvedItem {
  id: string;
  type: 'magnet_utara' | 'magnet_selatan' | 'object';
  name: string;
  image: string;
  pole?: 'U' | 'S';
  objectName?: ObjectEntity['name'];
  isMagnetic?: boolean;
}

const INITIAL_SHELF_NORTH: ShelvedItem[] = [
  { id: 'north-1', type: 'magnet_utara', name: 'Magnet Utara 1', image: ASSETS.magnetUtara, pole: 'U' },
  { id: 'north-2', type: 'magnet_utara', name: 'Magnet Utara 2', image: ASSETS.magnetUtara, pole: 'U' },
];

const INITIAL_SHELF_SOUTH: ShelvedItem[] = [
  { id: 'south-1', type: 'magnet_selatan', name: 'Magnet Selatan 1', image: ASSETS.magnetSelatan, pole: 'S' },
  { id: 'south-2', type: 'magnet_selatan', name: 'Magnet Selatan 2', image: ASSETS.magnetSelatan, pole: 'S' },
];

const INITIAL_SHELF_OBJECTS: ShelvedItem[] = [
  { id: 'obj-paku', type: 'object', name: 'Paku', image: ASSETS.paku, objectName: 'paku', isMagnetic: true },
  { id: 'obj-baut', type: 'object', name: 'Baut', image: ASSETS.baut, objectName: 'baut', isMagnetic: true },
  { id: 'obj-kayu', type: 'object', name: 'Kayu Ranting', image: ASSETS.kayuRanting, objectName: 'kayuRanting', isMagnetic: false },
  { id: 'obj-koin', type: 'object', name: 'Koin Perak', image: ASSETS.koinPerak, objectName: 'koinPerak', isMagnetic: false },
];

export const MagnetSim: React.FC = () => {
  // Items placed onto the canvas
  const [activeMagnets, setActiveMagnets] = useState<MagnetEntity[]>([]);
  const [activeObjects, setActiveObjects] = useState<ObjectEntity[]>([]);

  // Dragging interaction state
  const draggingItemRef = useRef<{ id: string; isMagnet: boolean; offsetX: number; offsetY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Spawn item onto canvas from shelf
  const spawnItem = (item: ShelvedItem) => {
    sound.playPop();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // Random initial placement near center-top of canvas
    const x = rect.width / 2 + (Math.random() * 200 - 100);
    const y = rect.height / 2 + (Math.random() * 160 - 80);

    if (item.type === 'magnet_utara' || item.type === 'magnet_selatan') {
      // Check if already active
      if (activeMagnets.some((m) => m.id === item.id)) return;
      setActiveMagnets((prev) => [
        ...prev,
        {
          id: item.id,
          type: item.type as 'magnet_utara' | 'magnet_selatan',
          pole: item.pole || 'U',
          x,
          y,
        },
      ]);
    } else {
      if (activeObjects.some((o) => o.id === item.id)) return;
      setActiveObjects((prev) => [
        ...prev,
        {
          id: item.id,
          name: item.objectName || 'paku',
          isMagnetic: !!item.isMagnetic,
          x,
          y,
        },
      ]);
    }
  };

  // Drag and move via Pointer Events
  const handlePointerDown = (
    e: React.PointerEvent,
    id: string,
    isMagnet: boolean,
    currentX: number,
    currentY: number
  ) => {
    e.stopPropagation();
    sound.playClick();

    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const pointerCanvasX = e.clientX - canvasRect.left;
    const pointerCanvasY = e.clientY - canvasRect.top;

    draggingItemRef.current = {
      id,
      isMagnet,
      offsetX: pointerCanvasX - currentX,
      offsetY: pointerCanvasY - currentY,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingItemRef.current || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const pointerCanvasX = e.clientX - canvasRect.left;
    const pointerCanvasY = e.clientY - canvasRect.top;

    const { id, isMagnet, offsetX, offsetY } = draggingItemRef.current;
    const newX = Math.max(40, Math.min(canvasRect.width - 40, pointerCanvasX - offsetX));
    const newY = Math.max(40, Math.min(canvasRect.height - 40, pointerCanvasY - offsetY));

    if (isMagnet) {
      setActiveMagnets((prev) =>
        prev.map((m) => (m.id === id ? { ...m, x: newX, y: newY, isDragging: true } : m))
      );
    } else {
      setActiveObjects((prev) =>
        prev.map((o) => (o.id === id ? { ...o, x: newX, y: newY, isDragging: true } : o))
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingItemRef.current) {
      const { id, isMagnet } = draggingItemRef.current;
      if (isMagnet) {
        setActiveMagnets((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isDragging: false } : m))
        );
      } else {
        setActiveObjects((prev) =>
          prev.map((o) => (o.id === id ? { ...o, isDragging: false } : o))
        );
      }
      draggingItemRef.current = null;
    }
  };

  const handleReset = () => {
    sound.playClick();
    setActiveMagnets([]);
    setActiveObjects([]);
  };

  // Simulation physics loop: pole interaction & object attraction
  useEffect(() => {
    // If no active magnets, skip loop
    if (activeMagnets.length === 0) {
      return;
    }

    let isCancelled = false;
    let lastSnap = 0;

    const loop = () => {
      if (isCancelled) return;
      if (!canvasRef.current) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // 1. Calculate magnet-to-magnet forces and stable latching
      setActiveMagnets((prevMagnets) => {
        if (prevMagnets.length < 2) return prevMagnets;

        let hasMoved = false;
        const newMagnets = prevMagnets.map((m1) => {
          if (m1.isDragging) return m1;

          let netFx = 0;
          let netFy = 0;

          for (const m2 of prevMagnets) {
            if (m1.id === m2.id) continue;
            const res = calculateMagnetPoleForce(m1, m2, 190);

            if (res.isContact) {
              // Opposite poles touching: stably snap flush together, no jitter
              if (performance.now() - lastSnap > 800) {
                sound.playMagnetSnap();
                lastSnap = performance.now();
              }
              // Zero net force when in contact
              continue;
            }

            netFx += res.fx;
            netFy += res.fy;
          }

          if (Math.abs(netFx) > 0.05 || Math.abs(netFy) > 0.05) {
            hasMoved = true;
          }

          // Damped displacement
          const dx = netFx * 0.04;
          const dy = netFy * 0.04;
          const clampedX = Math.max(50, Math.min(width - 50, m1.x + dx));
          const clampedY = Math.max(50, Math.min(height - 50, m1.y + dy));

          return { ...m1, x: clampedX, y: clampedY };
        });

        return hasMoved ? newMagnets : prevMagnets;
      });

      // 2. Calculate magnetic object attraction (paku, baut)
      setActiveObjects((prevObjects) => {
        if (prevObjects.length === 0 || activeMagnets.length === 0) return prevObjects;

        return prevObjects.map((obj) => {
          if (obj.isDragging || !obj.isMagnetic) return obj;

          const attraction = calculateObjectAttraction(obj, activeMagnets, 170);
          if (attraction.nearestMagnetId && attraction.dist > 2) {
            const dx = attraction.fx * 0.04;
            const dy = attraction.fy * 0.04;
            const clampedX = Math.max(30, Math.min(width - 30, obj.x + dx));
            const clampedY = Math.max(30, Math.min(height - 30, obj.y + dy));

            if (attraction.dist < 30 && performance.now() - lastSnap > 800) {
              sound.playMagnetSnap();
              lastSnap = performance.now();
            }

            return {
              ...obj,
              x: clampedX,
              y: clampedY,
              isAttachedTo: attraction.nearestMagnetId,
            };
          }

          return obj;
        });
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeMagnets]);

  // Asset getter for object
  const getObjectAsset = (name: ObjectEntity['name']) => {
    switch (name) {
      case 'paku':
        return ASSETS.paku;
      case 'baut':
        return ASSETS.baut;
      case 'kayuRanting':
        return ASSETS.kayuRanting;
      case 'koinPerak':
        return ASSETS.koinPerak;
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Controls & Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 px-5 py-2.5 rounded-2xl border-2 border-amber-300 shadow-md z-20">
        <div className="flex items-center space-x-2 text-xs md:text-sm font-bold text-slate-700">
          <MagnetIcon className="w-5 h-5 text-rose-500" />
          <span>Tarik magnet & benda dari kotak pilihan ke area simulasi di tengah!</span>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold rounded-xl text-sm transition cursor-pointer shadow-xs"
          aria-label="Bersihkan area simulasi magnet"
        >
          <RotateCcw className="w-4 h-4" />
          <span>BERSIHKAN AREA</span>
        </button>
      </div>

      {/* Main Layout: Left/Top Shelves + Middle Interactive Canvas */}
      <div className="flex-1 my-3 flex flex-col md:flex-row gap-3 items-stretch overflow-hidden">
        {/* Three Selection Shelves */}
        <div className="w-full md:w-60 flex flex-col gap-2 z-10 overflow-y-auto pr-1">
          {/* Kotak 1: Magnet Utara */}
          <div className="bg-white/95 p-2.5 rounded-2xl border-2 border-red-300 shadow-xs">
            <div className="text-[11px] font-black uppercase tracking-wider text-red-900 mb-1.5 flex items-center justify-between">
              <span>Kotak 1: Magnet Utara (U)</span>
              <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full font-bold">Merah</span>
            </div>
            <div className="flex gap-1.5">
              {INITIAL_SHELF_NORTH.map((item) => {
                const isActive = activeMagnets.some((m) => m.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => spawnItem(item)}
                    disabled={isActive}
                    className={`flex-1 p-1.5 rounded-xl border-2 flex flex-col items-center transition cursor-pointer ${
                      isActive
                        ? 'opacity-40 border-slate-300 bg-slate-100 cursor-not-allowed'
                        : 'border-red-400 bg-red-50 hover:bg-red-100 hover:scale-105 active:scale-95 shadow-sm'
                    }`}
                    title={isActive ? 'Sudah berada di panggung' : 'Klik atau tarik ke panggung'}
                  >
                    <img src={item.image} alt={item.name} className="w-12 h-8 object-contain drop-shadow-xs" />
                    <span className="text-[10px] font-extrabold text-red-900 mt-0.5">Kutub U</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kotak 2: Magnet Selatan */}
          <div className="bg-white/95 p-2.5 rounded-2xl border-2 border-blue-300 shadow-xs">
            <div className="text-[11px] font-black uppercase tracking-wider text-blue-900 mb-1.5 flex items-center justify-between">
              <span>Kotak 2: Magnet Selatan (S)</span>
              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-bold">Biru</span>
            </div>
            <div className="flex gap-1.5">
              {INITIAL_SHELF_SOUTH.map((item) => {
                const isActive = activeMagnets.some((m) => m.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => spawnItem(item)}
                    disabled={isActive}
                    className={`flex-1 p-1.5 rounded-xl border-2 flex flex-col items-center transition cursor-pointer ${
                      isActive
                        ? 'opacity-40 border-slate-300 bg-slate-100 cursor-not-allowed'
                        : 'border-blue-400 bg-blue-50 hover:bg-blue-100 hover:scale-105 active:scale-95 shadow-sm'
                    }`}
                    title={isActive ? 'Sudah berada di panggung' : 'Klik atau tarik ke panggung'}
                  >
                    <img src={item.image} alt={item.name} className="w-12 h-8 object-contain drop-shadow-xs" />
                    <span className="text-[10px] font-extrabold text-blue-900 mt-0.5">Kutub S</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kotak 3: Benda di Sekitar Magnet */}
          <div className="bg-white/95 p-2.5 rounded-2xl border-2 border-amber-300 shadow-xs flex-1">
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 mb-1.5">
              Kotak 3: Benda di Sekitar
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {INITIAL_SHELF_OBJECTS.map((item) => {
                const isActive = activeObjects.some((o) => o.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => spawnItem(item)}
                    disabled={isActive}
                    className={`p-1.5 rounded-xl border-2 flex flex-col items-center justify-center transition cursor-pointer ${
                      isActive
                        ? 'opacity-40 border-slate-300 bg-slate-100 cursor-not-allowed'
                        : 'border-amber-300 bg-amber-50 hover:bg-amber-100 hover:scale-105 active:scale-95 shadow-sm'
                    }`}
                    title={isActive ? 'Sudah di panggung' : 'Klik untuk tempatkan'}
                  >
                    <img src={item.image} alt={item.name} className="w-8 h-8 object-contain drop-shadow-xs" />
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight mt-0.5">{item.name}</span>
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 ${
                        item.isMagnetic
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.isMagnetic ? 'Feromagnetik' : 'Nonmagnetik'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Central Simulation Canvas: Empty on start */}
        <div
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative flex-1 bg-gradient-to-br from-amber-50/70 via-white/80 to-sky-50/70 rounded-2xl border-2 border-white/80 shadow-inner overflow-hidden cursor-crosshair"
          style={{ touchAction: 'none' }}
        >
          {/* Subtle grid pattern for lab table feel */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Empty state hint */}
          {activeMagnets.length === 0 && activeObjects.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-600 mb-3 shadow-md">
                <MagnetIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-700">Area Percobaan Masih Kosong</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Klik magnet atau benda pada kotak di sebelah kiri untuk meletakkannya di sini. Lalu geser bebas menggunakan mouse atau jari!
              </p>
            </div>
          )}

          {/* Magnets Layer */}
          {activeMagnets.map((magnet) => (
            <div
              key={magnet.id}
              onPointerDown={(e) => handlePointerDown(e, magnet.id, true, magnet.x, magnet.y)}
              className="absolute cursor-grab active:cursor-grabbing hover:scale-105 transition-transform z-20 group"
              style={{
                left: `${magnet.x}px`,
                top: `${magnet.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative w-24 h-14 flex items-center justify-center filter drop-shadow-lg">
                <img
                  src={magnet.type === 'magnet_utara' ? ASSETS.magnetUtara : ASSETS.magnetSelatan}
                  alt={magnet.pole}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
                {/* Magnetic field glow indicator */}
                <div
                  className={`absolute -inset-2 rounded-2xl pointer-events-none opacity-40 ${
                    magnet.pole === 'U' ? 'bg-red-400/30' : 'bg-blue-400/30'
                  }`}
                />
              </div>
            </div>
          ))}

          {/* Objects Layer */}
          {activeObjects.map((obj) => (
            <div
              key={obj.id}
              onPointerDown={(e) => handlePointerDown(e, obj.id, false, obj.x, obj.y)}
              className="absolute cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-30"
              style={{
                left: `${obj.x}px`,
                top: `${obj.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative w-14 h-14 flex items-center justify-center filter drop-shadow-md">
                <img
                  src={getObjectAsset(obj.name)}
                  alt={obj.name}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
                {obj.isAttachedTo && (
                  <span className="absolute -top-3 px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-black rounded-full shadow-xs">
                    Menempel!
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Concept Note */}
      <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-2xl text-amber-950 text-xs md:text-sm font-semibold shadow-xs z-20">
        <p>
          <span className="font-black text-amber-800 mr-1">Konsep Ilmiah:</span>
          &ldquo;Magnet dapat menarik benda tertentu seperti besi dan baja. Kutub magnet yang berbeda saling tarik-menarik, sedangkan kutub yang sama saling tolak-menolak.&rdquo;
          <span className="text-slate-600 text-xs block mt-0.5">
            (Paku dan baut terbuat dari bahan feromagnetik, sedangkan koin perak dan kayu adalah bahan nonmagnetik).
          </span>
        </p>
      </div>
    </div>
  );
};
