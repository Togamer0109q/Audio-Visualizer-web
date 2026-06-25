import { BaseProvider, ProviderError, type TrackData } from './BaseProvider';
import { TrackService } from '../soundcloud/tracks';

export class SoundCloudProvider extends BaseProvider {
  public readonly source = 'soundcloud' as const;

  public constructor(private readonly trackService = new TrackService()) {
    super();
  }

  public canHandle(input: string): boolean {
    try {
      const url = new URL(input);
      return url.hostname === 'soundcloud.com' || url.hostname.endsWith('.soundcloud.com');
    } catch {
      return false;
    }
  }

  public async resolve(input: string): Promise<TrackData> {
    if (!hasSoundCloudCredentials()) {
      console.warn('[SoundCloudProvider] missing SoundCloud credentials');
      throw new ProviderError('SoundCloud provider unavailable', 503);
    }

    console.info('[SoundCloudProvider] resolving track metadata');
    const metadata = await this.trackService.getTrackFromUrl(input);
    let streamUrl: string | null = null;
    let playable = metadata.playable;

    if (metadata.playable) {
      try {
        const stream = await this.trackService.getPlayableStream(metadata.trackId);
        streamUrl = stream.streamUrl;
        playable = stream.playable;
      } catch (error) {
        // TODO: Surface structured provider diagnostics once production SoundCloud credentials are available.
        console.warn('[SoundCloudProvider] stream resolution unavailable', {
          trackId: metadata.trackId,
          error: error instanceof Error ? error.message : String(error),
        });
        streamUrl = null;
      }
    }

    return {
      id: metadata.trackId,
      title: metadata.title,
      artist: metadata.artist,
      coverArt: metadata.coverArt ?? metadata.artistAvatar,
      streamUrl,
      playable,
      source: this.source,
    };
  }
}

function hasSoundCloudCredentials(): boolean {
  return Boolean(process.env.SOUNDCLOUD_CLIENT_ID && process.env.SOUNDCLOUD_CLIENT_SECRET);
}
