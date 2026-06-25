import { BaseProvider, ProviderError, type TrackData } from './BaseProvider';

interface YouTubeOEmbedResponse {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

interface YouTubeVideosResponse {
  items?: Array<{
    contentDetails?: {
      duration?: string;
    };
  }>;
}

export class YouTubeProvider extends BaseProvider {
  public readonly source = 'youtube' as const;

  public canHandle(input: unknown): boolean {
    if (typeof input !== 'string') return false;
    try {
      const url = new URL(input);
      return ['youtube.com', 'www.youtube.com', 'music.youtube.com', 'youtu.be'].includes(url.hostname);
    } catch {
      return false;
    }
  }

  public async resolve(input: unknown): Promise<TrackData> {
    if (typeof input !== 'string') throw new ProviderError('Invalid YouTube input', 400);

    const videoId = this.extractId(input);
    if (!videoId) throw new ProviderError('Invalid YouTube URL', 400, 'Unable to find a YouTube video id.');

    console.info('[YouTubeProvider] resolving metadata', { videoId });

    try {
      const metadata = await this.fetchOEmbed(input);
      const duration = await this.fetchDuration(videoId);
      return {
        id: videoId,
        title: metadata.title,
        artist: metadata.author_name,
        coverArt: metadata.thumbnail_url,
        streamUrl: null,
        duration,
        playable: false,
        source: this.source,
      };
    } catch (error) {
      console.error('[YouTubeProvider] metadata resolution failed', {
        videoId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ProviderError) throw error;
      throw new ProviderError('Unable to resolve YouTube metadata', 502, error instanceof Error ? error.message : String(error));
    }
  }

  private extractId(input: string): string | null {
    try {
      const url = new URL(input);
      if (url.hostname === 'youtu.be') return url.pathname.slice(1) || null;
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] ?? null;
      return url.searchParams.get('v');
    } catch {
      return null;
    }
  }

  private async fetchOEmbed(input: string): Promise<YouTubeOEmbedResponse> {
    const url = new URL('https://www.youtube.com/oembed');
    url.searchParams.set('url', input);
    url.searchParams.set('format', 'json');

    const response = await fetch(url);
    if (!response.ok) throw new ProviderError('Unable to resolve YouTube metadata', response.status === 404 ? 404 : 502, `oEmbed status ${response.status}`);
    return (await response.json()) as YouTubeOEmbedResponse;
  }

  private async fetchDuration(videoId: string): Promise<number | undefined> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.info('[YouTubeProvider] YOUTUBE_API_KEY not configured; duration unavailable', { videoId });
      return undefined;
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('id', videoId);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url);
    if (!response.ok) throw new ProviderError('Unable to resolve YouTube duration', 502, `YouTube Data API status ${response.status}`);
    const payload = (await response.json()) as YouTubeVideosResponse;
    const isoDuration = payload.items?.[0]?.contentDetails?.duration;
    return isoDuration ? parseIso8601Duration(isoDuration) : undefined;
  }
}

function parseIso8601Duration(duration: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}
