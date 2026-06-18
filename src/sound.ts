export class SoundSynth {
  private ctx: AudioContext | null = null;
  public muted: boolean = true;

  constructor() {
    // Lazy initialized on first user click to bypass autoplay security
  }

  private init() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch (e) {
        console.warn("Failed to initialize AudioContext", e);
      }
    }
  }

  public playSlash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  public playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.setValueAtTime(90, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  public playPlayerDamage() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  public playSpecial() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    
    // Low pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.9);
    
    // High-energy noise explosion
    const bufferSize = ctx.sampleRate * 0.9;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.9);
    
    // Base synth punch
    const oscP = ctx.createOscillator();
    const oscG = ctx.createGain();
    oscP.type = 'triangle';
    oscP.frequency.setValueAtTime(60, ctx.currentTime);
    oscP.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.7);
    oscG.gain.setValueAtTime(0.18, ctx.currentTime);
    oscG.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
    oscP.connect(oscG);
    oscG.connect(ctx.destination);
    oscP.start();
    oscP.stop(ctx.currentTime + 0.7);
  }

  public playCollect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.05); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  public playWaveComplete() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.07);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + index * 0.07 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + index * 0.07);
      osc.stop(ctx.currentTime + index * 0.07 + 0.2);
    });
  }

  public playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const notes = [440.00, 392.00, 349.23, 293.66, 220.00]; // A4, G4, F4, D4, A3
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.16);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + index * 0.16 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + index * 0.16);
      osc.stop(ctx.currentTime + index * 0.16 + 0.5);
    });
  }
}
export const globalSynth = new SoundSynth();
