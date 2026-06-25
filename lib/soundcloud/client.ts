import { TokenManager } from './auth';

const API_BASE_URL = 'https://api.soundcloud.com';

export class SoundCloudClient {
  public constructor(private readonly tokenManager = new TokenManager()) {}

  public async get<T>(pathOrUrl: string, params?: Record<string, string>): Promise<T> {
    const token = await this.tokenManager.authenticate();
    const url = pathOrUrl.startsWith('https://') ? new URL(pathOrUrl) : new URL(pathOrUrl, API_BASE_URL);
    if (params) {
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    }
    return this.fetchWithBackoff<T>(url, token.accessToken);
  }

  private async fetchWithBackoff<T>(url: URL, accessToken: string, attempt = 0): Promise<T> {
    const response = await fetch(url, {
      headers: { accept: 'application/json; charset=utf-8', Authorization: `OAuth ${accessToken}` },
    });

    if (response.status === 429 && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
      return this.fetchWithBackoff<T>(url, accessToken, attempt + 1);
    }
    if (!response.ok) throw new Error(`SoundCloud request failed with status ${response.status}.`);
    return (await response.json()) as T;
  }
}
