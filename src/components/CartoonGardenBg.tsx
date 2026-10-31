import React from 'react';

interface CartoonGardenBgProps {
  customImage?: string;
  overlayOpacity?: number;
}

export const CartoonGardenBg: React.FC<CartoonGardenBgProps> = ({
  customImage,
  overlayOpacity = 0.15,
}) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {customImage ? (
        <div
          className="w-full h-full bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${customImage})` }}
        />
      ) : (
        /* Rich 2D cartoon park / garden vector landscape */
        <div className="w-full h-full relative bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-200">
          {/* Sun with warm rays */}
          <div className="absolute top-10 right-28 w-28 h-28 bg-amber-300 rounded-full shadow-[0_0_80px_rgba(251,191,36,0.8)] border-4 border-amber-200">
            <div className="absolute inset-2 bg-yellow-400 rounded-full opacity-80" />
          </div>

          {/* Clouds */}
          <svg
            className="absolute top-12 left-16 w-48 h-24 text-white/90 drop-shadow-md"
            viewBox="0 0 100 50"
            fill="currentColor"
          >
            <path d="M 20,40 Q 10,40 10,30 Q 10,20 25,20 Q 30,5 50,10 Q 70,5 75,20 Q 90,20 90,30 Q 90,40 80,40 Z" />
          </svg>
          <svg
            className="absolute top-20 right-80 w-64 h-32 text-white/80 drop-shadow-md"
            viewBox="0 0 100 50"
            fill="currentColor"
          >
            <path d="M 20,40 Q 10,40 10,30 Q 10,20 25,20 Q 30,5 50,10 Q 70,5 75,20 Q 90,20 90,30 Q 90,40 80,40 Z" />
          </svg>

          {/* Distant Hills */}
          <svg
            className="absolute bottom-28 left-0 right-0 w-full h-64 text-emerald-300/80 preserve-3d"
            viewBox="0 0 1200 300"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,180 C200,90 350,220 600,140 C850,60 1000,200 1200,120 L1200,300 L0,300 Z" />
          </svg>

          {/* Middle Hills */}
          <svg
            className="absolute bottom-16 left-0 right-0 w-full h-56 text-emerald-400 preserve-3d"
            viewBox="0 0 1200 250"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,140 C280,60 480,180 750,100 C1000,30 1120,150 1200,110 L1200,250 L0,250 Z" />
          </svg>

          {/* Foreground Garden Grass & Rolling Mound */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full h-36 text-lime-500 preserve-3d"
            viewBox="0 0 1200 180"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,70 C300,110 500,40 800,80 C1020,120 1150,50 1200,60 L1200,180 L0,180 Z" />
          </svg>

          {/* Foreground Lawn Strip */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-emerald-700 via-lime-600 to-lime-500 border-t-4 border-lime-400" />

          {/* Cartoon flowers & tufts on the lawn */}
          <div className="absolute bottom-10 left-24 flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-pink-400 border-2 border-pink-600 inline-block shadow-sm" />
            <span className="w-6 h-6 rounded-full bg-amber-400 border-2 border-amber-600 inline-block shadow-sm" />
            <span className="w-4 h-4 rounded-full bg-violet-400 border-2 border-violet-600 inline-block shadow-sm" />
          </div>

          <div className="absolute bottom-12 right-32 flex items-center space-x-3">
            <span className="w-5 h-5 rounded-full bg-red-400 border-2 border-red-600 inline-block shadow-sm" />
            <span className="w-6 h-6 rounded-full bg-yellow-300 border-2 border-amber-500 inline-block shadow-sm" />
            <span className="w-5 h-5 rounded-full bg-purple-400 border-2 border-purple-600 inline-block shadow-sm" />
          </div>
        </div>
      )}

      {/* Subtle translucent tint layer for crisp legibility */}
      <div
        className="absolute inset-0 bg-slate-900/5"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
};
