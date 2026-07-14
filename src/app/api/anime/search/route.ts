import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim() === "") {
      return NextResponse.json([]);
    }

    const graphqlQuery = `
      query ($search: String) {
        Page(page: 1, perPage: 5) {
          media(search: $search, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
            id
            title {
              english
              romaji
            }
            coverImage {
              large
            }
            averageScore
            format
            episodes
            startDate {
              year
            }
          }
        }
      }
    `;

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { search: query },
      }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error("AniList API Error:", json.errors);
      return NextResponse.json([]);
    }

    const mappedData = json.data.Page.media.map(
      (item: {
        id: string | number;
        title?: { english?: string; romaji?: string };
        coverImage?: { large?: string };
        averageScore?: number;
        format?: string;
        episodes?: number;
        startDate?: { year?: number };
      }) => ({
        id: item.id,
        title: item.title?.english || item.title?.romaji,
        posterImage: item.coverImage?.large,
        score: item.averageScore ? (item.averageScore / 10).toFixed(1) : "N/A",
        format: item.format,
        episodes: item.episodes,
        year: item.startDate?.year,
      }),
    );

    return NextResponse.json(mappedData, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch search results" },
      { status: 500 },
    );
  }
}
