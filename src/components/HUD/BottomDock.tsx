import React, { useState } from 'react';
import { GameSettings } from '../../types/game';
import { TRANSLATIONS } from '../../constants/gameData';
import {
  Building2,
  Navigation,
  Waves,
  Undo2,
  Target,
  Users2,
  Music,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BottomDockProps {
  settings: GameSettings;
  activeTab: string | null;
  onSelectTab: (tab: string) => void;
  onEnterDemolishMode: () => void;
  onEnterTerraformMode: (type: 'lower' | 'raise') => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  settings,
  activeTab,
  onSelectTab,
  onEnterDemolishMode,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const isRtl = settings.language === 'ar';

  const dockTabs = [
    { id: 'build', label: t.tab_build, icon: Building2, color: 'text-amber-400' },
    { id: 'roads', label: t.tab_roads, icon: Navigation, color: 'text-sky-400' },
    { id: 'terraform', label: t.tab_terraform, icon: Waves, color: 'text-teal-400' },
    { id: 'demolish', label: t.tab_demolish, icon: Undo2, color: 'text-rose-400' },
    { id: 'missions', label: t.tab_missions, icon: Target, color: 'text-emerald-400' },
    { id: 'citizens', label: t.tab_citizens, icon: Users2, color: 'text-violet-400' },
    { id: 'music', label: t.tab_music, icon: Music, color: 'text-pink-400' },
    { id: 'settings', label: t.tab_settings, icon: Settings, color: 'text-slate-400' },
  ];

  const handleTabClick = (id: string) => {
    if (id === 'demolish') {
      onEnterDemolishMode();
    } else {
      onSelectTab(id);
    }
  };

  return (
    <div
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 w-[96vw] max-w-4xl select-none ${
        collapsed ? 'translate-y-[calc(100%-2.2rem)]' : 'translate-y-0'
      } ${isRtl ? 'font-tajawal' : 'font-sans'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Collapse / Expand Toggle Tab */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80 rounded-t-xl text-xs font-semibold shadow-lg backdrop-blur-md cursor-pointer transition hover:bg-slate-800"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{collapsed ? t.dock_expand : t.dock_collapse}</span>
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <nav className="bg-slate-900/95 border border-slate-700/80 shadow-2xl rounded-2xl p-2 backdrop-blur-lg">
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
          {dockTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center min-w-[4.2rem] sm:min-w-[5.2rem] py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center group ${
                  isActive
                    ? 'bg-amber-500/20 border border-amber-500/50 shadow-inner'
                    : 'hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${tab.color} ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-xs font-medium whitespace-nowrap leading-tight ${
                    isActive ? 'text-amber-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
