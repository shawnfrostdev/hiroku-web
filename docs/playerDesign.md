# Enterprise-Grade Premium Video Player Design Specification

This document details the complete design specification for the custom video player, matching the streaming standards of Netflix, Hulu, and Crunchyroll.

---

## 1. Core Playback Engine & Adaptive Streaming

* **ABR Engine (Adaptive Bitrate):** Native HLS (`hls.js`) and DASH (`dash.js`) integrations. Automatically scales video resolution (1080p, 720p, 480p, 360p) based on real-time network throughput (bandwidth calculation).
* **Multi-Audio Channel Router:** Decodes multiple audio tracks from the stream manifest, allowing on-the-fly toggling between original audio (e.g. Japanese) and localized dubs.
* **Text Track Parser (WebVTT/SRT):** Custom rendering engine to overlay styled subtitles. Supports customizable user preferences (font sizes, text colors, background opacity, and positioning presets).

---

## 2. Advanced UX & Multi-Device Capabilities

### Desktop Interaction
* **Standard Keyboard Layout:**
  * `Space`: Play/Pause
  * `Left / Right Arrows`: Seek 10s backward/forward
  * `Up / Down Arrows`: Adjust volume (5% increments)
  * `M`: Toggle mute state
  * `F`: Toggle native fullscreen mode
  * `T`: Toggle theater view layout
* **Timeline Indexing & Chapters:** Interactive progress bar segmented with visual markers mapping to scene chapters (loaded from an external VTT map). Shows thumbnail previews on hover.

### Mobile UX (Touch Gestures)
* **Double Tap Seek:** Double tapping the left 30% of the screen seeks backward 10s; double tapping the right 30% seeks forward 10s.
* **Vertical Swipes:** Swiping vertically on the left side adjusts display brightness; swiping on the right side adjusts player volume.

### External Cast & Picture-in-Picture
* **Native PiP API:** Allows users to pop out the player into a floating, resizable overlay window while switching tabs or minimizing the browser.
* **Casting Protocols:** Built-in SDK connectors for Google Chromecast (Web Receiver SDK) and Apple AirPlay.

---

## 3. Commercial Content Protection & Security

* **Multi-DRM Architecture:** Integrates hardware/browser-level content decryption modules (CDM) to protect streams from unauthorized decrypts:
  * **Google Widevine (Modular DRM):** Chrome, Firefox, Opera, and Android devices.
  * **Apple FairPlay Streaming:** Safari (macOS) and iOS native/web.
  * **Microsoft PlayReady:** Edge browser and Windows environments.
* **Dynamic Forensic Watermarking:** Overlaying user identifiers (User ID, IP Address, session token) as a faint, randomized, moving watermark across the frames to prevent and trace screen-record leaks.
* **Concurrency Enforcement:** WebSocket or heartbeat session checks that prevent simultaneous streaming from the same account across multiple IP addresses or device configurations.
* **Geo-Restricted Delivery (Geo-fencing):** IP-based verification at the CDN edge to block access from unauthorized geographical locations based on content licensing.

---

## 4. Reliability & QoE (Quality of Experience) Telemetry

* **QoE Analytics Reporter:** Background beacon pinging every 10 seconds to log critical playback metrics:
  * **TTFF (Time-To-First-Frame):** Measures initial player latency.
  * **Rebuffer Ratio:** Buffering duration divided by total watch time.
  * **Error Rates:** Logs fatal decode errors, CDN timeout errors (e.g. 504 Gateway Timeout), or manifest 404s.
* **Seamless Multi-CDN Fallback:** If chunk download speeds from the primary CDN drop below a threshold or throw consecutive network errors, the engine seamlessly rewrites chunk URLs to a secondary CDN without stalling playback.

---

## 5. Architectural Decoupling & Headless Orchestration

* **State Separation (Event-Driven):** The core playback engines run independently of React's render loop, emitting standard events (`PLAY`, `PAUSE`, `TIME_UPDATE`, `QUALITY_CHANGE`, `BUFFERING`) to a central state store (e.g. Zustand or Redux). Control bars and setting menus reactively subscribe to changes in the store to eliminate re-render lag.
* **Metadata Ingestion Engine:** Exposes clean ingestion points to receive dynamic timestamp payloads (intro/outro parameters, recap points, and chapter segment intervals) fetched from API endpoints.

---

## 6. Accessibility (a11y) & WCAG Compliance

* **ARIA Integrations:** All interactive components use appropriate HTML5 semantic structures and ARIA attributes (e.g. `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`).
* **Keyboard Focus Management:** Implements absolute focus trapping when custom menu popups (e.g. settings, selector panels) are open. Highly visible focus outlines are styled for keyboard-only navigation.

---

## 7. Secure Offline Playback

* **Local Media Cache (IndexedDB):** Implements Service Workers and IndexedDB APIs to securely download and store encrypted video segments locally in the browser cache.
* **Offline License Persistence:** Persists DRM license keys in secure browser containers, allowing local offline decryption while respecting key expiry policies set by content providers.

---

## 8. Ad-Insertion Standards (AVOD)

* **SSAI Integration (Server-Side Ad Insertion):** Seamlessly parses stream manifests containing dynamically stitched ad segments at the server level, preventing client-side ad-blocking software from detecting and stripping commercial breaks.
* **CSAI Support (Client-Side Ad Insertion):** Core parsing engine for industry-standard VAST (Video Ad Serving Template) and VPAID (Video Player Ad-Interface Definition) schemas to display pre-rolls, mid-rolls, and overlays.

---

## 9. Browser Quirks & Autoplay Management

* **Autoplay Blocker Mitigation:** Fallback logic that automatically switches to muted playback if the browser's Media Engagement Index (MEI) blocks unmuted audio on start. Triggers a prominent "Click to Unmute" overlay.
* **iOS Safari Inline Configuration:** Explicitly configures `playsinline` and `webkit-playsinline` on the `<video>` element, disabling iOS Safari's default behavioral hijacking to prevent the native QuickTime player from stripping custom UI layers.

---

## 10. Live Streaming & DVR (Digital Video Recording)

* **Low-Latency Streaming Protocols:** Implementation parameters for LL-HLS and CMAF chunk processing to minimize live stream latency from 30 seconds down to a premium 2–5 seconds.
* **DVR Sliding Time-Window:** Configures a sliding window (e.g. 2 hours) inside the player cache. Allows users to seek backward into live-aired segments and seamlessly transition back to the real-time "Live Edge" through a dedicated UI control.

---

## 11. Extensible Plugin & Middleware Architecture

* **Engine Middleware Hook Registry:** Headless core architecture exposed with a lifecycle event emitter system (`beforePlay`, `onProgress`, `beforeSwitchResolution`). Enables developers to hook third-party services (e.g. analytics beacons, ad trackers, overlay renderers) into the stream without bloating the core player package.

---

## 12. Core Implementation Strategy & Architecture Blueprint

### A. Selected Engine Stack
* **Core Playback Engine:** **Google Shaka Player**. Selected for native, industry-standard handling of HLS/DASH manifest switching, IndexedDB-based secure offline storage, and seamless integration with commercial CDMs (Widevine, FairPlay, PlayReady).
* **State Manager:** **Zustand**. Configured as the decoupled, headless state orchestrator. Prevents React virtual-DOM re-renders from interrupting hardware-accelerated video decoding.
* **UI Foundation:** **Tailwind CSS** paired with **Radix UI Primitives** (e.g. Slider, Dialog) to achieve native compliance with WCAG keyboard-only access and focus-trapping.

### B. React / Next.js Component Tree Layout
```text
<PlayerContainer> (Initializes headless Zustand event/state store)
  ├── <VideoCore /> (Wraps native <video> tag & Shaka player engine interface)
  ├── <PlayerControls> (Reactive subscriber; re-renders only on direct UI state change)
  │     ├── <TimelineBar /> (Reads & updates playback progress values)
  │     ├── <VolumeControl /> (Controls audio nodes)
  │     └── <QualitySelector /> (Toggles manifest resolution bitrates)
  └── <PlayerOverlays> (Contextual layers)
        ├── <SkipIntroButton /> (Dynamic timestamp skipping)
        └── <NextEpisodeCountdown /> (Initiates next episode autoplay sequence)
```

### C. Infrastructure & Vendor Delivery Stack
* **Encoding & Transcoding:** **Mux** or **AWS Elemental MediaConvert** to package ingested raw video files into adaptive HLS (`.m3u8`) segments with custom keys.
* **Dynamic Stream Packaging:** **AWS Elemental MediaPackage** to orchestrate real-time AES-128 and DRM packaging on request.
* **CDN & Edge Optimization:** Multi-CDN architecture utilizing **Cloudflare Stream** or **Fastly** to enforce CORS referrers, geo-fencing policies, and live LL-HLS chunk delivery.