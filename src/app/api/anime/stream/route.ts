import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SCRAPER_URL = (
  process.env.NEXT_PUBLIC_SCRAPER_API_URL || "http://localhost:4000"
).replace(/\/v1$/, "");

function normalizeSubtitles(
  rawData: { subtitles?: unknown[]; tracks?: unknown[] } | null | undefined,
): Array<{ file: string; label: string; kind: string }> {
  if (!rawData) return [];

  // Consumet and other extractors may return subtitles in `subtitles` or `tracks` array
  const rawList = Array.isArray(rawData.subtitles)
    ? rawData.subtitles
    : Array.isArray(rawData.tracks)
      ? rawData.tracks
      : [];

  const normalized: Array<{ file: string; label: string; kind: string }> = [];

  for (const item of rawList) {
    if (!item || typeof item !== "object") continue;

    // Handle properties based on varying provider structures
    const file =
      (item as { url?: string; file?: string }).url ||
      (item as { url?: string; file?: string }).file;
    const label =
      (item as { lang?: string; language?: string; label?: string }).label ||
      (item as { lang?: string; language?: string; label?: string }).lang ||
      (item as { lang?: string; language?: string; label?: string }).language ||
      "Unknown";
    const kind = (item as { kind?: string }).kind || "captions";

    // Filter out thumbnails, sprites, or invalid tracks
    if (kind.toLowerCase() === "thumbnails" || !file) continue;

    normalized.push({ file, label, kind });
  }

  return normalized;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const animeId = searchParams.get("id");
  const episodeNumber = searchParams.get("episode");
  const serverParam = searchParams.get("server")?.toLowerCase() || undefined;
  let server = serverParam;
  let subServerName: string | undefined;
  if (serverParam?.includes("-")) {
    const parts = serverParam.split("-");
    server = parts[0];
    subServerName = parts[1]; // e.g. "primary", "kiwi", "miruro"
  }
  const category = (searchParams.get("category") || "sub").toLowerCase(); // 'sub' or 'dub'

  if (!animeId || !episodeNumber) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const { fetchAnimeEpisodes } = await import("@/lib/scraper");
    const episodesRes = await fetchAnimeEpisodes(animeId);
    const episode = episodesRes.data.find(
      (ep: { number: number | string }) =>
        ep.number.toString() === episodeNumber,
    );

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    // Determine the list of providers to try
    let providersToTry: {
      provider?: string;
      category?: string;
      url?: string;
    }[] = [];
    if (server && server !== "auto") {
      providersToTry = [{ provider: server, category }];
    } else {
      providersToTry = episode.providers || [];
      // Prioritize the matching category, then prioritize 'lynx' as the default server
      providersToTry.sort(
        (
          a: { category?: string; provider?: string },
          b: { category?: string; provider?: string },
        ) => {
          if (a.category === category && b.category !== category) return -1;
          if (a.category !== category && b.category === category) return 1;

          if (a.provider === "lynx" && b.provider !== "lynx") return -1;
          if (a.provider !== "lynx" && b.provider === "lynx") return 1;

          return 0;
        },
      );
    }

    let lastError: Error | null = null;
    let data: Record<string, unknown> | null = null;

    for (const provInfo of providersToTry) {
      const activeServer = provInfo.provider;
      // softsub is a frontend label — the underlying provider API uses 'sub' audio
      const audioType =
        provInfo.category === "softsub" || category === "softsub"
          ? "sub"
          : category;
      const watchUrl = `${SCRAPER_URL}/api/watch/${activeServer}/${animeId}/${audioType}/${episodeNumber}`;
      console.log(`[Next.js Stream API] Fetching: ${watchUrl}`);
      try {
        const res = await fetch(watchUrl, { cache: "no-store" });
        if (res.ok) {
          const temp = await res.json();
          if (temp?.streams && temp.streams.length > 0) {
            // Assign to a local non-null variable to satisfy the type checker
            const resolved: Record<string, unknown> = temp;
            resolved.subtitles = normalizeSubtitles(resolved);
            data = resolved;

            // If watching dub and no subtitles are present, attempt to fetch subtitles from the sub source
            const currentSubs = resolved.subtitles as unknown[];
            if (audioType === "dub" && currentSubs.length === 0) {
              const subWatchUrl = `${SCRAPER_URL}/api/watch/${activeServer}/${animeId}/sub/${episodeNumber}`;
              try {
                const subRes = await fetch(subWatchUrl, { cache: "no-store" });
                if (subRes.ok) {
                  const subTemp = await subRes.json();
                  const subNorm = normalizeSubtitles(subTemp);
                  if (subNorm.length > 0) {
                    resolved.subtitles = subNorm;
                    console.log(
                      `[Next.js Stream API] Injected subtitles from sub source for ${activeServer}`,
                    );
                  }
                }
              } catch (_e) {
                console.warn(
                  `[Next.js Stream API] Failed to fetch subtitles from sub source for ${activeServer}`,
                );
              }
            }

            break; // Success! Valid streams found.
          } else {
            lastError = new Error(
              `Provider ${activeServer} succeeded but returned no streams`,
            );
            console.warn(`[Next.js Stream API] ${lastError.message}`);
          }
        } else {
          const errText = await res.text().catch(() => "");
          lastError = new Error(
            `Scraper microservice returned ${res.status}: ${errText || res.statusText}`,
          );
          console.warn(
            `[Next.js Stream API] Provider ${activeServer} failed: ${lastError.message}`,
          );
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[Next.js Stream API] Provider ${activeServer} threw error: ${(err as Error).message}`,
        );
      }
    }

    if (!data) {
      throw (
        lastError || new Error("No working provider found for this episode.")
      );
    }

    // Map response streams to what the watch page expects:
    // Watch page expects: { sources: [ { url, type, isM3U8 } ], subtitles: [] }
    const sources = (
      (data?.streams as Array<{
        url?: string;
        file?: string;
        type?: string;
        isM3U8?: boolean;
        server?: string;
      }>) || []
    ).map(
      (s: {
        url?: string;
        file?: string;
        type?: string;
        isM3U8?: boolean;
        server?: string;
      }) => {
        const url = s.url || s.file;
        return {
          url,
          type: s.type || "hls",
          isM3U8: s.type === "hls" || (url || "").includes(".m3u8"),
          server: s.server,
        };
      },
    );

    let filteredSources = sources;
    if (subServerName) {
      filteredSources = sources.filter((s) =>
        s.server?.toLowerCase().includes(subServerName?.toLowerCase()),
      );
      // Fallback to all sources if the filtered list is empty
      if (filteredSources.length === 0) {
        filteredSources = sources;
      }
    }

    // ----------------------------------------------------
    // AniSkip Integration
    // ----------------------------------------------------
    let skipTimes = [];
    try {
      const { getMappingById } = await import("@/lib/animeLists");
      const mapping = await getMappingById("anilist", animeId);
      const malId = mapping?.mal_id;

      if (malId) {
        const skipUrl = `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?types[]=op&types[]=ed&episodeLength=0`;
        const skipRes = await fetch(skipUrl, { cache: "force-cache" });
        if (skipRes.ok) {
          const skipData = await skipRes.json();
          if (skipData.found && Array.isArray(skipData.results)) {
            skipTimes = skipData.results.map(
              (r: {
                skipType: string;
                interval: { startTime: number; endTime: number };
              }) => ({
                type: r.skipType, // 'op' | 'ed'
                startTime: r.interval.startTime,
                endTime: r.interval.endTime,
              }),
            );
          }
        }
      }
    } catch (err) {
      console.warn(
        `[Next.js Stream API] AniSkip fetch failed for animeId ${animeId}:`,
        err,
      );
    }
    // ----------------------------------------------------

    return NextResponse.json({
      sources: filteredSources,
      subtitles: data.subtitles || [],
      skipTimes,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
