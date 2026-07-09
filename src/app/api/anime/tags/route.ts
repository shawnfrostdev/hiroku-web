import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const graphqlQuery = `
      query {
        MediaTagCollection {
          name
          isAdult
          category
        }
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

    const allTags = json.data?.MediaTagCollection || [];
    // Allow general 18+ content tags but filter out explicit Sexual Content and Hentai tags
    const tags = allTags
      .filter((tag: any) => tag.category !== "Sexual Content" && tag.name !== "Hentai")
      .map((tag: any) => tag.name);

    // Sort alphabetically
    tags.sort();

    return NextResponse.json(tags, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Tags API Error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
