export type AudioSource = 'soundcloud' | 'youtube' | 'local';

export interface TrackData {
  id: string;
  title: string;
  artist: string;
  coverArt: string | null;
  streamUrl: string | null;
  duration?: number;
  playable: boolean;
  source: AudioSource;
}

export class ProviderError extends Error {
  public constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly details?: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export abstract class BaseProvider {
  public abstract readonly source: AudioSource;

  public abstract canHandle(input: string): boolean;

  public abstract resolve(input: string): Promise<TrackData>;
}
