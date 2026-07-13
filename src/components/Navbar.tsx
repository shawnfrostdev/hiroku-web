"use client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Menu, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

export function Navbar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchBtnRef = useRef<HTMLButtonElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["anime-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const res = await fetch(
        `/api/anime/search?q=${encodeURIComponent(debouncedQuery)}`,
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length > 0,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node) &&
        mobileSearchBtnRef.current &&
        !mobileSearchBtnRef.current.contains(event.target as Node)
      ) {
        setShowMobileSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allLinks = [
    { label: "Home", href: "/" },
    { label: "Browse", href: "/browse" },
    { label: "Bookmarks", href: "/bookmarks" },
    { label: "Profile", href: "/profile" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <div className="relative z-50">
      {/* Main Navbar Row */}
      <nav className="mx-[12px] mt-[12px] md:m-[24px] bg-[#141414] border border-[#282828] rounded-[12px] h-[56px] md:h-[64px] px-[12px] md:px-[16px] flex items-center justify-between gap-[12px] md:gap-[32px]">
        {/* Left: Logo */}
        <Link
          href="/"
          className="text-xl font-logo text-[#FFFFFF] hover:opacity-80 transition-opacity lowercase shrink-0"
        >
          hiroku
        </Link>

        {/* Desktop Center: Search bar */}
        <div className="hidden md:flex flex-1 min-w-[120px]" ref={dropdownRef}>
          <div className="relative w-full">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-[#525252]" />
            <input
              type="text"
              placeholder="Search anime..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="w-full h-[32px] bg-[#242424] border border-[#282828] rounded-[8px] pl-[36px] pr-[36px] text-sm text-[#FFFFFF] placeholder-[#525252] focus-visible:outline-none focus-visible:border-[#FFFFFF] transition-colors"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#FFFFFF] transition-colors"
                aria-label="Clear search"
              >
                <X className="h-[14px] w-[14px]" />
              </button>
            )}

            {/* Desktop Search Dropdown */}
            {isFocused && query.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-[8px] bg-[#141414] border border-[#282828] rounded-[12px] shadow-2xl overflow-hidden z-50">
                {isSearching ? (
                  <div className="flex items-center justify-center p-[8px] text-[#A3A3A3] py-[32px]">
                    <Loader2 className="w-[20px] h-[20px] animate-spin" />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="flex flex-col p-[8px] gap-[4px]">
                    {searchResults.map(
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
                          onClick={() => setIsFocused(false)}
                          className="flex items-start gap-[12px] p-[8px] rounded-[8px] hover:bg-[#242424] transition-colors"
                        >
                          <div className="relative aspect-[2/3] w-[40px] rounded-[6px] bg-[#141414] overflow-hidden shrink-0 border border-[#282828]">
                            {item.posterImage && (
                              <Image
                                unoptimized
                                fill
                                src={item.posterImage}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 pt-[2px]">
                            <span className="text-base font-bold text-[#FFFFFF] truncate leading-tight">
                              {item.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-[6px] mt-[4px]">
                              {item.year && (
                                <span className="text-[#A3A3A3] font-bold bg-[#242424] border border-[#282828] px-[6px] py-[2px] rounded text-[9px] shrink-0 whitespace-nowrap">
                                  {item.year}
                                </span>
                              )}
                              {item.format && (
                                <span className="text-[#A3A3A3] font-bold bg-[#242424] border border-[#282828] px-[6px] py-[2px] rounded text-[9px] shrink-0 whitespace-nowrap uppercase">
                                  {item.format}
                                </span>
                              )}
                              {item.episodes && (
                                <span className="text-[#A3A3A3] font-bold bg-[#242424] border border-[#282828] px-[6px] py-[2px] rounded text-[9px] shrink-0 whitespace-nowrap">
                                  {item.episodes} EPS
                                </span>
                              )}
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-[6px] py-[2px] rounded text-[9px] shrink-0 whitespace-nowrap">
                                {item.score} ★
                              </span>
                            </div>
                          </div>
                        </Link>
                      ),
                    )}
                    {searchResults.length === 5 && (
                      <Link
                        href={`/search?q=${encodeURIComponent(query)}`}
                        onClick={() => setIsFocused(false)}
                        className="mt-[4px] w-full text-center text-xs font-bold text-[#FFFFFF] bg-[#242424] hover:bg-[#282828] py-[10px] rounded-[8px] transition-colors border border-[#282828]"
                      >
                        View all results
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="p-[16px] text-center text-sm text-[#A3A3A3]">
                    No results found for "{query}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Right: Nav links + Discord */}
        <div className="hidden md:flex items-center gap-[32px] shrink-0">
          <div className="flex items-center gap-[32px]">
            {[
              { label: "Profile", href: "/profile" },
              { label: "Settings", href: "/settings" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? "text-[#FFFFFF]"
                    : "text-[#A3A3A3] hover:text-[#FFFFFF]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Button variant="primary" size="sm" asChild>
            <Link href="/discord" className="whitespace-nowrap">
              Discord
            </Link>
          </Button>
        </div>

        {/* Mobile Right: Search icon + Discord icon + Hamburger */}
        <div className="flex md:hidden items-center gap-[8px]">
          {/* Search icon */}
          <button
            type="button"
            ref={mobileSearchBtnRef}
            onClick={() => {
              setShowMobileSearch((prev) => !prev);
              setShowMobileMenu(false);
            }}
            className="h-[36px] w-[36px] flex items-center justify-center rounded-[8px] bg-[#242424] border border-[#282828] text-[#A3A3A3] hover:text-white transition-colors"
            aria-label="Search"
          >
            {showMobileSearch ? (
              <X className="w-[16px] h-[16px]" />
            ) : (
              <Search className="w-[16px] h-[16px]" />
            )}
          </button>

          {/* Discord icon button */}
          <Link
            href="/discord"
            className="h-[36px] w-[36px] flex items-center justify-center rounded-[8px] bg-[#FFFFFF] text-[#000000] hover:opacity-80 transition-opacity"
            aria-label="Discord"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[18px] h-[18px]"
            >
              <title>Discord</title>
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
          </Link>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => {
              setShowMobileMenu((prev) => !prev);
              setShowMobileSearch(false);
            }}
            className="h-[36px] w-[36px] flex items-center justify-center rounded-[8px] bg-[#242424] border border-[#282828] text-[#A3A3A3] hover:text-white transition-colors"
            aria-label="Menu"
          >
            {showMobileMenu ? (
              <X className="w-[16px] h-[16px]" />
            ) : (
              <Menu className="w-[16px] h-[16px]" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Search Bar (below navbar) */}
      {showMobileSearch && (
        <div ref={mobileSearchRef} className="md:hidden mx-[12px] mt-[8px]">
          <div className="relative w-full">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-[#525252]" />
            <input
              type="text"
              placeholder="Search anime..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="w-full h-[40px] bg-[#141414] border border-[#282828] rounded-[10px] pl-[36px] pr-[36px] text-sm text-[#FFFFFF] placeholder-[#525252] focus-visible:outline-none focus-visible:border-[#FFFFFF] transition-colors"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#FFFFFF] transition-colors"
              >
                <X className="h-[14px] w-[14px]" />
              </button>
            )}
            {/* Mobile Search Dropdown */}
            {query.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-[8px] bg-[#141414] border border-[#282828] rounded-[12px] shadow-2xl overflow-hidden z-50">
                {isSearching ? (
                  <div className="flex items-center justify-center py-[32px]">
                    <Loader2 className="w-[20px] h-[20px] animate-spin text-[#A3A3A3]" />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="flex flex-col p-[8px] gap-[4px]">
                    {searchResults.map(
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
                          onClick={() => {
                            setIsFocused(false);
                            setShowMobileSearch(false);
                          }}
                          className="flex items-start gap-[12px] p-[8px] rounded-[8px] hover:bg-[#242424] transition-colors"
                        >
                          <div className="relative aspect-[2/3] w-[40px] rounded-[6px] bg-[#141414] overflow-hidden shrink-0 border border-[#282828]">
                            {item.posterImage && (
                              <Image
                                unoptimized
                                fill
                                src={item.posterImage}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 pt-[2px]">
                            <span className="text-base font-bold text-[#FFFFFF] truncate leading-tight">
                              {item.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-[6px] mt-[4px]">
                              {item.year && (
                                <span className="text-[#A3A3A3] font-bold bg-[#242424] border border-[#282828] px-[6px] py-[2px] rounded text-[9px]">
                                  {item.year}
                                </span>
                              )}
                              {item.format && (
                                <span className="text-[#A3A3A3] font-bold bg-[#242424] border border-[#282828] px-[6px] py-[2px] rounded text-[9px] uppercase">
                                  {item.format}
                                </span>
                              )}
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-[6px] py-[2px] rounded text-[9px]">
                                {item.score} ★
                              </span>
                            </div>
                          </div>
                        </Link>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="p-[16px] text-center text-sm text-[#A3A3A3]">
                    No results for "{query}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="md:hidden mx-[12px] mt-[8px] bg-[#141414] border border-[#282828] rounded-[12px] overflow-hidden shadow-2xl">
          <div className="flex flex-col p-[8px] gap-[2px]">
            {allLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`px-[12px] py-[12px] rounded-[8px] text-sm font-bold transition-colors ${
                    isActive
                      ? "text-[#FFFFFF] bg-[#242424]"
                      : "text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#242424]/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
