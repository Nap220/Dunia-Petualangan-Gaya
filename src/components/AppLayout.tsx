import React, { useState } from 'react';
import { CartoonGardenBg } from './CartoonGardenBg';
import { ASSETS } from '../utils/assets';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';

export type ScreenId = 'menu' | 'gravitasi' | 'otot' | 'gesek' | 'magnet' | 'pegas';

interface AppLayoutProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  title?: string;
  topicIcon?: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentScreen,
  onNavigate,
  title,
  topicIcon,
  children,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick();
  };

  const handleBackToMenu = () => {
    sound.playClick();
    onNavigate('menu');
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-950 overflow-hidden select-none">
      {/* 16:9 Aspect Ratio Frame Container (max width 1920x1080 reference) */}
      <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video bg-sky-200 overflow-hidden shadow-2xl rounded-none md:rounded-2xl border-0 md:border-4 border-amber-400/30 flex flex-col">
        {/* Background: user's uploaded playground image on halaman awal (menu), clean cartoon landscape on simulations */}
        <CartoonGardenBg customImage={currentScreen === 'menu' ? ASSETS.backgroundTaman : undefined} />

        {/* Global Navigation Bar for Simulation Pages */}
        {currentScreen !== 'menu' && (
          <header className="relative z-30 flex items-center justify-between px-6 py-3 bg-white/95 border-b-4 border-amber-300 shadow-md">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToMenu}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 active:scale-95 text-amber-950 font-bold rounded-xl shadow-[0_3px_0_#d97706] transition-all cursor-pointer text-sm md:text-base"
                aria-label="Kembali ke Menu Utama"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-heading">Menu Utama</span>
              </button>

              <div className="flex items-center space-x-3">
                {topicIcon && (
                  <img
                    src={topicIcon}
                    alt=""
                    className="w-9 h-9 object-contain drop-shadow-sm"
                  />
                )}
                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-wide font-heading">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleMute}
                className="p-2.5 bg-sky-100 hover:bg-sky-200 active:scale-95 rounded-xl border-2 border-sky-300 text-sky-800 transition cursor-pointer shadow-sm"
                title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
                aria-label={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
              </button>
            </div>
          </header>
        )}

        {/* Floating Sound Toggle on Menu Page */}
        {currentScreen === 'menu' && (
          <div className="absolute top-4 right-5 z-30">
            <button
              onClick={handleToggleMute}
              className="p-3 bg-white/90 hover:bg-white active:scale-95 rounded-2xl border-2 border-amber-300 text-amber-900 shadow-md transition cursor-pointer flex items-center space-x-2 text-sm font-bold"
              title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
              aria-label={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-5 h-5 text-red-500" />
                  <span className="hidden sm:inline text-xs text-red-600">Suara Mati</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                  <span className="hidden sm:inline text-xs text-emerald-700">Suara Aktif</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};
