/**
 * Web Audio Synthesizer and Local Track Player
 * 100% Procedural sound synthesis (zero 404s) + Local Device Audio Player
 */

import { loadCustomAudioTracks, saveCustomAudioTrack, deleteCustomAudioTrack } from '../storage/db';
import { CustomTrack } from '../types/game';

class AudioEngineClass {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;

  private audioElement: HTMLAudioElement | null = null;
  private currentTrackUrl: string | null = null;
  private customTracks: { track: CustomTrack; blob: Blob; url?: string }[] = [];
  private currentTrackIndex: number = -1;
  private isPlaying: boolean = false;
  private isSynthMusicActive: boolean = false;
  private synthMusicInterval: number | null = null;

  public sfxVolume: number = 0.8;
  public musicVolume: number = 0.6;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.sfxVolume;
        this.sfxGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public async loadStoredTracks(): Promise<CustomTrack[]> {
    const list = await loadCustomAudioTracks();
    this.customTracks = list.map((item) => {
      const url = URL.createObjectURL(item.blob);
      return { ...item, url };
    });
    return this.customTracks.map((t) => t.track);
  }

  public async importTrackFromFile(file: File): Promise<CustomTrack> {
    const track: CustomTrack = {
      id: 'track_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Device Storage',
      addedAt: Date.now(),
    };

    await saveCustomAudioTrack(track, file);
    const url = URL.createObjectURL(file);
    this.customTracks.push({ track, blob: file, url });
    return track;
  }

  public async removeTrack(id: string): Promise<void> {
    await deleteCustomAudioTrack(id);
    const idx = this.customTracks.findIndex((t) => t.track.id === id);
    if (idx !== -1) {
      if (this.customTracks[idx].url) {
        URL.revokeObjectURL(this.customTracks[idx].url!);
      }
      if (this.currentTrackIndex === idx) {
        this.stopAudio();
      }
      this.customTracks.splice(idx, 1);
    }
  }

  public playTrackByIndex(index: number, onEnded?: () => void) {
    this.initContext();
    this.stopSynthBGM();

    if (index < 0 || index >= this.customTracks.length) {
      // If no custom tracks, start procedural relaxing synth music
      this.startSynthBGM();
      this.isPlaying = true;
      return;
    }

    const item = this.customTracks[index];
    if (!item || !item.url) return;

    if (!this.audioElement) {
      this.audioElement = new Audio();
    }

    this.audioElement.src = item.url;
    this.audioElement.volume = this.musicVolume;
    this.audioElement.play().catch(() => {});
    this.isPlaying = true;
    this.currentTrackIndex = index;

    this.audioElement.onended = () => {
      if (onEnded) onEnded();
      else this.playNextTrack();
    };
  }

  public togglePlayPause(): boolean {
    this.initContext();
    if (this.isPlaying) {
      if (this.audioElement && !this.audioElement.paused) {
        this.audioElement.pause();
      }
      this.stopSynthBGM();
      this.isPlaying = false;
    } else {
      if (this.customTracks.length > 0 && this.currentTrackIndex >= 0) {
        this.audioElement?.play().catch(() => {});
        this.isPlaying = true;
      } else {
        this.startSynthBGM();
        this.isPlaying = true;
      }
    }
    return this.isPlaying;
  }

  public playNextTrack() {
    if (this.customTracks.length === 0) return;
    const nextIdx = (this.currentTrackIndex + 1) % this.customTracks.length;
    this.playTrackByIndex(nextIdx);
  }

  public playPrevTrack() {
    if (this.customTracks.length === 0) return;
    const prevIdx = (this.currentTrackIndex - 1 + this.customTracks.length) % this.customTracks.length;
    this.playTrackByIndex(prevIdx);
  }

  public stopAudio() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.stopSynthBGM();
    this.isPlaying = false;
  }

  public setVolumes(sfx: number, music: number) {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
    if (this.musicGain) this.musicGain.gain.value = music;
    if (this.audioElement) this.audioElement.volume = music;
  }

  /**
   * Procedural relaxing city synth soundtrack using harmonic oscillators
   */
  private startSynthBGM() {
    if (this.isSynthMusicActive) return;
    this.initContext();
    if (!this.ctx) return;

    this.isSynthMusicActive = true;
    const notes = [261.63, 329.63, 392.0, 523.25, 440.0, 349.23, 293.66, 392.0]; // C Major pentatonic
    let step = 0;

    const playChord = () => {
      if (!this.isSynthMusicActive || !this.ctx || !this.musicGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.value = 650;

      const note = notes[step % notes.length];
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12 * this.musicVolume, this.ctx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 4.0);

      step++;
    };

    playChord();
    this.synthMusicInterval = window.setInterval(playChord, 2200);
  }

  private stopSynthBGM() {
    this.isSynthMusicActive = false;
    if (this.synthMusicInterval) {
      clearInterval(this.synthMusicInterval);
      this.synthMusicInterval = null;
    }
  }

  // --- PROCEDURAL SOUND EFFECTS (ZERO EXTERNAL ASSETS) ---

  public playPlaceSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playCoinSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const delay = idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  }

  public playDemolishSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playLevelUpSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C (major triumph)
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + i * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  public playWaterSplashSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public getCurrentTrack(): CustomTrack | null {
    if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.customTracks.length) {
      return this.customTracks[this.currentTrackIndex].track;
    }
    return null;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const AudioEngine = new AudioEngineClass();
