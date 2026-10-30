import React from 'react';
import { CityStats, GameSettings, Season } from '../../types/game';
import { TRANSLATIONS } from '../../constants/gameData';
import { Coins, Sparkles, Users, Archive, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  stats: CityStats;
  settings: GameSettings;
  season: Season;
  dayTime: number;
  taxAvailable: number;
  onCollectTaxes: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  stats,
  settings,
  season,
  dayTime,
  taxAvailable,
  onCollectTaxes,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const isNight = dayTime < 6 || dayTime > 18;
  const xpPercent = Math.min(100, Math.round((stats.xp / stats.xpToNextLevel) * 100));

  const seasonLabels: Record<Season, string> = {
    spring: t.season_spring,
    summer: t.season_summer,
    autumn: t.season_autumn,
    winter: t.season_winter,
  };

  const isRtl = settings.language === 'ar';

  return (
    <header
      className={`fixed top-3 left-1/2 -translate-x-1/2 w-[96vw] max-w-6xl z-30 pointer-events-none select-none transition-all ${
        isRtl ? 'font-tajawal' : 'font-sans'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900/90 border border-slate-700/60 shadow-xl rounded-2xl p-2.5 px-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-slate-100 pointer-events-auto">
        {/* City Title & Level / XP */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wide bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                {t.app_title}
              </span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {t.level_label} {stats.level}
              </span>
            </div>
            {/* XP Bar */}
            <div className="w-28 sm:w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Currency & City Metrics */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm">
          {/* Coins */}
          <div className="flex items-center gap-1.5 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-200">{stats.coins.toLocaleString()}</span>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-1.5 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-200">{stats.gems.toLocaleString()}</span>
          </div>

          {/* Population */}
          <div className="flex items-center gap-1.5 bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-500/30">
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-semibold text-sky-200">{stats.population.toLocaleString()}</span>
          </div>

          {/* Ultra Storage (999,999) */}
          <div
            className="hidden md:flex items-center gap-1.5 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-500/30"
            title={t.storage_unlimited}
          >
            <Archive className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs text-purple-200 font-medium">999k</span>
          </div>

          {/* Season & Day/Night */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-xs font-semibold">{seasonLabels[season]}</span>
            <div className="flex items-center gap-1 text-xs text-slate-300 border-l border-slate-700 pl-2">
              {isNight ? <Moon className="w-3.5 h-3.5 text-indigo-300" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
              <span>{Math.floor(dayTime).toString().padStart(2, '0')}:00</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: PWA Install & Tax Collector */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <button
            onClick={onCollectTaxes}
            disabled={taxAvailable <= 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
              taxAvailable > 0
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-95 cursor-pointer border border-amber-300'
                : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.collect_taxes}</span>
            {taxAvailable > 0 && <span className="bg-amber-900/30 px-1 rounded text-xs font-mono">+{taxAvailable}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};
