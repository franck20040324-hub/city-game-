import React from 'react';
import { GameSettings, Mission } from '../../types/game';
import { TRANSLATIONS } from '../../constants/gameData';
import { X, Target, Coins, Sparkles, CheckCircle2 } from 'lucide-react';

interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  missions: Mission[];
  onClaimReward: (missionId: string) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  isOpen,
  onClose,
  settings,
  missions,
  onClaimReward,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const isRtl = settings.language === 'ar';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 ${
        isRtl ? 'font-tajawal' : 'font-sans'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">{t.missions_title}</h2>
              <p className="text-xs text-slate-400">{t.missions_subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Missions List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {missions.map((m) => {
            const title = t[m.titleKey] || m.id;
            const desc = t[m.descKey] || '';
            const progress = Math.min(100, Math.round((m.currentCount / m.targetCount) * 100));

            return (
              <div
                key={m.id}
                className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        m.type === 'daily'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      {m.type}
                    </span>
                    <h3 className="font-bold text-sm text-white">{title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{desc}</p>

                  {/* Progress bar */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-300 shrink-0">
                      {m.currentCount} / {m.targetCount}
                    </span>
                  </div>
                </div>

                {/* Rewards & Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{m.rewardCoins}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+{m.rewardGems}</span>
                    </div>
                  </div>

                  {m.claimed ? (
                    <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {t.claimed_label}
                    </span>
                  ) : (
                    <button
                      onClick={() => onClaimReward(m.id)}
                      disabled={!m.completed}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow cursor-pointer ${
                        m.completed
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {t.claim_reward}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
