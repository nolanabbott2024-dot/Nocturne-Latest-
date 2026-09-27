# Nocturne TV 4.0

Native Android and Fire TV redesign, using the supplied Apple TV screenshot as the visual reference and Stremio's addon resource model as the data contract.

## Screens

- Home: immersive artwork, title logo when supplied, actions, Continue Watching, Watchlist, live catalog rails.
- Movies, TV Shows, Sports: catalog-driven sections. Live/sports catalogs appear only when supplied by an installed addon.
- Channels: installed providers and their catalogs.
- Catalog: full collection grid, addon-provided genre filters and pagination.
- Search: federated addon search with profile-specific recent searches.
- Library: Watchlist, Continue Watching, Watched, movie/series filters, progress bars and title context actions.
- Details: artwork, metadata, Watchlist, trailers, seasons, episodes, cast search, description, and additional titles from a catalog.
- Ways to Watch: stream sources, quality/codec/size labels, filtering, deduplication by source URL, and optional automatic selection.
- Player: Media3 ExoPlayer, HLS/DASH support, resume, media-session controls, audio and subtitle track selection, speed, next episode, source switching, and Picture in Picture on compatible devices.
- Settings: profiles, addon install/update/remove and per-resource controls, catalog row visibility/name/order, playback and appearance preferences, source preferences, and local data controls.

## Architecture

- `StremioClient`: HTTP resource transport and protocol types. Resource-specific type/id-prefix constraints, catalog extras, stream headers and episode metadata are handled here.
- `AddonRepository`: asynchronous addon/catalog/meta/stream/subtitle effects, five-minute in-memory catalog cache, manifest fallback cache, provider failure reporting.
- `LibraryStore`: profile-local Watchlist/history/progress, watched episodes, profile management, and legacy list migration.
- `MainActivity` and `TvUi`: native screen routing, Back stack, focusable glass surfaces, horizontal rails and full pages.
- `TrailerView`: direct trailers through Media3; YouTube trailers through its official embedded player. The rest of the app is native.
- `PlayerActivity`: playback lifecycle, media session, saved progress, audio/subtitle selection, next-episode resolution.

The supplied Rust stremio-core source informed the transport/model separation and URL contract. This app implements those contracts in Java; it does not embed the Rust runtime or claim complete stremio-core parity.

## Data and behavior

Catalog names, rankings, provider rows, artwork and logos come from addon responses. The app does not fabricate Netflix, Disney+, regional Top 10 rankings, sports schedules, or unavailable metadata. Catalogs reload when browsed after the cache expires; launch and Settings → Refresh Catalogs refresh addon manifests.

Remote focus or pointer hover starts a trailer after five seconds when a trailer is available. The card expands in its row; leaving it stops playback and restores its size. Focus does not replace the page background. Preview settings and sound are controlled in Settings, with no floating sound button.

Profiles are local to the device. The optional family filter accepts G, PG, TV-Y, TV-Y7, TV-G and TV-PG ratings and hides unrated titles. It is a viewing filter, not a PIN-secured parental-control system.

No personal addon URL/token is bundled. Installed manifests stay in device preferences. Android backup is disabled. Previously published personalized URLs must still be rotated because source history is not erased by removing a constant.

## Verification

The GitHub workflow compiles the app and its instrumentation package, then runs an API 30 TV emulator. `NocturneTest` checks addon URL encoding, resource-specific constraints, saved episode round-trips, profile isolation, duplicate-source handling, native navigation, card preview start/cleanup, Watchlist, stream selection, real local video playback and saved progress. It captures screenshots of the native screens. The generated test video and test catalog live only in the instrumentation package.

Download the `Nocturne-TV-verification` workflow artifact for screenshots and reports. Test results are authoritative for the commit associated with that run; a feature list alone is not evidence of a passing test.

These checks do not verify a user's private addon credentials, every remote provider, every YouTube embed, DRM streams, Fire OS codec availability, or every physical remote. Those require device/provider testing.

## Platform boundaries

Apple account sign-in, Store purchases/rentals, Apple subscriptions, licensed sports feeds, AirPlay, SharePlay, Siri service integration and scene-level InSight require separate platform services and data rights. They are not simulated by empty screens. Torrent-only infoHash sources require an addon or external streaming server that resolves them to playable URLs.

## Research references

- Apple TV navigation: https://support.apple.com/guide/tvapp/navigate-the-apple-tv-app-atvb14e9d4d5/web
- Apple title pages and viewing: https://support.apple.com/en-mide/guide/tvapp/atvbb35c9fc3/web
- Media3 lifecycle and playback: https://developer.android.com/media/media3/exoplayer/hello-world
- YouTube embedding and error handling: https://developers.google.com/youtube/iframe_api_reference
- Supplied Stremio source: `src/addon_transport/http_transport/http_transport.rs`, `src/types/addon/request.rs`, `src/types/query_params_encode.rs`.

## Building

JDK 17, Gradle 8.9, Android SDK 35:

```sh
gradle :app:assembleDebug
gradle :app:connectedDebugAndroidTest
```

The workflow reuses a debug signing key while the GitHub cache is available. A production signing key stored in repository secrets is still required for guaranteed long-term in-place upgrades. An APK signed with a different key cannot replace an installed version; uninstalling clears local data.
