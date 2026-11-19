# VidTube

VidTube is a React/Vite YouTube frontend. Public video, channel, playlist, and category data is loaded from YouTube Data API v3.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_YOUTUBE_API_KEY` to a YouTube Data API v3 key for browser-direct development.
3. In Google Cloud, enable YouTube Data API v3 and restrict this browser key to the local HTTP referrer and YouTube Data API v3.
4. Run `npm run dev`.

The browser-direct key is visible to visitors in the built client. Vite environment variables are configuration, not secrets. Do not use an unrestricted key in a public deployment. The API client uses request caching, in-flight request deduplication, debounced search, cancellation, and a request timeout to reduce unnecessary calls.

## Server-side proxy

Production builds use the committed `.env.production` configuration: the frontend key is empty and requests target `/api/youtube/v3`. Route that path to the allowlisted Node proxy in `server/youtubeProxy.js`, and configure `YOUTUBE_API_KEY` only in the server environment or secret manager. For local proxy development, set both `YOUTUBE_API_KEY` and `VITE_YOUTUBE_API_BASE_URL=/api/youtube/v3` in `.env`, then run `npm run proxy` and `npm run dev` in separate terminals. Vite forwards `/api/youtube/v3` to the local proxy.

The proxy only forwards GET requests for the public YouTube resources used by VidTube. Keep the key restricted to YouTube Data API v3 and, for production, the proxy server's IP address. Do not use a browser-referrer-restricted key as a server key; Google Cloud application restrictions are configured for the intended application type.

## API usage and quota

- `videoCategories.list` loads assignable category IDs for Uzbekistan (`regionCode=UZ`). Home and category feeds use `videos.list` with the `mostPopular` chart and those dynamic IDs. YouTube currently rejects `regionCode=UZ` on the `mostPopular` chart endpoint, so that parameter is deliberately omitted there; category searches use `regionCode=UZ`.
- Search uses `search.list` only after a debounce, then fetches the returned video IDs with `videos.list`.
- Channel uploads use `channels.list`, the channel's uploads playlist ID, `playlistItems.list`, and `videos.list`.
- Playlist pages use `playlists.list`, `playlistItems.list`, and `videos.list`.
- Public list methods cost 1 quota unit per call. Google's current quota documentation lists a default `search.list` limit of 100 calls per day (each request costs 1 unit in its Search Queries bucket); additional page requests also consume quota. Quotas reset at midnight Pacific Time. See [YouTube API quota costs](https://developers.google.com/youtube/v3/determine_quota_cost).

## Account actions and OAuth

The API key provides public data only. Like/dislike, subscribing, private subscriptions/playlists, and comments require user OAuth and are not simulated. VidTube explains this in the UI. A future OAuth flow should use the Google authorization-code flow with PKCE and server-managed token exchange/storage; never put client secrets or refresh tokens in the browser bundle or local storage.

## Commands

- `npm run dev` — Vite development server
- `npm run proxy` — local server-side YouTube API proxy
- `npm run build` — production build
- `npm run lint` — ESLint

Official references: [YouTube Data API](https://developers.google.com/youtube/data), [REST API reference](https://developers.google.com/youtube/v3/docs), and [IFrame Player API](https://developers.google.com/youtube/iframe_api_reference).
