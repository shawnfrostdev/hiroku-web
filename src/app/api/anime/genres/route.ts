import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const graphqlQuery = `
      query {
        GenreCollection
      }
    `;

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error("AniList API Error:", json.errors);
      return NextResponse.json([]);
    }

    const rawGenres: string[] = json.data?.GenreCollection || [];
    const genres = rawGenres.filter((genre) => genre !== "Hentai");

    return NextResponse.json(genres, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Genres API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch genres" },
      { status: 500 },
    );
  }
}
