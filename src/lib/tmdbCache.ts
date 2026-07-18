import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface TMDBDetails {
  backdrop_path: string | null;
  poster_path: string | null;
  title: string | null;
  overview: string | null;
  episodes?: Record<string, unknown>[];
}

const CACHE_DIR = path.join(os.tmpdir(), "hiroku-cache");
const CACHE_FILE = path.join(CACHE_DIR, "tmdb-details-cache.json");

let inMemoryCache: Record<number, TMDBDetails | null> | null = null;
let isCacheLoaded = false;
let loadPromise: Promise<void> | null = null;

async function loadCache() {
  if (isCacheLoaded) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const data = await fs.readFile(CACHE_FILE, "utf-8");
        inMemoryCache = JSON.parse(data);
      } catch {
        inMemoryCache = {};
      }
      isCacheLoaded = true;
    })();
  }
  return loadPromise;
}

let savePromise: Promise<void> | null = null;
let pendingSave = false;

async function saveCacheDebounced() {
  if (savePromise) {
    pendingSave = true;
    return;
  }

  savePromise = (async () => {
    if (!inMemoryCache) return;
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(
        CACHE_FILE,
        JSON.stringify(inMemoryCache, null, 2),
        "utf-8",
      );
    } catch (err) {
      console.error("Failed to save TMDB cache to disk:", err);
    }
  })().finally(() => {
    savePromise = null;
    if (pendingSave) {
      pendingSave = false;
      saveCacheDebounced();
    }
  });

  return savePromise;
}

function parseSeasonFromTitle(title: string): number | null {
  const normalized = title.toLowerCase();
  if (/\b(2nd season|season 2|part 2|season ii|\bs2\b)/.test(normalized))
    return 2;
  if (/\b(3rd season|season 3|part 3|season iii|\bs3\b)/.test(normalized))
    return 3;
  if (/\b(4th season|season 4|part 4|season iv|\bs4\b)/.test(normalized))
    return 4;
  if (/\b(5th season|season 5|part 5|season v|\bs5\b)/.test(normalized))
    return 5;
  return null;
}

/**
 * Fetches TMDB details directly from TMDB API with robust matching.
 */
async function fetchTMDBDetailsDirectly(
  // biome-ignore lint/suspicious/noExplicitAny: allow AnimeMapping | null
  mapping: any,
  title: string,
): Promise<TMDBDetails | null> {
  const apiKey =
    process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const apiBaseUrl =
    process.env.TMDB_API_BASE_URL || "https://api.themoviedb.org";

  if (!apiKey) return null;

  try {
    let tmdbId: number | null = null;
    let isMovie = false;
    let seasonNumber: number | null = null;

    if (mapping) {
      if (mapping.themoviedb_id) {
        if (typeof mapping.themoviedb_id === "object") {
          if (mapping.themoviedb_id.tv) {
            tmdbId = mapping.themoviedb_id.tv;
            isMovie = false;
          } else if (mapping.themoviedb_id.movie) {
            const movieVal = mapping.themoviedb_id.movie;
            tmdbId = Array.isArray(movieVal) ? movieVal[0] : movieVal;
            isMovie = true;
          }
        } else if (typeof mapping.themoviedb_id === "number") {
          tmdbId = mapping.themoviedb_id;
          isMovie = mapping.type === "movie";
        }
      }

      if (mapping.season !== undefined && mapping.season !== null) {
        if (typeof mapping.season === "object") {
          seasonNumber = mapping.season.tmdb ?? mapping.season.tvdb ?? null;
        } else {
          seasonNumber = Number.parseInt(mapping.season, 10) || null;
        }
      }
    }

    if (seasonNumber === null) {
      seasonNumber = parseSeasonFromTitle(title);
    }

    // Fallback to TVDB ID lookup
    if (!tmdbId && mapping?.thetvdb_id) {
      const findUrl = `${apiBaseUrl}/3/find/${mapping.thetvdb_id}?api_key=${apiKey}&external_source=tvdb_id`;
      const res = await fetch(findUrl);
      if (res.ok) {
        const data = await res.json();
        const result = data.tv_results?.[0] || data.movie_results?.[0];
        if (result) {
          tmdbId = result.id;
          isMovie = !data.tv_results?.[0];
        }
      }
    }

    // Fallback to Search by title
    if (!tmdbId) {
      let searchUrl = `${apiBaseUrl}/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
      let res = await fetch(searchUrl);
      let data = res.ok ? await res.json() : null;
      let result = data?.results?.[0];

      if (!result) {
        // Strip season tags and search for the base anime name
        const cleanTitle = title
          .replace(
            /\b(2nd season|3rd season|4th season|5th season|season \d+|part \d+|arc|ii|iii|iv|v)\b/gi,
            "",
          )
          .replace(/\s+/g, " ")
          .trim();
        if (cleanTitle && cleanTitle !== title) {
          searchUrl = `${apiBaseUrl}/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(cleanTitle)}`;
          res = await fetch(searchUrl);
          data = res.ok ? await res.json() : null;
          result = data?.results?.[0];
        }
      }

      if (result) {
        tmdbId = result.id;
        isMovie = result.media_type === "movie";
      }
    }

    if (!tmdbId) return null;

    if (isMovie) {
      const movieUrl = `${apiBaseUrl}/3/movie/${tmdbId}?api_key=${apiKey}`;
      const res = await fetch(movieUrl);
      if (res.ok) {
        const details = await res.json();
        return {
          backdrop_path: details.backdrop_path || null,
          poster_path: details.poster_path || null,
          title: details.title || null,
          overview: details.overview || null,
          episodes: [
            {
              episode_number: 1,
              name: details.title,
              overview: details.overview,
              still_path: details.backdrop_path || details.poster_path,
              runtime: details.runtime,
            },
          ],
        };
      }
    } else {
      const tvUrl = `${apiBaseUrl}/3/tv/${tmdbId}?api_key=${apiKey}`;
      const tvRes = await fetch(tvUrl);
      let tvDetails: {
        name?: string;
        overview?: string;
        backdrop_path?: string;
        poster_path?: string;
      } | null = null;
      if (tvRes.ok) {
        tvDetails = await tvRes.json();
      }

      let seasonDetails: {
        overview?: string;
        poster_path?: string;
        episodes?: {
          episode_number: number;
          still_path?: string;
          runtime?: number;
          air_date?: string;
          name?: string;
        }[];
      } | null = null;
      const targetSeason = seasonNumber !== null ? seasonNumber : 1;
      const seasonUrl = `${apiBaseUrl}/3/tv/${tmdbId}/season/${targetSeason}?api_key=${apiKey}`;
      const seasonRes = await fetch(seasonUrl);
      if (seasonRes.ok) {
        seasonDetails = await seasonRes.json();
      }

      return {
        backdrop_path:
          tvDetails?.backdrop_path || seasonDetails?.poster_path || null,
        poster_path:
          seasonDetails?.poster_path || tvDetails?.poster_path || null,
        title: tvDetails?.name || null,
        overview: seasonDetails?.overview || tvDetails?.overview || null,
        episodes: seasonDetails?.episodes || [],
      };
    }
  } catch (err) {
    console.error(`Error fetching from TMDB for title "${title}":`, err);
  }

  return null;
}

/**
 * Returns TMDB details from local filesystem cache, or fetches and caches them if not available.
 */
export async function getCachedTMDBDetails(
  anilistId: number,
  // biome-ignore lint/suspicious/noExplicitAny: allow AnimeMapping | null
  mapping: any,
  title: string,
): Promise<TMDBDetails | null> {
  await loadCache();

  if (inMemoryCache && anilistId in inMemoryCache) {
    return inMemoryCache[anilistId];
  }

  const details = await fetchTMDBDetailsDirectly(mapping, title);

  if (inMemoryCache) {
    inMemoryCache[anilistId] = details;
    saveCacheDebounced();
  }

  return details;
}
