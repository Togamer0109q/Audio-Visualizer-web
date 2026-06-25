import { BaseProvider, type TrackData } from './BaseProvider';

export class LocalProvider extends BaseProvider {
  public readonly source = 'local' as const;

  public canHandle(input: string): boolean {
    return input.startsWith('local:') || input.startsWith('blob:') || input.startsWith('data:audio/');
  }

  public async resolve(input: string): Promise<TrackData> {
    // TODO: Wire browser File objects directly on the frontend; serverless functions should not receive raw local audio files.
    return {
      id: input.startsWith('local:') ? input.slice('local:'.length) : input,
      title: 'Local audio file',
      artist: 'Local source',
      coverArt: null,
      streamUrl: input.startsWith('blob:') || input.startsWith('data:audio/') ? input : null,
      playable: input.startsWith('blob:') || input.startsWith('data:audio/'),
      source: this.source,
    };
  }
}
