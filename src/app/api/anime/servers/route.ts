import { NextResponse } from 'next/server';
import { fetchAnimeEpisodes, formatProviderName } from '@/lib/scraper';

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const animeId = searchParams.get('id');
  const episodeNumber = searchParams.get('episode');

  if (!animeId || !episodeNumber) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const episodesRes = await fetchAnimeEpisodes(animeId);
    const episode = episodesRes.data.find(
      (ep: any) => ep.number.toString() === episodeNumber
    );

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    const softsubList = (episode.providers || [])
      .filter((p: any) => p.category === 'softsub')
      .map((p: any) => ({
        serverName: formatProviderName(p.provider),
        serverId: p.provider
      }));

    const subList = (episode.providers || [])
      .filter((p: any) => p.category === 'sub')
      .map((p: any) => ({
        serverName: formatProviderName(p.provider),
        serverId: p.provider
      }));

    const dubList = (episode.providers || [])
      .filter((p: any) => p.category === 'dub')
      .map((p: any) => ({
        serverName: formatProviderName(p.provider),
        serverId: p.provider
      }));

    return NextResponse.json({
      softsub: softsubList,
      sub: subList,
      dub: dubList
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
