import { BaseProvider, type TrackData } from './BaseProvider';
import { LocalProvider } from './LocalProvider';
import { SoundCloudProvider } from './SoundCloudProvider';
import { YouTubeProvider } from './YouTubeProvider';

export class ProviderResolver {
  private readonly providers: BaseProvider[];

  public constructor(providers: BaseProvider[] = [new SoundCloudProvider(), new YouTubeProvider(), new LocalProvider()]) {
    this.providers = providers;
  }

  public getProvider(input: string): BaseProvider {
    const provider = this.providers.find((candidate) => candidate.canHandle(input));
    if (!provider) throw new Error('Unsupported audio source. Provide a SoundCloud, YouTube, or local audio input.');
    return provider;
  }

  public async resolve(input: string): Promise<TrackData> {
    return this.getProvider(input).resolve(input);
  }
}

export type { TrackData } from './BaseProvider';
