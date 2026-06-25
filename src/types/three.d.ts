declare module 'three' {
  export class Scene { add(...object: Object3D[]): void; remove(...object: Object3D[]): void; }
  export class Object3D { position: Vector3; rotation: Vector3; scale: Vector3; add(...object: Object3D[]): void; traverse(callback: (object: Object3D) => void): void; }
  export class Group extends Object3D {}
  export class Vector3 { set(x: number, y: number, z: number): this; setScalar(value: number): this; x: number; y: number; z: number; }
  export class PerspectiveCamera extends Object3D { constructor(fov: number, aspect: number, near: number, far: number); aspect: number; updateProjectionMatrix(): void; }
  export class WebGLRenderer { constructor(params?: unknown); domElement: HTMLCanvasElement; setPixelRatio(value: number): void; setClearColor(color: number, alpha?: number): void; setSize(width: number, height: number, updateStyle?: boolean): void; render(scene: Scene, camera: PerspectiveCamera): void; dispose(): void; }
  export class AmbientLight extends Object3D { constructor(color: number, intensity?: number); }
  export class PointLight extends Object3D { constructor(color: number, intensity?: number, distance?: number); }
  export class BufferAttribute { constructor(array: Float32Array, itemSize: number); count: number; needsUpdate: boolean; getX(index: number): number; getY(index: number): number; setZ(index: number, z: number): void; }
  export class BufferGeometry { attributes: { position: BufferAttribute }; setAttribute(name: string, attribute: BufferAttribute): this; dispose(): void; }
  export class TorusGeometry extends BufferGeometry { constructor(radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number); }
  export class BoxGeometry extends BufferGeometry { constructor(width?: number, height?: number, depth?: number); }
  export class Material { dispose(): void; }
  export class MeshStandardMaterial extends Material { constructor(params?: unknown); emissiveIntensity: number; }
  export class PointsMaterial extends Material { constructor(params?: unknown); }
  export class Mesh<G extends BufferGeometry = BufferGeometry, M extends Material = Material> extends Object3D { constructor(geometry: G, material: M); geometry: G; material: M; }
  export class Points<G extends BufferGeometry = BufferGeometry, M extends Material = Material> extends Object3D { constructor(geometry: G, material: M); geometry: G; material: M; }
}
