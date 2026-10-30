import React, { useState } from 'react';
import { BuildingCategory, GameSettings, StructureType } from '../../types/game';
import { BUILDING_DEFINITIONS, TRANSLATIONS } from '../../constants/gameData';
import { X, Coins, Sparkles, Clock, Hammer, Lock } from 'lucide-react';

interface BuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  userLevel: number;
  userCoins: number;
  userGems: number;
  defaultCategory?: BuildingCategory;
  onSelectStructure: (type: StructureType) => void;
}

export const BuildModal: React.FC<BuildModalProps> = ({
  isOpen,
  onClose,
  settings,
  userLevel,
  userCoins,
  userGems,
  defaultCategory = 'residential',
  onSelectStructure,
}) => {
  const [selectedCat, setSelectedCat] = useState<BuildingCategory>(defaultCategory);

  if (!isOpen) return null;

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const isRtl = settings.language === 'ar';

  const categories: { id: BuildingCategory; label: string }[] = [
    { id: 'residential', label: t.cat_residential },
    { id: 'commercial', label: t.cat_commercial },
    { id: 'services', label: t.cat_services },
    { id: 'industrial', label: t.cat_industrial },
    { id: 'transport', label: t.cat_transport },
    { id: 'water_infra', label: t.cat_water_infra },
    { id: 'agriculture', label: t.cat_agriculture },
    { id: 'landmarks', label: t.cat_landmarks },
  ];

  const buildings = Object.values(BUILDING_DEFINITIONS).filter((b) => b.category === selectedCat);

  const formatTime = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 ${
        isRtl ? 'font-tajawal' : 'font-sans'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">{t.tab_build}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 p-2 px-3 border-b border-slate-800/80 overflow-x-auto no-scrollbar bg-slate-900/50">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCat === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Building Cards Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {buildings.map((b) => {
            const isUnlocked = userLevel >= b.unlockedLevel;
            const canAfford = userCoins >= b.costCoins && userGems >= b.costGems;
            const name = t[b.nameKey] || b.id;
            const desc = t[b.descKey] || '';

            return (
              <div
                key={b.id}
                className={`relative bg-slate-800/60 border rounded-2xl p-3.5 flex flex-col justify-between transition ${
                  isUnlocked
                    ? 'border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800'
                    : 'border-slate-800 opacity-60'
                }`}
              >
                <div>
                  {/* Top line badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: b.color }} />
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full">
                      {b.dimensions.width}x{b.dimensions.depth}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">{name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{desc}</p>
                </div>

                {/* Stats & Costs */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/40">
                  <div className="flex items-center justify-between text-xs mb-2 text-slate-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTime(b.constructionTimeSec)}
                    </span>
                    <span className="text-amber-300 font-semibold">+{b.xpReward} XP</span>
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      {b.costCoins > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{b.costCoins.toLocaleString()}</span>
                        </div>
                      )}
                      {b.costGems > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{b.costGems}</span>
                        </div>
                      )}
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          onSelectStructure(b.id);
                          onClose();
                        }}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {t.tab_build}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg">
                        <Lock className="w-3 h-3" />
                        <span>
                          {t.level_label} {b.unlockedLevel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
