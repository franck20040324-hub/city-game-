import React from 'react';
import { CitizenEvent, GameSettings } from '../../types/game';
import { TRANSLATIONS } from '../../constants/gameData';
import { X, Users2, Sparkles, Heart } from 'lucide-react';

interface CitizenEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  events: CitizenEvent[];
  onResolveEvent: (eventId: string, choiceId: string) => void;
}

export const CitizenEventsModal: React.FC<CitizenEventsModalProps> = ({
  isOpen,
  onClose,
  settings,
  events,
  onResolveEvent,
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-violet-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">{t.citizen_events_title}</h2>
              <p className="text-xs text-slate-400">{t.citizen_events_subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Events content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">{t.event_completed}</p>
            </div>
          ) : (
            events.map((ev) => {
              const title = t[ev.titleKey] || ev.id;
              const desc = t[ev.descKey] || '';

              return (
                <div
                  key={ev.id}
                  className="bg-slate-800/60 border border-violet-500/30 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ev.icon}</span>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-violet-200">{title}</h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>

                  {/* Decision Choices */}
                  <div className="space-y-2 pt-2 border-t border-slate-700/50">
                    {ev.choices.map((c) => {
                      const text = t[c.textKey] || c.id;

                      return (
                        <button
                          key={c.id}
                          onClick={() => onResolveEvent(ev.id, c.id)}
                          className="w-full text-left flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-violet-900/30 border border-slate-700 hover:border-violet-500/50 transition cursor-pointer group"
                        >
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-violet-200">
                            {text}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {c.rewardGems && c.rewardGems > 0 && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                <Sparkles className="w-3 h-3" />
                                +{c.rewardGems}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                              <Heart className="w-3 h-3 fill-rose-400" />
                              +{c.happinessImpact}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
