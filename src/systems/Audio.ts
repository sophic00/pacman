/**
 * Web Audio API procedural synthesizer for arcade-authentic Pac-Man sound effects.
 * 100% self-contained: no external audio assets or downloads required.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private wakaToggle = false;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenInterval: number | null = null;
  private frightenedOsc: OscillatorNode | null = null;
  private frightenedGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with autoplay policies
  }

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopSiren();
      this.stopFrightenedSound();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Classic "waka-waka" chomp sound
   */
  public playWaka(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.2, now);

    if (this.wakaToggle) {
      // First syllable: rising tone ~300Hz -> 520Hz
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
    } else {
      // Second syllable: falling tone ~500Hz -> 280Hz
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
    }
    this.wakaToggle = !this.wakaToggle;

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Background siren sound looping during normal play
   */
  public startSiren(dotRatio = 1.0): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || this.sirenOsc) return;

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc.type = 'triangle';
    this.sirenGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    // Frequency shifts slightly higher as dots are eaten
    const baseFreq = 380 + (1 - dotRatio) * 120;
    this.sirenOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    // Modulate pitch slightly up and down
    let step = 0;
    this.sirenInterval = window.setInterval(() => {
      if (!this.ctx || !this.sirenOsc) return;
      const freq = step % 2 === 0 ? baseFreq : baseFreq - 60;
      this.sirenOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      step++;
    }, 200);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.ctx.destination);
    this.sirenOsc.start();
  }

  public stopSiren(): void {
    if (this.sirenInterval !== null) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.sirenOsc = null;
    }
    if (this.sirenGain) {
      this.sirenGain.disconnect();
      this.sirenGain = null;
    }
  }

  /**
   * Frightened / Energizer background warble sound
   */
  public startFrightenedSound(): void {
    this.stopSiren();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || this.frightenedOsc) return;

    this.frightenedOsc = this.ctx.createOscillator();
    this.frightenedGain = this.ctx.createGain();

    this.frightenedOsc.type = 'sawtooth';
    this.frightenedGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    this.frightenedOsc.frequency.setValueAtTime(140, this.ctx.currentTime);

    // Low-frequency LFO modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(4, this.ctx.currentTime); // 4Hz warble
    lfoGain.gain.setValueAtTime(40, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.frightenedOsc.frequency);
    lfo.start();

    this.frightenedOsc.connect(this.frightenedGain);
    this.frightenedGain.connect(this.ctx.destination);
    this.frightenedOsc.start();
  }

  public stopFrightenedSound(): void {
    if (this.frightenedOsc) {
      try {
        this.frightenedOsc.stop();
        this.frightenedOsc.disconnect();
      } catch {
        // Ignore
      }
      this.frightenedOsc = null;
    }
    if (this.frightenedGain) {
      this.frightenedGain.disconnect();
      this.frightenedGain = null;
    }
  }

  /**
   * Sound played when Pac-Man eats a frightened ghost
   */
  public playEatGhost(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Sound played when Pac-Man eats bonus fruit
   */
  public playEatFruit(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const noteOsc = this.ctx!.createOscillator();
      const noteGain = this.ctx!.createGain();
      const startTime = now + idx * 0.06;

      noteOsc.type = 'square';
      noteOsc.frequency.setValueAtTime(freq, startTime);

      noteGain.gain.setValueAtTime(0.15, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

      noteOsc.connect(noteGain);
      noteGain.connect(this.ctx!.destination);

      noteOsc.start(startTime);
      noteOsc.stop(startTime + 0.06);
    });
  }

  /**
   * Iconic descending chromatic death sequence
   */
  public playDeath(): void {
    this.stopSiren();
    this.stopFrightenedSound();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const frequencies = [
      800, 750, 700, 650, 600, 550, 500, 460, 420, 380, 340, 300, 260, 220, 180
    ];

    frequencies.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + index * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.08);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  /**
   * Iconic opening theme jingle
   */
  public playIntro(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pac-Man Intro theme notes: [note, durationIn16ths]
    const notes: [number, number][] = [
      [493.88, 1], [987.77, 1], [739.99, 1], [622.25, 1], [987.77, 1], [739.99, 1], [622.25, 2],
      [523.25, 1], [1046.50, 1], [783.99, 1], [659.25, 1], [1046.50, 1], [783.99, 1], [659.25, 2],
      [493.88, 1], [987.77, 1], [739.99, 1], [622.25, 1], [987.77, 1], [739.99, 1], [622.25, 2],
      [622.25, 0.5], [659.25, 0.5], [698.46, 0.5], [739.99, 0.5], [783.99, 0.5], [830.61, 0.5], [880.00, 0.5], [987.77, 1]
    ];

    let cursor = now;
    const tempo = 0.12; // 16th note length in seconds

    notes.forEach(([freq, duration]) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, cursor);

      const noteLen = duration * tempo;
      gain.gain.setValueAtTime(0.12, cursor);
      gain.gain.exponentialRampToValueAtTime(0.01, cursor + noteLen * 0.9);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(cursor);
      osc.stop(cursor + noteLen);

      cursor += noteLen;
    });
  }
}
