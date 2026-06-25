import { BaseProvider, ProviderError, type TrackData } from './BaseProvider';
import { LocalProvider } from './LocalProvider';
import { SoundCloudProvider } from './SoundCloudProvider';
import { YouTubeProvider } from './YouTubeProvider';

export class ProviderResolver {
  private readonly providers: BaseProvider[];

  public constructor(providers: BaseProvider[] = [new SoundCloudProvider(), new YouTubeProvider(), new LocalProvider()]) {
    this.providers = providers;
  }

  public getProvider(input: unknown): BaseProvider {
    const normalizedInput = normalizeInput(input);
    const provider = this.providers.find((candidate) => safelyCanHandle(candidate, normalizedInput));
    if (!provider) {
      console.warn('[ProviderResolver] unsupported input', { inputType: describeInput(normalizedInput) });
      throw new ProviderError('Unsupported audio source', 400, 'Provide a SoundCloud, YouTube, blob, data:audio, or local: input.');
    }
    console.info('[ProviderResolver] selected provider', { source: provider.source, inputType: describeInput(normalizedInput) });
    return provider;
  }

  public async resolve(input: unknown): Promise<TrackData> {
    const normalizedInput = normalizeInput(input);
    return this.getProvider(normalizedInput).resolve(normalizedInput);
  }
}

function safelyCanHandle(provider: BaseProvider, input: unknown): boolean {
  try {
    return provider.canHandle(input);
  } catch (error) {
    console.warn('[ProviderResolver] provider canHandle failed', {
      source: provider.source,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

function describeInput(input: unknown): string {
  if (typeof File !== 'undefined' && input instanceof File) return `file:${input.type || 'unknown'}`;
  if (input && typeof input === 'object' && 'audioFile' in input) return 'local-file-input';
  if (typeof input !== 'string') return typeof input;
  try {
    const url = new URL(input);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return input.startsWith('local:') ? 'local:' : 'unknown';
  }
}

export type { TrackData } from './BaseProvider';
export { ProviderError } from './BaseProvider';

function normalizeInput(input: unknown): unknown {
  return typeof input === 'string' ? input.trim() : input;
}
