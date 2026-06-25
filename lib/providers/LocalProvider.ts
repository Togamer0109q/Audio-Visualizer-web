import { BaseProvider, ProviderError, type TrackData } from './BaseProvider';

export interface LocalProviderInput {
  audioFile: File;
  coverFile?: File | null;
}

const SUPPORTED_AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave']);
const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav'];

export class LocalProvider extends BaseProvider {
  public readonly source = 'local' as const;

  public canHandle(input: unknown): boolean {
    if (isFile(input)) return isSupportedAudioFile(input);
    if (isLocalProviderInput(input)) return isSupportedAudioFile(input.audioFile);
    return typeof input === 'string' && (input.startsWith('local:') || input.startsWith('blob:') || input.startsWith('data:audio/'));
  }

  public async resolve(input: unknown): Promise<TrackData> {
    if (isLocalProviderInput(input)) return this.resolveFile(input.audioFile, input.coverFile ?? null);
    if (isFile(input)) return this.resolveFile(input, null);
    if (typeof input === 'string') return this.resolveStringInput(input);

    throw new ProviderError('Unsupported local audio input', 400, 'Provide an MP3 or WAV File.');
  }

  private async resolveFile(audioFile: File, coverFile: File | null): Promise<TrackData> {
    if (!isSupportedAudioFile(audioFile)) {
      console.warn('[LocalProvider] unsupported audio file', { name: audioFile.name, type: audioFile.type });
      throw new ProviderError('Unsupported local audio file', 400, 'Only MP3 and WAV files are supported.');
    }
    if (coverFile && !coverFile.type.startsWith('image/')) {
      console.warn('[LocalProvider] unsupported cover file', { name: coverFile.name, type: coverFile.type });
      throw new ProviderError('Unsupported cover image', 400, 'Cover art must be an image file.');
    }

    console.info('[LocalProvider] resolved local audio file', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      hasCover: Boolean(coverFile),
    });

    return {
      id: createLocalId(audioFile),
      title: parseTitleFromFilename(audioFile.name),
      artist: 'Local file',
      coverArt: coverFile ? URL.createObjectURL(coverFile) : null,
      streamUrl: URL.createObjectURL(audioFile),
      playable: true,
      source: this.source,
    };
  }

  private async resolveStringInput(input: string): Promise<TrackData> {
    if (input.startsWith('blob:') || input.startsWith('data:audio/')) {
      return {
        id: input,
        title: 'Local audio file',
        artist: 'Local source',
        coverArt: null,
        streamUrl: input,
        playable: true,
        source: this.source,
      };
    }

    throw new ProviderError('Local file upload required', 400, 'Use an MP3 or WAV file to play local audio.');
  }
}

function isLocalProviderInput(input: unknown): input is LocalProviderInput {
  return Boolean(input && typeof input === 'object' && 'audioFile' in input && isFile((input as LocalProviderInput).audioFile));
}

function isFile(input: unknown): input is File {
  return typeof File !== 'undefined' && input instanceof File;
}

function isSupportedAudioFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return SUPPORTED_AUDIO_TYPES.has(file.type) || SUPPORTED_AUDIO_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function parseTitleFromFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^.]+$/, '');
  return withoutExtension.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Local audio file';
}

function createLocalId(file: File): string {
  return `local:${file.name}:${file.size}:${file.lastModified}`;
}
