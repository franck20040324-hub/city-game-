import React from 'react';
import { GameSettings } from '../../types/game';
import { TRANSLATIONS } from '../../constants/gameData';
import { X, Waves, ArrowDown, ArrowUp, Mountain } from 'lucide-react';

interface TerraformModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSelectTerraform: (type: 'lower' | 'raise') => void;
}

export const TerraformModal: React.FC<TerraformModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSelectTerraform,
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-teal-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">{t.terraform_title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content options */}
        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{t.terraform_hint}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Lower Ground Button */}
            <button
              onClick={() => {
                onSelectTerraform('lower');
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 bg-teal-950/40 hover:bg-teal-900/50 border border-teal-500/40 rounded-2xl transition cursor-pointer group text-center"
            >
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ArrowDown className="w-6 h-6 text-teal-300" />
              </div>
              <h3 className="font-bold text-sm text-teal-200">{t.terraform_lower}</h3>
              <span className="text-[11px] text-teal-400/80 mt-1">80 Coins / tile</span>
            </button>

            {/* Raise Ground Button */}
            <button
              onClick={() => {
                onSelectTerraform('raise');
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-2xl transition cursor-pointer group text-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ArrowUp className="w-6 h-6 text-emerald-300" />
              </div>
              <h3 className="font-bold text-sm text-emerald-200">{t.terraform_raise}</h3>
              <span className="text-[11px] text-emerald-400/80 mt-1">80 Coins / tile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
