/**
 * Procedural Web Audio Sound Synthesizer & SFX Bus for Street Justice
 * 
 * Rebalanced, throttled, and dynamically compressed sound effects:
 * - Eliminates duplicate, overlapping, and continuous machine-gun screeching.
 * - Gentle on the ears: realistic acoustic envelopes and punchy sub-thumps without harsh digital clipping.
 * - Dedicated SFX master bus with DynamicsCompressorNode.
 * - Independent SFX volume and mute controls persisted in localStorage.
 */

import { cinematicMusicEngine } from './CinematicMusicEngine';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private sfxCompressor: DynamicsCompressorNode | null = null;

  private isMuted: boolean = false;
  private sfxVolume: number = 0.75;

  // Sustained vehicle sound nodes
  private sirenOsc1: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive: boolean = false;
  private sirenInterval: number | null = null;

  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  // Ambient city layer (soft background city hush)
  private ambientCityNode: AudioBufferSourceNode | null = null;
  private ambientCityGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;

  // Debouncing / rate-limiting map to prevent loud duplicate audio stacking
  private lastTriggerTime: Record<string, number> = {};

  constructor() {
    this.loadPersistedSettings();
  }

  private loadPersistedSettings() {
    try {
      const saved = localStorage.getItem('street_justice_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.sfxVolume === 'number') {
          this.sfxVolume = Math.max(0, Math.min(1, parsed.sfxVolume));
        }
        if (typeof parsed.isSfxMuted === 'boolean') {
          this.isMuted = parsed.isSfxMuted;
        }
      }
    } catch {}
  }

  private saveSettings() {
    try {
      const existing = localStorage.getItem('street_justice_audio_settings');
      const parsed = existing ? JSON.parse(existing) : {};
      parsed.sfxVolume = this.sfxVolume;
      parsed.isSfxMuted = this.isMuted;
      localStorage.setItem('street_justice_audio_settings', JSON.stringify(parsed));
    } catch {}
  }

  private initContext() {
    // Utilize the shared context from cinematicMusicEngine
    this.ctx = cinematicMusicEngine.getAudioContext();
    if (!this.ctx) return;

    if (!this.sfxBus) {
      this.sfxBus = this.ctx.createGain();

      // Dynamics Compressor: keeps all SFX bounded, punchy, and completely prevents speaker blowout / distortion
      this.sfxCompressor = this.ctx.createDynamicsCompressor();
      this.sfxCompressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.sfxCompressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.sfxCompressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.sfxCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.sfxCompressor.release.setValueAtTime(0.12, this.ctx.currentTime);

      this.sfxBus.connect(this.sfxCompressor);

      // Connect into master gain
      const masterGain = cinematicMusicEngine.getMasterGain();
      if (masterGain) {
        this.sfxCompressor.connect(masterGain);
      } else {
        this.sfxCompressor.connect(this.ctx.destination);
      }

      this.updateSfxBusGain();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private updateSfxBusGain() {
    if (!this.sfxBus || !this.ctx) return;
    const targetGain = this.isMuted ? 0 : this.sfxVolume;
    const t = this.ctx.currentTime;
    this.sfxBus.gain.cancelScheduledValues(t);
    this.sfxBus.gain.setValueAtTime(this.sfxBus.gain.value, t);
    this.sfxBus.gain.linearRampToValueAtTime(targetGain, t + 0.08);
  }

  private getDestinationNode(): AudioNode | null {
    this.initContext();
    return this.sfxBus;
  }

  /**
   * Debounces a sound effect key to avoid machine-gun retriggering
   */
  private checkThrottle(key: string, minIntervalSeconds: number): boolean {
    const now = performance.now() / 1000;
    const last = this.lastTriggerTime[key] || 0;
    if (now - last < minIntervalSeconds) {
      return false; // Throttled
    }
    this.lastTriggerTime[key] = now;
    return true;
  }

  // ==========================================
  // CONTROLS & VOLUME
  // ==========================================

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    this.updateSfxBusGain();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.saveSettings();
    this.updateSfxBusGain();
    if (muted) {
      this.stopSiren();
      this.stopEngine();
      this.stopAmbientCity();
    }
  }

  public isSfxMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Backward compatibility aliases
  public setVolume(vol: number) {
    this.setSfxVolume(vol);
  }

  // ==========================================
  // AMBIENT & FOLEY SOUNDS
  // ==========================================

  public startAmbientCity() {
    if (this.isMuted || this.isAmbientPlaying) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 3.0);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = lastOut * 0.96 + white * 0.04;
        data[i] = lastOut * 0.12;
      }

      this.ambientCityNode = this.ctx.createBufferSource();
      this.ambientCityNode.buffer = buffer;
      this.ambientCityNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, this.ctx.currentTime);

      this.ambientCityGain = this.ctx.createGain();
      this.ambientCityGain.gain.setValueAtTime(0.025, this.ctx.currentTime);

      this.ambientCityNode.connect(filter);
      filter.connect(this.ambientCityGain);
      this.ambientCityGain.connect(dest);

      this.ambientCityNode.start(0);
      this.isAmbientPlaying = true;
    } catch {}
  }

  public stopAmbientCity() {
    if (this.ambientCityNode) {
      try {
        this.ambientCityNode.stop();
        this.ambientCityNode.disconnect();
      } catch {}
      this.ambientCityNode = null;
    }
    this.isAmbientPlaying = false;
  }

  /**
   * Footsteps: Throttled to 220ms, low-volume realistic shoe tap on asphalt
   */
  public playFootstep() {
    if (this.isMuted) return;
    if (!this.checkThrottle('footstep', 0.22)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    // Low-frequency asphalt footstep tap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.07);

    gain.gain.setValueAtTime(0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playJump() {
    if (this.isMuted) return;
    if (!this.checkThrottle('jump', 0.35)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(210, t + 0.10);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.10);
  }

  // ==========================================
  // WEAPON SOUND EFFECTS (REBALANCED & WARM)
  // ==========================================

  /**
   * Gunshot sounds: Rebalanced from harsh 1.40 gain to crisp, weighty 0.24-0.32 gain
   */
  public playGunshot(type: 'handgun' | 'smg' | 'shotgun' | 'rifle' | 'taser' | 'grenade' | 'camera') {
    if (this.isMuted) return;

    if (type === 'camera') {
      this.playCameraShutter();
      return;
    }
    if (type === 'grenade') {
      this.playExplosion();
      return;
    }

    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;

    if (type === 'taser') {
      // Clean non-irritating electric zap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(280, t + 0.06);
      osc.frequency.linearRampToValueAtTime(90, t + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.20);
      return;
    }

    // Realistic gunshot acoustics:
    // 1. Transient mechanical slide snap
    // 2. Filtered noise blast (warm lowpass/bandpass body)
    // 3. Sub-punch thump (weighty punch without harsh highs)

    const isShotgun = type === 'shotgun';
    const isSmg = type === 'smg';
    const isRifle = type === 'rifle';

    const duration = isShotgun ? 0.28 : isSmg ? 0.10 : isRifle ? 0.16 : 0.18;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    if (isShotgun) {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(140, t + duration);
    } else if (isRifle) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(260, t + duration);
    } else if (isSmg) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(220, t + duration);
    } else {
      // Handgun
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, t);
      filter.frequency.exponentialRampToValueAtTime(220, t + duration);
    }

    const noiseGain = this.ctx.createGain();
    const noiseVol = isShotgun ? 0.22 : isRifle ? 0.16 : isSmg ? 0.14 : 0.18;
    noiseGain.gain.setValueAtTime(noiseVol, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Punch oscillator (deep sub thump, warm, no ear-fatigue)
    const punchOsc = this.ctx.createOscillator();
    const punchGain = this.ctx.createGain();
    punchOsc.type = 'sine';
    const startFreq = isShotgun ? 140 : isRifle ? 180 : 160;
    punchOsc.frequency.setValueAtTime(startFreq, t);
    punchOsc.frequency.exponentialRampToValueAtTime(38, t + 0.08);

    const punchVol = isShotgun ? 0.26 : isRifle ? 0.20 : isSmg ? 0.16 : 0.22;
    punchGain.gain.setValueAtTime(punchVol, t);
    punchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    punchOsc.connect(punchGain);
    punchGain.connect(dest);

    noise.start(t);
    noise.stop(t + duration);
    punchOsc.start(t);
    punchOsc.stop(t + 0.09);
  }

  // Dry-fire metallic click (throttled to 180ms)
  public playDryFire() {
    if (this.isMuted) return;
    if (!this.checkThrottle('dryfire', 0.18)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.035);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  // Police radio backup call with tone & ducking
  public playRadioDispatchCall() {
    if (this.isMuted) return;
    // Duck background music for 3.0s so dispatch comms are clear and cinematic
    cinematicMusicEngine.duckMusic(3.0);

    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    // Dual DTMF tones
    [750, 1050].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.10, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  // Reload mechanical click sequence
  public playReload() {
    if (this.isMuted) return;
    if (!this.checkThrottle('reload', 0.8)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const playClick = (timeOffset: number, freq: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + timeOffset);
      gain.gain.setValueAtTime(0.14, t + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.04);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + timeOffset);
      osc.stop(t + timeOffset + 0.04);
    };

    playClick(0.0, 750);
    playClick(0.16, 1050);
    playClick(0.32, 1350);
  }

  // Impact / Hit sound (throttled to 140ms)
  public playHit(isHeadshot: boolean = false) {
    if (this.isMuted) return;
    if (!this.checkThrottle('hit', 0.14)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHeadshot ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 1200 : 320, t);
    osc.frequency.exponentialRampToValueAtTime(isHeadshot ? 2200 : 90, t + 0.07);

    gain.gain.setValueAtTime(isHeadshot ? 0.20 : 0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Officer Carter body damage / armor hit
  public playPlayerDamage(hasArmor: boolean = false) {
    if (this.isMuted) return;
    if (!this.checkThrottle('player_damage', 0.22)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (hasArmor) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.10);
      gain.gain.setValueAtTime(0.20, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.14);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    }

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Camera forensic shutter click
  public playCameraShutter() {
    if (this.isMuted) return;
    if (!this.checkThrottle('camera', 0.25)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.05);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Police megaphone / order chime (throttled to 300ms)
  public playMegaphoneChime() {
    if (this.isMuted) return;
    if (!this.checkThrottle('megaphone', 0.30)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(740, t + 0.10);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Evidence bag pickup chime
  public playEvidencePickup() {
    if (this.isMuted) return;
    if (!this.checkThrottle('evidence_pickup', 0.35)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0.14, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx + 1) * 0.05);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + idx * 0.05);
      osc.stop(t + (idx + 1) * 0.05);
    });
  }

  // Handcuff ratchet
  public playArrest() {
    if (this.isMuted) return;
    if (!this.checkThrottle('arrest', 0.5)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const playRatchet = (offset: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, t + offset);
      gain.gain.setValueAtTime(0.12, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.025);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + offset);
      osc.stop(t + offset + 0.025);
    };

    playRatchet(0.0);
    playRatchet(0.07);
    playRatchet(0.14);
    playRatchet(0.24);
  }

  // Dispatch radio tone chime (throttled to 280ms)
  public playRadioChime() {
    if (this.isMuted) return;
    if (!this.checkThrottle('radio_chime', 0.28)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [659.25, 880, 1046.5]; // E5, A5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.11, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx + 1) * 0.06);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + idx * 0.06);
      osc.stop(t + (idx + 1) * 0.06);
    });
  }

  // Explosion / crash (rebalanced from harsh 0.90 to 0.32)
  public playExplosion() {
    if (this.isMuted) return;
    if (!this.checkThrottle('explosion', 0.35)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + 0.6);
  }

  // Police Siren loop (warm, 1200Hz lowpass filtered, volume 0.075)
  public toggleSiren(active?: boolean): boolean {
    if (active === undefined) {
      active = !this.isSirenActive;
    }

    if (!active) {
      this.stopSiren();
      return false;
    }

    if (this.isMuted) return false;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return false;

    this.stopSiren();

    const t = this.ctx.currentTime;
    this.sirenOsc1 = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc1.type = 'sawtooth';
    this.sirenGain.gain.setValueAtTime(0.075, t);

    // Filter to make siren warm and authentic without harsh piercing frequencies
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);

    this.sirenOsc1.connect(filter);
    filter.connect(this.sirenGain);
    this.sirenGain.connect(dest);

    this.sirenOsc1.start();
    this.isSirenActive = true;

    // Wail up and down smoothly
    let high = false;
    this.sirenInterval = window.setInterval(() => {
      if (!this.ctx || !this.sirenOsc1 || !this.isSirenActive) return;
      const now = this.ctx.currentTime;
      high = !high;
      const targetFreq = high ? 840 : 620;
      this.sirenOsc1.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.45);
    }, 450);

    return true;
  }

  public stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc1) {
      try {
        this.sirenOsc1.stop();
        this.sirenOsc1.disconnect();
      } catch {}
      this.sirenOsc1 = null;
    }
    this.isSirenActive = false;
  }

  // Vehicle Engine Sound (warm rumble, lowpass at 180Hz, gain 0.04)
  public startEngine() {
    if (this.isMuted || this.engineOsc) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(42, this.ctx.currentTime);
    this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(dest);

    this.engineOsc.start();
  }

  public updateEnginePitch(speedRatio: number) {
    if (!this.ctx || !this.engineOsc) return;
    const targetFreq = 42 + Math.min(140, speedRatio * 110);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.06);
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {}
      this.engineOsc = null;
    }
  }

  /**
   * Tire Screech: Debounced to 350ms to prevent the 60fps re-trigger bug!
   * Soft bandpass rubber friction sound, volume 0.075.
   */
  public playTireScreech() {
    if (this.isMuted) return;
    if (!this.checkThrottle('tire_screech', 0.35)) return;
    const dest = this.getDestinationNode();
    if (!dest || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.linearRampToValueAtTime(750, t + 0.14);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    gain.gain.setValueAtTime(0.075, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.14);
  }
}

export const soundEngine = new SoundEngine();
