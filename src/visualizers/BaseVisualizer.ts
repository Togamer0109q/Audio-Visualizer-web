import type * as THREE from 'three';

export interface VisualizerSettings {
  glowIntensity: number;
  bassSensitivity: number;
}

export abstract class BaseVisualizer {
  protected scene: THREE.Scene | null = null;
  protected settings: VisualizerSettings = {
    glowIntensity: 0.7,
    bassSensitivity: 0.65,
  };

  public abstract initialize(scene: THREE.Scene): void;
  public abstract update(deltaTime: number): void;
  public abstract dispose(): void;

  public setSettings(settings: Partial<VisualizerSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }
}
