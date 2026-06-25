# SoundCloud Visualizer

A browser-based audio visualizer inspired by phonk and edit visualizers. The frontend is a Vite + TypeScript + Three.js app, and the backend is designed for Vercel Serverless Functions with a Universal Audio Provider System (UAPS).

## Features

- Fullscreen dark cyber-themed interface with glassmorphism panels.
- Universal provider resolver for SoundCloud, YouTube, and local audio inputs.
- Backend-only provider access so third-party APIs are never called directly by the frontend.
- Track metadata and stream resolution scaffolding normalized into one `TrackData` shape.
- Modular Three.js renderer and animation loop.
- Wave and radial visualizer modes with procedural animation.
- AudioManager prepared for Web Audio API analyser data and mock fallback.
- Zod input validation, in-memory cache abstraction, and per-IP rate limiting.

## Architecture

```text
Frontend (Vite / TypeScript / Three.js)
  -> Vercel API routes
    -> ProviderResolver
      -> SoundCloudProvider -> SoundCloud API (https://api.soundcloud.com)
      -> YouTubeProvider -> TODO approved metadata/stream strategy
      -> LocalProvider -> TODO browser File integration
```

The frontend never calls third-party providers directly. API routes validate input, rate-limit callers, select the correct provider, cache token/track data where relevant, and return a normalized `TrackData` object to the visualizer.

## Universal Audio Provider System

All providers normalize results into:

```ts
interface TrackData {
  id: string;
  title: string;
  artist: string;
  coverArt: string | null;
  streamUrl: string | null;
  duration?: number;
  playable: boolean;
  source: "soundcloud" | "youtube" | "local";
}
```

Current provider status:

- `LocalProvider`: fully supports browser MP3/WAV `File` uploads, creates object URLs for playback, derives titles from filenames, and supports optional uploaded cover art.
- `YouTubeProvider`: resolves title, channel, thumbnail, and duration when `YOUTUBE_API_KEY` is configured; without stream extraction it intentionally returns `playable: false`.
- `SoundCloudProvider`: remains stable and scaffolded behind credentials while stream-selection details are verified against production SoundCloud app access.

## SoundCloud API notes

The integration follows SoundCloud's official API guide and OpenAPI reference:

- API base URL: `https://api.soundcloud.com`
- Token host: `https://secure.soundcloud.com`
- Auth header: `Authorization: OAuth <access_token>`
- Client Credentials is used for public track lookup/playback scaffolding.
- Authorization Code with PKCE is not fully implemented yet because it requires app registration, redirect URI configuration, and production credential handling.
- Token refresh and stream-transcoding selection are scaffolded with TODO comments for verification against production app credentials.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in SoundCloud app credentials:

   ```bash
   SOUNDCLOUD_CLIENT_ID=
   SOUNDCLOUD_CLIENT_SECRET=
   SOUNDCLOUD_REDIRECT_URI=
   YOUTUBE_API_KEY=
   ```

4. Run locally:

   ```bash
   npm run dev
   ```

5. Type-check and build:

   ```bash
   npm run typecheck
   npm run build
   ```

## Vercel deployment

- Add `SOUNDCLOUD_CLIENT_ID`, `SOUNDCLOUD_CLIENT_SECRET`, `SOUNDCLOUD_REDIRECT_URI`, and optional `YOUTUBE_API_KEY` in the Vercel project settings.
- Deploy with Vercel using the included `vercel.json`.
- The frontend build output is `dist`, and serverless functions live in `api/`.

## API error format

API routes return structured JSON errors instead of raw server errors:

```json
{
  "error": true,
  "message": "Human readable error",
  "details": "Optional technical details"
}
```

If SoundCloud credentials are missing, SoundCloud-backed routes return HTTP `503` with `SoundCloud provider unavailable` instead of crashing. Unsupported provider inputs return HTTP `400`, YouTube metadata failures return structured provider errors, and providers without stream extraction return non-playable normalized responses.

## API routes

### `GET /api/health`

Returns:

```json
{ "status": "ok" }
```

### `POST /api/resolve-track`

Request accepts any URL-based provider input. Local MP3/WAV playback is handled directly in the browser with `LocalProvider` because serverless functions cannot receive browser `File` objects without a dedicated upload pipeline:

```json
{ "url": "https://soundcloud.com/artist/track" }
```

Response uses normalized `TrackData`:

```json
{
  "id": "123",
  "title": "Track title",
  "artist": "Artist",
  "coverArt": null,
  "streamUrl": null,
  "playable": true,
  "source": "soundcloud"
}
```

### `POST /api/stream`

Request:

```json
{ "trackId": "123", "source": "soundcloud" }
```

Response:

```json
{ "streamUrl": null, "playable": false }
```
