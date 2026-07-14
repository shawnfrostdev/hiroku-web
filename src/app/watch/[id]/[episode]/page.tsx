"use client";
import { useQuery } from "@tanstack/react-query";
import Hls from "hls.js";
import {
  AlertCircle,
  Bug,
  ChevronsUpDown,
  Download,
  Grid3X3,
  Headphones,
  LayoutList,
  Loader2,
  Server,
  Share2,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { use, useCallback, useEffect, useRef, useState } from "react";
import PlayerControls from "@/components/PlayerControls";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useWatchlistStore } from "@/store/useWatchlistStore";

// Mock public mp4 anime-like stream removed as it is now dynamic

export default function WatchPage({
  params,
}: {
  params: Promise<{ id: string; episode: string }>;
}) {
  const resolvedParams = use(params);
  const animeId = resolvedParams.id;
  const currentEpNum = parseInt(resolvedParams.episode, 10) || 1;

  const router = useRouter();
  const player = usePlayerStore();
  const watchlist = useWatchlistStore();

  // Video Ref and State
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  // Tracks the true episode-level playback position. Written ONLY by handleTimeUpdate
  // and reset ONLY when the episode changes. HLS teardown/recreate cannot touch it,
  // so server switches always resume from the correct timestamp.
  const episodePositionRef = useRef<number>(0);
  // Tracks whether the user deliberately had the video playing before a server switch.
  // Written by user interactions (togglePlay) and the video's onPlay/onPause events, but
  // guarded so that browser-initiated pauses from HLS teardown don't clear it.
  const wasPlayingRef = useRef<boolean>(false);
  // Set to true briefly while we're swapping HLS instances so we can ignore
  // browser-initiated pause events that happen as a side effect of src teardown.
  const isSwappingSourceRef = useRef<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [_isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => {
    const saved = useWatchlistStore.getState().items[animeId]?.progressSeconds;
    return saved || 0;
  });
  const [_duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [_playbackRate, setPlaybackRate] = useState(1);
  const [_showSpeedControls, setShowSpeedControls] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Autoplay next episode
  const [autoplayNext, _setAutoplayNext] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Interactive Server & Audio Dropdown states
  const [selectedAudio, setSelectedAudio] = useState<"Sub" | "Dub" | "Softsub">(
    "Sub",
  );
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("Off");
  const [availableSubtitles, setAvailableSubtitles] = useState<string[]>([
    "Off",
  ]);
  const [selectedServer, setSelectedServer] = useState<string>("Auto");
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [audioOpenDirection, setAudioOpenDirection] = useState<"up" | "down">(
    "down",
  );
  const [serverOpenDirection, setServerOpenDirection] = useState<"up" | "down">(
    "down",
  );
  const audioTriggerRef = useRef<HTMLDivElement>(null);
  const serverTriggerRef = useRef<HTMLDivElement>(null);

  // Fetch detail info
  const {
    data: anime,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["anime-detail", animeId],
    queryFn: async () => {
      const res = await fetch(`/api/anime/detail?id=${animeId}`);
      if (!res.ok) throw new Error("Failed to load anime details");
      return res.json();
    },
  });

  const { data: serversData } = useQuery({
    queryKey: ["anime-servers", animeId, currentEpNum],
    queryFn: async () => {
      const res = await fetch(
        `/api/anime/servers?id=${animeId}&episode=${currentEpNum}`,
      );
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!animeId,
  });

  const serversArray = Array.isArray(serversData) ? serversData : [];
  const subServers = serversData?.sub
    ? serversData.sub.map(
        (s: { serverName?: string; name?: string } | string) =>
          typeof s === "string" ? s : s.serverName || s.name,
      )
    : serversArray.map((s: { serverName?: string; name?: string } | string) =>
        typeof s === "string" ? s : s.serverName || s.name,
      );

  const dubServers = serversData?.dub
    ? serversData.dub.map(
        (s: { serverName?: string; name?: string } | string) =>
          typeof s === "string" ? s : s.serverName || s.name,
      )
    : serversArray.map((s: { serverName?: string; name?: string } | string) =>
        typeof s === "string" ? s : s.serverName || s.name,
      );

  const softsubServers = serversData?.softsub
    ? serversData.softsub.map(
        (s: { serverName?: string; name?: string } | string) =>
          typeof s === "string" ? s : s.serverName || s.name,
      )
    : [];

  const availableAudioModes = serversData
    ? [
        ...(subServers.length > 0 ? ["Sub"] : []),
        ...(softsubServers.length > 0 ? ["Softsub"] : []),
        ...(dubServers.length > 0 ? ["Dub"] : []),
      ]
    : ["Sub", "Softsub", "Dub"];

  const currentServers =
    selectedAudio === "Softsub"
      ? softsubServers.length > 0
        ? softsubServers
        : ["Auto"]
      : selectedAudio === "Sub"
        ? subServers.length > 0
          ? subServers
          : ["Auto"]
        : dubServers.length > 0
          ? dubServers
          : ["Auto"];

  useEffect(() => {
    if (serversData) {
      if (selectedAudio === "Dub" && dubServers.length === 0) {
        setSelectedAudio(
          subServers.length > 0
            ? "Sub"
            : softsubServers.length > 0
              ? "Softsub"
              : "Sub",
        );
        setSelectedServer("Auto");
      } else if (selectedAudio === "Sub" && subServers.length === 0) {
        setSelectedAudio(
          softsubServers.length > 0
            ? "Softsub"
            : dubServers.length > 0
              ? "Dub"
              : "Sub",
        );
        setSelectedServer("Auto");
      } else if (selectedAudio === "Softsub" && softsubServers.length === 0) {
        setSelectedAudio(
          subServers.length > 0 ? "Sub" : dubServers.length > 0 ? "Dub" : "Sub",
        );
        setSelectedServer("Auto");
      }
    }
  }, [
    serversData,
    selectedAudio,
    subServers.length,
    dubServers.length,
    softsubServers.length,
  ]);

  useEffect(() => {
    if (
      currentServers.length > 0 &&
      (!currentServers.includes(selectedServer) || selectedServer === "Auto")
    ) {
      setSelectedServer(currentServers[0]);
    }
  }, [currentServers, selectedServer]);

  // Fetch stream info
  const {
    data: streamData,
    isLoading: isStreamLoading,
    isError: isStreamError,
  } = useQuery({
    queryKey: [
      "anime-stream",
      animeId,
      currentEpNum,
      selectedServer,
      selectedAudio,
    ],
    queryFn: async () => {
      const category = selectedAudio.toLowerCase();
      const res = await fetch(
        `/api/anime/stream?id=${animeId}&episode=${currentEpNum}&server=${selectedServer}&category=${category}`,
      );
      if (!res.ok) throw new Error("Failed to load video stream");
      return res.json();
    },
    enabled: !!animeId,
  });

  const VIDEO_SOURCE = streamData?.sources?.[0]?.url || "";
  const rawSubtitles: Array<{ file: string; label: string; kind?: string }> =
    streamData?.subtitles || [];

  // Populate subtitle track list whenever stream data arrives
  useEffect(() => {
    if (!streamData) return;
    const subs = rawSubtitles;
    if (subs.length > 0) {
      const labels = subs.map((s) => s.label);
      setAvailableSubtitles([...labels, "Off"]);
      // Prefer English by default
      const englishSub = labels.find(
        (l) => l.toLowerCase().includes("english") || l.toLowerCase() === "en",
      );
      setCurrentSubtitle(englishSub || labels[0]);
    } else {
      setAvailableSubtitles(["Off"]);
      setCurrentSubtitle("Off");
    }
  }, [streamData, rawSubtitles]);

  // IMPORTANT: Do NOT set episodePositionRef or wasPlayingRef here during render.
  // They are written only in event handlers to prevent HLS teardown side-effects
  // from poisoning their values between the cleanup and the new setup.

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!videoRef.current || !VIDEO_SOURCE) return;

    // Mark that we are in the middle of swapping sources so that browser-triggered
    // pause/timeupdate events during HLS destroy don't corrupt our position ref.
    isSwappingSourceRef.current = true;

    let hls: Hls | null = null;
    const isM3U8 =
      streamData?.sources?.[0]?.isM3U8 ||
      VIDEO_SOURCE.includes(".m3u8") ||
      VIDEO_SOURCE.includes("/m3u8");
    const videoEl = videoRef.current;

    // Read from the episode-level position ref. This is NEVER reset by HLS
    // teardown — only by handleTimeUpdate and the episode-change effect.
    const timeToResume = episodePositionRef.current;
    const shouldResumePlaying = wasPlayingRef.current;

    // Done setting up — allow normal event handling again.
    isSwappingSourceRef.current = false;

    const attemptPlay = async () => {
      try {
        await videoEl.play();
      } catch (err) {
        console.warn("Autoplay blocked, attempting muted autoplay", err);
        videoEl.muted = true;
        setIsMuted(true);
        if (typeof player.setIsMuted === "function") player.setIsMuted(true);
        try {
          await videoEl.play();
        } catch (e) {
          console.warn("Muted autoplay also failed", e);
          setIsPlaying(false);
          setIsBuffering(false);
        }
      }
    };

    const handleMetadata = () => {
      // Clamp to the actual duration to handle servers with differing lengths
      const clampedTime =
        videoEl.duration > 0
          ? Math.min(timeToResume, videoEl.duration - 0.5)
          : timeToResume;
      if (clampedTime > 0) {
        videoEl.currentTime = clampedTime;
      }
      if (shouldResumePlaying) {
        attemptPlay();
      } else {
        videoEl.pause();
        setIsPlaying(false);
      }
    };

    if (isM3U8 && Hls.isSupported()) {
      hls = new Hls({ startLevel: -1 }); // -1 = auto
      hlsRef.current = hls;
      hls.loadSource(VIDEO_SOURCE);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS Network Error, recovering...");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS Media Error, recovering...");
              hls?.recoverMediaError();
              break;
            default:
              console.error("HLS Fatal Error, destroying...");
              hls?.destroy();
              break;
          }
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        // Expose available quality levels to the store
        const levelLabels = data.levels.map(
          (l: { height: number }) => `${l.height}p`,
        );
        if (levelLabels.length > 0) {
          player.setResolutions([...levelLabels, "Auto"]);
        }
        // For HLS streams, seeking is reliable after MANIFEST_PARSED. Use
        // handleMetadata to do the clamped seek + conditional play/pause.
        handleMetadata();
      });
    } else if (isM3U8 && videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      videoEl.src = VIDEO_SOURCE;
      videoEl.addEventListener("loadedmetadata", handleMetadata);
    } else {
      // Direct MP4 playback
      videoEl.src = VIDEO_SOURCE;
      videoEl.addEventListener("loadedmetadata", handleMetadata);
    }

    return () => {
      // Mark teardown so event handlers know to ignore browser-triggered events
      isSwappingSourceRef.current = true;
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
      videoEl.removeEventListener("loadedmetadata", handleMetadata);
      // Clear the flag after a microtask so async browser events still get filtered
      Promise.resolve().then(() => {
        isSwappingSourceRef.current = false;
      });
    };
  }, [
    VIDEO_SOURCE,
    player.setResolutions,
    player.setVolume,
    streamData?.sources?.[0]?.isM3U8,
  ]);

  const episodesList =
    anime?.episodes && anime.episodes.length > 0
      ? anime.episodes
      : Array.from({ length: anime?.episodesCount || 0 }).map((_, i) => ({
          episode_number: i + 1,
          name: `Episode ${i + 1}`,
          overview: "No description available for this episode.",
          still_path: null,
          runtime: 24,
          air_date: null,
        }));

  const currentEpInfo = episodesList.find(
    (ep: { episode_number: number }) => ep.episode_number === currentEpNum,
  );

  // Synchronize with Player Store (mock globally active episode)
  // IMPORTANT: Also reset the episode-level position ref so server switches
  // within the NEW episode start from 0, not the previous episode's position.
  useEffect(() => {
    episodePositionRef.current = 0;
    wasPlayingRef.current = false;
    setCurrentTime(0);
    player.playEpisode(animeId, currentEpNum);
  }, [animeId, currentEpNum, player.playEpisode]);

  // Synchronize playing state with store
  useEffect(() => {
    player.setPlaying(isPlaying);
    return () => player.setPlaying(false);
  }, [isPlaying, player.setPlaying]);

  // Add to Continue Watching
  useEffect(() => {
    if (anime?.id) {
      const currentTitle =
        anime.title?.english ||
        anime.title?.romaji ||
        anime.title?.native ||
        anime.title?.userPreferred ||
        anime.title;

      const currentImage = anime.image || anime.coverImage || anime.posterImage;

      useWatchlistStore.getState().addItem({
        animeId: String(anime.id),
        animeTitle:
          typeof currentTitle === "string" ? currentTitle : "Unknown Title",
        animeImage: currentImage,
        status: "watching",
        currentEpisode: Number(currentEpNum) || 1,
      });
    }
  }, [anime, currentEpNum]);

  // Keyboard controls
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTime > 0) {
        useWatchlistStore
          .getState()
          .updateProgress(
            String(animeId),
            Number(currentEpNum) || 1,
            currentTime,
            _duration,
          );
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentTime, animeId, currentEpNum, _duration]);

  // Video Event Handlers
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    const next = !isPlaying;
    if (next) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      setCountdown(null);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  // Unified click handler that differentiates single vs double click.
  // Double click left half = rewind 10s, right half = forward 10s.
  // On mobile (touch) a single tap only shows/hides controls — no play/pause.
  const handlePlayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Detect touch: PointerEvent with pointerType="touch" or no pointerId (synthetic)
    const isTouch =
      (e.nativeEvent as PointerEvent).pointerType === "touch" ||
      window.matchMedia("(pointer: coarse)").matches;

    if (clickTimerRef.current) {
      // Second click / double-tap — skip ±10s on both desktop and mobile
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < rect.width / 2) {
        seekRelative(-10);
      } else {
        seekRelative(10);
      }
    } else {
      // First click — wait to see if a second comes
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        // On mobile: single tap only shows/hides controls, not play/pause
        if (!isTouch) {
          togglePlay();
        } else {
          setIsHoveringControls((prev) => !prev);
        }
      }, 220);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    // Guard: ignore time updates triggered by HLS teardown (they emit 0)
    if (isSwappingSourceRef.current) return;
    const t = videoRef.current.currentTime;
    // episodePositionRef is the single source of truth for resume position.
    // It persists across server switches and is only reset on episode change.
    episodePositionRef.current = t;
    setCurrentTime(t);
    player.setTime(t);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && !Number.isNaN(dur) && dur !== Infinity) {
      setDuration(dur);
      player.setDuration(dur);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    const hasNext = currentEpNum < episodesList.length;
    if (autoplayNext && hasNext) {
      setCountdown(5); // 5 seconds autoplay countdown
    }
  };

  const seekRelative = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + seconds,
      ),
    );
  }, []);

  const handleSeekChange = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    player.setTime(time);
  };

  const handleSkipBackward = () => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, videoRef.current.currentTime - 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    player.setTime(newTime);
  };

  const handleSkipForward = () => {
    if (!videoRef.current) return;
    const newTime = Math.min(
      videoRef.current.duration || Number.POSITIVE_INFINITY,
      videoRef.current.currentTime + 10,
    );
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    player.setTime(newTime);
  };

  const adjustVolume = useCallback(
    (delta: number) => {
      const newVol = Math.max(0, Math.min(1, volume + delta));
      setVolume(newVol);
      setIsMuted(newVol === 0);
      if (typeof player.setVolume === "function") {
        player.setVolume(newVol);
      }
      if (videoRef.current) {
        videoRef.current.volume = newVol;
        videoRef.current.muted = newVol === 0;
      }
    },
    [volume, player],
  );

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
    if (typeof player.setVolume === "function") {
      player.setVolume(val);
    }
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);

    // If we are unmuting but the slider is stuck at 0, pop it back to 1
    if (!nextMute && volume === 0) {
      setVolume(1);
      if (typeof player.setVolume === "function") player.setVolume(1);
      videoRef.current.volume = 1;
    } else if (typeof player.toggleMute === "function") {
      player.toggleMute();
    }

    videoRef.current.muted = nextMute;
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    player.setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedControls(false);
  };

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const _formatTime = (timeInSecs: number) => {
    if (Number.isNaN(timeInSecs) || timeInSecs < 0) return "00:00";
    const hrs = Math.floor(timeInSecs / 3600);
    const mins = Math.floor((timeInSecs % 3600) / 60);
    const secs = Math.floor(timeInSecs % 60);

    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const navigateToNextEpisode = useCallback(() => {
    if (currentEpNum < episodesList.length) {
      router.push(`/watch/${animeId}/${currentEpNum + 1}`);
    }
  }, [animeId, currentEpNum, episodesList.length, router]);

  const navigateToPrevEpisode = () => {
    if (currentEpNum > 1) {
      router.push(`/watch/${animeId}/${currentEpNum - 1}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "ArrowUp":
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyT":
          e.preventDefault();
          setIsTheaterMode((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [adjustVolume, seekRelative, toggleFullscreen, togglePlay]);

  // Mouse inactivity hide controls
  const handleMouseMove = () => {
    setIsHoveringControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsHoveringControls(false);
        setShowSpeedControls(false);
      }
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Close server/audio dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        audioTriggerRef.current &&
        !audioTriggerRef.current.contains(target)
      ) {
        setShowAudioDropdown(false);
      }
      if (
        serverTriggerRef.current &&
        !serverTriggerRef.current.contains(target)
      ) {
        setShowServerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync autoplay countdown
  useEffect(() => {
    if (countdown !== null) {
      if (countdown <= 0) {
        setCountdown(null);
        navigateToNextEpisode();
      } else {
        countdownIntervalRef.current = setTimeout(() => {
          setCountdown((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);
      }
    }
    return () => {
      if (countdownIntervalRef.current)
        clearTimeout(countdownIntervalRef.current);
    };
  }, [countdown, navigateToNextEpisode]);

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col bg-black min-h-screen">
        <div className="w-full px-0 md:px-[24px] pt-0 flex flex-col gap-[24px] lg:flex-row lg:items-stretch lg:gap-[24px]">
          {/* Left Column (Video + Details) Skeleton */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Video Player Skeleton */}
            <div className="w-full aspect-video bg-[#141414] border border-[#282828] md:rounded-[12px] animate-pulse" />

            {/* Title / Servers Skeleton */}
            <div className="px-[16px] md:px-0 py-[20px] flex flex-col gap-[16px]">
              <div className="h-[32px] w-[250px] md:w-[400px] bg-[#282828] rounded-[6px] animate-pulse" />
              <div className="flex flex-wrap gap-[16px]">
                <div className="h-[40px] w-[120px] bg-[#282828] rounded-[8px] animate-pulse" />
                <div className="h-[40px] w-[150px] bg-[#282828] rounded-[8px] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Column (Episodes Sidebar) Skeleton */}
          <div className="shrink-0 lg:w-[380px] xl:w-[440px] lg:self-stretch">
            <div className="flex flex-col gap-[16px] bg-[#141414] border border-[#282828] md:rounded-[12px] p-[20px] h-full animate-pulse min-h-[500px]">
              <div className="h-[20px] w-[100px] bg-[#282828] rounded-[4px]" />
              <div className="flex flex-col gap-[8px]">
                {Array.from({ length: 6 }, (_, i) => `skel-ep-${i}`).map(
                  (id) => (
                    <div
                      key={id}
                      className="h-[70px] w-full bg-[#282828] rounded-[8px]"
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Anime Info Card Skeleton */}
        <div className="w-full px-0 md:px-[24px] pb-[48px]">
          <div className="bg-[#141414] border border-[#282828] rounded-[12px] p-[24px] flex flex-col md:flex-row gap-[24px] animate-pulse">
            <div className="w-[120px] md:w-[150px] aspect-[2/3] bg-[#282828] rounded-[8px] shrink-0" />
            <div className="flex-1 flex flex-col gap-[16px]">
              <div className="h-[28px] w-[300px] bg-[#282828] rounded-[6px]" />
              <div className="flex gap-[6px]">
                <div className="h-[20px] w-[60px] bg-[#282828] rounded-[4px]" />
                <div className="h-[20px] w-[60px] bg-[#282828] rounded-[4px]" />
              </div>
              <div className="flex flex-col gap-[8px] mt-[8px]">
                <div className="h-[14px] w-full bg-[#282828] rounded-[4px]" />
                <div className="h-[14px] w-5/6 bg-[#282828] rounded-[4px]" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !anime) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-[24px] text-center gap-[16px] min-h-[70vh] bg-black">
        <AlertCircle className="w-[48px] h-[48px] text-rose-500" />
        <h2 className="text-xl font-bold text-white">Playback Error</h2>
        <p className="text-sm text-[#A3A3A3] max-w-md">
          Failed to load episode sources. Please verify the URL or try
          reloading.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </main>
    );
  }

  const _isLiked = localStorage.getItem(`liked-${animeId}`) === "true";
  const _watchlistItem = watchlist.items[animeId];

  return (
    <main className="flex-1 flex flex-col bg-black min-h-screen text-text-primary">
      {/* Cinematic Main Section: Player + Title/buttons row with sidebar */}
      <div
        className={`w-full px-[12px] md:px-[24px] pt-[12px] md:pt-0 flex flex-col gap-[12px] md:gap-[24px] ${isTheaterMode ? "" : "lg:flex-row lg:items-start lg:gap-[24px]"}`}
      >
        {/* Left Cinematic Column: Video Player and details */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${isTheaterMode ? "w-full" : "lg:h-[calc(100vh-140px)]"}`}
        >
          {/* Custom Video Player Container */}
          <div
            role="application"
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              if (isPlaying) {
                setIsHoveringControls(false);
                setShowSpeedControls(false);
              }
            }}
            className="group relative w-full aspect-video lg:aspect-auto max-h-[48vh] sm:max-h-[55vh] md:max-h-[60vh] lg:max-h-none lg:flex-1 lg:min-h-0 mx-auto bg-black rounded-0 md:rounded-[12px] overflow-hidden border border-border-line shadow-2xl select-none flex justify-center items-center"
          >
            {/* The Video Element or Embed Iframe */}
            {streamData?.sources?.[0]?.type === "embed" ? (
              <iframe
                title="Video Player"
                src={VIDEO_SOURCE}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onDurationChange={(e) => {
                    const dur = e.currentTarget.duration;
                    if (dur && !Number.isNaN(dur) && dur !== Infinity) {
                      setDuration(dur);
                      player.setDuration(dur);
                    }
                  }}
                  onEnded={handleVideoEnded}
                  onPlay={() => {
                    // Guard: ignore browser-initiated play events from HLS teardown
                    if (!isSwappingSourceRef.current) {
                      wasPlayingRef.current = true;
                    }
                    setIsPlaying(true);
                    setIsBuffering(false);
                  }}
                  onPause={() => {
                    // Guard: ignore browser-initiated pause events from HLS teardown
                    if (!isSwappingSourceRef.current) {
                      wasPlayingRef.current = false;
                    }
                    setIsPlaying(false);
                  }}
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => setIsBuffering(false)}
                  onCanPlay={() => setIsBuffering(false)}
                  onLoadStart={() => setIsBuffering(true)}
                  onLoadedData={() => setIsBuffering(false)}
                  autoPlay
                  playsInline
                  crossOrigin="anonymous"
                >
                  {rawSubtitles.map((sub) => (
                    <track
                      key={sub.label}
                      kind={sub.kind === "captions" ? "captions" : "subtitles"}
                      src={sub.file}
                      srcLang={sub.label.toLowerCase().slice(0, 2)}
                      label={sub.label}
                      default={sub.label === currentSubtitle}
                    />
                  ))}
                  <track kind="captions" />
                </video>

                {/* Loading Overlay */}
                {isStreamLoading && (
                  <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto cursor-wait">
                    <div className="flex items-center gap-[12px] bg-black/80 px-[24px] py-[16px] rounded-[12px] border border-[#282828] shadow-2xl backdrop-blur-md">
                      <Loader2 className="w-[24px] h-[24px] text-white animate-spin" />
                      <span className="text-white text-sm font-bold">
                        Loading Streams
                      </span>
                    </div>
                  </div>
                )}

                {/* Error State Overlay */}
                {(isStreamError ||
                  (!isStreamLoading &&
                    (!streamData ||
                      !streamData?.sources ||
                      streamData?.sources.length === 0))) && (
                  <div className="absolute inset-0 z-50 bg-[#141414] flex flex-col items-center justify-center">
                    <span className="text-4xl mb-4 text-text-secondary select-none">
                      (╥﹏╥)
                    </span>
                    <span className="text-white text-sm font-bold tracking-widest uppercase">
                      No streams found
                    </span>
                    <span className="text-text-secondary text-xs mt-2">
                      Please select a different server or check back later.
                    </span>
                  </div>
                )}

                {/* Unified click/double-click overlay for play-pause and skip */}
                <button
                  type="button"
                  onClick={(e) =>
                    handlePlayerClick(
                      e as unknown as React.MouseEvent<HTMLDivElement>,
                    )
                  }
                  className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer select-none"
                >
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-[16px] text-center p-[24px]">
                      <span className="text-sm font-semibold tracking-wider text-text-muted uppercase">
                        Next Episode Starts In
                      </span>
                      <div className="text-6xl font-extrabold text-white">
                        {countdown}
                      </div>
                      <div className="flex gap-[12px] mt-[12px]">
                        <Button
                          variant="primary"
                          onClick={navigateToNextEpisode}
                        >
                          Play Now
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setCountdown(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </button>

                {/* Custom Control Bar (overlay) — hidden while loading */}
                {!isStreamLoading && (
                  <PlayerControls
                    isPlaying={isPlaying}
                    isFullscreen={isFullscreen}
                    isTheaterMode={isTheaterMode}
                    isHoveringControls={isHoveringControls}
                    currentEpNum={currentEpNum}
                    episodesCount={episodesList.length}
                    currentSubtitle={currentSubtitle}
                    availableSubtitles={availableSubtitles}
                    skipTimes={streamData?.skipTimes}
                    onPlayToggle={togglePlay}
                    onPrevEpisode={navigateToPrevEpisode}
                    onNextEpisode={navigateToNextEpisode}
                    onSeek={handleSeekChange}
                    onSkipBackward={handleSkipBackward}
                    onSkipForward={handleSkipForward}
                    onVolumeChange={handleVolumeChange}
                    onToggleMute={toggleMute}
                    onPlaybackRateChange={handlePlaybackRateChange}
                    onSubtitleChange={(label) => {
                      setCurrentSubtitle(label);
                      if (videoRef.current) {
                        const tracks = Array.from(videoRef.current.textTracks);
                        tracks.forEach((track) => {
                          if (label === "Off") {
                            track.mode = "disabled";
                          } else {
                            track.mode =
                              track.label === label ? "showing" : "hidden";
                          }
                        });
                      }
                    }}
                    onResolutionChange={(res) => {
                      player.setResolution(res);
                      if (hlsRef.current) {
                        if (res === "Auto") {
                          // Let HLS pick the best level automatically
                          hlsRef.current.currentLevel = -1;
                        } else {
                          // Match selected label (e.g. "1080p") to an HLS level by height
                          const targetHeight = parseInt(res, 10);
                          const levels = hlsRef.current.levels;
                          const idx = levels.findIndex(
                            (l: { height?: number }) =>
                              l.height === targetHeight,
                          );
                          if (idx !== -1) {
                            hlsRef.current.currentLevel = idx;
                          }
                        }
                      }
                    }}
                    onTheaterToggle={() => setIsTheaterMode((prev) => !prev)}
                    onFullscreenToggle={toggleFullscreen}
                  />
                )}
              </>
            )}
          </div>

          {/* Episode Info details below player */}
          <div className="px-[16px] md:px-0 py-[20px] flex flex-col gap-[16px] relative z-50">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-[24px]">
              <div className="flex flex-col gap-[6px]">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Episode {currentEpNum}:{" "}
                  {!currentEpInfo?.name ||
                  currentEpInfo.name === `Episode ${currentEpNum}`
                    ? anime?.title || "Anime"
                    : currentEpInfo.name}
                </h1>
              </div>

              {/* Server Settings block */}
              <div className="flex flex-wrap items-end gap-[16px] shrink-0">
                {/* Audio Column */}
                <div
                  ref={audioTriggerRef}
                  className="flex flex-col gap-[6px] relative"
                >
                  <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-wider text-text-secondary uppercase select-none">
                    <Headphones className="w-[12px] h-[12px]" />
                    <span>Audio</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!showAudioDropdown) {
                        const rect =
                          audioTriggerRef.current?.getBoundingClientRect();
                        if (rect) {
                          const spaceBelow = window.innerHeight - rect.bottom;
                          setAudioOpenDirection(
                            spaceBelow < 120 ? "up" : "down",
                          );
                        }
                      }
                      setShowAudioDropdown((prev) => !prev);
                      setShowServerDropdown(false);
                    }}
                    type="button"
                    className="flex items-center bg-[#141414] border border-border-line rounded-[8px] h-[40px] px-[12px] select-none text-sm font-bold text-white cursor-pointer hover:bg-[#1a1a1a]"
                  >
                    <span className="text-[10px] px-[4px] py-[1px] bg-[#242424] border border-[#282828] rounded font-extrabold tracking-tighter">
                      CC
                    </span>
                    <span className="ml-[6px]">{selectedAudio}</span>
                    <ChevronsUpDown className="w-[12px] h-[12px] text-text-secondary ml-[10px]" />
                  </button>

                  {/* Audio Dropdown Menu */}
                  {showAudioDropdown && (
                    <div
                      className={`absolute left-0 bg-[#121212] border border-[#282828] rounded-[8px] p-[4px] flex flex-col gap-[4px] shadow-2xl z-30 min-w-[100px] ${
                        audioOpenDirection === "down"
                          ? "top-[66px]"
                          : "bottom-[46px]"
                      }`}
                    >
                      {(availableAudioModes as readonly ("Sub" | "Dub")[]).map(
                        (mode) => (
                          <button
                            type="button"
                            key={mode}
                            onClick={() => {
                              setSelectedAudio(mode);
                              setSelectedServer("Auto");
                              setShowAudioDropdown(false);
                            }}
                            className={`px-[10px] py-[6px] text-xs text-left rounded-[6px] font-bold cursor-pointer hover:bg-white hover:text-black ${
                              selectedAudio === mode
                                ? "bg-[#242424] text-white"
                                : "text-text-secondary"
                            }`}
                          >
                            {mode}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Server Column */}
                <div
                  ref={serverTriggerRef}
                  className="flex flex-col gap-[6px] relative"
                >
                  <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-wider text-text-secondary uppercase select-none">
                    <Server className="w-[12px] h-[12px]" />
                    <span>Server ({currentServers.length})</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!showServerDropdown) {
                        const rect =
                          serverTriggerRef.current?.getBoundingClientRect();
                        if (rect) {
                          const spaceBelow = window.innerHeight - rect.bottom;
                          setServerOpenDirection(
                            spaceBelow < 180 ? "up" : "down",
                          );
                        }
                      }
                      setShowServerDropdown((prev) => !prev);
                      setShowAudioDropdown(false);
                    }}
                    type="button"
                    className="flex items-center bg-[#141414] border border-border-line rounded-[8px] h-[40px] px-[12px] select-none text-sm font-bold text-white cursor-pointer hover:bg-[#1a1a1a]"
                  >
                    <Zap className="w-[12px] h-[12px] fill-current" />
                    <span className="ml-[6px]">{selectedServer}</span>
                    <ChevronsUpDown className="w-[12px] h-[12px] text-text-secondary ml-[10px]" />
                  </button>

                  {/* Server Dropdown Menu */}
                  {showServerDropdown && (
                    <div
                      className={`absolute left-0 bg-[#121212] border border-[#282828] rounded-[8px] p-[4px] flex flex-col gap-[4px] shadow-2xl z-30 min-w-[120px] ${
                        serverOpenDirection === "down"
                          ? "top-[66px]"
                          : "bottom-[46px]"
                      }`}
                    >
                      {currentServers.map((srv: string) => (
                        <button
                          type="button"
                          key={srv}
                          onClick={() => {
                            setSelectedServer(srv);
                            setShowServerDropdown(false);
                          }}
                          className={`px-[10px] py-[6px] text-xs text-left rounded-[6px] font-bold cursor-pointer hover:bg-white hover:text-black ${
                            selectedServer === srv
                              ? "bg-[#242424] text-white"
                              : "text-text-secondary"
                          }`}
                        >
                          {srv}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <button
                  type="button"
                  className="h-[40px] px-[16px] bg-[#242424] text-white hover:bg-[#323232] rounded-[8px] border border-border-line flex items-center gap-[6px] text-xs font-bold cursor-pointer"
                >
                  <Download className="w-[12px] h-[12px]" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  className="h-[40px] px-[16px] bg-[#242424] text-white hover:bg-[#323232] rounded-[8px] border border-border-line flex items-center gap-[6px] text-xs font-bold cursor-pointer"
                >
                  <Bug className="w-[12px] h-[12px]" />
                  <span>Report</span>
                </button>
                <button
                  type="button"
                  className="h-[40px] px-[16px] bg-[#242424] text-white hover:bg-[#323232] rounded-[8px] border border-border-line flex items-center gap-[6px] text-xs font-bold cursor-pointer"
                >
                  <Share2 className="w-[12px] h-[12px]" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Episode Sidebar */}
        <div
          className={`shrink-0 ${isTheaterMode ? "w-full mb-[24px]" : "lg:w-[380px] xl:w-[440px] lg:self-stretch relative"}`}
        >
          <div
            className={
              isTheaterMode
                ? "flex flex-col gap-[16px] bg-surface border border-border-line rounded-[12px] p-[20px]"
                : "flex flex-col gap-[16px] bg-surface border border-border-line rounded-0 md:rounded-[12px] p-[20px] lg:absolute lg:top-0 lg:left-0 lg:right-0 lg:bottom-[24px]"
            }
          >
            <div className="flex items-center justify-between border-b border-border-line pb-[12px]">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
                Episodes
              </h2>
              <div className="flex items-center gap-[4px] bg-[#242424] p-[2px] rounded-[6px] border border-border-line">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-[4px] rounded-[4px] cursor-pointer ${viewMode === "list" ? "bg-white text-black" : "text-text-secondary hover:text-white"}`}
                  title="List View"
                >
                  <LayoutList className="w-[14px] h-[14px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-[4px] rounded-[4px] cursor-pointer ${viewMode === "grid" ? "bg-white text-black" : "text-text-secondary hover:text-white"}`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-[14px] h-[14px]" />
                </button>
              </div>
            </div>

            {/* Episode items container */}
            {viewMode === "list" ? (
              <div className="flex flex-col gap-[8px] overflow-y-auto pr-[4px] flex-1 min-h-0 max-h-[480px] lg:max-h-none">
                {episodesList.map(
                  (
                    ep: {
                      episode_number?: number;
                      id?: string | number;
                      still_path?: string | null;
                      name?: string;
                      runtime?: number;
                      air_date?: string;
                    },
                    index: number,
                  ) => {
                    const epNum = ep.episode_number || index + 1;
                    const isCurrent = epNum === currentEpNum;
                    const thumbnail = ep.still_path
                      ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                      : null;

                    return (
                      <button
                        type="button"
                        key={ep.id || index}
                        onClick={() =>
                          router.push(`/watch/${animeId}/${epNum}`)
                        }
                        className={`group relative flex gap-[12px] p-[8px] rounded-[8px] border text-left cursor-pointer hover:bg-control w-full ${
                          isCurrent
                            ? "bg-control border-white"
                            : "bg-background border-border-line"
                        }`}
                      >
                        {/* Thumbnail / EP tag */}
                        {thumbnail ? (
                          <div className="relative w-[100px] aspect-[16/9] rounded-[4px] overflow-hidden bg-[#121212] shrink-0 border border-border-line">
                            <Image
                              unoptimized
                              fill
                              src={thumbnail}
                              alt={ep.name || "Episode thumbnail"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-[100px] aspect-[16/9] rounded-[4px] border flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCurrent
                                ? "bg-white text-black border-white"
                                : "bg-control border-border-line text-text-secondary"
                            }`}
                          >
                            EP {epNum}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-[2px]">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                            Episode {epNum}
                          </span>
                          <span
                            className={`text-sm font-bold truncate ${isCurrent ? "text-white" : "text-text-secondary group-hover:text-text-primary"}`}
                          >
                            {ep.name || `Episode ${epNum}`}
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-[8px] overflow-y-auto pr-[4px] flex-1 min-h-0 max-h-[480px] lg:max-h-none auto-rows-max">
                {episodesList.map(
                  (
                    ep: {
                      episode_number?: number;
                      id?: string | number;
                      still_path?: string | null;
                      name?: string;
                      runtime?: number;
                      air_date?: string;
                    },
                    index: number,
                  ) => {
                    const epNum = ep.episode_number || index + 1;
                    const isCurrent = epNum === currentEpNum;
                    return (
                      <button
                        type="button"
                        key={ep.id || index}
                        onClick={() =>
                          router.push(`/watch/${animeId}/${epNum}`)
                        }
                        className={`aspect-square flex items-center justify-center rounded-[6px] border text-xs font-bold hover:bg-control cursor-pointer ${
                          isCurrent
                            ? "bg-control border-white text-white"
                            : "bg-background border-border-line text-text-secondary hover:text-white"
                        }`}
                      >
                        {epNum}
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anime Info Details Card — below the player/sidebar row */}
      <div className="w-full px-0 md:px-[24px] pb-[48px]">
        <div className="flex flex-col lg:flex-row gap-[24px] lg:items-stretch">
          {/* Left-aligned card matching the player column width */}
          <div className="flex-1 min-w-0">
            <div className="bg-surface border border-border-line rounded-[12px] p-[24px] flex flex-col md:flex-row gap-[24px] h-full">
              {anime?.posterImage && (
                <div className="relative w-[120px] md:w-[150px] aspect-[2/3] rounded-[8px] overflow-hidden bg-[#121212] shrink-0 border border-border-line">
                  <Image
                    unoptimized
                    fill
                    src={anime.posterImage}
                    alt={anime.title}
                    className="w-full h-full object-cover animate-none"
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col justify-between gap-[16px]">
                <div className="flex flex-col gap-[16px]">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {anime?.title}
                    </h2>
                    {anime?.romajiTitle &&
                      anime.romajiTitle !== anime.title && (
                        <p className="text-xs text-text-muted font-bold mt-[2px]">
                          {anime.romajiTitle}
                        </p>
                      )}
                  </div>
                  {anime?.genres && anime.genres.length > 0 && (
                    <div className="flex flex-wrap gap-[6px]">
                      {anime.genres.map((genre: string) => (
                        <span
                          key={genre}
                          className="text-[10px] font-bold uppercase tracking-wider px-[8px] py-[3px] rounded bg-control border border-border-line text-text-secondary"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 hover:line-clamp-none cursor-pointer">
                    {anime?.synopsis ||
                      "No description available for this anime."}
                  </p>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-[12px] pt-[16px] border-t border-border-line text-xs">
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      Format
                    </span>
                    <span className="text-white font-bold">
                      {anime?.format || "Unknown"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      Studio
                    </span>
                    <span
                      className="text-white font-bold truncate"
                      title={anime?.studio}
                    >
                      {anime?.studio || "Unknown Studio"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      Producers
                    </span>
                    <span
                      className="text-white font-bold truncate"
                      title={anime?.producers}
                    >
                      {anime?.producers || "Unknown"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      Status
                    </span>
                    <span className="text-white font-bold">
                      {anime?.status || "Unknown"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      Season
                    </span>
                    <span className="text-white font-bold">
                      {anime?.season
                        ? `${anime.season} ${anime.year || ""}`
                        : `${anime?.year || "Unknown"}`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      Start Date
                    </span>
                    <span className="text-white font-bold">
                      {anime?.startDate || "Unknown"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      End Date
                    </span>
                    <span className="text-white font-bold">
                      {anime?.endDate || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Recommendations Card — aligned under the sidebar */}
          {!isTheaterMode && (
            <div className="shrink-0 lg:w-[380px] xl:w-[440px] h-full">
              {anime?.recommendations && anime.recommendations.length > 0 && (
                <div className="bg-surface border border-border-line rounded-[12px] p-[20px] flex flex-col gap-[16px] h-full">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
                      Recommended
                    </h2>
                  </div>
                  <div className="flex flex-col gap-[12px]">
                    {anime.recommendations
                      .slice(0, 2)
                      .map(
                        (rec: {
                          id: string | number;
                          poster?: string;
                          title?: string;
                          type?: string;
                          averageScore?: number;
                          score?: number | string;
                          format?: string;
                          episodes?: number;
                        }) => (
                          <Link
                            key={rec.id}
                            href={`/watch/${rec.id}/1`}
                            className="group isolate relative overflow-hidden flex items-center gap-[16px] p-[12px] rounded-[8px] hover:bg-[#242424]/40 transition-colors cursor-pointer border border-transparent hover:border-[#282828]"
                          >
                            {/* Background poster blur overlay */}
                            {rec.poster && (
                              <div
                                className="absolute inset-0 bg-cover bg-right transition-all duration-500 z-0 pointer-events-none grayscale group-hover:grayscale-0 opacity-20 group-hover:opacity-40"
                                style={{
                                  backgroundImage: `url(${rec.poster})`,
                                }}
                              >
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background:
                                      "linear-gradient(to right, rgba(20,20,20,1) 0%, rgba(20,20,20,0.4) 40%, transparent 100%)",
                                  }}
                                />
                              </div>
                            )}
                            {/* Poster */}
                            <div className="relative aspect-[2/3] w-[48px] rounded-[6px] border border-[#282828] bg-[#141414] overflow-hidden shrink-0 shadow-md z-10">
                              {rec.poster ? (
                                <Image
                                  unoptimized
                                  fill
                                  src={rec.poster}
                                  alt={rec.title || "Recommendation poster"}
                                  className="w-full h-full object-cover transform-gpu will-change-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-[#A3A3A3] p-[2px]">
                                  {rec.title}
                                </div>
                              )}
                            </div>
                            {/* Details */}
                            <div className="flex flex-col gap-[2px] min-w-0 flex-1 z-10 relative">
                              <span className="text-sm font-bold text-white line-clamp-1 leading-snug group-hover:text-emerald-400 transition-colors">
                                {rec.title}
                              </span>
                              <div className="flex items-center gap-[6px] text-xs text-[#A3A3A3] mt-[4px]">
                                {rec.score && (
                                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-[6px] py-[2px] rounded text-[9px] shrink-0">
                                    {rec.score} ★
                                  </span>
                                )}
                                {rec.format && (
                                  <span className="text-[9px] font-bold px-[6px] py-[2px] rounded border uppercase tracking-wider shrink-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                                    {rec.format}
                                  </span>
                                )}
                                {rec.episodes && (
                                  <span className="text-[9px] font-bold px-[6px] py-[2px] rounded border uppercase tracking-wider shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                    {rec.episodes} EP
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ),
                      )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Comment Section */}
      <div className="w-full px-0 md:px-[24px] pb-[48px]">
        <div className="bg-surface border border-border-line rounded-[12px] p-[24px] flex flex-col gap-[24px]">
          {/* Header */}
          <div className="flex items-center gap-[8px] border-b border-border-line pb-[16px]">
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
              Comments
            </h2>
            <span className="text-xs font-bold text-text-muted bg-control border border-border-line px-[8px] py-[2px] rounded">
              0
            </span>
          </div>

          {/* Write a comment */}
          <div className="flex flex-col gap-[12px]">
            <div className="flex gap-[12px]">
              <div className="w-[36px] h-[36px] rounded-full bg-control border border-border-line shrink-0 flex items-center justify-center text-xs font-bold text-text-muted">
                U
              </div>
              <div className="flex-1 flex flex-col gap-[8px]">
                <textarea
                  placeholder="Share your thoughts about this episode..."
                  rows={3}
                  className="w-full bg-background border border-border-line rounded-[8px] px-[14px] py-[10px] text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-white/30 transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-[16px] py-[8px] bg-white text-black text-xs font-bold rounded-[6px] hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-[32px] gap-[8px] text-center">
            <span className="text-2xl">💬</span>
            <p className="text-sm font-bold text-text-primary">
              No comments yet
            </p>
            <p className="text-xs text-text-muted">
              Be the first to share your thoughts on this episode.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
