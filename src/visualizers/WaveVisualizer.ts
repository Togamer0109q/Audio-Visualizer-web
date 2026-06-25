import * as THREE from 'three';
import { BaseVisualizer } from './BaseVisualizer';

export class WaveVisualizer extends BaseVisualizer {
  private group = new THREE.Group();
  private ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial> | null = null;
  private particles: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> | null = null;
  private time = 0;

  public initialize(scene: THREE.Scene): void {
    this.scene = scene;

    const geometry = new THREE.TorusGeometry(2.05, 0.055, 18, 192);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff4fd8,
      emissive: 0x8a1cff,
      emissiveIntensity: 1.8,
      metalness: 0.25,
      roughness: 0.22,
    });
    this.ring = new THREE.Mesh(geometry, material);
    this.group.add(this.ring);

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(360 * 3);
    for (let i = 0; i < 360; i += 1) {
      const angle = (i / 360) * Math.PI * 2;
      const radius = 2.25 + Math.random() * 0.65;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.45;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0x9e5cff, size: 0.025, transparent: true, opacity: 0.75 }),
    );
    this.group.add(this.particles);

    scene.add(this.group);
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    const pulse = 1 + Math.sin(this.time * 2.2) * 0.05 * this.settings.bassSensitivity;
    this.group.scale.setScalar(pulse);
    this.group.rotation.z += deltaTime * 0.08;

    if (this.ring) {
      this.ring.material.emissiveIntensity = 0.8 + this.settings.glowIntensity * 2.8 + Math.sin(this.time * 4) * 0.25;
      const positions = this.ring.geometry.attributes.position;
      for (let i = 0; i < positions.count; i += 1) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const angle = Math.atan2(y, x);
        positions.setZ(i, Math.sin(angle * 8 + this.time * 3) * 0.08);
      }
      positions.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.scene?.remove(this.group);
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        object.material.dispose();
      }
      if (object instanceof THREE.Points) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });
  }
}
