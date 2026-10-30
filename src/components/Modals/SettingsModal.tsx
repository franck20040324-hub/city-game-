import React from 'react';
import { GameSettings } from '../../types/game';
import { TRANSLATIONS } from '../../constants/gameData';
import {
  X,
  Settings,
  Languages,
  Volume2,
  Music,
  Sun,
  Cpu,
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { AudioEngine } from '../../audio/AudioEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onManualSave: () => void;
  onResetCity: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onManualSave,
  onResetCity,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const isRtl = settings.language === 'ar';

  const handleSoundFxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ ...settings, soundFxVolume: val });
    AudioEngine.setVolumes(val, settings.musicVolume);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ ...settings, musicVolume: val });
    AudioEngine.setVolumes(settings.soundFxVolume, val);
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ ...settings, brightness: val });
  };

  const handleLanguageToggle = () => {
    const nextLang = settings.language === 'en' ? 'ar' : 'en';
    onUpdateSettings({ ...settings, language: nextLang });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ ...settings, graphicsQuality: e.target.value as any });
  };

  const handleSpeedChange = (speed: number) => {
    onUpdateSettings({ ...settings, dayNightSpeed: speed });
  };

  const handleResetConfirm = () => {
    if (window.confirm(t.reset_confirm)) {
      onResetCity();
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 ${
        isRtl ? 'font-tajawal' : 'font-sans'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">{t.settings_title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {/* Language Switcher */}
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-slate-200">{t.lang_select}</span>
            </div>
            <button
              onClick={handleLanguageToggle}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer shadow"
            >
              {settings.language === 'en' ? 'العربية (Arabic)' : 'English (الإنجليزية)'}
            </button>
          </div>

          {/* Sound FX Slider */}
          <div className="space-y-1.5 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-slate-300">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                {t.sound_fx_label}
              </span>
              <span className="font-mono text-slate-400">{Math.round(settings.soundFxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundFxVolume}
              onChange={handleSoundFxChange}
              className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Music Volume Slider */}
          <div className="space-y-1.5 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-slate-300">
                <Music className="w-4 h-4 text-pink-400" />
                {t.music_vol_label}
              </span>
              <span className="font-mono text-slate-400">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={handleMusicChange}
              className="w-full accent-pink-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Brightness Slider */}
          <div className="space-y-1.5 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-slate-300">
                <Sun className="w-4 h-4 text-amber-400" />
                {t.brightness_label}
              </span>
              <span className="font-mono text-slate-400">{Math.round(settings.brightness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.4"
              step="0.05"
              value={settings.brightness}
              onChange={handleBrightnessChange}
              className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Graphics Quality (Snapdragon 662 optimized) */}
          <div className="space-y-1.5 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2 font-medium text-slate-300">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>{t.graphics_quality}</span>
            </div>
            <select
              value={settings.graphicsQuality}
              onChange={handleQualityChange}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 cursor-pointer text-xs"
            >
              <option value="low">{t.graphics_low}</option>
              <option value="balanced">{t.graphics_balanced}</option>
              <option value="high">{t.graphics_high}</option>
            </select>
          </div>

          {/* Day / Night Cycle Speed */}
          <div className="space-y-2 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2 font-medium text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{t.day_night_speed}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { speed: 0, label: t.speed_pause },
                { speed: 1, label: t.speed_normal },
                { speed: 2, label: t.speed_fast },
              ].map((s) => (
                <button
                  key={s.speed}
                  onClick={() => handleSpeedChange(s.speed)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    settings.dayNightSpeed === s.speed
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Save Status Notice */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t.auto_save_notice}</p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                onManualSave();
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700"
            >
              <Save className="w-4 h-4" />
              <span>{t.manual_save_btn}</span>
            </button>

            <button
              onClick={handleResetConfirm}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold text-xs transition cursor-pointer border border-rose-500/40"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.manual_reset_btn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
