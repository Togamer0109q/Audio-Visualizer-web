type LoopCallback = (deltaTime: number, elapsedTime: number) => void;

export class AnimationLoop {
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private elapsedTime = 0;
  private readonly updateCallbacks = new Set<LoopCallback>();
  private readonly renderCallbacks = new Set<LoopCallback>();

  public addUpdateCallback(callback: LoopCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  public addRenderCallback(callback: LoopCallback): () => void {
    this.renderCallbacks.add(callback);
    return () => this.renderCallbacks.delete(callback);
  }

  public start(): void {
    if (this.animationFrameId !== null) return;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    if (this.animationFrameId === null) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private readonly tick = (time: number): void => {
    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;
    this.elapsedTime += deltaTime;

    for (const callback of this.updateCallbacks) callback(deltaTime, this.elapsedTime);
    for (const callback of this.renderCallbacks) callback(deltaTime, this.elapsedTime);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
