export class AudioManager {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private frequencyData = new Uint8Array(128);
  private mockStartTime = performance.now();

  public initialize(): void {
    if (this.context) return;
    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    this.context = new AudioContextCtor();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;
    this.analyser.connect(this.context.destination);
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  public loadTrack(url: string): void {
    this.initialize();
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';
    }
    this.audioElement.src = url;

    if (this.context && this.analyser && !this.source) {
      this.source = this.context.createMediaElementSource(this.audioElement);
      this.source.connect(this.analyser);
    }
  }

  public async play(): Promise<void> {
    this.initialize();
    await this.context?.resume();
    await this.audioElement?.play();
  }

  public pause(): void {
    this.audioElement?.pause();
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      if (this.frequencyData.some((value) => value > 0)) return this.frequencyData;
    }
    return this.getMockFrequencyData();
  }

  public getBass(): number {
    return this.averageRange(0, 8);
  }

  public getMids(): number {
    return this.averageRange(8, 42);
  }

  public getHighs(): number {
    return this.averageRange(42, this.getFrequencyData().length);
  }

  private averageRange(start: number, end: number): number {
    const data = this.getFrequencyData();
    const slice = data.slice(start, Math.min(end, data.length));
    if (slice.length === 0) return 0;
    return slice.reduce((sum, value) => sum + value, 0) / (slice.length * 255);
  }

  private getMockFrequencyData(): Uint8Array {
    const elapsed = (performance.now() - this.mockStartTime) / 1000;
    const data = new Uint8Array(this.frequencyData.length);
    for (let i = 0; i < data.length; i += 1) {
      const lowBoost = Math.max(0, 1 - i / data.length);
      const wave = Math.sin(elapsed * 3 + i * 0.3) * 0.5 + 0.5;
      data[i] = Math.round((30 + wave * 120 * lowBoost + Math.random() * 16) * 0.9);
    }
    this.frequencyData = data;
    return data;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
