import { NextResponse } from "next/server";
import { getMappingById } from "@/lib/animeLists";
import { getCachedTMDBDetails } from "@/lib/tmdbCache";

export const dynamic = "force-dynamic";

interface AniListMediaDetail {
  id: number;
  title: {
    english: string | null;
    romaji: string;
  };
  description: string;
  averageScore: number | null;
  episodes: number | null;
  format?: string;
  bannerImage: string | null;
  genres: string[];
  status: string;
  season: string | null;
  seasonYear: number | null;
  studios: {
    edges: Array<{
      isMain: boolean;
      node: { name: string };
    }>;
  };
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  endDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  coverImage?: {
    extraLarge: string;
    large: string;
  };
  nextAiringEpisode?: {
    episode: number;
  } | null;
  recommendations?: {
    nodes: Array<{
      rating: number;
      mediaRecommendation: {
        id: number;
        title: { english: string | null; romaji: string };
        coverImage: { large: string; extraLarge: string };
        averageScore: number | null;
        format: string | null;
        episodes: number | null;
      } | null;
    }>;
  };
}

const fetchAniListDetail = async (
  id: number,
): Promise<AniListMediaDetail | null> => {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          english
          romaji
        }
        description
        averageScore
        episodes
        format
        bannerImage
        genres
        status
        season
        seasonYear
        studios {
          edges {
            isMain
            node {
              name
            }
          }
        }
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        coverImage {
          extraLarge
          large
        }
        nextAiringEpisode {
          episode
        }
        recommendations(sort: RATING_DESC, perPage: 10) {
          nodes {
            rating
            mediaRecommendation {
              id
              title { english romaji }
              coverImage { large extraLarge }
              averageScore
              format
              episodes
            }
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
      query,
      variables: { id },
    }),
  });

  const json = await response.json();
  if (json.errors) {
    console.error("AniList API Error for detail:", json.errors);
    return null;
  }
  return json.data.Media;
};

function cleanSynopsis(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 },
      );
    }

    const animeId = parseInt(idParam, 10);
    if (Number.isNaN(animeId)) {
      return NextResponse.json(
        { error: "Invalid id parameter" },
        { status: 400 },
      );
    }

    const item = await fetchAniListDetail(animeId);
    if (!item) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    const title = item.title.english || item.title.romaji;
    let mapping = null;
    try {
      mapping = await getMappingById("anilist", item.id);
    } catch (e) {
      console.error("Error loading mapping:", e);
    }

    const tmdbDetails = await getCachedTMDBDetails(item.id, mapping, title);

    const bannerImage = tmdbDetails?.backdrop_path
      ? `https://image.tmdb.org/t/p/original${tmdbDetails.backdrop_path}`
      : item.bannerImage;

    const posterImage = tmdbDetails?.poster_path
      ? `https://image.tmdb.org/t/p/original${tmdbDetails.poster_path}`
      : item.coverImage?.extraLarge || item.coverImage?.large || null;

    let availableEpisodes = item.episodes || 0;
    if (item.status === "RELEASING" && item.nextAiringEpisode) {
      availableEpisodes = item.nextAiringEpisode.episode - 1;
    }

    const tmdbEpisodesCount = tmdbDetails?.episodes?.length || 0;
    if (availableEpisodes === 0 && tmdbEpisodesCount > 0) {
      availableEpisodes = tmdbEpisodesCount;
    }

    const studioEdges = item.studios?.edges || [];
    const mainStudios = studioEdges
      // biome-ignore lint/suspicious/noExplicitAny: AniList API response
      .filter((e: any) => e.isMain)
      // biome-ignore lint/suspicious/noExplicitAny: AniList API response
      .map((e: any) => e.node.name);
    const producersList = studioEdges
      // biome-ignore lint/suspicious/noExplicitAny: AniList API response
      .filter((e: any) => !e.isMain)
      // biome-ignore lint/suspicious/noExplicitAny: AniList API response
      .map((e: any) => e.node.name);

    const studio = mainStudios.join(", ") || "Unknown Studio";
    const producers =
      producersList.slice(0, 10).join(", ") || "Unknown Producer";

    const formatAniListDate = (
      dateObj: {
        year?: number | null;
        month?: number | null;
        day?: number | null;
      } | null,
    ) => {
      if (!dateObj || !dateObj.year) return null;
      const { year, month, day } = dateObj;
      if (!month) return `${year}`;
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthStr = months[month - 1] || String(month).padStart(2, "0");
      if (!day) return `${monthStr} ${year}`;
      return `${monthStr} ${day}, ${year}`;
    };

    const startDate = formatAniListDate(item.startDate);
    const endDate = formatAniListDate(item.endDate);

    const detailData = {
      id: item.id,
      title,
      romajiTitle: item.title.romaji,
      synopsis: tmdbDetails?.overview || cleanSynopsis(item.description),
      score: item.averageScore ? (item.averageScore / 10).toFixed(1) : "8.5",
      episodesCount: availableEpisodes,
      format: item.format || "TV",
      status: item.status,
      season: item.season,
      year: item.seasonYear,
      studio,
      producers,
      startDate,
      endDate,
      genres: item.genres,
      bannerImage,
      posterImage,
      episodes: (tmdbDetails?.episodes || []).slice(0, availableEpisodes),
      recommendations: (item.recommendations?.nodes || [])
        // biome-ignore lint/suspicious/noExplicitAny: AniList API response
        .filter((n: any) => n.mediaRecommendation)
        .slice(0, 8)
        // biome-ignore lint/suspicious/noExplicitAny: AniList API response
        .map((n: any) => ({
          id: n.mediaRecommendation.id,
          title:
            n.mediaRecommendation.title.english ||
            n.mediaRecommendation.title.romaji,
          poster:
            n.mediaRecommendation.coverImage?.extraLarge ||
            n.mediaRecommendation.coverImage?.large ||
            null,
          score: n.mediaRecommendation.averageScore
            ? (n.mediaRecommendation.averageScore / 10).toFixed(1)
            : null,
          format: n.mediaRecommendation.format || null,
          episodes: n.mediaRecommendation.episodes || null,
        })),
    };

    return NextResponse.json(detailData);
  } catch (error: unknown) {
    console.error("Error in detail route:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch anime details" },
      { status: 500 },
    );
  }
}
