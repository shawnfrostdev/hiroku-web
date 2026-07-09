import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const genres = searchParams.getAll("genres");
    const tags = searchParams.getAll("tags");
    const year = searchParams.get("year");
    const season = searchParams.get("season");
    const format = searchParams.get("format");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);

    const variables: Record<string, any> = {
      page,
      perPage: 100,
      type: "ANIME",
    };

    if (query) variables.search = query;
    if (genres && genres.length > 0) variables.genre_in = genres;
    if (tags && tags.length > 0) variables.tag_in = tags;
    if (year) variables.seasonYear = parseInt(year, 10);
    if (season) variables.season = season.toUpperCase();
    if (format) variables.format = format;
    if (status) variables.status = status;

    const graphqlQuery = `
      query (
        $page: Int,
        $perPage: Int,
        $search: String,
        $type: MediaType,
        $genre_in: [String],
        $tag_in: [String],
        $seasonYear: Int,
        $season: MediaSeason,
        $format: MediaFormat,
        $status: MediaStatus
      ) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(
            search: $search,
            type: $type,
            genre_in: $genre_in,
            genre_not_in: ["Hentai"],
            tag_in: $tag_in,
            seasonYear: $seasonYear,
            season: $season,
            format: $format,
            status: $status,
            sort: [POPULARITY_DESC, SCORE_DESC]
          ) {
            id
            title {
              english
              romaji
            }
            coverImage {
              extraLarge
              large
            }
            bannerImage
            averageScore
            format
            episodes
            status
            genres
            season
            seasonYear
            startDate {
              year
            }
            nextAiringEpisode {
              episode
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
      body: JSON.stringify({ query: graphqlQuery, variables }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error("AniList API Error:", json.errors);
      return NextResponse.json({ results: [], pageInfo: {} });
    }

    const pageInfo = json.data.Page.pageInfo;
    const media = json.data.Page.media || [];

    const results = media.map((item: any) => {
      let availableEpisodes = item.episodes;
      if (item.status === "RELEASING" && item.nextAiringEpisode) {
        availableEpisodes = item.nextAiringEpisode.episode - 1;
      }

      const episodesStr =
        item.format === "MOVIE"
          ? "MOVIE"
          : availableEpisodes && availableEpisodes > 0
          ? `${availableEpisodes}EP`
          : item.format
          ? item.format.replace("_", " ")
          : "Anime";

      return {
        id: item.id,
        title: item.title.english || item.title.romaji,
        posterImage: item.coverImage?.extraLarge || item.coverImage?.large || null,
        bannerImage: item.bannerImage || null,
        score: item.averageScore ? (item.averageScore / 10).toFixed(1) : "N/A",
        format: item.format || null,
        episodes: episodesStr,
        status: item.status,
        genres: item.genres || [],
        tagline: item.genres && item.genres.length > 0 ? item.genres[0] : null,
        year: item.startDate?.year || item.seasonYear || null,
        season: item.season || null,
      };
    });

    return NextResponse.json(
      { results, pageInfo },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Browse API Error:", error);
    return NextResponse.json({ error: "Failed to fetch browse results" }, { status: 500 });
  }
}
