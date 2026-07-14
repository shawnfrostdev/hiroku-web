"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  Check,
  Grid3X3,
  Heart,
  LayoutGrid,
  LayoutList,
  Pause,
  Play,
  Plus,
  Star,
  Trash2,
  Tv,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useWatchlistStore } from "@/store/useWatchlistStore";

interface Comment {
  id: number;
  username: string;
  content: string;
  createdAt: string;
}

export default function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const animeId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [episodeView, setEpisodeView] = useState<"list" | "grid" | "small">(
    "list",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isLiked, setIsLiked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (isRatingModalOpen) {
      setTempRating(userRating);
    }
  }, [isRatingModalOpen, userRating]);

  // Player Store integration
  const player = usePlayerStore();
  const isPlayingThisAnime = player.animeId === animeId && player.isPlaying;

  // Watchlist Store integration
  const watchlist = useWatchlistStore();
  const watchlistItem = watchlist.items[animeId];

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

  // Preload first episode servers and stream data in the background
  useEffect(() => {
    if (anime) {
      const firstEp = anime.episodes?.[0]?.episode_number || 1;
      queryClient.prefetchQuery({
        queryKey: ["anime-servers", animeId, firstEp],
        queryFn: async () => {
          const res = await fetch(
            `/api/anime/servers?id=${animeId}&episode=${firstEp}`,
          );
          if (!res.ok) throw new Error("Failed to load servers");
          const data = await res.json();

          // After fetching servers, prefetch the default stream
          queryClient.prefetchQuery({
            queryKey: ["anime-stream", animeId, firstEp, "Auto", "Sub"],
            queryFn: async () => {
              const res = await fetch(
                `/api/anime/stream?id=${animeId}&episode=${firstEp}&server=Auto&category=sub`,
              );
              if (!res.ok) throw new Error("Failed to load video stream");
              return res.json();
            },
          });

          return data;
        },
      });
    }
  }, [anime, animeId, queryClient]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLiked = localStorage.getItem(`liked-${animeId}`);
    if (savedLiked) {
      setIsLiked(savedLiked === "true");
    }
    const savedRating = localStorage.getItem(`rating-${animeId}`);
    if (savedRating) {
      setUserRating(parseInt(savedRating, 10));
    }
  }, [animeId]);

  // Load comments from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`comments-${animeId}`);
    if (saved) {
      setCommentsList(JSON.parse(saved));
    } else {
      setCommentsList([]);
    }
  }, [animeId]);

  if (!mounted || isLoading) {
    return (
      <main className="flex-1 flex flex-col -mt-[68px] md:-mt-[112px] relative">
        {/* Banner Skeleton */}
        <div className="absolute top-0 left-0 right-0 h-[480px] md:h-[640px] bg-[#141414] animate-pulse z-0 pointer-events-none" />

        {/* Content Details Skeleton */}
        <div className="relative w-full px-[12px] md:px-[24px] pb-[48px] pt-[80px] md:pt-[136px] flex flex-col lg:flex-row gap-[12px] md:gap-[24px]">
          {/* Left Column: Poster and Metadata Skeleton */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-[24px]">
            {/* Poster Skeleton */}
            <div className="relative aspect-[2/3] w-full rounded-[12px] bg-[#282828] animate-pulse shadow-2xl" />

            {/* Detailed Metadata Section Skeleton */}
            <div className="flex flex-col gap-[16px] p-[20px] bg-surface border border-border-line rounded-[12px] animate-pulse">
              {/* Format, Episodes, Status, Season */}
              <div className="grid grid-cols-2 gap-y-[12px] gap-x-[16px] border-b border-border-line pb-[12px]">
                {Array.from({ length: 4 }, (_, i) => `skel-fmt-${i}`).map(
                  (id) => (
                    <div key={id} className="flex flex-col gap-[4px]">
                      <div className="h-[10px] w-1/2 bg-[#242424] rounded-[2px]" />
                      <div className="h-[16px] w-3/4 bg-[#242424] rounded-[4px]" />
                    </div>
                  ),
                )}
              </div>
              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-y-[12px] gap-x-[16px] border-b border-border-line pb-[12px]">
                {Array.from({ length: 2 }, (_, i) => `skel-date-${i}`).map(
                  (id) => (
                    <div key={id} className="flex flex-col gap-[4px]">
                      <div className="h-[10px] w-1/2 bg-[#242424] rounded-[2px]" />
                      <div className="h-[16px] w-3/4 bg-[#242424] rounded-[4px]" />
                    </div>
                  ),
                )}
              </div>
              {/* Studios & Producers */}
              <div className="flex flex-col gap-[12px] border-b border-border-line pb-[12px]">
                {Array.from({ length: 2 }, (_, i) => `skel-studio-${i}`).map(
                  (id) => (
                    <div key={id} className="flex flex-col gap-[4px]">
                      <div className="h-[10px] w-1/4 bg-[#242424] rounded-[2px]" />
                      <div className="h-[16px] w-5/6 bg-[#242424] rounded-[4px]" />
                    </div>
                  ),
                )}
              </div>
              {/* Ratings */}
              <div className="flex flex-col gap-[4px]">
                <div className="h-[10px] w-1/3 bg-[#242424] rounded-[2px]" />
                <div className="h-[16px] w-1/2 bg-[#242424] rounded-[4px] mt-[4px]" />
              </div>
            </div>

            {/* Action buttons stack skeleton */}
            <div className="flex flex-col gap-[12px] w-full animate-pulse">
              <div className="h-[40px] w-full bg-[#282828] rounded-[8px]" />
              <div className="h-[40px] w-full bg-[#282828] rounded-[8px]" />
              <div className="h-[40px] w-full bg-[#282828] rounded-[8px]" />
            </div>
          </div>

          {/* Right Column: Title, Synopsis, Episodes */}
          <div className="flex-1 flex flex-col gap-[40px]">
            {/* Title & Synopsis Wrapper */}
            <div className="bg-surface border border-border-line rounded-[12px] p-[24px] md:p-[32px] flex flex-col gap-[24px] animate-pulse">
              {/* Title & Genres */}
              <div className="flex flex-col gap-[16px]">
                <div className="h-[48px] md:h-[60px] w-3/4 bg-[#282828] rounded-[8px]" />
                <div className="h-[14px] w-1/3 bg-[#282828] rounded-[4px]" />
                <div className="flex gap-[8px]">
                  {Array.from({ length: 3 }, (_, i) => `skel-tag-${i}`).map(
                    (id) => (
                      <div
                        key={id}
                        className="h-[20px] w-[60px] bg-[#282828] rounded-[4px]"
                      />
                    ),
                  )}
                </div>
              </div>

              {/* Synopsis */}
              <div className="flex flex-col gap-[12px]">
                <div className="h-[12px] w-[80px] bg-[#282828] rounded-[4px]" />
                <div className="flex flex-col gap-[8px]">
                  <div className="h-[16px] w-full bg-[#282828] rounded-[4px]" />
                  <div className="h-[16px] w-5/6 bg-[#282828] rounded-[4px]" />
                  <div className="h-[16px] w-4/5 bg-[#282828] rounded-[4px]" />
                </div>
              </div>
            </div>

            {/* Episodes List Skeleton */}
            <div className="flex flex-col gap-[16px] animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-[12px] w-[100px] bg-[#282828] rounded-[4px]" />
                <div className="h-[28px] w-[100px] bg-[#282828] rounded-[8px]" />
              </div>
              <div className="flex flex-col gap-[12px]">
                {Array.from({ length: 5 }, (_, i) => `skel-${i}`).map((id) => (
                  <div
                    key={id}
                    className="flex gap-[16px] p-[12px] rounded-[8px] bg-surface border border-border-line animate-pulse"
                  >
                    <div className="w-[160px] sm:w-[200px] aspect-[16/9] bg-[#282828] rounded-[6px] shrink-0" />
                    <div className="flex-1 flex flex-col gap-[8px]">
                      <div className="h-[14px] w-[100px] bg-[#323232] rounded-[4px]" />
                      <div className="h-[16px] w-1/2 bg-[#323232] rounded-[4px]" />
                      <div className="h-[12px] w-full bg-[#323232] rounded-[4px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !anime) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-[24px] text-center gap-[16px] min-h-[50vh]">
        <h2 className="text-xl font-bold text-white">Failed to load details</h2>
        <p className="text-sm text-[#A3A3A3] max-w-md">
          There was an error communicating with the anime service. Please check
          your connection or try again.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </main>
    );
  }

  const handleWatchlistChange = (
    status: "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch",
  ) => {
    watchlist.addItem({
      animeId,
      animeTitle: anime.title,
      animeImage: anime.posterImage,
      status,
    });
    setIsDropdownOpen(false);
  };

  const handleRemoveFromWatchlist = () => {
    watchlist.removeItem(animeId);
    setIsDropdownOpen(false);
  };

  const handleToggleLike = () => {
    const nextVal = !isLiked;
    setIsLiked(nextVal);
    localStorage.setItem(`liked-${animeId}`, String(nextVal));
  };

  const handleRateSeries = (rating: number) => {
    setTempRating(rating);
  };

  const handleConfirmRating = () => {
    setUserRating(tempRating);
    localStorage.setItem(`rating-${animeId}`, String(tempRating));
    setIsRatingModalOpen(false);
  };

  const handlePlayEpisode = (epNumber: number) => {
    router.push(`/watch/${animeId}/${epNumber}`);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment: Comment = {
      id: Date.now(),
      username: "Guest_User",
      content: commentInput.trim(),
      createdAt: "Just now",
    };

    const updated = [newComment, ...commentsList];
    setCommentsList(updated);
    localStorage.setItem(`comments-${animeId}`, JSON.stringify(updated));
    setCommentInput("");
  };

  const formatStatus = (status: string) => {
    return status?.replace(/_/g, " ").toUpperCase() || "";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Recently";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();

      // If the date is in the future
      if (diffInMs < 0) {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }

      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      const diffInWeeks = Math.floor(diffInDays / 7);
      const diffInMonths = Math.floor(diffInDays / 30);

      if (diffInHours < 1) {
        return "an hour ago";
      }
      if (diffInDays < 1) {
        return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
      }
      if (diffInDays < 7) {
        return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
      }
      if (diffInDays < 30) {
        return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
      }
      if (diffInDays < 180) {
        // Up to 6 months
        return diffInMonths === 1
          ? "1 month ago"
          : `${diffInMonths} months ago`;
      }

      // Too old: return specific date
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

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

  const sortedEpisodes = [...episodesList].sort((a, b) => {
    return sortOrder === "asc"
      ? a.episode_number - b.episode_number
      : b.episode_number - a.episode_number;
  });

  const getPageLimit = () => {
    return episodeView === "small" ? 50 : 13;
  };

  const limit = getPageLimit();
  const totalEpisodes = sortedEpisodes.length;
  const totalPages = Math.ceil(totalEpisodes / limit);
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEpisodes = sortedEpisodes.slice(startIndex, endIndex);

  return (
    <main className="flex-1 flex flex-col -mt-[68px] md:-mt-[112px] relative">
      {/* 1. Dynamic Video Player or Banner Section */}
      <AnimatePresence mode="wait">
        {isPlayingThisAnime ? (
          <motion.div
            key="player"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full z-20 mt-[68px] md:mt-[112px] border-b border-[#282828] overflow-hidden"
          >
            <div className="relative w-full aspect-video md:max-h-[560px] bg-black flex flex-col justify-between">
              {/* Fake Video Screen */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-0">
                <Tv className="w-[32px] h-[32px] md:w-[48px] md:h-[48px] text-[#282828] mb-[8px] animate-pulse" />
                <span className="text-[10px] md:text-xs text-[#525252] font-semibold uppercase tracking-widest">
                  Playing: Episode {player.episodeNumber}
                </span>
              </div>

              {/* Player Top Bar */}
              <div className="relative z-10 p-[8px] md:p-[16px] flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                <span className="text-xs md:text-sm font-bold text-white truncate max-w-[70%]">
                  {anime.title} — Episode {player.episodeNumber}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => player.setPlaying(false)}
                  className="rounded-full h-[28px] w-[28px] md:h-[32px] md:w-[32px] p-0 flex items-center justify-center bg-[#242424] hover:bg-[#323232]"
                >
                  <X className="w-[12px] h-[12px] md:w-[14px] md:h-[14px]" />
                </Button>
              </div>

              {/* Player Bottom Custom Controls */}
              <div className="relative z-10 p-[8px] md:p-[16px] flex flex-col gap-[8px] md:gap-[12px] bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                {/* Timeline slider */}
                <div className="flex items-center gap-[8px] md:gap-[12px]">
                  <span className="text-[10px] md:text-xs text-[#A3A3A3] font-mono shrink-0">
                    {Math.floor(player.progressSeconds / 60)}:
                    {String(player.progressSeconds % 60).padStart(2, "0")}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={player.durationSeconds || 100}
                    value={player.progressSeconds}
                    onChange={(e) =>
                      player.setProgress(parseInt(e.target.value, 10))
                    }
                    className="w-full h-[3px] md:h-[4px] bg-[#282828] rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <span className="text-[10px] md:text-xs text-[#A3A3A3] font-mono shrink-0">
                    {Math.floor(player.durationSeconds / 60)}:
                    {String(player.durationSeconds % 60).padStart(2, "0")}
                  </span>
                </div>

                {/* Left/Right Action Triggers */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[12px] md:gap-[16px]">
                    <button
                      type="button"
                      onClick={() => player.setPlaying(!player.isPlaying)}
                      className="text-white hover:opacity-80 transition-opacity"
                    >
                      {player.isPlaying ? (
                        <Pause className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] fill-current" />
                      ) : (
                        <Play className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] fill-current" />
                      )}
                    </button>

                    <div className="flex items-center gap-[8px]">
                      <button
                        type="button"
                        onClick={() => player.toggleMute()}
                        className="text-white hover:opacity-80 transition-opacity"
                      >
                        {player.isMuted ? (
                          <VolumeX className="w-[16px] h-[16px] md:w-[20px] md:h-[20px]" />
                        ) : (
                          <Volume2 className="w-[16px] h-[16px] md:w-[20px] md:h-[20px]" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={player.isMuted ? 0 : player.volume}
                        onChange={(e) =>
                          player.setVolume(parseFloat(e.target.value))
                        }
                        className="w-[60px] h-[3px] bg-[#282828] rounded-lg appearance-none cursor-pointer accent-white hidden md:block"
                      />
                    </div>
                  </div>

                  <span className="text-[10px] md:text-xs text-[#525252] font-semibold">
                    1080P AUTO HLS
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-[480px] md:h-[640px] bg-[#000000] z-0 pointer-events-none"
          >
            {anime.bannerImage ? (
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${anime.bannerImage})` }}
              >
                {/* Rich gradients to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/70 to-[#000000]/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/40 to-transparent" />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-[#141414] to-[#000000]" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Content Info Details Section */}
      <div
        className={`relative w-full px-[12px] md:px-[24px] pb-[48px] flex flex-col lg:flex-row gap-[12px] md:gap-[24px] ${
          isPlayingThisAnime
            ? "pt-[12px] md:pt-[24px]"
            : "pt-[80px] md:pt-[136px]"
        }`}
      >
        {/* Left Column: Poster and Quick Metadata */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-[24px]">
          <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden border border-border-line bg-surface shadow-2xl">
            {anime.posterImage && (
              <Image
                unoptimized
                fill
                src={anime.posterImage}
                alt={anime.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Detailed Metadata Section */}
          <div className="flex flex-col gap-[16px] p-[20px] bg-surface border border-border-line rounded-[12px] text-sm">
            {/* Format, Episodes, Status, Season in 2 columns */}
            <div className="grid grid-cols-2 gap-y-[12px] gap-x-[16px] border-b border-border-line pb-[12px]">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Format
                </span>
                <span className="text-sm font-semibold text-text-primary uppercase">
                  {anime.format || "N/A"}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Episodes
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {anime.episodesCount || "N/A"}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Status
                </span>
                <span className="text-sm font-semibold text-text-primary capitalize">
                  {formatStatus(anime.status)}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Season
                </span>
                <span className="text-sm font-semibold text-text-primary capitalize">
                  {anime.season
                    ? `${anime.season} ${anime.year}`
                    : anime.year || "N/A"}
                </span>
              </div>
            </div>

            {/* Dates in 2 columns */}
            <div className="grid grid-cols-2 gap-y-[12px] gap-x-[16px] border-b border-border-line pb-[12px]">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Start Date
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {anime.startDate || "N/A"}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  End Date
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {anime.endDate || "N/A"}
                </span>
              </div>
            </div>

            {/* Studio & Producers in full-width rows */}
            <div className="flex flex-col gap-[12px] border-b border-border-line pb-[12px]">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Studios
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {anime.studio || "N/A"}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Producers
                </span>
                <span className="text-sm font-semibold text-text-primary leading-normal">
                  {anime.producers || "N/A"}
                </span>
              </div>
            </div>

            {/* Ratings */}
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Rating
                </span>
                <span className="text-sm font-semibold text-text-primary flex items-center gap-[4px]">
                  {anime.score}{" "}
                  <Star className="w-[14px] h-[14px] fill-amber-400 text-amber-400 shrink-0" />
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons stack */}
          <div className="flex flex-col gap-[12px] w-full">
            {/* Watchlist status control */}
            <div className="relative w-full">
              <DropdownMenu onOpenChange={setIsDropdownOpen}>
                <div className="flex items-center gap-[4px] w-full">
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={watchlistItem ? "secondary" : "primary"}
                      className="flex-1 gap-[8px]"
                    >
                      {watchlistItem ? (
                        <>
                          <Check className="w-[16px] h-[16px] text-emerald-400" />
                          <span className="capitalize">
                            {watchlistItem.status.replace("_", " ")}
                          </span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-[16px] h-[16px]" />
                          <span>Add to List</span>
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  {watchlistItem && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRemoveFromWatchlist}
                      className="h-[40px] w-[40px] shrink-0 border border-border-line text-rose-400 hover:bg-rose-950/20"
                      aria-label="Remove from watchlist"
                    >
                      <Trash2 className="w-[16px] h-[16px]" />
                    </Button>
                  )}
                </div>

                <DropdownMenuContent
                  isOpen={isDropdownOpen}
                  className="w-[280px]"
                >
                  <DropdownMenuItem
                    onClick={() => handleWatchlistChange("watching")}
                  >
                    Watching
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleWatchlistChange("completed")}
                  >
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleWatchlistChange("on_hold")}
                  >
                    On Hold
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleWatchlistChange("dropped")}
                  >
                    Dropped
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleWatchlistChange("plan_to_watch")}
                  >
                    Plan to Watch
                  </DropdownMenuItem>
                  {watchlistItem && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleRemoveFromWatchlist}
                        className="text-rose-400 hover:bg-rose-950/20"
                      >
                        Delete Bookmark
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Like Button */}
            <Button
              variant={isLiked ? "primary" : "secondary"}
              className="w-full gap-[8px]"
              onClick={handleToggleLike}
            >
              <Heart
                className={`w-[16px] h-[16px] ${isLiked ? "fill-black text-black" : "text-white"}`}
              />
              <span>{isLiked ? "Liked" : "Like"}</span>
            </Button>

            {/* Rate Button */}
            <Dialog
              open={isRatingModalOpen}
              onOpenChange={setIsRatingModalOpen}
            >
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full gap-[8px]">
                  <Star className="w-[16px] h-[16px] text-white" />
                  <span>Rate This Series</span>
                </Button>
              </DialogTrigger>
              <DialogContent
                isOpen={isRatingModalOpen}
                className="max-w-md bg-surface border border-border-line text-text-primary p-[24px] min-w-0"
              >
                <DialogHeader className="min-w-0">
                  <DialogTitle className="text-xl font-bold truncate">
                    Rate this series
                  </DialogTitle>
                  <DialogDescription className="text-sm text-text-muted truncate">
                    Share your rating for {anime.title}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-[24px] py-[16px] w-full min-w-0">
                  {/* Anime Info inside Modal */}
                  <div className="flex gap-[16px] w-full min-w-0 overflow-hidden p-[12px] bg-control border border-border-line rounded-[8px]">
                    <div className="relative aspect-[2/3] w-[60px] rounded-[6px] overflow-hidden border border-border-line bg-background shrink-0">
                      {anime.posterImage && (
                        <Image
                          unoptimized
                          fill
                          src={anime.posterImage}
                          alt={anime.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
                      <div
                        className="font-bold text-text-primary text-base truncate w-full"
                        title={anime.title}
                      >
                        {anime.title}
                      </div>
                      <div className="text-xs text-text-muted mt-[2px] truncate w-full">
                        {anime.format} • {anime.studio}
                      </div>
                      {tempRating > 0 && (
                        <span className="text-xs text-text-secondary font-bold mt-[4px] flex items-center gap-[4px]">
                          Your rating: {tempRating}/5{" "}
                          <Star className="w-[12px] h-[12px] fill-amber-400 text-amber-400" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Star Selector */}
                  <div className="flex flex-col items-center gap-[16px] w-full">
                    <div className="flex items-center gap-[8px]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => handleRateSeries(star)}
                          className="cursor-pointer hover:scale-110 transition-transform p-[4px]"
                          title={`Select ${star} Stars`}
                        >
                          <Star
                            className={`w-[32px] h-[32px] ${
                              star <= tempRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-[#3b3b3b] hover:text-text-muted"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <Button
                      onClick={handleConfirmRating}
                      variant="primary"
                      className="w-full mt-[8px]"
                      disabled={tempRating === 0}
                    >
                      Confirm Rating
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Right Column: Title, Synopsis, Episodes, Comments */}
        <div className="flex-1 flex flex-col gap-[40px]">
          {/* Title & Synopsis Wrapper Card */}
          <div className="bg-surface border border-border-line rounded-[12px] p-[24px] md:p-[32px] flex flex-col gap-[24px]">
            {/* Main Title & Genres */}
            <div className="flex flex-col gap-[16px]">
              <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
                {anime.title}
              </h1>
              {anime.romajiTitle && anime.romajiTitle !== anime.title && (
                <span className="text-sm font-semibold text-text-muted -mt-[8px]">
                  Alternative titles: {anime.romajiTitle}
                </span>
              )}

              {/* Genres Row */}
              <div className="flex flex-wrap items-center gap-[8px]">
                {anime.genres?.map((genre: string) => (
                  <span
                    key={genre}
                    className="text-[10px] font-bold px-[8px] py-[3px] rounded bg-control border border-border-line text-text-secondary uppercase tracking-wider"
                  >
                    {genre}
                  </span>
                ))}
                <span
                  className={`text-[10px] font-bold px-[8px] py-[3px] rounded border uppercase tracking-wider ${
                    anime.status === "FINISHED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}
                >
                  {formatStatus(anime.status)}
                </span>
              </div>
            </div>

            {/* Synopsis */}
            <div className="flex flex-col gap-[12px]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Synopsis
              </h2>
              <p className="text-base text-text-secondary leading-relaxed w-full">
                {anime.synopsis || "No description provided."}
              </p>
            </div>
          </div>

          {/* Episodes List Section */}
          <div className="flex flex-col gap-[16px]">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Episodes ({anime.episodesCount})
              </h2>
              <div className="flex items-center gap-[4px] p-[2px] bg-surface border border-border-line rounded-[8px]">
                {/* Sorting Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className={`p-[6px] rounded-[6px] transition-colors cursor-pointer ${
                    sortOrder === "desc"
                      ? "bg-control text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                  title={
                    sortOrder === "asc"
                      ? "Sort Descending (Newest first)"
                      : "Sort Ascending (Oldest first)"
                  }
                  aria-label="Toggle Episode Sort Order"
                >
                  <ArrowUpDown className="w-[14px] h-[14px]" />
                </button>

                {/* Vertical Divider */}
                <div className="w-[1px] h-[14px] bg-border-line mx-[4px]" />

                {/* View Mode Toggle Buttons */}
                <button
                  type="button"
                  onClick={() => setEpisodeView("list")}
                  className={`p-[6px] rounded-[6px] transition-colors cursor-pointer ${
                    episodeView === "list"
                      ? "bg-control text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <LayoutList className="w-[14px] h-[14px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setEpisodeView("grid")}
                  className={`p-[6px] rounded-[6px] transition-colors cursor-pointer ${
                    episodeView === "grid"
                      ? "bg-control text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid className="w-[14px] h-[14px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setEpisodeView("small")}
                  className={`p-[6px] rounded-[6px] transition-colors cursor-pointer ${
                    episodeView === "small"
                      ? "bg-control text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                  title="Compact View"
                  aria-label="Compact View"
                >
                  <Grid3X3 className="w-[14px] h-[14px]" />
                </button>
              </div>
            </div>

            {anime.episodesCount > 0 ? (
              <>
                {/* List View (full width cards) */}
                {episodeView === "list" && (
                  <div className="flex flex-col gap-[12px]">
                    {paginatedEpisodes.map(
                      (
                        ep: {
                          id: string | number;
                          title?: string;
                          name?: string;
                          number?: number;
                          image?: string;
                          isFiller?: boolean;
                          episode_number?: number;
                          still_path?: string | null;
                          runtime?: number;
                          overview?: string;
                          air_date?: string;
                        },
                        index: number,
                      ) => {
                        const epNum = ep.episode_number || index + 1;
                        const isCurrentlyPlaying =
                          player.animeId === animeId &&
                          player.episodeNumber === epNum &&
                          player.isPlaying;
                        const thumbnail = ep.still_path
                          ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                          : null;
                        return (
                          <button
                            type="button"
                            key={ep.id || index}
                            onClick={() => handlePlayEpisode(epNum)}
                            className={`group relative flex items-center gap-[16px] p-[12px] rounded-[8px] border text-left cursor-pointer transition-all hover:bg-control w-full ${
                              isCurrentlyPlaying
                                ? "bg-control border-white"
                                : "bg-surface border-border-line"
                            }`}
                          >
                            {thumbnail ? (
                              <div className="w-[160px] sm:w-[200px] aspect-[16/9] rounded-[6px] overflow-hidden border border-border-line bg-background shrink-0 relative">
                                <Image
                                  unoptimized
                                  fill
                                  src={thumbnail}
                                  alt={ep.name || "Episode thumbnail"}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-[8px] right-[8px] text-xs text-text-primary font-bold bg-black/60 px-[8px] py-[2px] rounded border border-border-line backdrop-blur-[2px]">
                                  {ep.runtime || 24} MIN
                                </span>
                                {isCurrentlyPlaying && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                                      Playing
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                className={`w-[160px] sm:w-[200px] aspect-[16/9] rounded-[6px] flex items-center justify-center border text-base font-bold shrink-0 relative ${
                                  isCurrentlyPlaying
                                    ? "bg-white text-black border-white"
                                    : "bg-control border-border-line text-text-primary"
                                }`}
                              >
                                EP {epNum}
                                <span className="absolute bottom-[8px] right-[8px] text-xs text-text-primary font-bold bg-black/60 px-[8px] py-[2px] rounded border border-border-line backdrop-blur-[2px]">
                                  {ep.runtime || 24} MIN
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                              <div className="flex items-center gap-[6px] text-[11px] text-text-muted font-semibold uppercase tracking-wider">
                                <span>Episode {epNum}</span>
                                <span>•</span>
                                <span>
                                  {ep.air_date ? formatDate(ep.air_date) : ""}
                                </span>
                              </div>
                              <span className="text-base font-bold text-text-primary truncate">
                                {ep.name || `Episode ${epNum}`}
                              </span>
                              {ep.overview && (
                                <p className="text-sm text-text-muted line-clamp-2 mt-[4px] leading-relaxed">
                                  {ep.overview}
                                </p>
                              )}
                            </div>
                            <div
                              className={`w-[36px] h-[36px] rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                isCurrentlyPlaying
                                  ? "bg-white text-black border-white"
                                  : "bg-control border-border-line group-hover:bg-white group-hover:text-black group-hover:border-white"
                              }`}
                            >
                              <Play className="w-[12px] h-[12px] fill-current" />
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}

                {/* Grid View (5 cards per row on desktop, smaller cards) */}
                {episodeView === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[12px]">
                    {paginatedEpisodes.map(
                      (
                        ep: {
                          id: string | number;
                          title?: string;
                          name?: string;
                          number?: number;
                          image?: string;
                          isFiller?: boolean;
                          episode_number?: number;
                          still_path?: string | null;
                          runtime?: number;
                          overview?: string;
                          air_date?: string;
                        },
                        index: number,
                      ) => {
                        const epNum = ep.episode_number || index + 1;
                        const isCurrentlyPlaying =
                          player.animeId === animeId &&
                          player.episodeNumber === epNum &&
                          player.isPlaying;
                        const thumbnail = ep.still_path
                          ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                          : null;
                        return (
                          <button
                            type="button"
                            key={ep.id || index}
                            onClick={() => handlePlayEpisode(epNum)}
                            className={`group relative flex flex-col rounded-[8px] border overflow-hidden text-left cursor-pointer transition-all hover:bg-control ${
                              isCurrentlyPlaying
                                ? "bg-control border-white"
                                : "bg-surface border-border-line"
                            }`}
                          >
                            {thumbnail ? (
                              <div className="w-full aspect-[16/9] bg-background relative border-b border-border-line">
                                <Image
                                  unoptimized
                                  fill
                                  src={thumbnail}
                                  alt={ep.name || "Episode thumbnail"}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <span className="absolute bottom-[8px] left-[12px] text-xs text-text-primary font-bold bg-black/60 px-[8px] py-[2px] rounded border border-border-line backdrop-blur-[2px]">
                                  EP {epNum}
                                </span>
                                <span className="absolute bottom-[8px] right-[12px] text-xs text-text-primary font-bold bg-black/60 px-[8px] py-[2px] rounded border border-border-line backdrop-blur-[2px]">
                                  {ep.runtime || 24} MIN
                                </span>
                                {isCurrentlyPlaying && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                                      Playing
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full aspect-[16/9] bg-control relative border-b border-border-line flex items-center justify-center">
                                <Tv className="w-[24px] h-[24px] text-text-muted opacity-40" />
                                <span className="absolute bottom-[8px] left-[12px] text-xs text-text-primary font-bold bg-black/60 px-[8px] py-[2px] rounded border border-border-line backdrop-blur-[2px]">
                                  EP {epNum}
                                </span>
                                <span className="absolute bottom-[8px] right-[12px] text-xs text-text-primary font-bold bg-black/60 px-[8px] py-[2px] rounded border border-border-line backdrop-blur-[2px]">
                                  {ep.runtime || 24} MIN
                                </span>
                                {isCurrentlyPlaying && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                                      Playing
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="p-[16px] flex flex-col flex-1">
                              <span className="text-base font-bold text-text-primary truncate">
                                {ep.name || `Episode ${epNum}`}
                              </span>
                              <p className="text-sm text-text-muted line-clamp-2 mt-[4px] leading-relaxed">
                                {ep.overview ||
                                  "No description available for this episode."}
                              </p>
                              <div className="flex items-center justify-between w-full mt-auto pt-[12px]">
                                <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">
                                  Uploaded:{" "}
                                  {ep.air_date ? formatDate(ep.air_date) : ""}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity p-[6px] rounded-full bg-white text-black">
                                  <Play className="w-[12px] h-[12px] fill-current" />
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}

                {/* Small Grid View (Squares with episode numbers) */}
                {episodeView === "small" && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-[8px]">
                    {paginatedEpisodes.map(
                      (
                        ep: {
                          id: string;
                          title?: string;
                          number?: number;
                          image?: string;
                          isFiller?: boolean;
                          episode_number?: number;
                        },
                        index: number,
                      ) => {
                        const epNum = ep.episode_number || index + 1;
                        const isCurrentlyPlaying =
                          player.animeId === animeId &&
                          player.episodeNumber === epNum &&
                          player.isPlaying;
                        return (
                          <button
                            type="button"
                            key={ep.id || index}
                            onClick={() => handlePlayEpisode(epNum)}
                            className={`w-full aspect-square rounded-[8px] border flex items-center justify-center text-sm font-bold transition-all hover:bg-control cursor-pointer ${
                              isCurrentlyPlaying
                                ? "bg-control border-white text-white"
                                : "bg-surface border-border-line text-text-secondary"
                            }`}
                          >
                            {epNum}
                          </button>
                        );
                      },
                    )}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalEpisodes > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-[16px] border-t border-border-line pt-[16px] mt-[16px] text-sm">
                    <span className="text-text-muted">
                      Showing{" "}
                      <span className="text-text-primary font-bold">
                        {startIndex + 1}-{Math.min(endIndex, totalEpisodes)}
                      </span>{" "}
                      of{" "}
                      <span className="text-text-primary font-bold">
                        {totalEpisodes}
                      </span>{" "}
                      Episodes
                    </span>
                    <div className="flex items-center gap-[8px]">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Prev
                      </Button>
                      <div className="flex items-center gap-[4px] flex-wrap justify-center">
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          return (
                            <button
                              type="button"
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`h-[32px] px-[10px] min-w-[32px] rounded-[6px] border text-xs font-bold transition-all cursor-pointer ${
                                currentPage === pageNum
                                  ? "bg-white text-black border-white"
                                  : "bg-surface border-border-line text-text-secondary hover:bg-control"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-[24px] text-center border border-border-line rounded-[12px] bg-surface text-sm text-text-secondary">
                No episodes are available to watch for this format.
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-surface border border-border-line rounded-[12px] p-[24px] flex flex-col gap-[24px] mt-0">
            {/* Header */}
            <div className="flex items-center gap-[8px] border-b border-border-line pb-[16px]">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
                Comments
              </h2>
              <span className="text-xs font-bold text-text-muted bg-control border border-border-line px-[8px] py-[2px] rounded">
                {commentsList.length}
              </span>
            </div>

            {/* Write a comment */}
            <form onSubmit={handleAddComment} className="flex gap-[12px]">
              <div className="w-[36px] h-[36px] rounded-full bg-control border border-border-line shrink-0 flex items-center justify-center text-xs font-bold text-text-muted">
                U
              </div>
              <div className="flex-1 flex flex-col gap-[8px]">
                <textarea
                  placeholder="Share your thoughts about this show..."
                  rows={3}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full bg-background border border-border-line rounded-[8px] px-[14px] py-[10px] text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-white/30 transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-[16px] py-[8px] bg-white text-black text-xs font-bold rounded-[6px] hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </form>

            {/* Comments stack */}
            {commentsList.length > 0 ? (
              <div className="flex flex-col gap-[12px]">
                {commentsList.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-[16px] bg-[#121212] border border-border-line rounded-[12px] flex flex-col gap-[6px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">
                        @{comm.username}
                      </span>
                      <span className="text-[10px] text-text-muted font-semibold">
                        {comm.createdAt}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {comm.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-[32px] gap-[8px] text-center">
                <span className="text-2xl">💬</span>
                <p className="text-sm font-bold text-text-primary">
                  No comments yet
                </p>
                <p className="text-xs text-text-muted">
                  Be the first to share your thoughts on this show.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
