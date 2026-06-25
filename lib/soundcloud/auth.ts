import { cache } from '../cache';

export interface TokenData {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  scope: string | null;
}

interface SoundCloudTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

const TOKEN_HOST = 'https://secure.soundcloud.com';
const TOKEN_CACHE_KEY = 'soundcloud:token';

export class TokenManager {
  public async authenticate(): Promise<TokenData> {
    const cached = cache.get<TokenData>(TOKEN_CACHE_KEY);
    if (cached && cached.expiresAt - Date.now() > 30_000) return cached;

    const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
    const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('SoundCloud credentials are not configured. Add SOUNDCLOUD_CLIENT_ID and SOUNDCLOUD_CLIENT_SECRET.');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${TOKEN_HOST}/oauth/token`, {
      method: 'POST',
      headers: {
        accept: 'application/json; charset=utf-8',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });
    if (!response.ok) throw new Error(`SoundCloud authentication failed with status ${response.status}.`);
    const payload = (await response.json()) as SoundCloudTokenResponse;
    const token = this.toTokenData(payload);
    cache.set(TOKEN_CACHE_KEY, token, Math.max(payload.expires_in - 60, 60) * 1000);
    return token;
  }

  public async refreshToken(refreshToken: string): Promise<TokenData> {
    const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
    const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('SoundCloud credentials are not configured.');

    const response = await fetch(`${TOKEN_HOST}/oauth/token`, {
      method: 'POST',
      headers: { accept: 'application/json; charset=utf-8', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }),
    });
    if (!response.ok) throw new Error(`SoundCloud token refresh failed with status ${response.status}.`);
    const token = this.toTokenData((await response.json()) as SoundCloudTokenResponse);
    cache.set(TOKEN_CACHE_KEY, token, Math.max(token.expiresAt - Date.now() - 60_000, 60_000));
    return token;
  }

  private toTokenData(payload: SoundCloudTokenResponse): TokenData {
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? null,
      expiresAt: Date.now() + payload.expires_in * 1000,
      scope: payload.scope ?? null,
    };
  }
}
