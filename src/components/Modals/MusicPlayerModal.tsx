import React, { useState, useEffect, useRef } from 'react';
import { CustomTrack, GameSettings } from '../../types/game';
import { TRANSLATIONS } from '../../constants/gameData';
import { AudioEngine } from '../../audio/AudioEngine';
import {
  X,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Upload,
  Trash2,
  Volume2,
  Headphones,
} from 'lucide-react';

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

export const MusicPlayerModal: React.FC<MusicPlayerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [tracks, setTracks] = useState<CustomTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<CustomTrack | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const isRtl = settings.language === 'ar';

  useEffect(() => {
    if (isOpen) {
      AudioEngine.loadStoredTracks().then((stored) => {
        setTracks(stored);
        setIsPlaying(AudioEngine.getIsPlaying());
        setCurrentTrack(AudioEngine.getCurrentTrack());
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
        const added = await AudioEngine.importTrackFromFile(file);
        setTracks((prev) => [...prev, added]);
      }
    }
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTogglePlay = () => {
    const playing = AudioEngine.togglePlayPause();
    setIsPlaying(playing);
    setCurrentTrack(AudioEngine.getCurrentTrack());
  };

  const handlePlayIndex = (idx: number) => {
    AudioEngine.playTrackByIndex(idx, () => {
      setIsPlaying(AudioEngine.getIsPlaying());
      setCurrentTrack(AudioEngine.getCurrentTrack());
    });
    setIsPlaying(true);
    setCurrentTrack(tracks[idx] || null);
  };

  const handleNext = () => {
    AudioEngine.playNextTrack();
    setIsPlaying(true);
    setCurrentTrack(AudioEngine.getCurrentTrack());
  };

  const handlePrev = () => {
    AudioEngine.playPrevTrack();
    setIsPlaying(true);
    setCurrentTrack(AudioEngine.getCurrentTrack());
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await AudioEngine.removeTrack(id);
    setTracks((prev) => prev.filter((t) => t.id !== id));
    if (currentTrack?.id === id) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    onUpdateSettings({ ...settings, musicVolume: vol });
    AudioEngine.setVolumes(settings.soundFxVolume, vol);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 ${
        isRtl ? 'font-tajawal' : 'font-sans'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-pink-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">{t.music_player_title}</h2>
              <p className="text-xs text-slate-400 max-w-md line-clamp-1">{t.music_player_desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Controls Deck */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-300">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  {t.now_playing}
                </div>
                <div className="text-sm font-bold text-white truncate max-w-xs">
                  {currentTrack ? currentTrack.title : t.track_default_1}
                </div>
              </div>
            </div>

            {/* Play/Pause & Skip */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={handleTogglePlay}
                className="p-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-slate-950 hover:brightness-110 active:scale-95 transition shadow-lg cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950" />}
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-3 pt-1">
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={handleVolumeChange}
              className="w-full accent-pink-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Import from Device Button */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-pink-600/80 hover:bg-pink-600 text-white font-bold text-xs shadow-md transition cursor-pointer border border-pink-400/30"
          >
            <Upload className="w-4 h-4" />
            <span>{loading ? 'Importing...' : t.upload_device_song}</span>
          </button>
        </div>

        {/* Persistent Playlist */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          <div className="text-xs font-semibold text-slate-400 mb-1">
            {isRtl ? 'قائمة الأغاني المحفوظة محلياً' : 'Stored Device & Ambient Playlist'}
          </div>

          {/* Built-in procedural soundtrack tracks */}
          {[t.track_default_1, t.track_default_2, t.track_default_3].map((defTitle, i) => (
            <div
              key={`def_${i}`}
              onClick={() => {
                AudioEngine.playTrackByIndex(-1);
                setIsPlaying(true);
                setCurrentTrack({
                  id: `def_${i}`,
                  title: defTitle,
                  artist: 'Built-in Synth',
                  addedAt: 0,
                });
              }}
              className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-200">{defTitle}</span>
              </div>
              <span className="text-[10px] text-pink-400/80 font-mono">BGM</span>
            </div>
          ))}

          {/* User imported local tracks */}
          {tracks.map((tr, idx) => {
            const isCurrent = currentTrack?.id === tr.id;

            return (
              <div
                key={tr.id}
                onClick={() => handlePlayIndex(idx)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  isCurrent
                    ? 'bg-pink-950/40 border-pink-500/50 text-pink-200'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Music className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-pink-400' : 'text-slate-400'}`} />
                  <div className="truncate">
                    <div className="text-xs font-semibold truncate">{tr.title}</div>
                    <div className="text-[10px] text-slate-400">{tr.artist}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDelete(tr.id, e)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    title={t.delete_track}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {tracks.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">{t.no_custom_tracks}</p>
          )}
        </div>
      </div>
    </div>
  );
};
