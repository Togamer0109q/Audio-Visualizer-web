import * as THREE from 'three';
import { BaseVisualizer } from './BaseVisualizer';

export class RadialVisualizer extends BaseVisualizer {
  private group = new THREE.Group();
  private bars: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>[] = [];
  private time = 0;

  public initialize(scene: THREE.Scene): void {
    this.scene = scene;
    const count = 96;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const geometry = new THREE.BoxGeometry(0.035, 0.45, 0.035);
      const material = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xff39c8 : 0x7a5cff,
        emissive: 0x7a1fff,
        emissiveIntensity: 1.4,
      });
      const bar = new THREE.Mesh(geometry, material);
      bar.position.set(Math.cos(angle) * 2.15, Math.sin(angle) * 2.15, 0);
      bar.rotation.z = angle - Math.PI / 2;
      this.group.add(bar);
      this.bars.push(bar);
    }
    scene.add(this.group);
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    this.group.rotation.z -= deltaTime * 0.05;
    this.bars.forEach((bar, index) => {
      const wave = Math.sin(this.time * 3.2 + index * 0.23) * 0.5 + 0.5;
      const height = 0.35 + wave * (1.35 * this.settings.bassSensitivity);
      bar.scale.y = height;
      bar.material.emissiveIntensity = 0.7 + this.settings.glowIntensity * 2.6 + wave * 0.55;
    });
  }

  public dispose(): void {
    this.scene?.remove(this.group);
    for (const bar of this.bars) {
      bar.geometry.dispose();
      bar.material.dispose();
    }
    this.bars = [];
  }
}
