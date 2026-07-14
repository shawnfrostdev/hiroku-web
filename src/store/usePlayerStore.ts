import { create } from "zustand";

interface PlayerState {
  // 1. Core Playback State
  animeId: string | null;
  episodeNumber: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;

  // Backwards Compatibility fields
  progressSeconds: number;
  durationSeconds: number;

  // 2. Engine & Quality State
  isBuffering: boolean;
  currentResolution: string;
  availableResolutions: string[];

  // 3. Metadata & Overlay State
  chapterMarkers: Array<{ title: string; startTime: number }>;
  skipIntroData: { start: number; end: number } | null;
  showSkipButton: boolean;

  // 4. Actions (Called by the VideoCore or UI Components)
  play: () => void;
  pause: () => void;
  playEpisode: (animeId: string, episodeNumber: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setTime: (time: number) => void;
  setProgress: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setResolutions: (resolutions: string[]) => void;
  setResolution: (resolution: string) => void;
  setPlaybackRate: (rate: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  resetPlayer: () => void;

  // Metadata Ingestion Point
  ingestEpisodeData: (metadata: {
    chapters?: Array<{ title: string; startTime: number }>;
    intro?: { start: number; end: number };
  }) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  // Initial State
  animeId: null,
  episodeNumber: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,

  progressSeconds: 0,
  durationSeconds: 0,

  isBuffering: true,
  currentResolution: "auto",
  availableResolutions: [],

  chapterMarkers: [],
  skipIntroData: null,
  showSkipButton: false,

  // Actions
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setPlaying: (isPlaying) => set({ isPlaying }),

  playEpisode: (animeId, episodeNumber) =>
    set({
      animeId,
      episodeNumber,
      isPlaying: true,
      currentTime: 0,
      progressSeconds: 0,
      duration: 0,
      durationSeconds: 0,
    }),

  setTime: (time) =>
    set((state) => ({
      currentTime: time,
      progressSeconds: time,
      // Automatically trigger skip button UI if within timestamp
      showSkipButton: state.skipIntroData
        ? time >= state.skipIntroData.start && time <= state.skipIntroData.end
        : false,
    })),

  setProgress: (seconds) =>
    set((state) => ({
      progressSeconds: seconds,
      currentTime: seconds,
      showSkipButton: state.skipIntroData
        ? seconds >= state.skipIntroData.start &&
          seconds <= state.skipIntroData.end
        : false,
    })),

  setDuration: (seconds) =>
    set({
      durationSeconds: seconds,
      duration: seconds,
    }),

  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setResolutions: (resolutions) => set({ availableResolutions: resolutions }),
  setResolution: (resolution) => set({ currentResolution: resolution }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setIsMuted: (isMuted) => set({ isMuted }),

  resetPlayer: () =>
    set({
      animeId: null,
      episodeNumber: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      progressSeconds: 0,
      durationSeconds: 0,
      chapterMarkers: [],
      skipIntroData: null,
      showSkipButton: false,
    }),

  ingestEpisodeData: (metadata) =>
    set({
      chapterMarkers: metadata.chapters || [],
      skipIntroData: metadata.intro || null,
    }),
}));
