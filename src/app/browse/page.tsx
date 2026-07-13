"use client";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnimeItem {
  id: number;
  title: string;
  posterImage: string | null;
  score: string;
  format: string | null;
  episodes: string;
  status: string;
  genres: string[];
  tagline: string | null;
  year: number | null;
}

interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

interface BrowseResult {
  results: AnimeItem[];
  pageInfo: PageInfo;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];
const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];
const STATUSES = [
  "RELEASING",
  "FINISHED",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
];

const STATUS_LABELS: Record<string, string> = {
  RELEASING: "Airing",
  FINISHED: "Finished",
  NOT_YET_RELEASED: "Not Yet Aired",
  CANCELLED: "Cancelled",
  HIATUS: "On Hiatus",
};

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - 1989 },
  (_, i) => CURRENT_YEAR + 1 - i,
);

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> =
  {
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
    ADVENTURE: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/20",
    },
    MYSTERY: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/20",
    },
  };

function getTagBadge(tag: string) {
  if (!tag) return null;
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
}

// ─── Dropdown Component ───────────────────────────────────────────────────────

interface DropdownProps {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (val: string | null) => void;
  icon?: React.ReactNode;
}

function Dropdown({ label, value, options, onChange, icon }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 200);
    }
    setOpen((p) => !p);
    setSearch("");
  };

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative flex flex-col gap-[6px] w-[160px]">
      <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-wider text-text-secondary uppercase select-none">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`flex items-center bg-[#141414] border rounded-[8px] h-[40px] pl-[12px] gap-[4px] w-full ${value ? "border-white/30" : "border-border-line"}`}
      >
        <button
          type="button"
          onClick={toggle}
          className="flex-1 flex items-center gap-[8px] pr-[12px] cursor-pointer min-w-0"
        >
          <span
            className={`text-sm font-bold truncate ${value ? "text-white" : "text-text-secondary"}`}
          >
            {value
              ? (options.find((o) => o.value === value)?.label ?? value)
              : `Any ${label}`}
          </span>
          <ChevronDown
            className={`w-[12px] h-[12px] text-text-secondary shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="px-[10px] h-full flex items-center text-text-secondary hover:text-white transition-colors shrink-0 border-l border-[#282828] cursor-pointer"
            title={`Clear ${label}`}
          >
            <X className="w-[12px] h-[12px]" />
          </button>
        )}
      </div>
      {open && (
        <div
          className={`absolute left-0 bg-[#121212] border border-[#282828] rounded-[8px] p-[4px] flex flex-col gap-[2px] shadow-2xl z-50 min-w-[160px] max-h-[240px] overflow-hidden ${openUp ? "bottom-[66px]" : "top-[66px]"}`}
        >
          {/* Search box */}
          <div className="px-[6px] pt-[2px] pb-[6px] border-b border-[#282828]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Filter ${label}...`}
              className="w-full bg-[#1c1c1c] border border-border-line rounded-[4px] h-[28px] px-[8px] text-xs text-white placeholder-text-secondary focus:outline-none focus:border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex-1 flex flex-col gap-[2px] overflow-y-auto scrollbar-dark max-h-[190px] pr-[8px]">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                setSearch("");
              }}
              className={`px-[10px] py-[8px] text-sm text-left rounded-[6px] font-bold cursor-pointer hover:bg-white hover:text-black transition-colors ${!value ? "bg-[#242424] text-white" : "text-text-secondary"}`}
            >
              Any {label}
            </button>
            {filteredOptions.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setSearch("");
                }}
                className={`px-[10px] py-[8px] text-sm text-left rounded-[6px] font-bold cursor-pointer hover:bg-white hover:text-black transition-colors ${value === opt.value ? "bg-[#242424] text-white" : "text-text-secondary"}`}
              >
                {opt.label}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <span className="text-[11px] text-text-secondary text-center py-[8px]">
                No options
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Multi-Select Genres Dropdown ────────────────────────────────────────────

interface GenresDropdownProps {
  genres: string[];
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
}

function GenresDropdown({
  genres,
  selectedGenres,
  onChange,
}: GenresDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 280);
    }
    setOpen((p) => !p);
    setSearch("");
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onChange([...selectedGenres, genre]);
    }
  };

  const filteredGenres = genres.filter((g) =>
    g.toLowerCase().includes(search.toLowerCase()),
  );

  const hasSelection = selectedGenres.length > 0;
  const displayLabel = hasSelection
    ? selectedGenres.length === 1
      ? selectedGenres[0]
      : `${selectedGenres[0]} +${selectedGenres.length - 1}`
    : "Any Genre";

  return (
    <div ref={ref} className="relative flex flex-col gap-[6px] w-[160px]">
      <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-wider text-text-secondary uppercase select-none">
        <span>Genres</span>
      </div>
      <div
        className={`flex items-center bg-[#141414] border rounded-[8px] h-[40px] pl-[12px] gap-[4px] w-full ${hasSelection ? "border-white/30" : "border-border-line"}`}
      >
        <button
          type="button"
          onClick={toggle}
          className="flex-1 flex items-center gap-[8px] pr-[12px] cursor-pointer hover:bg-transparent min-w-0"
        >
          <span
            className={`text-sm font-bold truncate ${hasSelection ? "text-white" : "text-text-secondary"}`}
          >
            {displayLabel}
          </span>
          <ChevronDown
            className={`w-[12px] h-[12px] text-text-secondary shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {hasSelection && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            className="px-[10px] h-full flex items-center text-text-secondary hover:text-white transition-colors shrink-0 border-l border-[#282828] cursor-pointer"
            title="Clear all genres"
          >
            <X className="w-[12px] h-[12px]" />
          </button>
        )}
      </div>
      {open && (
        <div
          className={`absolute left-0 bg-[#121212] border border-[#282828] rounded-[8px] p-[4px] flex flex-col gap-[2px] shadow-2xl z-50 w-[220px] max-h-[280px] overflow-hidden ${openUp ? "bottom-[66px]" : "top-[66px]"}`}
        >
          {/* Search box */}
          <div className="px-[6px] pt-[2px] pb-[6px] border-b border-[#282828]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter genres..."
              className="w-full bg-[#1c1c1c] border border-border-line rounded-[4px] h-[28px] px-[8px] text-xs text-white placeholder-text-secondary focus:outline-none focus:border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex-1 flex flex-col gap-[2px] overflow-y-auto scrollbar-dark max-h-[230px] pr-[8px]">
            {filteredGenres.map((genre) => {
              const selected = selectedGenres.includes(genre);
              return (
                <button
                  type="button"
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-[10px] py-[8px] text-sm text-left rounded-[6px] font-bold cursor-pointer transition-colors ${selected ? "bg-white text-black" : "text-text-secondary hover:bg-white hover:text-black"}`}
                >
                  {genre}
                </button>
              );
            })}
            {filteredGenres.length === 0 && (
              <span className="text-[11px] text-text-secondary text-center py-[8px]">
                No genres found
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TagsDropdownProps {
  tags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

function TagsDropdown({ tags, selectedTags, onChange }: TagsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 280);
    }
    setOpen((p) => !p);
    setSearch("");
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const filteredTags = tags.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase()),
  );

  const hasSelection = selectedTags.length > 0;
  const displayLabel = hasSelection
    ? selectedTags.length === 1
      ? selectedTags[0]
      : `${selectedTags[0]} +${selectedTags.length - 1}`
    : "Any Tag";

  return (
    <div ref={ref} className="relative flex flex-col gap-[6px] w-[160px]">
      <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-wider text-text-secondary uppercase select-none">
        <span>Tags</span>
      </div>
      <div
        className={`flex items-center bg-[#141414] border rounded-[8px] h-[40px] pl-[12px] gap-[4px] w-full ${hasSelection ? "border-white/30" : "border-border-line"}`}
      >
        <button
          type="button"
          onClick={toggle}
          className="flex-1 flex items-center gap-[8px] pr-[12px] cursor-pointer hover:bg-transparent min-w-0"
        >
          <span
            className={`text-sm font-bold truncate ${hasSelection ? "text-white" : "text-text-secondary"}`}
          >
            {displayLabel}
          </span>
          <ChevronDown
            className={`w-[12px] h-[12px] text-text-secondary shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {hasSelection && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            className="px-[10px] h-full flex items-center text-text-secondary hover:text-white transition-colors shrink-0 border-l border-[#282828] cursor-pointer"
            title="Clear all tags"
          >
            <X className="w-[12px] h-[12px]" />
          </button>
        )}
      </div>
      {open && (
        <div
          className={`absolute left-0 bg-[#121212] border border-[#282828] rounded-[8px] p-[4px] flex flex-col gap-[2px] shadow-2xl z-50 w-[220px] max-h-[280px] overflow-hidden ${openUp ? "bottom-[66px]" : "top-[66px]"}`}
        >
          {/* Search box */}
          <div className="px-[6px] pt-[2px] pb-[6px] border-b border-[#282828]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tags..."
              className="w-full bg-[#1c1c1c] border border-border-line rounded-[4px] h-[28px] px-[8px] text-xs text-white placeholder-text-secondary focus:outline-none focus:border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex-1 flex flex-col gap-[2px] overflow-y-auto scrollbar-dark max-h-[230px] pr-[8px]">
            {filteredTags.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-[10px] py-[8px] text-sm text-left rounded-[6px] font-bold cursor-pointer transition-colors ${selected ? "bg-white text-black" : "text-text-secondary hover:bg-white hover:text-black"}`}
                >
                  {tag}
                </button>
              );
            })}
            {filteredTags.length === 0 && (
              <span className="text-[11px] text-text-secondary text-center py-[8px]">
                No tags found
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Anime Card ───────────────────────────────────────────────────────────────

function AnimeCard({ item }: { item: AnimeItem }) {
  return (
    <Link
      href={`/anime/${item.id}`}
      className="group flex flex-col gap-[8px] p-[8px] -m-[8px] rounded-[12px] hover:bg-[#242424] transition-colors cursor-pointer"
    >
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
          <div className="w-full h-full flex items-center justify-center p-[16px] text-center text-xs text-text-secondary">
            {item.title}
          </div>
        )}
        <div className="absolute top-[8px] left-[8px] pointer-events-none">
          <span className="text-[9px] text-white font-black bg-[#10b981] px-[6px] py-[2px] rounded uppercase tracking-wider shadow-md">
            {item.score} ★
          </span>
        </div>
      </div>
      <div className="flex items-start justify-between gap-[4px] min-w-0 px-[2px]">
        <span className="text-xs md:text-sm font-bold text-white line-clamp-1 leading-tight flex-1">
          {item.title}
        </span>
        {item.episodes && getTagBadge(item.episodes)}
      </div>
    </Link>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-[8px] p-[8px] -m-[8px]">
      <div className="aspect-[2/3] rounded-[10px] bg-surface border border-border-line animate-pulse" />
      <div className="px-[2px] flex flex-col gap-[4px]">
        <div className="h-[14px] w-full bg-surface rounded animate-pulse" />
        <div className="h-[14px] w-1/3 bg-surface rounded animate-pulse" />
      </div>
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  title,
  items,
  isLoading,
}: {
  title: string;
  items: AnimeItem[];
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#525252]">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-[6px] md:gap-[16px] w-full">
        {isLoading
          ? Array.from({ length: 20 }, (_, i) => `skel-${i}`).map((id) => (
              <SkeletonCard key={id} />
            ))
          : items
              .slice(0, 20)
              .map((item) => <AnimeCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const hasActiveFilters =
    !!debouncedQuery ||
    selectedGenres.length > 0 ||
    selectedTags.length > 0 ||
    !!selectedYear ||
    !!selectedSeason ||
    !!selectedFormat ||
    !!selectedStatus;

  const clearAllFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedGenres([]);
    setSelectedTags([]);
    setSelectedYear(null);
    setSelectedSeason(null);
    setSelectedFormat(null);
    setSelectedStatus(null);
    setCurrentPage(1);
  };

  // ─── API: Genres ─────────────────────────────────────────────────────────
  const { data: genreList = [] } = useQuery<string[]>({
    queryKey: ["anime-genres"],
    queryFn: async () => {
      const res = await fetch("/api/anime/genres");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 86400 * 1000,
  });

  // ─── API: Tags ───────────────────────────────────────────────────────────
  const { data: tagList = [] } = useQuery<string[]>({
    queryKey: ["anime-tags"],
    queryFn: async () => {
      const res = await fetch("/api/anime/tags");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 86400 * 1000,
  });

  // ─── API: Filter/Search results ──────────────────────────────────────────
  const browseParams = new URLSearchParams();
  if (debouncedQuery) browseParams.set("q", debouncedQuery);
  selectedGenres.forEach((g) => {
    browseParams.append("genres", g);
  });
  selectedTags.forEach((t) => {
    browseParams.append("tags", t);
  });
  if (selectedYear) browseParams.set("year", selectedYear);
  if (selectedSeason) browseParams.set("season", selectedSeason);
  if (selectedFormat) browseParams.set("format", selectedFormat);
  if (selectedStatus) browseParams.set("status", selectedStatus);
  browseParams.set("page", String(currentPage));

  const { data: browseData, isLoading: isBrowseLoading } =
    useQuery<BrowseResult>({
      queryKey: [
        "browse",
        debouncedQuery,
        selectedGenres,
        selectedTags,
        selectedYear,
        selectedSeason,
        selectedFormat,
        selectedStatus,
        currentPage,
      ],
      queryFn: async () => {
        const res = await fetch(`/api/anime/browse?${browseParams.toString()}`);
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
      enabled: hasActiveFilters,
    });

  // ─── API: Category feeds (shown when no filters active) ──────────────────

  const { data: trending = [], isLoading: isLoadingTrending } = useQuery<
    AnimeItem[]
  >({
    queryKey: ["trendingAnime"],
    queryFn: async () => {
      const res = await fetch("/api/anime/trending");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !hasActiveFilters,
  });

  const { data: popularSeason = [], isLoading: isLoadingPopular } = useQuery<
    AnimeItem[]
  >({
    queryKey: ["popularSeasonAnime"],
    queryFn: async () => {
      const res = await fetch("/api/anime/popular-season");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !hasActiveFilters,
  });

  const { data: popularAllTime = [], isLoading: isLoadingAllTime } = useQuery<
    AnimeItem[]
  >({
    queryKey: ["popularAllTimeAnime"],
    queryFn: async () => {
      const res = await fetch("/api/anime/popular-alltime");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !hasActiveFilters,
  });

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="flex-1 flex flex-col gap-[24px] px-[24px] pb-[32px]">
      {/* ── Search Bar ── */}
      <div className="relative w-full">
        <Search className="absolute left-[16px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anime titles..."
          className="w-full bg-[#141414] border border-border-line rounded-[12px] h-[52px] pl-[48px] pr-[48px] text-white text-base font-medium placeholder:text-text-secondary focus:outline-none focus:border-white/30 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-[16px] top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-[16px] h-[16px]" />
          </button>
        )}
      </div>

      {/* ── Filter Row ── */}
      <div className="flex flex-wrap items-end gap-[16px]">
        <GenresDropdown
          genres={genreList}
          selectedGenres={selectedGenres}
          onChange={setSelectedGenres}
        />
        <TagsDropdown
          tags={tagList}
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
        <Dropdown
          label="Year"
          value={selectedYear}
          options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
          onChange={setSelectedYear}
        />
        <Dropdown
          label="Season"
          value={selectedSeason}
          options={SEASONS.map((s) => ({
            value: s,
            label: s.charAt(0) + s.slice(1).toLowerCase(),
          }))}
          onChange={setSelectedSeason}
        />
        <Dropdown
          label="Format"
          value={selectedFormat}
          options={FORMATS.map((f) => ({
            value: f,
            label: FORMAT_LABELS[f] || f,
          }))}
          onChange={setSelectedFormat}
        />
        <Dropdown
          label="Status"
          value={selectedStatus}
          options={STATUSES.map((s) => ({
            value: s,
            label: STATUS_LABELS[s] || s,
          }))}
          onChange={setSelectedStatus}
        />
        {hasActiveFilters && (
          <div className="flex flex-col gap-[6px]">
            <div className="h-[16px]" />
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-[6px] h-[40px] px-[14px] rounded-[8px] border border-rose-500/30 bg-rose-500/10 text-rose-400 text-sm font-bold cursor-pointer hover:bg-rose-500/20 transition-colors"
            >
              <X className="w-[12px] h-[12px]" />
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ── Results or Category Sections ── */}
      {hasActiveFilters ? (
        <div className="flex flex-col gap-[20px]">
          {/* Result count */}
          {!isBrowseLoading && browseData && (
            <div className="flex items-center gap-[8px]">
              <span className="text-xs font-bold uppercase tracking-widest text-[#525252]">
                Results
              </span>
              <span className="text-xs font-bold text-white bg-[#242424] border border-[#282828] px-[8px] py-[2px] rounded-full">
                {browseData.results?.length ?? 0}
              </span>
            </div>
          )}

          {/* Grid of results */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-[6px] md:gap-[16px] w-full">
            {isBrowseLoading ? (
              Array.from({ length: 100 }, (_, i) => `skel-full-${i}`).map(
                (id) => <SkeletonCard key={id} />,
              )
            ) : browseData?.results?.length === 0 ? (
              <div className="col-span-10 flex flex-col items-center justify-center py-[80px] gap-[12px]">
                <span className="text-4xl select-none">(◕︵◕)</span>
                <span className="text-text-secondary text-sm font-bold">
                  No results found
                </span>
                <span className="text-text-secondary text-xs">
                  Try adjusting your filters
                </span>
              </div>
            ) : (
              browseData?.results?.map((item) => (
                <AnimeCard key={item.id} item={item} />
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {!isBrowseLoading &&
            browseData?.pageInfo &&
            browseData.pageInfo.lastPage > 1 && (
              <div className="flex items-center justify-center gap-[8px] mt-[32px]">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] border border-border-line bg-[#141414] text-white hover:bg-control disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-[16px] h-[16px]" />
                </button>
                <span className="text-xs font-bold text-text-secondary select-none px-[12px] bg-[#141414] border border-border-line h-[36px] flex items-center rounded-[8px]">
                  Page {currentPage} of {browseData.pageInfo.lastPage}
                </span>
                <button
                  type="button"
                  disabled={!browseData.pageInfo.hasNextPage}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] border border-border-line bg-[#141414] text-white hover:bg-control disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-[16px] h-[16px]" />
                </button>
              </div>
            )}
        </div>
      ) : (
        /* ── Default Category Sections ── */
        <div className="flex flex-col gap-[32px]">
          <CategorySection
            title="Trending Now"
            items={trending}
            isLoading={isLoadingTrending}
          />
          <CategorySection
            title="Popular This Season"
            items={popularSeason}
            isLoading={isLoadingPopular}
          />
          <CategorySection
            title="All Time Popular"
            items={popularAllTime}
            isLoading={isLoadingAllTime}
          />
        </div>
      )}
    </main>
  );
}
