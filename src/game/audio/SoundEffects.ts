/**
 * Procedural Web Audio Sound Synthesizer for Street Justice
 * Zero network dependencies, reliable across mobile and desktop.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive: boolean = false;
  private sirenInterval: number | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private ambientCityNode: AudioBufferSourceNode | null = null;
  private ambientCityGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSiren();
      this.stopEngine();
      this.stopAmbientCity();
    } else {
      this.startAmbientCity();
    }
  }

  public startAmbientCity() {
    if (this.isMuted || this.isAmbientPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 3.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = lastOut * 0.95 + white * 0.05;
        data[i] = lastOut * 0.25;
      }

      this.ambientCityNode = this.ctx.createBufferSource();
      this.ambientCityNode.buffer = buffer;
      this.ambientCityNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, this.ctx.currentTime);

      this.ambientCityGain = this.ctx.createGain();
      this.ambientCityGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.ambientCityNode.connect(filter);
      filter.connect(this.ambientCityGain);
      this.ambientCityGain.connect(this.ctx.destination);

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

  public playFootstep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Short low-frequency footstep tap on asphalt
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    // Subtle noise scuff
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
    noise.start(t);
  }

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.12);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Gunshot sounds
  public playGunshot(type: 'handgun' | 'smg' | 'shotgun' | 'rifle' | 'taser' | 'grenade' | 'camera') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (type === 'camera') {
      this.playCameraShutter();
      return;
    }

    if (type === 'grenade') {
      this.playExplosion();
      return;
    }

    const t = this.ctx.currentTime;

    if (type === 'taser') {
      // Electric shock / zap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(380, t + 0.08);
      osc.frequency.linearRampToValueAtTime(80, t + 0.2);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
      return;
    }

    // Realistic gunshot: Transient punch click + filtered noise blast
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    if (type === 'shotgun') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + 0.35);
    } else if (type === 'rifle') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.22);
    } else if (type === 'smg') {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.12);
    } else {
      // Handgun
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, t);
      filter.frequency.exponentialRampToValueAtTime(250, t + 0.18);
    }

    const noiseGain = this.ctx.createGain();
    const duration = type === 'shotgun' ? 0.35 : type === 'smg' ? 0.12 : 0.22;
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Punch oscillator (sub thump)
    const punchOsc = this.ctx.createOscillator();
    const punchGain = this.ctx.createGain();
    punchOsc.type = 'sine';
    const startFreq = type === 'shotgun' ? 160 : 220;
    punchOsc.frequency.setValueAtTime(startFreq, t);
    punchOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

    punchGain.gain.setValueAtTime(0.8, t);
    punchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    punchOsc.connect(punchGain);
    punchGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + duration);
    punchOsc.start(t);
    punchOsc.stop(t + 0.12);
  }

  // Dry-fire metallic hammer click (when magazine is empty)
  public playDryFire() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.04);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Police radio backup dispatch call with radio squelch & tones
  public playRadioDispatchCall() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Dual DTMF-style dispatch tones
    [850, 1150].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });

    // Radio squelch burst at end
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.12;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, t + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t + 0.18);
      noise.stop(t + 0.30);
    } catch {}
  }

  // Reload click
  public playReload() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const playClick = (timeOffset: number, freq: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + timeOffset);
      gain.gain.setValueAtTime(0.3, t + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + timeOffset);
      osc.stop(t + timeOffset + 0.05);
    };

    playClick(0.0, 900);
    playClick(0.18, 1200);
    playClick(0.35, 1600);
  }

  // Hit sound / ricochet
  public playHit(isHeadshot: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHeadshot ? 'square' : 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 1500 : 400, t);
    osc.frequency.exponentialRampToValueAtTime(isHeadshot ? 2800 : 120, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Camera forensic shutter click
  public playCameraShutter() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.06);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Police megaphone / order surrender chime
  public playMegaphoneChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Evidence bag pickup chime
  public playEvidencePickup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.25, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx + 1) * 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.06);
      osc.stop(t + (idx + 1) * 0.06);
    });
  }

  // Police Handcuffs / Arrest
  public playArrest() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const playRatchet = (offset: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, t + offset);
      gain.gain.setValueAtTime(0.25, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.03);
    };

    playRatchet(0.0);
    playRatchet(0.08);
    playRatchet(0.16);
    playRatchet(0.28);
  }

  // Dispatch radio beep
  public playRadioChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [659.25, 880, 1046.5]; // E5, A5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);
      gain.gain.setValueAtTime(0.2, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx + 1) * 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.07);
      osc.stop(t + (idx + 1) * 0.07);
    });
  }

  // Explosion / crash
  public playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.8);
  }

  // Police Siren loop
  public toggleSiren(active?: boolean): boolean {
    if (active === undefined) {
      active = !this.isSirenActive;
    }

    if (!active) {
      this.stopSiren();
      return false;
    }

    if (this.isMuted) return false;
    this.initContext();
    if (!this.ctx) return false;

    this.stopSiren();

    const t = this.ctx.currentTime;
    this.sirenOsc1 = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc1.type = 'sawtooth';
    this.sirenGain.gain.setValueAtTime(0.18, t);

    // Filter to make siren sound warmer like real cruiser horn
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);

    this.sirenOsc1.connect(filter);
    filter.connect(this.sirenGain);
    this.sirenGain.connect(this.ctx.destination);

    this.sirenOsc1.start();
    this.isSirenActive = true;

    // Wail up and down
    let high = false;
    this.sirenInterval = window.setInterval(() => {
      if (!this.ctx || !this.sirenOsc1 || !this.isSirenActive) return;
      const now = this.ctx.currentTime;
      high = !high;
      const targetFreq = high ? 920 : 660;
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
      } catch {
        // ignore
      }
      this.sirenOsc1 = null;
    }
    this.isSirenActive = false;
  }

  // Vehicle Engine Sound
  public startEngine() {
    if (this.isMuted || this.engineOsc) return;
    this.initContext();
    if (!this.ctx) return;

    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc.start();
  }

  public updateEnginePitch(speedRatio: number) {
    if (!this.ctx || !this.engineOsc) return;
    const targetFreq = 45 + Math.min(180, speedRatio * 140);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // ignore
      }
      this.engineOsc = null;
    }
  }

  public playTireScreech() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.15);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }
}

export const soundEngine = new SoundEngine();
