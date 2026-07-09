import { NextResponse } from "next/server";
import { getMappingById } from "@/lib/animeLists";
import { getCachedTMDBDetails } from "@/lib/tmdbCache";

export const dynamic = "force-dynamic";

interface AniListMedia {
  id: number;
  title: {
    english: string | null;
    romaji: string;
  };
  description: string;
  averageScore: number;
  episodes: number | null;
  format?: string;
  bannerImage: string;
  genres: string[];
  status: string;
  coverImage?: {
    extraLarge: string;
    large: string;
  };
  nextAiringEpisode?: {
    episode: number;
  } | null;
}

const fetchAniListTrending = async (): Promise<AniListMedia[]> => {
  const query = `
    query {
      Page(page: 1, perPage: 30) {
        media(sort: TRENDING_DESC, type: ANIME) {
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
          nextAiringEpisode {
            episode
          }
          coverImage {
            extraLarge
            large
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
    body: JSON.stringify({ query }),
  });

  const json = await response.json();
  return json.data.Page.media;
};

function cleanSynopsis(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"');
}

export async function GET() {
  try {
    const animeListRaw = await fetchAniListTrending();
    const animeList = animeListRaw.filter((item) => item.status !== "NOT_YET_RELEASED");

    const mappedEntries = await Promise.all(
      animeList.map(async (item) => {
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

        let availableEpisodes = item.episodes;
        if (item.status === "RELEASING" && item.nextAiringEpisode) {
          availableEpisodes = item.nextAiringEpisode.episode - 1;
        }

        const episodesStr = item.format === "MOVIE"
          ? "MOVIE"
          : (availableEpisodes && availableEpisodes > 0
              ? `${availableEpisodes}EP`
              : (item.format ? item.format.replace("_", " ") : "Anime"));

        return {
          id: item.id,
          title,
          synopsis: tmdbDetails?.overview || cleanSynopsis(item.description),
          score: item.averageScore ? (item.averageScore / 10).toFixed(1) : "8.5",
          episodes: episodesStr,
          tagline: item.genres && item.genres.length > 0 ? item.genres[0] : "Trending",
          bannerImage,
          posterImage,
        };
      })
    );

    return NextResponse.json(mappedEntries);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch trending anime" },
      { status: 500 }
    );
  }
}
