import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCachedTMDBDetails } from "../lib/tmdbCache";

vi.mock("node:fs/promises", () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

describe("TMDB Details Cache Helper", () => {
  const mockCacheContent = {
    "12345": {
      backdrop_path: "/backdrop.jpg",
      poster_path: "/poster.jpg",
      title: "Test Anime Title",
      overview: "An amazing test anime.",
      episodes: []
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TMDB_API_KEY = "test_key";
    // Default fetch stub
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        backdrop_path: "/backdrop_new.jpg",
        poster_path: "/poster_new.jpg",
        title: "Fetched Title",
        name: "Fetched Title",
        overview: "Fetched overview details",
      }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return cached details if present in the cache file", async () => {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCacheContent));

    const details = await getCachedTMDBDetails(12345, null, "Test Anime Title");

    expect(details).not.toBeNull();
    expect(details?.title).toBe("Test Anime Title");
    expect(details?.backdrop_path).toBe("/backdrop.jpg");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should fetch details from API and save to cache if not present", async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

    const details = await getCachedTMDBDetails(99999, { themoviedb_id: 1111 }, "Fetched Title");

    expect(details).not.toBeNull();
    expect(details?.title).toBe("Fetched Title");
    expect(global.fetch).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
  });
});
