import React from 'react';
import { ScreenId } from './AppLayout';
import { ASSETS } from '../utils/assets';
import { sound } from '../utils/audio';

interface MainMenuProps {
  onSelectTopic: (screen: ScreenId) => void;
}

interface TopicCardItem {
  id: ScreenId;
  name: string;
  icon: string;
  badge: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
}

const TOPICS: TopicCardItem[] = [
  {
    id: 'gravitasi',
    name: 'Gaya Gravitasi',
    icon: ASSETS.iconGravitasi,
    badge: 'Tarik Bumi',
    bgColor: 'from-amber-100 to-orange-100',
    borderColor: 'border-amber-400',
    shadowColor: 'shadow-amber-500/30',
  },
  {
    id: 'otot',
    name: 'Gaya Otot',
    icon: ASSETS.iconOtot,
    badge: 'Dorong & Tarik',
    bgColor: 'from-blue-100 to-cyan-100',
    borderColor: 'border-blue-400',
    shadowColor: 'shadow-blue-500/30',
  },
  {
    id: 'gesek',
    name: 'Gaya Gesek',
    icon: ASSETS.iconGesek,
    badge: 'Hambatan Gerak',
    bgColor: 'from-emerald-100 to-teal-100',
    borderColor: 'border-emerald-400',
    shadowColor: 'shadow-emerald-500/30',
  },
  {
    id: 'magnet',
    name: 'Gaya Magnet',
    icon: ASSETS.iconMagnet,
    badge: 'Kutub U & S',
    bgColor: 'from-rose-100 to-pink-100',
    borderColor: 'border-rose-400',
    shadowColor: 'shadow-rose-500/30',
  },
  {
    id: 'pegas',
    name: 'Gaya Pegas',
    icon: ASSETS.iconPegas,
    badge: 'Energi Elastis',
    bgColor: 'from-purple-100 to-indigo-100',
    borderColor: 'border-purple-400',
    shadowColor: 'shadow-purple-500/30',
  },
];

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectTopic }) => {
  const handleCardClick = (id: ScreenId) => {
    sound.playPop();
    onSelectTopic(id);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-8 px-6 text-center select-none">
      {/* Title Header with Fun Cartoon Styling */}
      <div className="mt-2 flex flex-col items-center">
        <div className="inline-block px-6 py-2 bg-amber-400/90 text-amber-950 text-xs md:text-sm font-black uppercase tracking-widest rounded-full shadow-md mb-2 border-2 border-amber-300">
          Media Pembelajaran IPA Interaktif Siswa SD
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-amber-500 tracking-tight font-heading drop-shadow-[0_4px_0_#92400e] stroke-white stroke-2">
          PETUALANGAN DUNIA GAYA
        </h1>

        <p className="mt-2 text-base md:text-xl font-bold text-slate-700 bg-white/90 px-6 py-1.5 rounded-full border border-white/80 shadow-sm max-w-xl">
          Eksplorasi dan lakukan percobaan langsung untuk memahami pengaruh gaya terhadap gerak benda!
        </p>
      </div>

      {/* 5 Topic Cards in Horizontal Row */}
      <div className="w-full max-w-6xl my-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5 justify-center items-stretch">
          {TOPICS.map((topic, index) => (
            <button
              key={topic.id}
              onClick={() => handleCardClick(topic.id)}
              className={`group relative flex flex-col items-center justify-between p-4 md:p-5 rounded-3xl bg-gradient-to-b ${topic.bgColor} border-4 ${topic.borderColor} shadow-xl hover:${topic.shadowColor} hover:-translate-y-2 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-center overflow-hidden`}
              style={{ animationDelay: `${index * 80}ms` }}
              aria-label={`Pilih materi ${topic.name}`}
            >
              {/* Badge */}
              <div className="w-full flex justify-end">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/85 text-slate-700 shadow-xs border border-white">
                  {topic.badge}
                </span>
              </div>

              {/* Illustration Image */}
              <div className="my-3 w-28 h-28 md:w-32 md:h-32 flex items-center justify-center p-2 rounded-2xl bg-white/70 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <img
                  src={topic.icon}
                  alt={topic.name}
                  className="w-full h-full object-contain filter drop-shadow-md"
                  loading="eager"
                />
              </div>

              {/* Topic Name */}
              <div className="w-full mt-2">
                <h2 className="text-base md:text-lg lg:text-xl font-black text-slate-800 font-heading leading-tight group-hover:text-amber-800 transition-colors">
                  {topic.name}
                </h2>
                <div className="mt-2 flex items-center justify-center space-x-1 text-xs font-extrabold text-amber-700 group-hover:underline">
                  <span>Mulai Simulasi</span>
                  <span>&rarr;</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mb-2 text-xs md:text-sm font-semibold text-slate-600 bg-white/80 px-4 py-1 rounded-full border border-white/60">
        Klik salah satu materi di atas untuk memulai petualangan simulasi fisika!
      </div>
    </div>
  );
};
