import { cache } from '../cache';
import { SoundCloudClient } from './client';

export interface TrackMetadata {
  trackId: string;
  title: string;
  artist: string;
  coverArt: string | null;
  artistAvatar: string | null;
  playable: boolean;
}

export interface StreamInfo {
  streamUrl: string | null;
  playable: boolean;
}

interface SoundCloudUser {
  username?: string;
  avatar_url?: string | null;
}

interface SoundCloudTrack {
  id: number | string;
  title?: string;
  artwork_url?: string | null;
  user?: SoundCloudUser;
  streamable?: boolean;
  access?: 'playable' | 'preview' | 'blocked' | string;
  kind?: string;
}

interface SoundCloudStreamResponse {
  http_mp3_128_url?: string;
  hls_mp3_128_url?: string;
  hls_opus_64_url?: string;
  preview_mp3_128_url?: string;
}

export class TrackService {
  public constructor(private readonly client = new SoundCloudClient()) {}

  public async getTrackFromUrl(url: string): Promise<TrackMetadata> {
    const cacheKey = `track:url:${url}`;
    const cached = cache.get<TrackMetadata>(cacheKey);
    if (cached) return cached;

    const resource = await this.client.get<SoundCloudTrack>('/resolve', { url });
    if (resource.kind && resource.kind !== 'track') throw new Error('Only SoundCloud track URLs are supported.');
    const metadata = this.mapTrack(resource);
    cache.set(cacheKey, metadata, 10 * 60_000);
    cache.set(`track:id:${metadata.trackId}`, metadata, 10 * 60_000);
    return metadata;
  }

  public async getTrackMetadata(trackId: string): Promise<TrackMetadata> {
    const cacheKey = `track:id:${trackId}`;
    const cached = cache.get<TrackMetadata>(cacheKey);
    if (cached) return cached;
    const track = await this.client.get<SoundCloudTrack>(`/tracks/${encodeURIComponent(trackId)}`);
    const metadata = this.mapTrack(track);
    cache.set(cacheKey, metadata, 10 * 60_000);
    return metadata;
  }

  public async getPlayableStream(trackId: string): Promise<StreamInfo> {
    const metadata = await this.getTrackMetadata(trackId);
    if (!metadata.playable) return { streamUrl: null, playable: false };

    // TODO: Confirm preferred transcoding selection once production SoundCloud app credentials are available.
    const stream = await this.client.get<SoundCloudStreamResponse>(`/tracks/${encodeURIComponent(trackId)}/stream`);
    const streamUrl = stream.http_mp3_128_url ?? stream.hls_mp3_128_url ?? stream.hls_opus_64_url ?? stream.preview_mp3_128_url ?? null;
    return { streamUrl, playable: streamUrl !== null };
  }

  private mapTrack(track: SoundCloudTrack): TrackMetadata {
    const access = track.access ?? (track.streamable ? 'playable' : 'blocked');
    return {
      trackId: String(track.id),
      title: track.title ?? 'Untitled track',
      artist: track.user?.username ?? 'Unknown artist',
      coverArt: upgradeArtwork(track.artwork_url ?? null),
      artistAvatar: upgradeArtwork(track.user?.avatar_url ?? null),
      playable: access === 'playable' || track.streamable === true,
    };
  }
}

function upgradeArtwork(url: string | null): string | null {
  return url?.replace('-large', '-t500x500') ?? null;
}
