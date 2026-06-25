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

export abstract class BaseProvider {
  public abstract readonly source: AudioSource;

  public abstract canHandle(input: string): boolean;

  public abstract resolve(input: string): Promise<TrackData>;
}
