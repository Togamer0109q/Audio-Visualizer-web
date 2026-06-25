import './styles.css';
import { AudioManager } from './audio/AudioManager';
import { AnimationLoop } from './core/AnimationLoop';
import { Renderer } from './core/Renderer';
import { Controls, type ControlState, type VisualizerMode } from './ui/Controls';
import { BaseVisualizer } from './visualizers/BaseVisualizer';
import { RadialVisualizer } from './visualizers/RadialVisualizer';
import { WaveVisualizer } from './visualizers/WaveVisualizer';

interface TrackData {
  id: string;
  title: string;
  artist: string;
  coverArt: string | null;
  streamUrl: string | null;
  duration?: number;
  playable: boolean;
  source: 'soundcloud' | 'youtube' | 'local';
}

interface StreamResponse {
  streamUrl: string | null;
  playable: boolean;
  source?: TrackData['source'];
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found.');

app.innerHTML = `
  <main class="app-shell">
    <div class="background-art" data-background-art></div>
    <div class="grid-overlay"></div>
    <section class="visualizer-stage" data-stage></section>
    <section class="metadata-card" data-metadata hidden></section>
    <div data-controls></div>
  </main>
`;

const stage = app.querySelector<HTMLElement>('[data-stage]');
const controlsRoot = app.querySelector<HTMLElement>('[data-controls]');
const backgroundArtElement = app.querySelector<HTMLElement>('[data-background-art]');
const metadataCardElement = app.querySelector<HTMLElement>('[data-metadata]');
if (!stage || !controlsRoot || !backgroundArtElement || !metadataCardElement) throw new Error('Required DOM nodes missing.');
const backgroundArt = backgroundArtElement;
const metadataCard = metadataCardElement;

const renderer = new Renderer(stage);
const audioManager = new AudioManager();
const loop = new AnimationLoop();
let activeVisualizer: BaseVisualizer = createVisualizer('wave');
activeVisualizer.initialize(renderer.scene);

const controls = new Controls(controlsRoot, {
  onGenerate: (state) => void handleGenerate(state),
  onSettingsChange: applySettings,
});

loop.addUpdateCallback((deltaTime) => activeVisualizer.update(deltaTime));
loop.addRenderCallback(() => renderer.render());
loop.start();

function createVisualizer(mode: VisualizerMode): BaseVisualizer {
  return mode === 'radial' ? new RadialVisualizer() : new WaveVisualizer();
}

function applySettings(state: ControlState): void {
  document.documentElement.style.setProperty('--background-blur', `${state.blurStrength / 3}px`);
  document.documentElement.style.setProperty('--glow-alpha', String(0.25 + state.glowIntensity * 0.55));
  if ((state.mode === 'wave' && activeVisualizer instanceof WaveVisualizer) || (state.mode === 'radial' && activeVisualizer instanceof RadialVisualizer)) {
    activeVisualizer.setSettings({ glowIntensity: state.glowIntensity, bassSensitivity: state.bassSensitivity });
    return;
  }
  activeVisualizer.dispose();
  activeVisualizer = createVisualizer(state.mode);
  activeVisualizer.setSettings({ glowIntensity: state.glowIntensity, bassSensitivity: state.bassSensitivity });
  activeVisualizer.initialize(renderer.scene);
}

async function handleGenerate(state: ControlState): Promise<void> {
  applySettings(state);
  if (!state.url) {
    controls.setStatus('Enter a SoundCloud track URL first.');
    return;
  }

  try {
    controls.setStatus('Resolving track metadata...');
    const track = await postJson<TrackData>('/api/resolve-track', { url: state.url });
    renderMetadata(track);

    if (!track.playable) {
      controls.setStatus('Track resolved, but SoundCloud reports it is not fully playable off-platform.');
      return;
    }

    controls.setStatus('Resolving stream...');
    const stream = track.streamUrl
      ? { streamUrl: track.streamUrl, playable: track.playable, source: track.source }
      : await postJson<StreamResponse>('/api/stream', { trackId: track.id, source: track.source });
    if (stream.streamUrl) {
      audioManager.loadTrack(stream.streamUrl);
      await audioManager.play();
      controls.setStatus('Playing stream. Visualizer is using live analyser data when available.');
    } else {
      controls.setStatus('No stream URL available yet. Running procedural preview animation.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    controls.setStatus(message);
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'error' in payload ? String(payload.error) : 'Request failed';
    throw new Error(message);
  }
  return payload as T;
}

function renderMetadata(track: TrackData): void {
  const image = track.coverArt;
  if (image) backgroundArt.style.backgroundImage = `url("${image}")`;
  metadataCard.hidden = false;
  metadataCard.innerHTML = `
    <span>${track.playable ? 'Playable' : 'Restricted'}</span>
    <strong>${escapeHtml(track.title)}</strong>
    <p>${escapeHtml(track.artist)}</p>
  `;
}

function escapeHtml(value: string): string {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

window.addEventListener('beforeunload', () => {
  loop.stop();
  activeVisualizer.dispose();
  renderer.dispose();
});
