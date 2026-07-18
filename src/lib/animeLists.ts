import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface AnimeMapping {
  livechart_id?: number;
  thetvdb_id?: number;
  "anime-planet_id"?: string;
  anisearch_id?: number;
  kitsu_id?: number;
  mal_id?: number;
  type?: string;
  "notify.moe_id"?: string;
  anilist_id?: number;
  anidb_id?: number;
  [key: string]: string | number | undefined;
}

export type MappingSource =
  | "anilist"
  | "mal"
  | "kitsu"
  | "anidb"
  | "livechart"
  | "thetvdb"
  | "themoviedb"
  | "anime-planet"
  | "anisearch"
  | "notify.moe";

const DATA_URL =
  "https://cdn.jsdelivr.net/gh/Fribb/anime-lists@master/anime-list-mini.json";
const BUNDLED_FILE = path.join(process.cwd(), "src/lib/anime-list-mini.json");
const CACHE_DIR = path.join(os.tmpdir(), "hiroku-cache");
const CACHE_FILE = path.join(CACHE_DIR, "anime-list-mini.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for the loaded mappings to avoid reading from disk on every call
let cachedMappingsInMemory: AnimeMapping[] | null = null;

/**
 * Normalizes a source name to its key in the Fribb's anime list mapping object.
 */
export function normalizeSourceKey(source: MappingSource): string {
  switch (source) {
    case "anime-planet":
      return "anime-planet_id";
    case "notify.moe":
      return "notify.moe_id";
    default:
      return `${source}_id`;
  }
}

/**
 * Fetches the Fribb anime-lists mappings from CDN and saves to the local cache.
 */
export async function fetchAndCacheMappings(
  force = false,
): Promise<AnimeMapping[]> {
  // If we already have it in memory, and we're not forcing, return it
  if (cachedMappingsInMemory && !force) {
    return cachedMappingsInMemory;
  }

  // 1. Try reading from the bundled file first (generated at build time)
  if (!force) {
    try {
      const bundledData = await fs.readFile(BUNDLED_FILE, "utf-8");
      const parsed = JSON.parse(bundledData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedMappingsInMemory = parsed;
        return parsed;
      }
    } catch (_error) {
      // Bundled file not found or invalid, proceed to temp cache/CDN
    }
  }

  // 2. Check if local temp cache file is fresh
  try {
    const stats = await fs.stat(CACHE_FILE);
    const now = Date.now();
    if (!force && now - stats.mtimeMs < CACHE_TTL_MS) {
      const cachedData = await fs.readFile(CACHE_FILE, "utf-8");
      cachedMappingsInMemory = JSON.parse(cachedData);
      if (cachedMappingsInMemory) {
        return cachedMappingsInMemory;
      }
    }
  } catch (_error) {
    // Cache file doesn't exist or is invalid, proceed to fetch
  }

  // Ensure cache directory exists
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.warn("Could not create cache directory:", err);
  }

  // Fetch from CDN
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Fribb anime list mapping: ${response.statusText}`,
    );
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid mapping data received: expected an array.");
  }

  // Save to disk
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(data), "utf-8");
  } catch (err) {
    console.error("Failed to save anime-list cache to disk:", err);
  }
  cachedMappingsInMemory = data;

  return data;
}

/**
 * Returns all anime mappings, fetching/caching them if not already available.
 */
export async function getAnimeMappings(): Promise<AnimeMapping[]> {
  return fetchAndCacheMappings();
}

/**
 * Searches the mapping dataset for an entry with the matching source ID.
 */
export async function getMappingById(
  source: MappingSource,
  id: number | string,
): Promise<AnimeMapping | null> {
  const mappings = await getAnimeMappings();
  const targetKey = normalizeSourceKey(source);
  const targetId = typeof id === "number" ? id : Number.parseInt(id, 10) || id;

  const match = mappings.find((item) => item[targetKey] === targetId);
  return match || null;
}

/**
 * Resolves all mapping IDs for a given source ID.
 */
export async function resolveIds(
  source: MappingSource,
  id: number | string,
): Promise<AnimeMapping | null> {
  return getMappingById(source, id);
}
