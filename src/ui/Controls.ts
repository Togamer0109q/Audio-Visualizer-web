export type VisualizerMode = 'wave' | 'radial';

export interface ControlState {
  url: string;
  glowIntensity: number;
  blurStrength: number;
  bassSensitivity: number;
  mode: VisualizerMode;
}

interface ControlHandlers {
  onGenerate: (state: ControlState) => void;
  onSettingsChange: (state: ControlState) => void;
}

export class Controls {
  private readonly root: HTMLElement;
  private readonly handlers: ControlHandlers;

  public constructor(root: HTMLElement, handlers: ControlHandlers) {
    this.root = root;
    this.handlers = handlers;
    this.root.innerHTML = this.template();
    this.bind();
  }

  public setStatus(message: string): void {
    const status = this.root.querySelector<HTMLElement>('[data-status]');
    if (status) status.textContent = message;
  }

  private getState(): ControlState {
    return {
      url: this.input('[data-url]').value.trim(),
      glowIntensity: Number(this.input('[data-glow]').value) / 100,
      blurStrength: Number(this.input('[data-blur]').value),
      bassSensitivity: Number(this.input('[data-bass]').value) / 100,
      mode: this.input('[data-mode]').value as VisualizerMode,
    };
  }

  private bind(): void {
    this.root.querySelector<HTMLButtonElement>('[data-generate]')?.addEventListener('click', () => {
      this.handlers.onGenerate(this.getState());
    });
    this.root.querySelector<HTMLButtonElement>('[data-toggle-settings]')?.addEventListener('click', () => {
      this.root.querySelector('[data-settings]')?.classList.toggle('is-collapsed');
    });
    this.root.querySelectorAll('input, select').forEach((element) => {
      element.addEventListener('input', () => this.handlers.onSettingsChange(this.getState()));
    });
  }

  private input(selector: string): HTMLInputElement | HTMLSelectElement {
    const element = this.root.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
    if (!element) throw new Error(`Missing control: ${selector}`);
    return element;
  }

  private template(): string {
    return `
      <header class="hero-panel">
        <p class="eyebrow">Phonk / edit inspired</p>
        <h1>SoundCloud Visualizer</h1>
        <div class="url-row">
          <input data-url type="url" placeholder="Paste SoundCloud URL..." autocomplete="off" />
          <button data-generate type="button">Generate</button>
        </div>
        <p data-status class="status">Paste a SoundCloud track URL to resolve metadata.</p>
      </header>
      <aside data-settings class="settings-panel">
        <button data-toggle-settings class="settings-toggle" type="button">Settings</button>
        <div class="settings-content">
          <label>Glow Intensity <input data-glow type="range" min="0" max="100" value="70" /></label>
          <label>Blur Strength <input data-blur type="range" min="0" max="100" value="55" /></label>
          <label>Bass Sensitivity <input data-bass type="range" min="0" max="100" value="65" /></label>
          <label>Visualizer Mode
            <select data-mode>
              <option value="wave">Wave</option>
              <option value="radial">Radial</option>
            </select>
          </label>
        </div>
      </aside>`;
  }
}
