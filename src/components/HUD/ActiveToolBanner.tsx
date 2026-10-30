import React from 'react';
import { GameSettings, StructureType } from '../../types/game';
import { TRANSLATIONS, BUILDING_DEFINITIONS } from '../../constants/gameData';
import { X, Wrench, Waves, Undo2 } from 'lucide-react';

interface ActiveToolBannerProps {
  tool:
    | { mode: 'build'; structureType: StructureType }
    | { mode: 'terraform'; terraformType: 'lower' | 'raise' }
    | { mode: 'demolish' }
    | null;
  settings: GameSettings;
  onCancel: () => void;
}

export const ActiveToolBanner: React.FC<ActiveToolBannerProps> = ({ tool, settings, onCancel }) => {
  if (!tool) return null;

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const isRtl = settings.language === 'ar';

  let title = '';
  let hint = '';
  let icon = <Wrench className="w-4 h-4 text-amber-400" />;

  if (tool.mode === 'build') {
    const def = BUILDING_DEFINITIONS[tool.structureType];
    const bName = def ? t[def.nameKey] || def.id : tool.structureType;
    title = `${t.tab_build}: ${bName}`;
    hint = isRtl ? 'انقر على أي خلية أرضية لوضع المبنى' : 'Click on any land tile to place this building';
  } else if (tool.mode === 'terraform') {
    icon = <Waves className="w-4 h-4 text-sky-400" />;
    title = tool.terraformType === 'lower' ? t.terraform_active_lower : t.terraform_active_raise;
    hint = t.terraform_hint;
  } else if (tool.mode === 'demolish') {
    icon = <Undo2 className="w-4 h-4 text-rose-400" />;
    title = t.demolish_title;
    hint = t.demolish_desc;
  }

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in slide-in-from-top-4 duration-200 ${
        isRtl ? 'font-tajawal' : 'font-sans'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900/95 border border-amber-500/50 shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-4 backdrop-blur-md text-white">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="text-xs font-bold text-amber-300">{title}</div>
            <div className="text-[11px] text-slate-300 max-w-xs truncate">{hint}</div>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="flex items-center gap-1 bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow transition cursor-pointer border border-red-400/40"
        >
          <X className="w-3.5 h-3.5" />
          <span>{t.exit_tool}</span>
        </button>
      </div>
    </div>
  );
};
