import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SCRAPER_URL = (
  process.env.NEXT_PUBLIC_SCRAPER_API_URL || "http://localhost:4000"
).replace(/\/v1$/, "");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const animeId = searchParams.get("id");
  const episodeNumber = searchParams.get("episode");
  const server = searchParams.get("server")?.toLowerCase() || undefined; // Provider ID (e.g. 'solaris', 'lunar')
  const category = (searchParams.get("category") || "sub").toLowerCase(); // 'sub' or 'dub'

  if (!animeId || !episodeNumber) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const { fetchAnimeEpisodes } = await import("@/lib/scraper");
    const episodesRes = await fetchAnimeEpisodes(animeId);
    const episode = episodesRes.data.find(
      (ep: {
        number: number;
        id: string;
        title: string;
        providers:
          | Record<string, unknown>
          | string
          | number
          | boolean
          | null
          | undefined
          | unknown[]
          | unknown[];
      }) => ep.number.toString() === episodeNumber,
    );

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    // Determine the list of providers to try
    let providersToTry:
      | Record<string, unknown>
      | string
      | number
      | boolean
      | null
      | undefined
      | unknown[]
      | unknown[] = [];
    if (server && server !== "auto") {
      providersToTry = [{ provider: server, category }];
    } else {
      providersToTry = episode.providers || [];
      // Prioritize the matching category, then prioritize 'lynx' as the default server
      providersToTry.sort(
        (
          a:
            | Record<string, unknown>
            | string
            | number
            | boolean
            | null
            | undefined
            | unknown[]
            | unknown,
          b:
            | Record<string, unknown>
            | string
            | number
            | boolean
            | null
            | undefined
            | unknown[]
            | unknown,
        ) => {
          if (a.category === category && b.category !== category) return -1;
          if (a.category !== category && b.category === category) return 1;

          if (a.provider === "lynx" && b.provider !== "lynx") return -1;
          if (a.provider !== "lynx" && b.provider === "lynx") return 1;

          return 0;
        },
      );
    }

    let lastError:
      | Record<string, unknown>
      | string
      | number
      | boolean
      | null
      | undefined
      | unknown[]
      | unknown = null;
    let data:
      | Record<string, unknown>
      | string
      | number
      | boolean
      | null
      | undefined
      | unknown[]
      | unknown = null;

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
            data = temp;

            // If watching dub and no subtitles are present, attempt to fetch subtitles from the sub source
            if (
              audioType === "dub" &&
              (!data.subtitles || data.subtitles.length === 0)
            ) {
              const subWatchUrl = `${SCRAPER_URL}/api/watch/${activeServer}/${animeId}/sub/${episodeNumber}`;
              try {
                const subRes = await fetch(subWatchUrl, { cache: "no-store" });
                if (subRes.ok) {
                  const subTemp = await subRes.json();
                  if (subTemp?.subtitles && subTemp.subtitles.length > 0) {
                    data.subtitles = subTemp.subtitles;
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
        lastError = err;
        console.warn(
          `[Next.js Stream API] Provider ${activeServer} threw error: ${err.message}`,
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
    const sources = (data.streams || []).map(
      (
        s:
          | Record<string, unknown>
          | string
          | number
          | boolean
          | null
          | undefined
          | unknown[]
          | unknown,
      ) => {
        const url = s.url || s.file;
        return {
          url,
          type: s.type || "hls",
          isM3U8: s.type === "hls" || (url || "").includes(".m3u8"),
        };
      },
    );

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
              (
                r:
                  | Record<string, unknown>
                  | string
                  | number
                  | boolean
                  | null
                  | undefined
                  | unknown[]
                  | unknown,
              ) => ({
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
      sources,
      subtitles: data.subtitles || [],
      skipTimes,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message, stack: error.stack },
      { status: 500 },
    );
  }
}
