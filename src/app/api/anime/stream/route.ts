import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

const SCRAPER_URL = (process.env.NEXT_PUBLIC_SCRAPER_API_URL || 'http://localhost:4000').replace(/\/v1$/, '');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const animeId = searchParams.get('id');
  const episodeNumber = searchParams.get('episode');
  let server = searchParams.get('server')?.toLowerCase() || undefined; // Provider ID (e.g. 'solaris', 'lunar')
  const category = (searchParams.get('category') || 'sub').toLowerCase(); // 'sub' or 'dub'

  if (!animeId || !episodeNumber) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const { fetchAnimeEpisodes } = await import('@/lib/scraper');
    const episodesRes = await fetchAnimeEpisodes(animeId);
    const episode = episodesRes.data.find(
      (ep: any) => ep.number.toString() === episodeNumber
    );

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    // Determine the list of providers to try
    let providersToTry: any[] = [];
    if (server && server !== 'auto') {
      providersToTry = [{ provider: server, category }];
    } else {
      providersToTry = episode.providers || [];
      // Prioritize the matching category, then prioritize 'lynx' as the default server
      providersToTry.sort((a: any, b: any) => {
        if (a.category === category && b.category !== category) return -1;
        if (a.category !== category && b.category === category) return 1;
        
        if (a.provider === 'lynx' && b.provider !== 'lynx') return -1;
        if (a.provider !== 'lynx' && b.provider === 'lynx') return 1;
        
        return 0;
      });
    }

    let lastError: any = null;
    let data: any = null;

    for (const provInfo of providersToTry) {
      const activeServer = provInfo.provider;
      // softsub is a frontend label — the underlying provider API uses 'sub' audio
      const audioType = (provInfo.category === 'softsub' || category === 'softsub') ? 'sub' : category;
      const watchUrl = `${SCRAPER_URL}/api/watch/${activeServer}/${animeId}/${audioType}/${episodeNumber}`;
      console.log(`[Next.js Stream API] Fetching: ${watchUrl}`);
      try {
        const res = await fetch(watchUrl, { cache: 'no-store' });
        if (res.ok) {
          const temp = await res.json();
          if (temp && temp.streams && temp.streams.length > 0) {
            data = temp;
            break; // Success! Valid streams found.
          } else {
            lastError = new Error(`Provider ${activeServer} succeeded but returned no streams`);
            console.warn(`[Next.js Stream API] ${lastError.message}`);
          }
        } else {
          const errText = await res.text().catch(() => '');
          lastError = new Error(`Scraper microservice returned ${res.status}: ${errText || res.statusText}`);
          console.warn(`[Next.js Stream API] Provider ${activeServer} failed: ${lastError.message}`);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Next.js Stream API] Provider ${activeServer} threw error: ${err.message}`);
      }
    }

    if (!data) {
      throw lastError || new Error("No working provider found for this episode.");
    }

    // Map response streams to what the watch page expects:
    // Watch page expects: { sources: [ { url, type, isM3U8 } ], subtitles: [] }
    const sources = (data.streams || []).map((s: any) => {
      const url = s.url || s.file;
      return {
        url,
        type: s.type || 'hls',
        isM3U8: s.type === 'hls' || (url || '').includes('.m3u8')
      };
    });

    // ----------------------------------------------------
    // AniSkip Integration
    // ----------------------------------------------------
    let skipTimes = [];
    try {
      const { getMappingById } = await import('@/lib/animeLists');
      const mapping = await getMappingById('anilist', animeId);
      const malId = mapping?.mal_id;
      
      if (malId) {
        const skipUrl = `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?types[]=op&types[]=ed&episodeLength=0`;
        const skipRes = await fetch(skipUrl, { cache: 'force-cache' });
        if (skipRes.ok) {
          const skipData = await skipRes.json();
          if (skipData.found && Array.isArray(skipData.results)) {
            skipTimes = skipData.results.map((r: any) => ({
              type: r.skipType, // 'op' | 'ed'
              startTime: r.interval.startTime,
              endTime: r.interval.endTime
            }));
          }
        }
      }
    } catch (err) {
      console.warn(`[Next.js Stream API] AniSkip fetch failed for animeId ${animeId}:`, err);
    }
    // ----------------------------------------------------

    return NextResponse.json({
      sources,
      subtitles: data.subtitles || [],
      skipTimes
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
