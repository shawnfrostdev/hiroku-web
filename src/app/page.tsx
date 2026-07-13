"use client";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, ChevronLeft, ChevronRight, Info, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWatchlistStore } from "@/store/useWatchlistStore";

const _CONTINUE_PLAYING_FALLBACK = [
  {
    animeId: "154587",
    animeTitle: "Frieren: Beyond Journey's End",
    animeImage:
      "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-n6ca655rBLSj.jpg",
    episode: "Episode 18",
    progress: 75,
    timeLeft: "6m left",
  },
  {
    animeId: "145064",
    animeTitle: "Jujutsu Kaisen Season 2",
    animeImage:
      "https://s4.anilist.co/file/anilistcdn/media/anime/banner/145064-9K642C978D7o.jpg",
    episode: "Episode 12",
    progress: 40,
    timeLeft: "14m left",
  },
  {
    animeId: "136003",
    animeTitle: "Chainsaw Man",
    animeImage:
      "https://s4.anilist.co/file/anilistcdn/media/anime/banner/136003-75T9a4H0R9kD.jpg",
    episode: "Episode 8",
    progress: 90,
    timeLeft: "2m left",
  },
];

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> =
  {
    // Formats / Statuses
    TV: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
    },
    MOVIE: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/20",
    },
    ONA: {
      bg: "bg-pink-500/10",
      text: "text-pink-400",
      border: "border-pink-500/20",
    },
    OVA: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      border: "border-indigo-500/20",
    },
    SPECIAL: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
    },
    TV_SHORT: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
    },
    // Genres / Taglines
    ACTION: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
    },
    COMEDY: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      border: "border-yellow-500/20",
    },
    DRAMA: {
      bg: "bg-teal-500/10",
      text: "text-teal-400",
      border: "border-teal-500/20",
    },
    FANTASY: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    ROMANCE: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/20",
    },
    SCI_FI: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
    },
    "SCI-FI": {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
    },
    ADVENTURE: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/20",
    },
    SPORTS: {
      bg: "bg-lime-500/10",
      text: "text-lime-400",
      border: "border-lime-500/20",
    },
    MYSTERY: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/20",
    },
    SLICE_OF_LIFE: {
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      border: "border-sky-500/20",
    },
    "SLICE OF LIFE": {
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      border: "border-sky-500/20",
    },
    THRILLER: {
      bg: "bg-fuchsia-500/10",
      text: "text-fuchsia-400",
      border: "border-fuchsia-500/20",
    },
    SUPERNATURAL: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      border: "border-indigo-500/20",
    },
    TRENDING: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
    },
    POPULAR: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    UPCOMING: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
    },
    ANIME: {
      bg: "bg-neutral-500/10",
      text: "text-neutral-400",
      border: "border-neutral-500/20",
    },
  };

const getTagBadge = (tag: string) => {
  if (!tag) return null;

  // If it's something like "12EP" or "24EP", color it based on EP number or standard format
  const isEpCount = /^\d+EP$/.test(tag);
  const normalized = tag.toUpperCase().replace(/\s+/g, " ").trim();

  const style = isEpCount
    ? {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
      }
    : TAG_COLORS[normalized] || {
        bg: "bg-neutral-500/10",
        text: "text-neutral-400",
        border: "border-neutral-500/20",
      };

  return (
    <span
      className={`text-[9px] font-bold px-[6px] py-[2px] rounded border uppercase tracking-wider shrink-0 ${style.bg} ${style.text} ${style.border}`}
    >
      {tag}
    </span>
  );
};

const fetchTrendingAnime = async () => {
  const response = await fetch("/api/anime/trending");
  if (!response.ok) {
    throw new Error("Failed to fetch trending anime");
  }
  return response.json();
};

const fetchPopularSeasonAnime = async () => {
  const response = await fetch("/api/anime/popular-season");
  if (!response.ok) {
    throw new Error("Failed to fetch popular seasonal anime");
  }
  return response.json();
};

const fetchPopularAllTimeAnime = async () => {
  const response = await fetch("/api/anime/popular-alltime");
  if (!response.ok) {
    throw new Error("Failed to fetch popular all-time anime");
  }
  return response.json();
};

const fetchFinishedMovies = async () => {
  const response = await fetch("/api/anime/finished-movies");
  if (!response.ok) {
    throw new Error("Failed to fetch finished shows and movies");
  }
  return response.json();
};

const fetchRecentlyUpdated = async () => {
  const response = await fetch("/api/anime/recently-updated");
  if (!response.ok) throw new Error("Failed to fetch recently updated anime");
  return response.json();
};

const DEFAULT_ENTRIES:
  | Record<string, unknown>
  | string
  | number
  | boolean
  | null
  | undefined
  | unknown[]
  | unknown[] = [];
const DEFAULT_OBJECT = { finished: [], movies: [] };

export default function Page() {
  const { data: entries = DEFAULT_ENTRIES, isLoading } = useQuery({
    queryKey: ["trendingAnime"],
    queryFn: fetchTrendingAnime,
  });

  const {
    data: popularSeason = DEFAULT_ENTRIES,
    isLoading: isLoadingPopularSeason,
  } = useQuery({
    queryKey: ["popularSeasonAnime"],
    queryFn: fetchPopularSeasonAnime,
  });

  const {
    data: popularAllTime = DEFAULT_ENTRIES,
    isLoading: isLoadingPopularAllTime,
  } = useQuery({
    queryKey: ["popularAllTimeAnime"],
    queryFn: fetchPopularAllTimeAnime,
  });

  const {
    data: finishedMovies = DEFAULT_OBJECT,
    isLoading: isLoadingFinishedMovies,
  } = useQuery({
    queryKey: ["finishedMovies"],
    queryFn: fetchFinishedMovies,
  });

  const {
    data: recentlyUpdated = DEFAULT_ENTRIES,
    isLoading: isLoadingRecentlyUpdated,
  } = useQuery({
    queryKey: ["recentlyUpdated"],
    queryFn: fetchRecentlyUpdated,
  });

  const watchlist = useWatchlistStore((state) => state.items);
  const watchingItems = Object.values(watchlist).filter(
    (item) => item.status === "watching",
  );

  const heroEntries =
    entries && Array.isArray(entries) ? entries.slice(0, 5) : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const activeEntry = heroEntries[activeIndex];
  const [forYouEntries, setForYouEntries] = useState<Record<string, unknown>[]>(
    [],
  );

  useEffect(() => {
    if (heroEntries.length === 0) return;
    setProgress(0);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      if (currentProgress >= 100) {
        setActiveIndex((curr) => (curr + 1) % heroEntries.length);
      } else {
        setProgress(currentProgress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [heroEntries.length]);

  useEffect(() => {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      setForYouEntries([]);
      return;
    }
    if (entries.length > 5) {
      const remaining = entries.slice(5);
      const shuffled = [...remaining].sort(() => 0.5 - Math.random());
      setForYouEntries(shuffled.slice(0, 5));
    } else {
      setForYouEntries(entries.slice(0, 5));
    }
  }, [entries]);

  if (
    isLoading ||
    isLoadingPopularSeason ||
    isLoadingPopularAllTime ||
    isLoadingFinishedMovies ||
    isLoadingRecentlyUpdated
  ) {
    return (
      <main className="flex-1 flex flex-col gap-[24px] px-[24px] pb-[24px]">
        {/* Top section: Hero and Previews side-by-side */}
        <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-start gap-[24px]">
          {/* Skeleton Hero Container */}
          <div className="relative overflow-hidden flex-1 min-w-0 h-[600px] lg:h-[740px] bg-[#141414] border border-[#282828] rounded-[12px] p-[32px] md:p-[48px] flex flex-col justify-end animate-pulse">
            <div className="flex flex-col gap-[24px] max-w-xl">
              <div className="h-[16px] w-[150px] bg-[#282828] rounded-[4px]" />
              <div className="h-[48px] w-[350px] bg-[#282828] rounded-[8px]" />
              <div className="flex flex-col gap-[8px]">
                <div className="h-[16px] w-full bg-[#282828] rounded-[4px]" />
                <div className="h-[16px] w-5/6 bg-[#282828] rounded-[4px]" />
                <div className="h-[16px] w-2/3 bg-[#282828] rounded-[4px]" />
              </div>
              <div className="flex gap-[12px]">
                <div className="h-[40px] w-[120px] bg-[#282828] rounded-[6px]" />
                <div className="h-[40px] w-[120px] bg-[#282828] rounded-[6px]" />
                <div className="h-[40px] w-[40px] bg-[#282828] rounded-[6px]" />
              </div>
            </div>
          </div>

          {/* Skeleton Sidebar */}
          <div className="w-full lg:w-[360px] lg:h-[740px] shrink-0 flex flex-col gap-[12px]">
            {Array.from({ length: 5 }, (_, i) => `skel-5-${i}`).map((id) => (
              <div
                key={id}
                className="w-full h-full lg:flex-1 p-[16px] bg-[#141414]/60 border border-[#282828] rounded-[8px] animate-pulse flex flex-col justify-between"
                style={{ minHeight: "100px" }}
              >
                <div className="flex justify-end">
                  <div className="h-[14px] w-[40px] bg-[#282828] rounded-[4px]" />
                </div>
                <div className="h-[18px] w-3/4 bg-[#282828] rounded-[4px]" />
              </div>
            ))}
          </div>
        </div>

        {/* Continue Watching / For You Skeleton */}
        <div className="flex flex-col gap-[16px]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
            For You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[16px]">
            {Array.from({ length: 5 }, (_, i) => `skel-5-${i}`).map((id) => (
              <div
                key={id}
                className="h-[140px] rounded-[10px] border border-[#282828] bg-[#141414] animate-pulse flex flex-col justify-end p-[16px] gap-[8px]"
              >
                <div className="h-[14px] w-3/4 bg-[#282828] rounded-[4px]" />
                <div className="h-[10px] w-1/2 bg-[#282828] rounded-[4px]" />
              </div>
            ))}
          </div>
        </div>

        {/* Trending Now Skeleton */}
        <div className="flex flex-col gap-[16px] mt-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
              Trending Now
            </h2>
            <div className="h-[12px] w-[50px] bg-[#282828] rounded-[3px] animate-pulse" />
          </div>
          <div className="flex md:grid md:grid-cols-5 lg:grid-cols-10 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none gap-[10px] md:gap-[16px] pb-[4px] md:pb-0">
            {Array.from({ length: 10 }, (_, i) => `skel-10-${i}`).map((id) => (
              <div key={id} className="flex flex-col gap-[8px] animate-pulse">
                <div className="aspect-[2/3] rounded-[10px] border border-[#282828] bg-[#141414]" />
                <div className="flex flex-col gap-[4px] px-[2px]">
                  <div className="h-[12px] w-full bg-[#282828] rounded-[4px]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular This Season Skeleton */}
        <div className="flex flex-col gap-[16px] mt-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
              Popular This Season
            </h2>
            <div className="h-[12px] w-[50px] bg-[#282828] rounded-[3px] animate-pulse" />
          </div>
          <div className="flex md:grid md:grid-cols-5 lg:grid-cols-10 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none gap-[10px] md:gap-[16px] pb-[4px] md:pb-0">
            {Array.from({ length: 10 }, (_, i) => `skel-10-${i}`).map((id) => (
              <div key={id} className="flex flex-col gap-[8px] animate-pulse">
                <div className="aspect-[2/3] rounded-[10px] border border-[#282828] bg-[#141414]" />
                <div className="flex flex-col gap-[4px] px-[2px]">
                  <div className="h-[12px] w-full bg-[#282828] rounded-[4px]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Time Popular Skeleton */}
        <div className="flex flex-col gap-[16px] mt-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
              All Time Popular
            </h2>
            <div className="h-[12px] w-[50px] bg-[#282828] rounded-[3px] animate-pulse" />
          </div>
          <div className="flex md:grid md:grid-cols-5 lg:grid-cols-10 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none gap-[10px] md:gap-[16px] pb-[4px] md:pb-0">
            {Array.from({ length: 10 }, (_, i) => `skel-10-${i}`).map((id) => (
              <div key={id} className="flex flex-col gap-[8px] animate-pulse">
                <div className="aspect-[2/3] rounded-[10px] border border-[#282828] bg-[#141414]" />
                <div className="flex flex-col gap-[4px] px-[2px]">
                  <div className="h-[12px] w-full bg-[#282828] rounded-[4px]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Just Finished & Top Movies Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] mt-[16px] w-full">
          {/* Left Column: Just Finished */}
          <div className="flex flex-col gap-[16px]">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
                Just Finished
              </h2>
              <div className="h-[12px] w-[50px] bg-[#282828] rounded-[3px] animate-pulse" />
            </div>
            <div className="flex flex-col gap-[12px]">
              {Array.from({ length: 5 }, (_, i) => `skel-5-${i}`).map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-[16px] animate-pulse"
                >
                  <div className="aspect-[2/3] w-[48px] rounded-[6px] border border-[#282828] bg-[#141414] shrink-0" />
                  <div className="flex flex-col gap-[6px] flex-1">
                    <div className="h-[14px] w-3/4 bg-[#282828] rounded-[4px]" />
                    <div className="h-[10px] w-1/4 bg-[#282828] rounded-[4px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Top Movies */}
          <div className="flex flex-col gap-[16px]">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
                Top Movies
              </h2>
              <div className="h-[12px] w-[50px] bg-[#282828] rounded-[3px] animate-pulse" />
            </div>
            <div className="flex flex-col gap-[12px]">
              {Array.from({ length: 5 }, (_, i) => `skel-5-${i}`).map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-[16px] animate-pulse"
                >
                  <div className="aspect-[2/3] w-[48px] rounded-[6px] border border-[#282828] bg-[#141414] shrink-0" />
                  <div className="flex flex-col gap-[6px] flex-1">
                    <div className="h-[14px] w-3/4 bg-[#282828] rounded-[4px]" />
                    <div className="h-[10px] w-1/4 bg-[#282828] rounded-[4px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule Skeleton */}
        <div className="flex flex-col gap-[16px] mt-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
              Schedule
            </h2>
          </div>

          {/* Day Tabs Skeleton */}
          <div className="flex flex-nowrap overflow-x-hidden gap-[8px] md:gap-[12px] pb-[8px] w-full">
            {Array.from({ length: 14 }, (_, i) => `skel-14-${i}`).map((id) => (
              <div
                key={id}
                className="flex flex-col items-center justify-center min-w-[64px] md:min-w-[72px] h-[46px] rounded-[8px] bg-[#141414] animate-pulse border border-[#282828] shrink-0"
              />
            ))}
          </div>

          {/* Cards Skeleton */}
          <div className="flex flex-nowrap overflow-x-hidden gap-[16px] w-full py-[8px]">
            {Array.from({ length: 6 }, (_, i) => `skel-6-${i}`).map((id) => (
              <div
                key={id}
                className="flex flex-col gap-[8px] p-[8px] -m-[8px] shrink-0 w-[120px] md:w-[160px] animate-pulse"
              >
                <div className="aspect-[2/3] rounded-[6px] bg-[#141414] border border-[#282828]" />
                <div className="h-[14px] w-3/4 bg-[#282828] rounded-[4px] mt-[4px]" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!activeEntry) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-[24px] text-center gap-[16px] min-h-[50vh]">
        <h2 className="text-xl font-bold text-[#FFFFFF]">
          Failed to load anime catalog
        </h2>
        <p className="text-sm text-[#A3A3A3] max-w-md">
          There was an error communicating with the anime service or the catalog
          is empty. Please check your internet connection or try reloading.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col pt-[12px] md:pt-0 gap-[12px] md:gap-[24px] px-[12px] md:px-[24px] pb-[24px]">
      {/* Top section: Hero and Previews side-by-side */}
      <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-start gap-[12px] lg:gap-[24px]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden w-full h-[480px] md:h-[600px] lg:h-[740px] bg-[#141414] border border-[#282828] rounded-[12px] p-[20px] md:p-[32px] lg:p-[48px] flex flex-col justify-end"
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 z-0"
            >
              <div className="w-full h-full">
                {/* Mobile Poster Image */}
                {activeEntry?.posterImage && (
                  <div
                    className="block md:hidden absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${activeEntry.posterImage})`,
                    }}
                  />
                )}

                {/* Desktop Banner Image */}
                {activeEntry?.bannerImage && (
                  <div
                    className="hidden md:block absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${activeEntry.bannerImage})`,
                    }}
                  />
                )}

                {/* Dark gradient overlay from bottom to top to ensure text readability */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(20, 20, 20, 1) 0%, rgba(20, 20, 20, 0.8) 30%, rgba(20, 20, 20, 0.2) 70%, rgba(20, 20, 20, 0) 100%)",
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Content Area (Active Entry Details) */}
          <div className="relative z-10 flex flex-col gap-[16px] md:gap-[24px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col gap-[12px] md:gap-[24px] min-h-[130px] md:min-h-[180px] lg:min-h-[220px] justify-end"
              >
                {/* Tagline / Meta */}
                <div className="flex items-center gap-[8px] text-[#A3A3A3] text-xs font-semibold tracking-wider uppercase">
                  <span>{activeEntry.tagline}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span>{activeEntry.episodes}</span>
                  <span className="px-[6px] py-[2px] border border-[#525252] rounded-[4px] text-[10px] font-bold">
                    {activeEntry.score} SCORE
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl md:text-3xl lg:text-5xl font-extrabold text-[#FFFFFF] tracking-tight leading-tight line-clamp-2">
                  {activeEntry.title}
                </h1>

                {/* Synopsis */}
                <p className="text-xs md:text-sm lg:text-base text-[#A3A3A3] leading-relaxed max-w-xl line-clamp-2 md:line-clamp-4">
                  {activeEntry.synopsis}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-[8px] md:gap-[12px] mt-[6px] md:mt-[8px]">
              <Button variant="primary" size="md" className="gap-[8px]" asChild>
                <Link href={`/anime/${activeEntry.id}`}>
                  <Play className="h-[16px] w-[16px] fill-current" />
                  Watch Now
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="gap-[8px]"
                asChild
              >
                <Link href={`/anime/${activeEntry.id}`}>
                  <Info className="h-[16px] w-[16px]" />
                  View Info
                </Link>
              </Button>
              <Button
                variant={
                  watchlist[String(activeEntry.id)] ? "primary" : "outline"
                }
                size="icon"
                onClick={() => {
                  const isBookmarked = !!watchlist[String(activeEntry.id)];
                  if (isBookmarked) {
                    useWatchlistStore
                      .getState()
                      .removeItem(String(activeEntry.id));
                  } else {
                    useWatchlistStore.getState().addItem({
                      animeId: String(activeEntry.id),
                      animeTitle: activeEntry.title,
                      animeImage: activeEntry.posterImage,
                      status: "plan_to_watch",
                    });
                  }
                }}
                aria-label="Bookmark anime"
              >
                <Bookmark
                  className={`h-[16px] w-[16px] ${watchlist[String(activeEntry.id)] ? "fill-current" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Muted background graphic element */}
          <div className="absolute right-0 bottom-0 top-0 w-full lg:w-1/2 opacity-10 pointer-events-none z-0">
            <div className="w-full h-full bg-[linear-gradient(to_right,rgba(163,163,163,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(163,163,163,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
        </motion.div>

        {/* Mobile dot indicators (replaces sidebar) */}
        <div className="lg:hidden flex items-center justify-center gap-[8px]">
          {heroEntries.map((entry, idx) => (
            <button
              type="button"
              key={`entry-${entry.animeId || idx}`}
              onClick={() => setActiveIndex(idx)}
              className="relative h-[4px] rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width: idx === activeIndex ? 24 : 8,
                background: idx === activeIndex ? "#FFFFFF" : "#282828",
              }}
              aria-label={`Hero slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Right Sidebar — desktop only */}
        <div className="hidden lg:flex w-[360px] h-[740px] shrink-0 flex-col">
          {/* Small Navigation Cards */}
          <div className="flex flex-col gap-[12px] h-full">
            {heroEntries.map((entry, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`relative overflow-hidden w-full text-left p-[16px] border rounded-[8px] transition-all flex flex-col justify-between lg:flex-1 cursor-pointer focus-visible:outline-none ${
                    isActive
                      ? "bg-[#242424] border-[#FFFFFF]"
                      : "bg-[#141414]/60 border-[#282828] hover:border-[#A3A3A3]/50 hover:bg-[#242424]/40"
                  }`}
                >
                  {/* Background image & gradient overlay */}
                  {entry.bannerImage && (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-opacity duration-300 z-0 pointer-events-none grayscale"
                      style={{
                        backgroundImage: `url(${entry.bannerImage})`,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to right, rgba(20, 20, 20, 0.95) 0%, rgba(20, 20, 20, 0.7) 50%, rgba(20, 20, 20, 0.2) 100%)",
                        }}
                      />
                    </div>
                  )}

                  <div className="flex flex-col justify-between h-full w-full z-10 relative">
                    {/* Top row: Rating badge aligned to the right */}
                    <div className="flex justify-end">
                      <span className="text-[10px] text-[#A3A3A3] font-bold bg-[#141414]/90 px-[6px] py-[2px] rounded border border-[#282828] backdrop-blur-[2px]">
                        {entry.score} ★
                      </span>
                    </div>

                    {/* Bottom row: Title / Name */}
                    <span
                      className={`text-lg font-extrabold truncate leading-tight ${isActive ? "text-[#FFFFFF]" : "text-[#A3A3A3]"}`}
                    >
                      {entry.title}
                    </span>
                  </div>

                  {/* Progress indicator bar at the bottom */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#282828] z-20">
                      <div
                        className="h-full bg-[#FFFFFF] transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Continue Watching / For You Section */}
      <div className="flex flex-col gap-[12px] mt-[8px] md:mt-[0px]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
            {watchingItems.length > 0 ? "Continue Watching" : "For You"}
          </h2>
        </div>

        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-[8px] md:gap-[16px] overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none pb-[4px] md:pb-0">
          {watchingItems.length > 0
            ? watchingItems.slice(0, 5).map((item, idx) => {
                const mockProgress = [75, 40, 90, 55, 30][idx % 5];
                const mockTimeLeft = [
                  "6m left",
                  "14m left",
                  "2m left",
                  "10m left",
                  "18m left",
                ][idx % 5];
                return (
                  <Link
                    href={`/anime/${item.animeId}`}
                    key={`watching-${item.animeId || idx}`}
                    className="group relative h-[100px] md:h-[130px] rounded-[10px] border border-[#282828] bg-[#141414] overflow-hidden cursor-pointer hover:border-[#FFFFFF]/60 transition-all flex flex-col justify-end p-[12px] shrink-0 snap-start w-[60vw] sm:w-[40vw] md:w-auto"
                  >
                    {item.animeImage && (
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                        style={{
                          backgroundImage: `url(${item.animeImage})`,
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(to top, rgba(20, 20, 20, 0.95) 0%, rgba(20, 20, 20, 0.6) 50%, rgba(20, 20, 20, 0.1) 100%)",
                          }}
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-[4px] relative">
                      <span className="text-sm font-bold text-[#FFFFFF] truncate">
                        {item.animeTitle}
                      </span>
                      <div className="flex items-center justify-between text-[11px] text-[#A3A3A3]">
                        <span>Episode 1</span>
                        <span>{mockTimeLeft}</span>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#282828]">
                      <div
                        className="h-full bg-[#FFFFFF]"
                        style={{ width: `${mockProgress}%` }}
                      />
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-[36px] h-[36px] bg-white rounded-full flex items-center justify-center text-black">
                        <Play className="w-[16px] h-[16px] fill-current ml-[2px]" />
                      </div>
                    </div>
                  </Link>
                );
              })
            : forYouEntries.map((item, index) => {
                const tags = [
                  {
                    text: "RECOMMENDED",
                    colorClass: "text-[#FFFFFF] bg-[#10b981] border-[#10b981]",
                  },
                  {
                    text: "TRENDING #1",
                    colorClass: "text-[#FFFFFF] bg-[#f97316] border-[#f97316]",
                  },
                  {
                    text: "MUST WATCH",
                    colorClass: "text-[#FFFFFF] bg-[#a855f7] border-[#a855f7]",
                  },
                  {
                    text: "FAN FAVORITE",
                    colorClass: "text-[#FFFFFF] bg-[#3b82f6] border-[#3b82f6]",
                  },
                  {
                    text: "HOT RELEASE",
                    colorClass: "text-[#FFFFFF] bg-[#ef4444] border-[#ef4444]",
                  },
                ];
                const activeTag = tags[index % tags.length];

                return (
                  <Link href={`/anime/${item.id}`} key={item.id}>
                    <div className="group relative h-[110px] md:h-[140px] rounded-[10px] border border-[#282828] bg-[#141414] overflow-hidden cursor-pointer hover:border-[#FFFFFF]/60 transition-all flex flex-col justify-between p-[12px] md:p-[16px] shrink-0 snap-start w-[65vw] sm:w-[45vw] md:w-auto">
                      {item.bannerImage && (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                          style={{
                            backgroundImage: `url(${item.bannerImage})`,
                          }}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(to top, rgba(20, 20, 20, 0.95) 0%, rgba(20, 20, 20, 0.6) 50%, rgba(20, 20, 20, 0.1) 100%)",
                            }}
                          />
                        </div>
                      )}

                      {/* Top row: Recommendation badge & Rating badge (Above Hover overlay) */}
                      <div className="absolute top-[16px] left-[16px] right-[16px] flex items-center justify-between gap-[8px] pointer-events-none">
                        <span
                          className={`text-[9px] font-black px-[7px] py-[3px] rounded-[4px] border uppercase tracking-wide shadow-md ${activeTag.colorClass}`}
                        >
                          {activeTag.text}
                        </span>
                        <span className="text-[10px] text-[#A3A3A3] font-bold bg-[#141414]/90 px-[6px] py-[2px] rounded border border-[#282828] backdrop-blur-[2px]">
                          {item.score} ★
                        </span>
                      </div>

                      <div className="flex flex-col justify-end h-full w-full relative">
                        {/* Bottom area: Title / Name & Tagline */}
                        <div className="flex flex-col gap-[2px]">
                          <span className="text-sm font-extrabold text-[#FFFFFF] truncate">
                            {item.title}
                          </span>
                          <div className="flex mt-[2px]">
                            {getTagBadge(item.tagline)}
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-[8px] bg-white text-black px-[12px] py-[6px] rounded-[6px] text-xs font-bold transition-transform duration-200 translate-y-2 group-hover:translate-y-0">
                          <Play className="w-[12px] h-[12px] fill-current" />
                          Start Watching
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>

      {/* Recently Updated Section */}
      <div className="flex flex-col gap-[12px] pt-[16px] border-t border-[#1c1c1c]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
            Recently Updated
          </h2>
          <a
            href="/"
            className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            View All
          </a>
        </div>
        <div className="flex md:grid md:grid-cols-5 lg:grid-cols-10 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none gap-[8px] md:gap-[16px] pb-[4px] md:pb-0">
          {recentlyUpdated
            .slice(0, 10)
            .map(
              (item: {
                id: number;
                title?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                media?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                averageScore?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                genres?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                recommendations?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                description?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
              }) => (
                <Link
                  href={`/anime/${item.id}`}
                  key={item.id}
                  className="group flex flex-col gap-[8px] md:p-[8px] md:-m-[8px] rounded-[12px] hover:bg-[#242424] transition-colors cursor-pointer shrink-0 snap-start w-[26vw] sm:w-[20vw] md:w-auto"
                >
                  {/* Card Image Container */}
                  <div className="relative aspect-[2/3] rounded-[10px] border border-[#282828] bg-[#141414] overflow-hidden shadow-md">
                    {item.posterImage ? (
                      <Image
                        unoptimized
                        fill
                        src={item.posterImage}
                        alt={item.title}
                        className="w-full h-full object-cover transform-gpu will-change-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-[16px] text-center text-xs text-[#A3A3A3]">
                        {item.title}
                      </div>
                    )}

                    {/* Score badge top-left */}
                    <div className="absolute top-[8px] left-[8px] pointer-events-none">
                      <span className="text-[9px] text-[#FFFFFF] font-black bg-[#10b981] px-[6px] py-[2px] rounded uppercase tracking-wider shadow-md">
                        {item.score} ★
                      </span>
                    </div>
                  </div>
                  {/* Details Below */}
                  <div className="flex items-start justify-between gap-[4px] min-w-0 px-[2px]">
                    <span className="text-xs md:text-sm font-bold text-[#FFFFFF] line-clamp-1 leading-tight flex-1">
                      {item.title}
                    </span>
                    {item.episodes && getTagBadge(item.episodes)}
                  </div>
                </Link>
              ),
            )}
        </div>
      </div>

      {/* Trending Now Section */}
      <div className="flex flex-col gap-[12px] pt-[16px] border-t border-[#1c1c1c]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
            Trending Now
          </h2>
          <a
            href="/"
            className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            View All
          </a>
        </div>
        <div className="flex md:grid md:grid-cols-5 lg:grid-cols-10 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none gap-[10px] md:gap-[16px] pb-[4px] md:pb-0">
          {entries
            .slice(0, 10)
            .map(
              (item: {
                id: number;
                title?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                media?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                averageScore?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                genres?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                recommendations?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                description?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
              }) => (
                <Link
                  href={`/anime/${item.id}`}
                  key={item.id}
                  className="group flex flex-col gap-[8px] md:p-[8px] md:-m-[8px] rounded-[12px] hover:bg-[#242424] transition-colors cursor-pointer shrink-0 snap-start w-[28vw] sm:w-[22vw] md:w-auto"
                >
                  {/* Card Image Container */}
                  <div className="relative aspect-[2/3] rounded-[10px] border border-[#282828] bg-[#141414] overflow-hidden shadow-md">
                    {/* Poster Image */}
                    {item.posterImage ? (
                      <Image
                        unoptimized
                        fill
                        src={item.posterImage}
                        alt={item.title}
                        className="w-full h-full object-cover transform-gpu will-change-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-[16px] text-center text-xs text-[#A3A3A3]">
                        {item.title}
                      </div>
                    )}

                    {/* Rating Badge (Top Left) */}
                    <div className="absolute top-[8px] left-[8px] pointer-events-none">
                      <span className="text-[9px] text-[#FFFFFF] font-black bg-[#10b981] px-[6px] py-[2px] rounded uppercase tracking-wider shadow-md">
                        {item.score} ★
                      </span>
                    </div>
                  </div>

                  {/* Details Below Card Image */}
                  <div className="flex items-start justify-between gap-[4px] min-w-0 px-[2px]">
                    <span className="text-xs md:text-sm font-bold text-[#FFFFFF] line-clamp-1 leading-tight flex-1">
                      {item.title}
                    </span>
                    {item.episodes && getTagBadge(item.episodes)}
                  </div>
                </Link>
              ),
            )}
        </div>
      </div>

      {/* Popular This Season Section */}
      <div className="flex flex-col gap-[12px] pt-[16px] border-t border-[#1c1c1c]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
            Popular This Season
          </h2>
          <a
            href="/"
            className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            View All
          </a>
        </div>
        <div className="flex md:grid md:grid-cols-5 lg:grid-cols-10 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none gap-[10px] md:gap-[16px] pb-[4px] md:pb-0">
          {popularSeason
            .slice(0, 10)
            .map(
              (item: {
                id: number;
                title?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                media?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                averageScore?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                genres?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                recommendations?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                description?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
              }) => (
                <Link
                  href={`/anime/${item.id}`}
                  key={item.id}
                  className="group flex flex-col gap-[8px] md:p-[8px] md:-m-[8px] rounded-[12px] hover:bg-[#242424] transition-colors cursor-pointer shrink-0 snap-start w-[28vw] sm:w-[22vw] md:w-auto"
                >
                  {/* Card Image Container */}
                  <div className="relative aspect-[2/3] rounded-[10px] border border-[#282828] bg-[#141414] overflow-hidden shadow-md">
                    {/* Poster Image */}
                    {item.posterImage ? (
                      <Image
                        unoptimized
                        fill
                        src={item.posterImage}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-[16px] text-center text-xs text-[#A3A3A3]">
                        {item.title}
                      </div>
                    )}

                    {/* Rating Badge (Top Left) */}
                    <div className="absolute top-[8px] left-[8px] pointer-events-none">
                      <span className="text-[9px] text-[#FFFFFF] font-black bg-[#10b981] px-[6px] py-[2px] rounded uppercase tracking-wider shadow-md">
                        {item.score} ★
                      </span>
                    </div>
                  </div>

                  {/* Details Below Card Image */}
                  <div className="flex items-start justify-between gap-[4px] min-w-0 px-[2px]">
                    <span className="text-xs md:text-sm font-bold text-[#FFFFFF] line-clamp-1 leading-tight flex-1">
                      {item.title}
                    </span>
                    {item.episodes && getTagBadge(item.episodes)}
                  </div>
                </Link>
              ),
            )}
        </div>
      </div>

      {/* All Time Popular Section */}
      <div className="flex flex-col gap-[12px] pt-[16px] border-t border-[#1c1c1c]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
            All Time Popular
          </h2>
          <a
            href="/"
            className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            View All
          </a>
        </div>
        <div className="flex md:grid md:grid-cols-5 lg:grid-cols-10 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none gap-[10px] md:gap-[16px] pb-[4px] md:pb-0">
          {popularAllTime
            .slice(0, 10)
            .map(
              (item: {
                id: number;
                title?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                media?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                averageScore?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                genres?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                recommendations?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                description?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
              }) => (
                <Link
                  href={`/anime/${item.id}`}
                  key={item.id}
                  className="group flex flex-col gap-[8px] md:p-[8px] md:-m-[8px] rounded-[12px] hover:bg-[#242424] transition-colors cursor-pointer shrink-0 snap-start w-[28vw] sm:w-[22vw] md:w-auto"
                >
                  {/* Card Image Container */}
                  <div className="relative aspect-[2/3] rounded-[10px] border border-[#282828] bg-[#141414] overflow-hidden shadow-md">
                    {/* Poster Image */}
                    {item.posterImage ? (
                      <Image
                        unoptimized
                        fill
                        src={item.posterImage}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-[16px] text-center text-xs text-[#A3A3A3]">
                        {item.title}
                      </div>
                    )}

                    {/* Rating Badge (Top Left) */}
                    <div className="absolute top-[8px] left-[8px] pointer-events-none">
                      <span className="text-[9px] text-[#FFFFFF] font-black bg-[#10b981] px-[6px] py-[2px] rounded uppercase tracking-wider shadow-md">
                        {item.score} ★
                      </span>
                    </div>
                  </div>

                  {/* Details Below Card Image */}
                  <div className="flex items-start justify-between gap-[4px] min-w-0 px-[2px]">
                    <span className="text-xs md:text-sm font-bold text-[#FFFFFF] line-clamp-1 leading-tight flex-1">
                      {item.title}
                    </span>
                    {item.episodes && getTagBadge(item.episodes)}
                  </div>
                </Link>
              ),
            )}
        </div>
      </div>

      {/* Just Finished & Top Movies Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] pt-[16px] border-t border-[#1c1c1c] w-full">
        {/* Left Column: Just Finished */}
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
              Just Finished
            </h2>
            <a
              href="/"
              className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              View All
            </a>
          </div>
          <div className="flex flex-col gap-[12px]">
            {finishedMovies.finished.map(
              (item: {
                id: number;
                title?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                media?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                averageScore?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                genres?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                recommendations?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                description?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
              }) => (
                <Link
                  href={`/anime/${item.id}`}
                  key={item.id}
                  className="group isolate relative overflow-hidden flex items-center gap-[16px] p-[12px] rounded-[8px] hover:bg-[#242424]/40 transition-colors cursor-pointer border border-transparent hover:border-[#282828]"
                >
                  {/* Background image & gradient overlay */}
                  {item.bannerImage && (
                    <div
                      className="absolute inset-0 bg-cover bg-right transition-all duration-500 z-0 pointer-events-none grayscale group-hover:grayscale-0 opacity-20 group-hover:opacity-40"
                      style={{
                        backgroundImage: `url(${item.bannerImage})`,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to right, rgba(20, 20, 20, 1) 0%, rgba(20, 20, 20, 0.4) 40%, transparent 100%)",
                        }}
                      />
                    </div>
                  )}

                  {/* Thumbnail Poster */}
                  <div className="relative aspect-[2/3] w-[48px] rounded-[6px] border border-[#282828] bg-[#141414] overflow-hidden shrink-0 shadow-md z-10">
                    {item.posterImage ? (
                      <Image
                        unoptimized
                        fill
                        src={item.posterImage}
                        alt={item.title}
                        className="w-full h-full object-cover transform-gpu will-change-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-[#A3A3A3] p-[2px]">
                        {item.title}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-[2px] min-w-0 flex-1 z-10 relative">
                    <span className="text-sm font-bold text-[#FFFFFF] line-clamp-1 leading-snug group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-[6px] text-xs text-[#A3A3A3] mt-[4px]">
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-[6px] py-[2px] rounded text-[9px] shrink-0">
                        {item.score} ★
                      </span>
                      {getTagBadge(item.episodes)}
                      {getTagBadge(item.tagline)}
                    </div>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>

        {/* Right Column: Top Movies */}
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
              Top Movies
            </h2>
            <a
              href="/"
              className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              View All
            </a>
          </div>
          <div className="flex flex-col gap-[12px]">
            {finishedMovies.movies.map(
              (item: {
                id: number;
                title?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                media?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                averageScore?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                genres?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                recommendations?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                description?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
              }) => (
                <Link
                  href={`/anime/${item.id}`}
                  key={item.id}
                  className="group isolate relative overflow-hidden flex items-center gap-[16px] p-[12px] rounded-[8px] hover:bg-[#242424]/40 transition-colors cursor-pointer border border-transparent hover:border-[#282828]"
                >
                  {/* Background image & gradient overlay */}
                  {item.bannerImage && (
                    <div
                      className="absolute inset-0 bg-cover bg-right transition-all duration-500 z-0 pointer-events-none grayscale group-hover:grayscale-0 opacity-20 group-hover:opacity-40"
                      style={{
                        backgroundImage: `url(${item.bannerImage})`,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to right, rgba(20, 20, 20, 1) 0%, rgba(20, 20, 20, 0.4) 40%, transparent 100%)",
                        }}
                      />
                    </div>
                  )}

                  {/* Thumbnail Poster */}
                  <div className="relative aspect-[2/3] w-[48px] rounded-[6px] border border-[#282828] bg-[#141414] overflow-hidden shrink-0 shadow-md z-10">
                    {item.posterImage ? (
                      <Image
                        unoptimized
                        fill
                        src={item.posterImage}
                        alt={item.title}
                        className="w-full h-full object-cover transform-gpu will-change-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-[#A3A3A3] p-[2px]">
                        {item.title}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-[2px] min-w-0 flex-1 z-10 relative">
                    <span className="text-sm font-bold text-[#FFFFFF] line-clamp-1 leading-snug group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-[6px] text-xs text-[#A3A3A3] mt-[4px]">
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-[6px] py-[2px] rounded text-[9px] shrink-0">
                        {item.score} ★
                      </span>
                      {getTagBadge(item.episodes)}
                      {getTagBadge(item.tagline)}
                    </div>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <ScheduleSection />
    </main>
  );
}

// Subcomponent to encapsulate schedule state cleanly
function ScheduleSection() {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: scheduleData = [], isLoading } = useQuery({
    queryKey: ["anime-schedule"],
    queryFn: async () => {
      const res = await fetch("/api/anime/schedule");
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json();
    },
  });

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  }, []);

  useEffect(() => {
    checkScroll();
  }, [checkScroll]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  // Generate 14 days and bucket scheduleData
  const days = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    date.setHours(0, 0, 0, 0); // start of day

    const startOfDay = Math.floor(date.getTime() / 1000);
    const endOfDay = startOfDay + 86400;

    const isToday = index === 0;
    const isTomorrow = index === 1;
    let label = date.toLocaleDateString("en-US", { weekday: "short" });
    if (isToday) label = "Today";
    if (isTomorrow) label = "Tomorrow";
    const dayNum = date.toLocaleDateString("en-US", { day: "numeric" });
    const monthName = date.toLocaleDateString("en-US", { month: "short" });

    const releases = scheduleData.filter(
      (item: {
        id: number;
        title?:
          | Record<string, unknown>
          | string
          | number
          | boolean
          | null
          | undefined
          | unknown[]
          | unknown;
        media?:
          | Record<string, unknown>
          | string
          | number
          | boolean
          | null
          | undefined
          | unknown[]
          | unknown;
        averageScore?:
          | Record<string, unknown>
          | string
          | number
          | boolean
          | null
          | undefined
          | unknown[]
          | unknown;
        genres?:
          | Record<string, unknown>
          | string
          | number
          | boolean
          | null
          | undefined
          | unknown[]
          | unknown;
        recommendations?:
          | Record<string, unknown>
          | string
          | number
          | boolean
          | null
          | undefined
          | unknown[]
          | unknown;
        description?:
          | Record<string, unknown>
          | string
          | number
          | boolean
          | null
          | undefined
          | unknown[]
          | unknown;
      }) => item.airingAt >= startOfDay && item.airingAt < endOfDay,
    );
    const hasData = releases.length > 0;

    return { index, label, dayNum, monthName, hasData, releases };
  });

  // Ensure active day defaults to a day with data if today has none
  const activeDay = days.find((d) => d.index === activeDayIndex) || days[0];
  const activeReleases = activeDay.releases;

  return (
    <div className="flex flex-col gap-16px mt-16px">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Schedule
        </h2>
      </div>

      {/* Day Tabs Container - horizontally scrollable for 14 items */}
      <div className="flex flex-nowrap overflow-x-auto gap-8px md:gap-12px pb-8px scrollbar-none w-full">
        {isLoading
          ? Array.from({ length: 14 }, (_, i) => `skel-hero-${i}`).map((id) => (
              <div
                key={id}
                className="flex flex-col items-center justify-center min-w-[64px] md:min-w-[72px] h-[46px] rounded-lg bg-surface animate-pulse border border-border-line shrink-0"
              />
            ))
          : days.map((day) => {
              const isActive = activeDayIndex === day.index;
              const isDisabled = !day.hasData;
              return (
                <button
                  type="button"
                  key={day.index}
                  onClick={() => !isDisabled && setActiveDayIndex(day.index)}
                  disabled={isDisabled}
                  title={isDisabled ? "No releases for this day" : ""}
                  className={`flex flex-col items-center justify-center min-w-[64px] md:min-w-[72px] py-8px rounded-lg border transition-all shrink-0 ${
                    isDisabled
                      ? "opacity-40 cursor-not-allowed bg-surface/30 border-transparent text-text-muted"
                      : isActive
                        ? "bg-text-primary border-text-primary text-pure cursor-pointer"
                        : "bg-surface/60 border-border-line hover:border-text-secondary/50 hover:bg-control/40 text-text-secondary hover:text-text-primary cursor-pointer"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-text-muted" : ""}`}
                  >
                    {day.label}
                  </span>
                  <span className="text-lg md:text-xl font-extrabold tracking-tight leading-none mt-[2px]">
                    {day.dayNum}
                  </span>
                </button>
              );
            })}
      </div>

      {/* Carousel of anime for the selected day */}
      <div className="relative group/carousel w-full mt-4px">
        {/* Left Arrow */}
        {!isLoading && activeReleases.length > 0 && (
          <button
            type="button"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`absolute left-[8px] md:left-12px top-1/2 -translate-y-1/2 z-20 p-8px bg-surface/90 backdrop-blur-md border border-border-line rounded-full text-text-primary transition-all shadow-xl ${
              !canScrollLeft
                ? "opacity-30 cursor-not-allowed"
                : "cursor-pointer hover:bg-control hover:scale-110"
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-[20px] h-[20px]" />
          </button>
        )}

        {/* Right Arrow */}
        {!isLoading && activeReleases.length > 0 && (
          <button
            type="button"
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`absolute right-[8px] md:right-12px top-1/2 -translate-y-1/2 z-20 p-8px bg-surface/90 backdrop-blur-md border border-border-line rounded-full text-text-primary transition-all shadow-xl ${
              !canScrollRight
                ? "opacity-30 cursor-not-allowed"
                : "cursor-pointer hover:bg-control hover:scale-110"
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-[20px] h-[20px]" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory scroll-smooth gap-16px w-full scrollbar-none py-8px"
        >
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 6 }, (_, i) => `skel-cont-${i}`).map((id) => (
              <div
                key={id}
                className="flex flex-col gap-8px p-8px -m-8px shrink-0 w-[120px] md:w-[160px]"
              >
                <div className="aspect-[2/3] rounded-md bg-surface animate-pulse border border-border-line shadow-md" />
                <div className="h-[14px] w-3/4 bg-surface animate-pulse rounded-sm mt-[4px]" />
              </div>
            ))
          ) : activeReleases.length === 0 ? (
            <div className="w-full text-center py-[40px] text-text-secondary text-sm">
              No anime scheduled for this day.
            </div>
          ) : (
            activeReleases.map(
              (item: {
                id: number;
                title?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                media?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                averageScore?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                genres?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                recommendations?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
                description?:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown;
              }) => {
                const releaseDate = new Date(item.airingAt * 1000);
                const timeString = releaseDate.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <Link
                    href={`/anime/${item.id}`}
                    key={item.scheduleId || item.id}
                    className="group flex flex-col gap-8px p-8px -m-8px rounded-lg hover:bg-control transition-colors cursor-pointer shrink-0 w-[120px] md:w-[160px] snap-start animate-fade-in"
                  >
                    {/* Card Image Container */}
                    <div className="relative aspect-[2/3] rounded-md border border-border-line bg-surface overflow-hidden shadow-md">
                      {/* Poster Image */}
                      {item.posterImage ? (
                        <Image
                          unoptimized
                          fill
                          src={item.posterImage}
                          alt={item.title}
                          className="w-full h-full object-cover transform-gpu will-change-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-16px text-center text-xs text-text-secondary">
                          {item.title}
                        </div>
                      )}

                      {/* Time Badge (Top Right) */}
                      <div className="absolute top-[8px] right-[8px] pointer-events-none">
                        <span className="text-[9px] text-pure font-black bg-text-primary/90 backdrop-blur-sm px-[6px] py-[2px] rounded shadow-md uppercase tracking-wider">
                          {timeString}
                        </span>
                      </div>
                    </div>

                    {/* Details Below Card Image */}
                    <div className="flex items-start justify-between gap-[4px] min-w-0 px-[2px]">
                      <span className="text-xs md:text-sm font-bold text-text-primary line-clamp-1 leading-tight flex-1">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-text-secondary font-bold tracking-wider uppercase shrink-0 mt-[1px]">
                        {item.episodes ? `EP ${item.episodes}` : "EP 1"}
                      </span>
                    </div>
                  </Link>
                );
              },
            )
          )}
        </div>
      </div>
    </div>
  );
}
