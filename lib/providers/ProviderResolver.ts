import { BaseProvider, ProviderError, type TrackData } from './BaseProvider';
import { LocalProvider } from './LocalProvider';
import { SoundCloudProvider } from './SoundCloudProvider';
import { YouTubeProvider } from './YouTubeProvider';

export class ProviderResolver {
  private readonly providers: BaseProvider[];

  public constructor(providers: BaseProvider[] = [new SoundCloudProvider(), new YouTubeProvider(), new LocalProvider()]) {
    this.providers = providers;
  }

  public getProvider(input: string): BaseProvider {
    const normalizedInput = input.trim();
    const provider = this.providers.find((candidate) => safelyCanHandle(candidate, normalizedInput));
    if (!provider) {
      console.warn('[ProviderResolver] unsupported input', { inputType: describeInput(normalizedInput) });
      throw new ProviderError('Unsupported audio source', 400, 'Provide a SoundCloud, YouTube, blob, data:audio, or local: input.');
    }
    console.info('[ProviderResolver] selected provider', { source: provider.source, inputType: describeInput(normalizedInput) });
    return provider;
  }

  public async resolve(input: string): Promise<TrackData> {
    const normalizedInput = input.trim();
    return this.getProvider(normalizedInput).resolve(normalizedInput);
  }
}

function safelyCanHandle(provider: BaseProvider, input: string): boolean {
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

function describeInput(input: string): string {
  try {
    const url = new URL(input);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return input.startsWith('local:') ? 'local:' : 'unknown';
  }
}

export type { TrackData } from './BaseProvider';
export { ProviderError } from './BaseProvider';
