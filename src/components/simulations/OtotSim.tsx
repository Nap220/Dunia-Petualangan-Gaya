import React, { useState } from 'react';
import { ASSETS } from '../../utils/assets';
import { sound } from '../../utils/audio';
import {
  MuscleCharacter,
  MuscleObject,
  calculateMuscleOutcome,
  MuscleOutcome,
  MUSCLE_CONSTANTS,
} from '../../utils/physics';
import { RotateCcw, Play, ArrowRight, Info, CheckCircle2, Move } from 'lucide-react';

export const OtotSim: React.FC = () => {
  const [selectedChar, setSelectedChar] = useState<MuscleCharacter | null>(null);
  const [selectedObj, setSelectedObj] = useState<MuscleObject | null>(null);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<MuscleOutcome | null>(null);
  const [pushedDistance, setPushedDistance] = useState<number>(0);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);
  const [isDragOverStage, setIsDragOverStage] = useState<boolean>(false);

  // Replacement logic: dragging or selecting replaces current item
  const handleSelectChar = (char: MuscleCharacter) => {
    sound.playClick();
    setSelectedChar(char);
    resetPushState();
  };

  const handleSelectObj = (obj: MuscleObject) => {
    sound.playClick();
    setSelectedObj(obj);
    resetPushState();
  };

  const resetPushState = () => {
    setIsPushing(false);
    setOutcome(null);
    setPushedDistance(0);
    setHasCompleted(false);
  };

  const handleFullReset = () => {
    sound.playClick();
    setSelectedChar(null);
    setSelectedObj(null);
    resetPushState();
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, type: 'char' | 'obj', val: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, val }));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOverStage) setIsDragOverStage(true);
  };

  const handleDragLeave = () => {
    setIsDragOverStage(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverStage(false);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      sound.playPop();

      if (data.type === 'char') {
        // Replace existing character if any
        setSelectedChar(data.val as MuscleCharacter);
        resetPushState();
      } else if (data.type === 'obj') {
        // Replace existing object if any
        setSelectedObj(data.val as MuscleObject);
        resetPushState();
      }
    } catch {
      // Ignore drop parse error
    }
  };

  const handleStartPush = () => {
    if (!selectedChar || !selectedObj || isPushing) return;

    sound.playWhoosh();
    setIsPushing(true);
    setHasCompleted(false);

    const calculated = calculateMuscleOutcome(selectedChar, selectedObj);
    setOutcome(calculated);

    if (calculated.canMove) {
      // Smooth push animation over time
      const startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / calculated.durationMs, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentDistance = easeOut * calculated.distancePx;
        setPushedDistance(currentDistance);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsPushing(false);
          setHasCompleted(true);
          sound.playThud();
        }
      };
      requestAnimationFrame(animate);
    } else {
      // Cannot move: strain for durationMs, then complete with 0 distance
      setTimeout(() => {
        setIsPushing(false);
        setHasCompleted(true);
        sound.playThud();
      }, calculated.durationMs);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 md:p-5 select-none">
      {/* Top Controls & Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 px-4 py-2 rounded-2xl border-2 border-amber-300 shadow-md z-20">
        <div className="flex items-center space-x-2 text-xs md:text-sm font-bold text-slate-700">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Tarik (drag & drop) karakter & benda ke kotak contoh gaya di panggung!</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleStartPush}
            disabled={!selectedChar || !selectedObj || isPushing}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl font-black text-xs md:text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
              selectedChar && selectedObj && !isPushing
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/40'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
            }`}
            aria-label="Mulai Mendorong"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isPushing ? 'Mendorong...' : 'DORONG BENDA'}</span>
          </button>

          <button
            onClick={handleFullReset}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            aria-label="Reset simulasi gaya otot"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Main Staging & Selection Canvas */}
      <div className="flex-1 my-2 flex flex-col md:flex-row gap-3 items-stretch overflow-hidden">
        {/* Left Side: Character & Object Selection Shelves */}
        <div className="w-full md:w-64 flex flex-col gap-2 z-10">
          {/* Kotak Pilihan Karakter */}
          <div className="p-2.5 bg-white/95 rounded-2xl border-2 border-sky-300 shadow-sm flex flex-col">
            <span className="text-[11px] font-black text-sky-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Move className="w-3.5 h-3.5 text-sky-600" />
                <span>1. Tarik Karakter</span>
              </span>
              {selectedChar && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Anak-anak */}
              <div
                draggable={!isPushing}
                onDragStart={(e) => handleDragStart(e, 'char', 'anak')}
                onClick={() => handleSelectChar('anak')}
                className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing hover:scale-102 ${
                  selectedChar === 'anak'
                    ? 'bg-sky-100 border-sky-600 ring-2 ring-sky-400'
                    : 'bg-slate-50 hover:bg-sky-50 border-slate-200'
                }`}
                title="Tarik atau klik ke Kotak Contoh Gaya"
              >
                <div className="w-14 h-20 flex items-center justify-center pointer-events-none">
                  <img
                    src={ASSETS.karakterAnak}
                    alt="Anak-anak"
                    className="h-full object-contain filter drop-shadow-xs"
                    draggable={false}
                  />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-0.5">Anak-anak</span>
                <span className="text-[9px] font-bold text-sky-700 bg-sky-200/80 px-1.5 py-0.2 rounded-full mt-0.5">
                  120 N
                </span>
              </div>

              {/* Orang Dewasa */}
              <div
                draggable={!isPushing}
                onDragStart={(e) => handleDragStart(e, 'char', 'dewasa')}
                onClick={() => handleSelectChar('dewasa')}
                className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing hover:scale-102 ${
                  selectedChar === 'dewasa'
                    ? 'bg-sky-100 border-sky-600 ring-2 ring-sky-400'
                    : 'bg-slate-50 hover:bg-sky-50 border-slate-200'
                }`}
                title="Tarik atau klik ke Kotak Contoh Gaya"
              >
                <div className="w-14 h-20 flex items-center justify-center pointer-events-none">
                  <img
                    src={ASSETS.karakterDewasa}
                    alt="Orang Dewasa"
                    className="h-full object-contain filter drop-shadow-xs"
                    draggable={false}
                  />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-0.5">Dewasa</span>
                <span className="text-[9px] font-bold text-sky-700 bg-sky-200/80 px-1.5 py-0.2 rounded-full mt-0.5">
                  350 N
                </span>
              </div>
            </div>
          </div>

          {/* Kotak Pilihan Benda */}
          <div className="p-2.5 bg-white/95 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col">
            <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Move className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Tarik Benda</span>
              </span>
              {selectedObj && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Kotak Peti */}
              <div
                draggable={!isPushing}
                onDragStart={(e) => handleDragStart(e, 'obj', 'peti')}
                onClick={() => handleSelectObj('peti')}
                className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing hover:scale-102 ${
                  selectedObj === 'peti'
                    ? 'bg-amber-100 border-amber-600 ring-2 ring-amber-400'
                    : 'bg-slate-50 hover:bg-amber-50 border-slate-200'
                }`}
                title="Tarik atau klik ke Kotak Contoh Gaya"
              >
                <div className="w-14 h-16 flex items-center justify-center pointer-events-none">
                  <img
                    src={ASSETS.kotakPeti}
                    alt="Kotak Peti"
                    className="h-full object-contain filter drop-shadow-xs"
                    draggable={false}
                  />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-0.5">Kotak Peti</span>
                <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded-full mt-0.5">
                  80 N
                </span>
              </div>

              {/* Kulkas */}
              <div
                draggable={!isPushing}
                onDragStart={(e) => handleDragStart(e, 'obj', 'kulkas')}
                onClick={() => handleSelectObj('kulkas')}
                className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing hover:scale-102 ${
                  selectedObj === 'kulkas'
                    ? 'bg-amber-100 border-amber-600 ring-2 ring-amber-400'
                    : 'bg-slate-50 hover:bg-amber-50 border-slate-200'
                }`}
                title="Tarik atau klik ke Kotak Contoh Gaya"
              >
                <div className="w-14 h-16 flex items-center justify-center pointer-events-none">
                  <img
                    src={ASSETS.kulkas}
                    alt="Kulkas"
                    className="h-full object-contain filter drop-shadow-xs"
                    draggable={false}
                  />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-0.5">Kulkas</span>
                <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded-full mt-0.5">
                  600 N
                </span>
              </div>
            </div>
          </div>

          {/* Minimalist Scientific Parameters Table */}
          <div className="p-2 bg-slate-900/85 text-white rounded-xl text-[10px] shadow-sm">
            <div className="font-bold text-amber-300 mb-0.5 flex items-center justify-between">
              <span>Parameter Gaya (Ilustratif)</span>
              <span>Satuan: N</span>
            </div>
            <div className="grid grid-cols-2 gap-0.5 text-slate-200">
              <div>Dorong Anak: <strong className="text-white">{MUSCLE_CONSTANTS.forceAnak} N</strong></div>
              <div>Beban Peti: <strong className="text-white">{MUSCLE_CONSTANTS.weightPeti} N</strong></div>
              <div>Dorong Dewasa: <strong className="text-white">{MUSCLE_CONSTANTS.forceDewasa} N</strong></div>
              <div>Beban Kulkas: <strong className="text-white">{MUSCLE_CONSTANTS.weightKulkas} N</strong></div>
            </div>
          </div>
        </div>

        {/* Center / Right: The Push Staging Area ("Kotak Contoh Gaya") */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex-1 bg-gradient-to-b from-sky-300/30 to-amber-100/40 rounded-2xl border-4 overflow-hidden flex flex-col justify-end p-4 transition-all duration-200 ${
            isDragOverStage
              ? 'border-dashed border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-300/50'
              : 'border-white/80'
          }`}
        >
          {/* Header Badge: Kotak Contoh Gaya */}
          <div className="absolute top-3 left-4 z-10 flex items-center space-x-2">
            <span className="bg-amber-400 text-amber-950 font-black text-[11px] px-3 py-1 rounded-full shadow-sm border border-amber-300">
              Kotak Contoh Gaya (Area Percobaan)
            </span>
            {isDragOverStage && (
              <span className="bg-emerald-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-sm">
                Lepaskan di sini untuk mengganti!
              </span>
            )}
          </div>

          {/* Scenario instruction overlay if nothing placed */}
          {(!selectedChar || !selectedObj) && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white/95 px-6 py-4 rounded-2xl border-2 border-dashed border-sky-400 text-center shadow-lg max-w-md">
                <p className="text-sm font-extrabold text-slate-800">
                  {!selectedChar
                    ? '👉 Tarik Karakter (Anak / Dewasa) ke sini'
                    : '👉 Tarik Benda (Kotak Peti / Kulkas) ke sini'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Item yang sudah ada akan otomatis berganti jika kamu menarik karakter atau benda baru!
                </p>
              </div>
            </div>
          )}

          {/* Staging Ground line */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-stone-700 to-stone-500 border-t-4 border-stone-400 z-0">
            <div className="w-full h-full flex items-center justify-around opacity-30 text-white font-mono text-[10px]">
              <span>| 0 cm</span>
              <span>| 50 cm</span>
              <span>| 100 cm</span>
              <span>| 150 cm</span>
              <span>| 200 cm</span>
              <span>| 250 cm</span>
            </div>
          </div>

          {/* Actor & Object Container */}
          <div
            className="relative z-10 flex items-end transition-transform duration-75"
            style={{
              transform: `translateX(${pushedDistance}px)`,
              marginBottom: '28px',
              marginLeft: '40px',
            }}
          >
            {/* Character */}
            {selectedChar && (
              <div
                className="relative flex items-end justify-center transition-all"
                style={{
                  width: selectedChar === 'anak' ? '120px' : '140px',
                  height: selectedChar === 'anak' ? '190px' : '230px',
                  marginRight: '-10px',
                }}
              >
                <img
                  src={
                    isPushing || hasCompleted
                      ? selectedChar === 'anak'
                        ? ASSETS.karakterAnakMendorong
                        : ASSETS.karakterDewasaMendorong
                      : selectedChar === 'anak'
                      ? ASSETS.karakterAnak
                      : ASSETS.karakterDewasa
                  }
                  alt="Karakter"
                  className="w-full h-full object-contain filter drop-shadow-lg pointer-events-none"
                  draggable={false}
                />

                {/* Sweating/effort bubble when pushing heavy fridge */}
                {isPushing && outcome && !outcome.canMove && (
                  <div className="absolute -top-6 right-2 bg-amber-400 text-amber-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-md">
                    Berat Sekali! 💦
                  </div>
                )}
              </div>
            )}

            {/* Object */}
            {selectedObj && (
              <div
                className="relative flex items-end justify-center"
                style={{
                  width: selectedObj === 'peti' ? '130px' : '135px',
                  height: selectedObj === 'peti' ? '130px' : '210px',
                }}
              >
                <img
                  src={selectedObj === 'peti' ? ASSETS.kotakPeti : ASSETS.kulkas}
                  alt="Benda"
                  className="w-full h-full object-contain filter drop-shadow-xl pointer-events-none"
                  draggable={false}
                />
              </div>
            )}
          </div>

          {/* Push Force Vector Arrow */}
          {isPushing && selectedChar && (
            <div
              className="absolute z-20 flex items-center space-x-1 transition-all"
              style={{
                left: `${150 + pushedDistance}px`,
                bottom: '120px',
              }}
            >
              <div className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                F Dorong ({selectedChar === 'anak' ? '120 N' : '350 N'})
              </div>
              <ArrowRight className="w-8 h-8 text-blue-600 stroke-[3]" />
            </div>
          )}
        </div>
      </div>

      {/* Outcome / Result Card */}
      <div className="bg-white/95 p-3 rounded-2xl border-2 border-amber-300 shadow-md z-20">
        {hasCompleted && outcome ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black text-xs uppercase tracking-wider mr-2">
                Hasil Percobaan:
              </span>
              <span className="text-xs md:text-sm font-bold text-slate-800">
                {outcome.description}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              *Hambatan gerak dan gaya dorong menentukan apakah benda dapat dipindahkan.
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-700 font-semibold">
            <span className="font-bold text-amber-800">Konsep Ilmiah:</span> Gaya dorong berasal dari energi otot. Benda akan bergerak jika gaya dorong yang diberikan cukup untuk mengatasi hambatan gerak benda tersebut.
          </p>
        )}
      </div>
    </div>
  );
};
