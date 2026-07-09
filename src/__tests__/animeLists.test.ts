import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAndCacheMappings,
  getMappingById,
  normalizeSourceKey,
  resolveIds,
} from "../lib/animeLists";

vi.mock("node:fs/promises", () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

describe("Anime Lists Mapping Helper", () => {
  const mockData = [
    {
      anidb_id: 14107,
      anilist_id: 101922,
      kitsu_id: 41410,
      mal_id: 38000,
      type: "TV",
      "anime-planet_id": "demon-slayer-kimetsu-no-yaiba",
    },
    {
      anidb_id: 14790,
      anilist_id: 108465,
      kitsu_id: 42274,
      mal_id: 39547,
      type: "TV",
      "anime-planet_id": "jujutsu-kaisen",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("normalizeSourceKey", () => {
    it("should correctly format standard sources", () => {
      expect(normalizeSourceKey("anilist")).toBe("anilist_id");
      expect(normalizeSourceKey("mal")).toBe("mal_id");
      expect(normalizeSourceKey("kitsu")).toBe("kitsu_id");
    });

    it("should handle custom naming exceptions", () => {
      expect(normalizeSourceKey("anime-planet")).toBe("anime-planet_id");
      expect(normalizeSourceKey("notify.moe")).toBe("notify.moe_id");
    });
  });

  describe("fetchAndCacheMappings", () => {
    it("should fetch from CDN when cache does not exist", async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error("File not found"));

      const data = await fetchAndCacheMappings(true);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      expect(data).toEqual(mockData);
    });

    it("should read from cache file if it exists and is fresh", async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        mtimeMs: Date.now(),
      } as unknown as import("node:fs").Stats);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData));

      const data = await fetchAndCacheMappings();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(data).toEqual(mockData);
    });
  });

  describe("getMappingById / resolveIds", () => {
    beforeEach(() => {
      vi.mocked(fs.stat).mockResolvedValue({
        mtimeMs: Date.now(),
      } as unknown as import("node:fs").Stats);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData));
    });

    it("should resolve mapping by AniList ID", async () => {
      const result = await getMappingById("anilist", 101922);
      expect(result).not.toBeNull();
      expect(result?.mal_id).toBe(38000);
      expect(result?.["anime-planet_id"]).toBe("demon-slayer-kimetsu-no-yaiba");
    });

    it("should resolve mapping by MyAnimeList ID", async () => {
      const result = await resolveIds("mal", 39547);
      expect(result).not.toBeNull();
      expect(result?.anilist_id).toBe(108465);
      expect(result?.["anime-planet_id"]).toBe("jujutsu-kaisen");
    });

    it("should return null if no matching ID is found", async () => {
      const result = await getMappingById("anilist", 999999);
      expect(result).toBeNull();
    });
  });
});
