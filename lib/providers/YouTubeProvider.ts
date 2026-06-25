import { BaseProvider, type TrackData } from './BaseProvider';

export class YouTubeProvider extends BaseProvider {
  public readonly source = 'youtube' as const;

  public canHandle(input: string): boolean {
    try {
      const url = new URL(input);
      return ['youtube.com', 'www.youtube.com', 'music.youtube.com', 'youtu.be'].includes(url.hostname);
    } catch {
      return false;
    }
  }

  public async resolve(input: string): Promise<TrackData> {
    // TODO: Implement metadata extraction through an approved YouTube data/streaming strategy.
    // Avoid server-side media extraction until legal/API requirements are explicitly selected.
    return {
      id: this.extractId(input) ?? input,
      title: 'YouTube track support coming soon',
      artist: 'YouTube',
      coverArt: null,
      streamUrl: null,
      playable: false,
      source: this.source,
    };
  }

  private extractId(input: string): string | null {
    try {
      const url = new URL(input);
      if (url.hostname === 'youtu.be') return url.pathname.slice(1) || null;
      return url.searchParams.get('v');
    } catch {
      return null;
    }
  }
}
