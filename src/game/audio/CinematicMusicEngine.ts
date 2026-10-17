/**
 * Street Justice — Cinematic Melodic Soundtrack System
 * 
 * Multi-layer procedural synthesizer & audio engine producing authentic,
 * melodic, high-fidelity music for menus, exploration, missions, combat, and victory.
 * 
 * Features:
 * - Handcrafted chord progressions, piano motifs, warm string pads, sub-bass, and downtempo grooves.
 * - Zero external asset dependency required — 100% legal, genuine Web Audio synthesis.
 * - Dynamic equal-power crossfading between gameplay states.
 * - Audio ducking during radio dispatch calls.
 * - Full audio controls: separate music/sfx volume, mute, pause/resume, track information.
 * - Resilient mobile autoplay unlocking on first user interaction.
 */

export type MusicTheme = 'menu' | 'exploration' | 'mission' | 'combat' | 'victory';

export interface TrackInfo {
  id: MusicTheme;
  title: string;
  subtitle: string;
  genre: string;
  bpm: number;
  key: string;
  description: string;
}

export const SOUNDTRACK_TRACKS: Record<MusicTheme, TrackInfo> = {
  menu: {
    id: 'menu',
    title: 'Neon Rain & Blue Embers',
    subtitle: 'Main Theme · Precinct 9 Noir',
    genre: 'Cinematic Ambient Noir / Downtempo',
    bpm: 72,
    key: 'D minor / F major',
    description: 'Atmospheric piano, warm analog synthesizers, subtle strings, and nocturnal urban ambience.',
  },
  exploration: {
    id: 'exploration',
    title: 'Precinct Midnight Patrol',
    subtitle: 'Free Roam & City Exploration',
    genre: 'Urban Jazz-Noir / Lo-Fi Groove',
    bpm: 82,
    key: 'A minor / C major',
    description: 'Relaxing, immersive Rhodes piano progressions and warm sub-bass for cruising Metro City.',
  },
  mission: {
    id: 'mission',
    title: 'Undercover Wiretap',
    subtitle: 'Active Investigation & Stakeout',
    genre: 'Dark Ambient / Thriller Pulse',
    bpm: 94,
    key: 'D minor',
    description: 'Tense rhythmic sequences, brooding synth pulses, and suspenseful cinematic pads.',
  },
  combat: {
    id: 'combat',
    title: 'Redline Code 3',
    subtitle: 'High Pursuit & Tactical Encounter',
    genre: 'Cinematic Action / Synthwave Chase',
    bpm: 122,
    key: 'E minor',
    description: 'Driving arpeggios, punchy percussion, brass stabs, and urgent police pursuit tempo.',
  },
  victory: {
    id: 'victory',
    title: 'City Restored',
    subtitle: 'Case Solved & Mission Accomplished',
    genre: 'Majestic Orchestral / Neo-Classical',
    bpm: 86,
    key: 'C major / F major',
    description: 'Warm, uplifting piano cascade, resonant string swell, and harmonious civic resolution.',
  },
};

// Standard frequencies for precise melodic voice synthesis across Octaves 1-7
const noteOffsets: Record<string, number> = {
  C: 0, 'C#': 1, Cs: 1, Db: 1,
  D: 2, 'D#': 3, Ds: 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Fs: 6, Gb: 6,
  G: 7, 'G#': 8, Gs: 8, Ab: 8,
  A: 9, 'A#': 10, As: 10, Bb: 10,
  B: 11,
};

const rawNotes: Record<string, number> = {};
for (let oct = 1; oct <= 7; oct++) {
  for (const [name, semitone] of Object.entries(noteOffsets)) {
    // MIDI note number: C4 is 60, A4 is 69 (440 Hz)
    const midi = (oct + 1) * 12 + semitone;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    rawNotes[`${name}${oct}`] = Number(freq.toFixed(2));
  }
}

// Proxy wrapper so any note key safely resolves to a valid finite frequency
export const N: Record<string, number> = new Proxy(rawNotes, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    return 440; // Safe musical fallback if an undefined note key is accessed
  },
});

export class CinematicMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private isUnlocked: boolean = false;

  // Volume & Playback state
  private musicVolume: number = 0.65;
  private isMuted: boolean = false;
  private isPaused: boolean = false;
  private currentTheme: MusicTheme = 'menu';
  private targetTheme: MusicTheme = 'menu';

  // Active theme player loops
  private activeSequenceTimer: number | null = null;
  private sequenceStep: number = 0;
  private currentBpm: number = 72;
  private beatIntervalMs: number = 833;

  // Active sound generator nodes to stop cleanly on transition
  private sustainedNodes: (AudioNode & { stop?: (when?: number) => void })[] = [];
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private ambientNoiseGain: GainNode | null = null;

  // Dynamic ducking (for radio communications)
  private isDucked: boolean = false;
  private duckRestoreTimer: number | null = null;

  // Custom audio track element (if player provides an external audio file/URL)
  private externalAudioElement: HTMLAudioElement | null = null;
  private isUsingExternalTrack: boolean = false;

  constructor() {
    this.loadPersistedSettings();
    this.setupAutoplayUnlocking();
  }

  private loadPersistedSettings() {
    try {
      const saved = localStorage.getItem('street_justice_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.musicVolume === 'number') {
          this.musicVolume = Math.max(0, Math.min(1, parsed.musicVolume));
        }
        if (typeof parsed.isMusicMuted === 'boolean') {
          this.isMuted = parsed.isMusicMuted;
        }
      }
    } catch {
      // Storage unavailable
    }
  }

  private saveSettings() {
    try {
      const existing = localStorage.getItem('street_justice_audio_settings');
      const parsed = existing ? JSON.parse(existing) : {};
      parsed.musicVolume = this.musicVolume;
      parsed.isMusicMuted = this.isMuted;
      localStorage.setItem('street_justice_audio_settings', JSON.stringify(parsed));
    } catch {}
  }

  /**
   * Initializes or gets the shared Web Audio Context.
   */
  public getAudioContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.musicBus = this.ctx.createGain();

        // Connect Music Bus -> Master Gain -> Destination
        this.musicBus.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.updateBusGain();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMusicBus(): GainNode | null {
    this.getAudioContext();
    return this.musicBus;
  }

  public getMasterGain(): GainNode | null {
    this.getAudioContext();
    return this.masterGain;
  }

  /**
   * Browser autoplay policy unlocking: attaches one-time listeners to document.
   */
  private setupAutoplayUnlocking() {
    const unlockHandler = () => {
      this.unlockAudio();
    };

    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach((eventName) => {
      window.addEventListener(eventName, unlockHandler, { once: true, passive: true });
    });
  }

  public unlockAudio(): boolean {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        this.isUnlocked = true;
        if (!this.isPaused && !this.activeSequenceTimer && !this.isUsingExternalTrack) {
          this.startSequence(this.currentTheme);
        }
      }).catch(() => {});
      return true;
    }
    this.isUnlocked = true;
    return true;
  }

  public isAudioContextUnlocked(): boolean {
    return this.ctx ? this.ctx.state === 'running' : false;
  }

  // ==========================================
  // VOLUME & AUDIO CONTROLS
  // ==========================================

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    this.updateBusGain();

    if (this.externalAudioElement) {
      this.externalAudioElement.volume = this.isMuted ? 0 : this.musicVolume;
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.saveSettings();
    this.updateBusGain();

    if (this.externalAudioElement) {
      this.externalAudioElement.muted = muted;
    }
  }

  public isMusicMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public pause() {
    this.isPaused = true;
    this.fadeMusicBus(0, 0.4);
    if (this.externalAudioElement) {
      this.externalAudioElement.pause();
    }
  }

  public resume() {
    this.isPaused = false;
    this.unlockAudio();
    this.updateBusGain();
    if (this.externalAudioElement) {
      this.externalAudioElement.play().catch(() => {});
    } else if (!this.activeSequenceTimer) {
      this.startSequence(this.currentTheme);
    }
  }

  public isMusicPaused(): boolean {
    return this.isPaused;
  }

  private updateBusGain() {
    if (!this.musicBus || !this.ctx) return;
    const targetGain = this.isMuted || this.isPaused ? 0 : this.isDucked ? this.musicVolume * 0.35 : this.musicVolume;
    const safeTarget = Number.isFinite(targetGain) ? Math.max(0, targetGain) : 0;
    const t = this.ctx.currentTime;
    const currentVal = Number.isFinite(this.musicBus.gain.value) ? this.musicBus.gain.value : 0;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setValueAtTime(currentVal, t);
    this.musicBus.gain.linearRampToValueAtTime(safeTarget, t + 0.15);
  }

  private fadeMusicBus(target: number, duration: number = 1.0) {
    if (!this.musicBus || !this.ctx) return;
    const safeTarget = Number.isFinite(target) ? Math.max(0, target) : 0;
    const safeDur = Number.isFinite(duration) && duration > 0 ? duration : 1.0;
    const t = this.ctx.currentTime;
    const currentVal = Number.isFinite(this.musicBus.gain.value) ? this.musicBus.gain.value : 0;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setValueAtTime(currentVal, t);
    this.musicBus.gain.linearRampToValueAtTime(safeTarget, t + safeDur);
  }

  /**
   * Duck music volume temporarily during radio calls, police dispatch, or megaphone order
   */
  public duckMusic(durationSeconds: number = 3.0) {
    if (this.isDucked) {
      if (this.duckRestoreTimer) clearTimeout(this.duckRestoreTimer);
    }
    this.isDucked = true;
    this.updateBusGain();

    this.duckRestoreTimer = window.setTimeout(() => {
      this.isDucked = false;
      this.duckRestoreTimer = null;
      this.updateBusGain();
    }, durationSeconds * 1000);
  }

  // ==========================================
  // THEME PLAYBACK & DYNAMIC TRANSITIONS
  // ==========================================

  public getCurrentTheme(): MusicTheme {
    return this.currentTheme;
  }

  public getCurrentTrackInfo(): TrackInfo {
    return SOUNDTRACK_TRACKS[this.currentTheme] || SOUNDTRACK_TRACKS.menu;
  }

  /**
   * Transitions to a new music theme smoothly with crossfading.
   * Avoids abrupt restarts if already playing this theme.
   */
  public playTheme(theme: MusicTheme, forceRestart: boolean = false) {
    if (this.currentTheme === theme && !forceRestart && this.activeSequenceTimer) {
      return;
    }

    this.targetTheme = theme;
    this.unlockAudio();

    if (this.isUsingExternalTrack) {
      this.currentTheme = theme;
      return;
    }

    // Perform smooth crossfade transition
    if (this.activeSequenceTimer) {
      this.fadeMusicBus(this.musicVolume * 0.25, 1.2);
      window.setTimeout(() => {
        this.stopActiveSequence();
        this.currentTheme = theme;
        this.startSequence(theme);
        this.fadeMusicBus(this.musicVolume, 1.2);
      }, 1200);
    } else {
      this.currentTheme = theme;
      this.startSequence(theme);
    }
  }

  private stopActiveSequence() {
    if (this.activeSequenceTimer) {
      clearInterval(this.activeSequenceTimer);
      this.activeSequenceTimer = null;
    }

    // Gently fade out active sustained voices
    if (this.ctx) {
      const t = this.ctx.currentTime;
      for (const node of this.sustainedNodes) {
        try {
          if ('gain' in node && (node as GainNode).gain) {
            (node as GainNode).gain.linearRampToValueAtTime(0, t + 0.8);
          }
          if (node.stop) {
            node.stop(t + 0.85);
          }
        } catch {}
      }
    }
    this.sustainedNodes = [];
    this.sequenceStep = 0;
  }

  public startSequence(theme: MusicTheme) {
    this.stopActiveSequence();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.currentBpm = SOUNDTRACK_TRACKS[theme]?.bpm || 72;
    this.beatIntervalMs = Math.round((60000 / this.currentBpm) / 2); // 8th note resolution

    this.sequenceStep = 0;

    // Start subtle city rain/tape warmth for noir menu and exploration
    if (theme === 'menu' || theme === 'exploration') {
      this.startAmbientNoirWarmth();
    } else {
      this.stopAmbientNoirWarmth();
    }

    // Trigger initial beat immediately
    this.stepMusicSequencer(theme);

    // Run rhythmic sequencer
    this.activeSequenceTimer = window.setInterval(() => {
      if (this.isPaused) return;
      this.stepMusicSequencer(theme);
    }, this.beatIntervalMs);
  }

  // ==========================================
  // PROCEDURAL INSTRUMENT GENERATORS
  // ==========================================

  /**
   * Soft Felt / Rhodes Electric Piano Voice
   * Rich multi-harmonic additive tone with warm exponential decay.
   */
  private playPianoNote(freq: number, duration: number = 1.6, velocity: number = 0.7, detuneCents: number = 0) {
    if (!this.ctx || !this.musicBus || this.isMuted) return;
    if (typeof freq !== 'number' || !Number.isFinite(freq) || freq <= 20 || freq > 20000) return;
    const vel = typeof velocity === 'number' && Number.isFinite(velocity) && velocity > 0 ? velocity : 0.7;
    const dur = typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 1.6;
    const detune = typeof detuneCents === 'number' && Number.isFinite(detuneCents) ? detuneCents : 0;
    const t = this.ctx.currentTime;

    // Fundamental Sine
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    osc1.detune.setValueAtTime(detune, t);

    // Warm 2nd Harmonic (Triangle for mellow body)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);
    osc2.detune.setValueAtTime(detune + 2, t);

    // 3rd Harmonic Sine (adds sweet Rhodes bell overtone)
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, t);

    // Velocity-sensitive lowpass filter with gentle filter decay
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoff = Math.min(3200, Math.max(100, freq * (3.0 + vel * 2.5)));
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(220, freq * 1.4), t + dur);

    // Envelope Gain
    const gain = this.ctx.createGain();
    const peak = Math.max(0.001, 0.22 * vel);
    gain.gain.setValueAtTime(0.001, t);
    // Felt strike attack (12ms)
    gain.gain.linearRampToValueAtTime(peak, t + 0.012);
    // Smooth natural decay
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.45), t + Math.min(0.4, dur * 0.5));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    // 2nd and 3rd harmonic gains
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.35, t);
    const gain3 = this.ctx.createGain();
    gain3.gain.setValueAtTime(0.12, t);

    osc1.connect(gain);
    osc2.connect(gain2);
    gain2.connect(gain);
    osc3.connect(gain3);
    gain3.connect(gain);

    gain.connect(filter);
    filter.connect(this.musicBus);

    osc1.start(t);
    osc2.start(t);
    osc3.start(t);

    osc1.stop(t + dur);
    osc2.stop(t + dur);
    osc3.stop(t + dur);
  }

  /**
   * Warm Analog String & Synthesizer Pad Voice
   * Detuned dual sawtooth with smooth lowpass filter and long cinematic swells.
   */
  private playPadChord(freqs: number[], duration: number = 3.6, volume: number = 0.16) {
    if (!this.ctx || !this.musicBus || this.isMuted) return;
    if (!Array.isArray(freqs) || freqs.length === 0) return;
    const validFreqs = freqs.filter((f) => typeof f === 'number' && Number.isFinite(f) && f > 20 && f < 20000);
    if (validFreqs.length === 0) return;

    const dur = typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 3.6;
    const vol = Math.max(0.001, typeof volume === 'number' && Number.isFinite(volume) && volume > 0 ? volume : 0.16);
    const t = this.ctx.currentTime;

    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(750, t);
    padFilter.frequency.linearRampToValueAtTime(1150, t + dur * 0.4);
    padFilter.frequency.linearRampToValueAtTime(650, t + dur);

    const masterPadGain = this.ctx.createGain();
    masterPadGain.gain.setValueAtTime(0.001, t);
    masterPadGain.gain.linearRampToValueAtTime(vol, t + Math.min(0.9, dur * 0.3)); // Gentle slow cinematic swell
    masterPadGain.gain.linearRampToValueAtTime(Math.max(0.0001, vol * 0.7), t + dur * 0.7);
    masterPadGain.gain.linearRampToValueAtTime(0.0001, t + dur);

    padFilter.connect(masterPadGain);
    masterPadGain.connect(this.musicBus);

    validFreqs.forEach((freq) => {
      if (!this.ctx) return;
      // Spread 2 detuned oscillators for lush stereo chorus width
      [-6, 6].forEach((cents) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        osc.detune.setValueAtTime(cents, t);

        const vGain = this.ctx.createGain();
        vGain.gain.setValueAtTime(0.24, t);

        osc.connect(vGain);
        vGain.connect(padFilter);

        osc.start(t);
        osc.stop(t + dur);
      });
    });
  }

  /**
   * Deep Warm Neo-Noir Sub Bass Voice
   */
  private playSubBassNote(freq: number, duration: number = 1.8, volume: number = 0.32) {
    if (!this.ctx || !this.musicBus || this.isMuted) return;
    if (typeof freq !== 'number' || !Number.isFinite(freq) || freq <= 20 || freq > 4000) return;
    const dur = typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 1.8;
    const vol = Math.max(0.001, typeof volume === 'number' && Number.isFinite(volume) && volume > 0 ? volume : 0.32);
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    // Sub sine harmonic
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * 0.6), t + dur * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    osc.start(t);
    sub.start(t);
    osc.stop(t + dur);
    sub.stop(t + dur);
  }

  /**
   * Expressive Melodic Lead Synth Voice (with subtle vibrato)
   */
  private playLeadNote(freq: number, duration: number = 1.4, volume: number = 0.22) {
    if (!this.ctx || !this.musicBus || this.isMuted) return;
    if (typeof freq !== 'number' || !Number.isFinite(freq) || freq <= 20 || freq > 20000) return;
    const dur = typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 1.4;
    const vol = Math.max(0.001, typeof volume === 'number' && Number.isFinite(volume) && volume > 0 ? volume : 0.22);
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Subtle natural vibrato LFO (5.2 Hz after 0.25s)
    const vibrato = this.ctx.createOscillator();
    vibrato.frequency.setValueAtTime(5.2, t);
    const vibGain = this.ctx.createGain();
    vibGain.gain.setValueAtTime(0, t);
    vibGain.gain.linearRampToValueAtTime(6.5, t + 0.4); // Cents modulation
    vibrato.connect(vibGain);
    vibGain.connect(osc.detune);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * 0.5), t + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    osc.start(t);
    vibrato.start(t);
    osc.stop(t + dur);
    vibrato.stop(t + dur);
  }

  /**
   * Soft downtempo organic pulse: brushed kick or gentle rimshot
   */
  private playDowntempoDrum(type: 'kick' | 'rimshot' | 'shaker', volume: number = 0.18) {
    if (!this.ctx || !this.musicBus || this.isMuted) return;
    const vol = Math.max(0.001, typeof volume === 'number' && Number.isFinite(volume) && volume > 0 ? volume : 0.18);
    const t = this.ctx.currentTime;

    if (type === 'kick') {
      // Warm, punchy 808-style low sub kick (non-distorting)
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.85, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.musicBus);
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (type === 'rimshot') {
      // Soft wood/metal rim tap
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.04);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.musicBus);
      osc.start(t);
      osc.stop(t + 0.05);
    } else {
      // Gentle brushed shaker
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4500, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicBus);

      noise.start(t);
      noise.stop(t + 0.05);
    }
  }

  /**
   * Ambient Noir Rain & Vinyl Warmth Texture
   */
  private startAmbientNoirWarmth() {
    if (this.ambientNoiseSource || !this.ctx || !this.musicBus) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 4.0);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filtering for warm night rain texture
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.04;
      }

      this.ambientNoiseSource = this.ctx.createBufferSource();
      this.ambientNoiseSource.buffer = buffer;
      this.ambientNoiseSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      this.ambientNoiseGain = this.ctx.createGain();
      this.ambientNoiseGain.gain.setValueAtTime(0.035, this.ctx.currentTime);

      this.ambientNoiseSource.connect(filter);
      filter.connect(this.ambientNoiseGain);
      this.ambientNoiseGain.connect(this.musicBus);

      this.ambientNoiseSource.start();
    } catch {}
  }

  private stopAmbientNoirWarmth() {
    if (this.ambientNoiseSource) {
      try {
        this.ambientNoiseSource.stop();
        this.ambientNoiseSource.disconnect();
      } catch {}
      this.ambientNoiseSource = null;
    }
  }

  // ==========================================
  // COMPOSITION SEQUENCERS
  // ==========================================

  private stepMusicSequencer(theme: MusicTheme) {
    switch (theme) {
      case 'menu':
        this.stepMenuTheme();
        break;
      case 'exploration':
        this.stepExplorationTheme();
        break;
      case 'mission':
        this.stepMissionTheme();
        break;
      case 'combat':
        this.stepCombatTheme();
        break;
      case 'victory':
        this.stepVictoryTheme();
        break;
    }
    this.sequenceStep++;
  }

  /**
   * MAIN MENU THEME: "Neon Rain & Blue Embers"
   * Tempo: 72 BPM · Key: D minor
   * Chord Progression (32 steps / 16 bars of 8th notes):
   * Bar 1: Dm9 (D3, F3, A3, C4, E4)
   * Bar 2: Bbmaj9 (Bb2, D3, F3, A3, C4)
   * Bar 3: Gm9 (G2, Bb2, D3, F3, A3)
   * Bar 4: A7sus4 -> A7(b9) (A2, D3, E3, G3, Bb3)
   */
  private stepMenuTheme() {
    const step = this.sequenceStep % 32;

    // Pad Chords on bar downbeats (every 8 steps)
    if (step === 0) {
      // Dm9
      this.playSubBassNote(N.D2, 3.4, 0.32);
      this.playPadChord([N.D3, N.F3, N.A3, N.C4, N.E4], 3.8, 0.15);
      this.playPianoNote(N.D3, 2.2, 0.7);
      this.playPianoNote(N.A3, 2.0, 0.65);
      this.playPianoNote(N.F4, 2.0, 0.75);
    } else if (step === 8) {
      // Bbmaj7
      this.playSubBassNote(N.Bb2, 3.4, 0.32);
      this.playPadChord([N.Bb2, N.D3, N.F3, N.A3, N.C4], 3.8, 0.15);
      this.playPianoNote(N.Bb2, 2.2, 0.7);
      this.playPianoNote(N.F3, 2.0, 0.65);
      this.playPianoNote(N.A4, 2.0, 0.75);
    } else if (step === 16) {
      // Gm9
      this.playSubBassNote(N.G2, 3.4, 0.32);
      this.playPadChord([N.G2, N.Bb2, N.D3, N.F3, N.A3], 3.8, 0.15);
      this.playPianoNote(N.G2, 2.2, 0.7);
      this.playPianoNote(N.D3, 2.0, 0.65);
      this.playPianoNote(N.Bb4, 2.0, 0.75);
    } else if (step === 24) {
      // Asus4 -> A7
      this.playSubBassNote(N.A2, 3.4, 0.32);
      this.playPadChord([N.A2, N.D3, N.E3, N.G3, N.Cs4], 3.8, 0.15);
      this.playPianoNote(N.A2, 2.2, 0.7);
      this.playPianoNote(N.E3, 2.0, 0.65);
      this.playPianoNote(N.G4, 2.0, 0.75);
    }

    // Emotive Melodic Piano Phrasing
    const pianoNotes: Record<number, number> = {
      2: N.A4,
      4: N.F4,
      6: N.E4,
      10: N.C5,
      12: N.A4,
      14: N.G4,
      18: N.Bb4,
      20: N.A4,
      22: N.F4,
      26: N.E4,
      28: N.D4,
      30: N.Cs4,
    };

    if (pianoNotes[step]) {
      this.playPianoNote(pianoNotes[step], 1.5, 0.72);
    }

    // Melodic Solo Lead motif in phrase 2 (steps 16 to 31)
    if (step === 17) this.playLeadNote(N.D5, 1.8, 0.18);
    if (step === 21) this.playLeadNote(N.F5, 1.4, 0.18);
    if (step === 25) this.playLeadNote(N.E5, 2.2, 0.20);
    if (step === 29) this.playLeadNote(N.D5, 2.5, 0.22);
  }

  /**
   * EXPLORATION THEME: "Precinct Midnight Patrol"
   * Tempo: 82 BPM · Key: A minor / C major
   * Relaxing, pleasant jazz-noir urban groove with warm Rhodes piano.
   * Progression: Am9 -> Fmaj9 -> Cmaj7 -> G6 -> Dm9 -> Em7 -> Fmaj7 -> E7(#9)
   */
  private stepExplorationTheme() {
    const step = this.sequenceStep % 64; // 8-bar loop
    const bar = Math.floor(step / 8);
    const sub = step % 8;

    // Rhythmic Downtempo Groove (soft, organic, pleasant)
    if (sub === 0 || sub === 4) {
      this.playDowntempoDrum('kick', 0.16);
    }
    if (sub === 2 || sub === 6) {
      this.playDowntempoDrum('rimshot', 0.12);
    }
    if (sub === 1 || sub === 3 || sub === 5 || sub === 7) {
      this.playDowntempoDrum('shaker', 0.08);
    }

    // Bar Chords & Sub Bass
    if (sub === 0) {
      switch (bar) {
        case 0: // Am9
          this.playSubBassNote(N.A2, 3.2, 0.28);
          this.playPadChord([N.A3, N.C4, N.E4, N.G4, N.B4], 3.5, 0.12);
          this.playPianoNote(N.A3, 2.0, 0.65);
          this.playPianoNote(N.E4, 1.8, 0.65);
          this.playPianoNote(N.C5, 2.0, 0.70);
          break;
        case 1: // Fmaj9
          this.playSubBassNote(N.F2, 3.2, 0.28);
          this.playPadChord([N.F3, N.A3, N.C4, N.E4, N.G4], 3.5, 0.12);
          this.playPianoNote(N.F3, 2.0, 0.65);
          this.playPianoNote(N.C4, 1.8, 0.65);
          this.playPianoNote(N.A4, 2.0, 0.70);
          break;
        case 2: // Cmaj7
          this.playSubBassNote(N.C3, 3.2, 0.28);
          this.playPadChord([N.C3, N.E3, N.G3, N.B3, N.D4], 3.5, 0.12);
          this.playPianoNote(N.C3, 2.0, 0.65);
          this.playPianoNote(N.G3, 1.8, 0.65);
          this.playPianoNote(N.E4, 2.0, 0.70);
          break;
        case 3: // G6 / B
          this.playSubBassNote(N.B2, 3.2, 0.28);
          this.playPadChord([N.B2, N.D3, N.G3, N.B3, N.E4], 3.5, 0.12);
          this.playPianoNote(N.B2, 2.0, 0.65);
          this.playPianoNote(N.D4, 1.8, 0.65);
          this.playPianoNote(N.G4, 2.0, 0.70);
          break;
        case 4: // Dm9
          this.playSubBassNote(N.D2, 3.2, 0.28);
          this.playPadChord([N.D3, N.F3, N.A3, N.C4, N.E4], 3.5, 0.12);
          this.playPianoNote(N.D3, 2.0, 0.65);
          this.playPianoNote(N.A3, 1.8, 0.65);
          this.playPianoNote(N.F4, 2.0, 0.70);
          break;
        case 5: // Em7
          this.playSubBassNote(N.E2, 3.2, 0.28);
          this.playPadChord([N.E3, N.G3, N.B3, N.D4], 3.5, 0.12);
          this.playPianoNote(N.E3, 2.0, 0.65);
          this.playPianoNote(N.B3, 1.8, 0.65);
          this.playPianoNote(N.G4, 2.0, 0.70);
          break;
        case 6: // Fmaj7
          this.playSubBassNote(N.F2, 3.2, 0.28);
          this.playPadChord([N.F3, N.A3, N.C4, N.E4], 3.5, 0.12);
          this.playPianoNote(N.F3, 2.0, 0.65);
          this.playPianoNote(N.C4, 1.8, 0.65);
          this.playPianoNote(N.A4, 2.0, 0.70);
          break;
        case 7: // E7(b9)
          this.playSubBassNote(N.E2, 3.2, 0.28);
          this.playPadChord([N.E3, N.Gs3, N.B3, N.D4, N.F4], 3.5, 0.12);
          this.playPianoNote(N.E3, 2.0, 0.65);
          this.playPianoNote(N.B3, 1.8, 0.65);
          this.playPianoNote(N.Gs4, 2.0, 0.70);
          break;
      }
    }

    // Melodic Syncopated Rhodes Licks (Section A & B variations)
    const explorationMelody: Record<number, number> = {
      3: N.B4,
      5: N.C5,
      11: N.G4,
      13: N.A4,
      19: N.E4,
      21: N.G4,
      27: N.Fs4,
      29: N.D4,
      35: N.F4,
      37: N.E4,
      43: N.G4,
      45: N.B4,
      51: N.C5,
      53: N.D5,
      59: N.B4,
      61: N.Gs4,
    };

    if (explorationMelody[step]) {
      this.playPianoNote(explorationMelody[step], 1.2, 0.68);
    }
  }

  /**
   * MISSION / INVESTIGATION THEME: "Undercover Wiretap"
   * Tempo: 94 BPM · Key: D minor
   * Tense, rhythmic stakeout sequence with 16th-pulse filtered arpeggio.
   */
  private stepMissionTheme() {
    const step = this.sequenceStep % 32;

    // Rhythmic filtered arpeggio pulse
    const arpNotes = [N.D3, N.A3, N.D4, N.F4, N.D4, N.A3, N.E4, N.A3];
    const arpPitch = arpNotes[step % arpNotes.length];
    this.playPianoNote(arpPitch, 0.45, 0.45);

    // Sub Bass Pulse every half-bar
    if (step % 8 === 0) {
      const bassNote = step < 16 ? N.D2 : step < 24 ? N.Bb2 : N.C3;
      this.playSubBassNote(bassNote, 2.2, 0.35);
      this.playPadChord([bassNote * 2, bassNote * 3, bassNote * 3.5], 2.8, 0.10);
      this.playDowntempoDrum('kick', 0.18);
    }

    // Rimshot on 4 & 12
    if (step % 8 === 4) {
      this.playDowntempoDrum('rimshot', 0.14);
    }

    // Suspense Lead motif
    if (step === 6) this.playLeadNote(N.F4, 1.2, 0.16);
    if (step === 14) this.playLeadNote(N.E4, 1.4, 0.16);
    if (step === 22) this.playLeadNote(N.G4, 1.2, 0.18);
    if (step === 30) this.playLeadNote(N.Cs4, 1.6, 0.20);
  }

  /**
   * COMBAT / PURSUIT THEME: "Redline Code 3"
   * Tempo: 122 BPM · Key: E minor
   * Driving cinematic pursuit with energetic synth bassline and dynamic kicks.
   */
  private stepCombatTheme() {
    const step = this.sequenceStep % 32;

    // Driving Four-on-the-Floor Kick on quarter notes
    if (step % 2 === 0) {
      this.playDowntempoDrum('kick', 0.24);
    }

    // Snare / Rimshot on backbeats
    if (step % 4 === 2) {
      this.playDowntempoDrum('rimshot', 0.18);
    }

    // Hihat shakers on offbeats
    if (step % 2 === 1) {
      this.playDowntempoDrum('shaker', 0.12);
    }

    // Driving 8th-note Sawtooth Bassline in E minor
    const combatBass = [N.E2, N.E2, N.G2, N.E2, N.A2, N.E2, N.D2, N.Fs2];
    const bNote = combatBass[step % 8];
    this.playSubBassNote(bNote, 0.5, 0.38);

    // Brass / String stabs on downbeats
    if (step === 0 || step === 16) {
      this.playPadChord([N.E3, N.G3, N.B3, N.E4], 1.2, 0.22);
    } else if (step === 8 || step === 24) {
      this.playPadChord([N.C3, N.E3, N.G3, N.C4], 1.2, 0.22);
    }

    // Urgent fast lead synth riffs
    if (step === 4) this.playLeadNote(N.B4, 0.6, 0.24);
    if (step === 6) this.playLeadNote(N.D5, 0.6, 0.24);
    if (step === 12) this.playLeadNote(N.G5, 0.8, 0.26);
    if (step === 20) this.playLeadNote(N.Fs5, 0.6, 0.24);
    if (step === 28) this.playLeadNote(N.E5, 1.0, 0.26);
  }

  /**
   * VICTORY THEME: "City Restored"
   * Tempo: 86 BPM · Key: C major / F major
   * Uplifting, triumphant resolution with ascending piano cascades and majestic strings.
   */
  private stepVictoryTheme() {
    const step = this.sequenceStep % 32;

    if (step === 0) {
      // Fmaj7
      this.playSubBassNote(N.F2, 3.4, 0.30);
      this.playPadChord([N.F3, N.A3, N.C4, N.E4], 3.8, 0.20);
      this.playPianoNote(N.F3, 2.2, 0.7);
      this.playPianoNote(N.C4, 2.2, 0.7);
      this.playPianoNote(N.A4, 2.2, 0.8);
    } else if (step === 8) {
      // Gsus4 -> G
      this.playSubBassNote(N.G2, 3.4, 0.30);
      this.playPadChord([N.G3, N.C4, N.D4, N.B4], 3.8, 0.20);
      this.playPianoNote(N.G3, 2.2, 0.7);
      this.playPianoNote(N.D4, 2.2, 0.7);
      this.playPianoNote(N.B4, 2.2, 0.8);
    } else if (step === 16) {
      // Cmaj7 (Majestic resolution)
      this.playSubBassNote(N.C3, 3.4, 0.34);
      this.playPadChord([N.C3, N.E3, N.G3, N.B3, N.E4], 3.8, 0.24);
      this.playPianoNote(N.C3, 2.4, 0.75);
      this.playPianoNote(N.G3, 2.2, 0.75);
      this.playPianoNote(N.E4, 2.4, 0.85);
      this.playPianoNote(N.G4, 2.4, 0.85);
      this.playPianoNote(N.C5, 2.6, 0.90);
    } else if (step === 24) {
      // Am9
      this.playSubBassNote(N.A2, 3.4, 0.30);
      this.playPadChord([N.A3, N.C4, N.E4, N.G4], 3.8, 0.20);
      this.playPianoNote(N.A3, 2.2, 0.7);
      this.playPianoNote(N.E4, 2.2, 0.75);
      this.playPianoNote(N.C5, 2.4, 0.85);
    }

    // Melodic triumphant piano flourish
    const victoryFlourish: Record<number, number> = {
      2: N.A4,
      4: N.C5,
      6: N.E5,
      10: N.B4,
      12: N.D5,
      14: N.G5,
      18: N.E5,
      20: N.G5,
      22: N.C6,
      26: N.B5,
      28: N.A5,
      30: N.G5,
    };

    if (victoryFlourish[step]) {
      this.playPianoNote(victoryFlourish[step], 1.6, 0.82);
    }
  }

  // ==========================================
  // EXTERNAL AUDIO ASSET SUPPORT
  // ==========================================

  /**
   * Allows setting a custom audio streaming file or user URL track.
   * If provided and successfully loaded, external audio will play;
   * if it errors or is cleared, procedural synthesizer resumes seamlessly.
   */
  public setCustomAudioTrack(url: string | null) {
    if (this.externalAudioElement) {
      this.externalAudioElement.pause();
      this.externalAudioElement.src = '';
      this.externalAudioElement = null;
    }

    if (!url) {
      this.isUsingExternalTrack = false;
      this.startSequence(this.currentTheme);
      return;
    }

    try {
      this.stopActiveSequence();
      this.externalAudioElement = new Audio(url);
      this.externalAudioElement.loop = true;
      this.externalAudioElement.volume = this.isMuted ? 0 : this.musicVolume;
      this.isUsingExternalTrack = true;

      this.externalAudioElement.play().catch(() => {
        // Fallback to procedural synth if autoplay blocked or network fails
        this.isUsingExternalTrack = false;
        this.startSequence(this.currentTheme);
      });
    } catch {
      this.isUsingExternalTrack = false;
      this.startSequence(this.currentTheme);
    }
  }
}

export const cinematicMusicEngine = new CinematicMusicEngine();
