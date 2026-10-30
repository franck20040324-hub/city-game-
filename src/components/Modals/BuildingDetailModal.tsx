import React from 'react';
import { PlacedStructure, GameSettings } from '../../types/game';
import { BUILDING_DEFINITIONS, TRANSLATIONS } from '../../constants/gameData';
import { X, Building2, Users, Coins, Sparkles, ArrowUpCircle, Trash2, Clock } from 'lucide-react';

interface BuildingDetailModalProps {
  structure: PlacedStructure | null;
  settings: GameSettings;
  userCoins: number;
  userGems: number;
  onClose: () => void;
  onUpgrade: (instanceId: string) => void;
  onSpeedup: (instanceId: string) => void;
  onRefundDemolish: (instanceId: string) => void;
}

export const BuildingDetailModal: React.FC<BuildingDetailModalProps> = ({
  structure,
  settings,
  userCoins,
  userGems,
  onClose,
  onUpgrade,
  onSpeedup,
  onRefundDemolish,
}) => {
  if (!structure) return null;

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const isRtl = settings.language === 'ar';
  const def = BUILDING_DEFINITIONS[structure.type];
  if (!def) return null;

  const bName = t[def.nameKey] || structure.type;
  const bDesc = t[def.descKey] || '';
  const currentResidents = def.populationBonus * structure.level;
  const currentTax = Math.round(def.taxIncomeRate * structure.level);

  const upgradeCost = Math.round(def.costCoins * def.upgradeCostMultiplier * structure.level * 0.7);
  const canUpgrade = def.canUpgrade && structure.level < def.maxLevel && structure.status === 'active';
  const canAffordUpgrade = userCoins >= upgradeCost;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 ${
        isRtl ? 'font-tajawal' : 'font-sans'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-md text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">{bName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details & Specs */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">{bDesc}</p>

          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2.5 text-center">
              <span className="text-[11px] text-slate-400 block">{t.level_stat}</span>
              <span className="text-sm font-bold text-amber-300">
                {structure.level} / {def.maxLevel}
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2.5 text-center">
              <span className="text-[11px] text-slate-400 block">{t.residents_stat}</span>
              <span className="text-sm font-bold text-sky-300">{currentResidents}</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2.5 text-center">
              <span className="text-[11px] text-slate-400 block">{t.tax_output_stat}</span>
              <span className="text-sm font-bold text-emerald-300">+{currentTax}/min</span>
            </div>
          </div>

          {/* Status banner */}
          {structure.status !== 'active' && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-200">
                  {structure.status === 'constructing' ? t.status_constructing : t.status_upgrading}
                </span>
              </div>
              <button
                onClick={() => onSpeedup(structure.instanceId)}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>2 {t.gems_label}</span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {canUpgrade && (
              <button
                onClick={() => {
                  onUpgrade(structure.instanceId);
                  onClose();
                }}
                disabled={!canAffordUpgrade}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition shadow cursor-pointer ${
                  canAffordUpgrade
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>
                  {t.upgrade_btn} ({upgradeCost.toLocaleString()} Coins)
                </span>
              </button>
            )}

            {/* 100% Refund Bulldoze Button */}
            <button
              onClick={() => {
                onRefundDemolish(structure.instanceId);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/40 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>
                {t.cancel_refund_btn} (+{structure.originalCostCoins.toLocaleString()} Coins)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
