# SoundCloud Visualizer

A browser-based SoundCloud visualizer inspired by phonk and edit visualizers. The frontend is a Vite + TypeScript + Three.js app, and the backend is designed for Vercel Serverless Functions.

## Features

- Fullscreen dark cyber-themed interface with glassmorphism panels.
- SoundCloud URL input with backend-only SoundCloud API access.
- Track metadata resolution endpoint.
- Stream resolution endpoint scaffolded for real credentials.
- Modular Three.js renderer and animation loop.
- Wave and radial visualizer modes with procedural animation.
- AudioManager prepared for Web Audio API analyser data and mock fallback.
- Zod input validation, in-memory cache abstraction, and per-IP rate limiting.

## Architecture

```text
Frontend (Vite / TypeScript / Three.js)
  -> Vercel API routes
    -> SoundCloud API (https://api.soundcloud.com)
    -> SoundCloud token host (https://secure.soundcloud.com)
```

The frontend never calls SoundCloud directly. API routes validate input, rate-limit callers, authenticate with SoundCloud, cache token/track data, and return only the data needed by the visualizer.

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

- Add `SOUNDCLOUD_CLIENT_ID`, `SOUNDCLOUD_CLIENT_SECRET`, and `SOUNDCLOUD_REDIRECT_URI` in the Vercel project settings.
- Deploy with Vercel using the included `vercel.json`.
- The frontend build output is `dist`, and serverless functions live in `api/`.

## API routes

### `GET /api/health`

Returns:

```json
{ "status": "ok" }
```

### `POST /api/resolve-track`

Request:

```json
{ "url": "https://soundcloud.com/artist/track" }
```

Response:

```json
{
  "trackId": "123",
  "title": "Track title",
  "artist": "Artist",
  "coverArt": null,
  "artistAvatar": null,
  "playable": true
}
```

### `POST /api/stream`

Request:

```json
{ "trackId": "123" }
```

Response:

```json
{ "streamUrl": null, "playable": false }
```
