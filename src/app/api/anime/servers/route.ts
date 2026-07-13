import { NextResponse } from "next/server";
import { fetchAnimeEpisodes, formatProviderName } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const animeId = searchParams.get("id");
  const episodeNumber = searchParams.get("episode");

  if (!animeId || !episodeNumber) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
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

    const softsubList = (episode.providers || [])
      .filter(
        (p: { provider: string; category: string }) => p.category === "softsub",
      )
      .map((p: { provider: string; category: string }) => ({
        serverName: formatProviderName(p.provider),
        serverId: p.provider,
      }));

    const subList = (episode.providers || [])
      .filter(
        (p: { provider: string; category: string }) => p.category === "sub",
      )
      .map((p: { provider: string; category: string }) => ({
        serverName: formatProviderName(p.provider),
        serverId: p.provider,
      }));

    const dubList = (episode.providers || [])
      .filter(
        (p: { provider: string; category: string }) => p.category === "dub",
      )
      .map((p: { provider: string; category: string }) => ({
        serverName: formatProviderName(p.provider),
        serverId: p.provider,
      }));

    return NextResponse.json({
      softsub: softsubList,
      sub: subList,
      dub: dubList,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
