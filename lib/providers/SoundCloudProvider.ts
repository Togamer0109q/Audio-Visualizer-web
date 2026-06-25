import { BaseProvider, type TrackData } from './BaseProvider';
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
    const metadata = await this.trackService.getTrackFromUrl(input);
    let streamUrl: string | null = null;
    let playable = metadata.playable;

    if (metadata.playable) {
      try {
        const stream = await this.trackService.getPlayableStream(metadata.trackId);
        streamUrl = stream.streamUrl;
        playable = stream.playable;
      } catch {
        // TODO: Surface structured provider diagnostics once production SoundCloud credentials are available.
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
