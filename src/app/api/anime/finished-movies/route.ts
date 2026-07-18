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
  isAdult: boolean;
  popularity: number;
  coverImage?: {
    extraLarge: string;
    large: string;
  };
  nextAiringEpisode?: {
    episode: number;
  } | null;
  status?: string;
}

const fetchAniListFinishedAndMovies = async (): Promise<{
  finished: AniListMedia[];
  movies: AniListMedia[];
}> => {
  const query = `
    query {
      finished: Page(page: 1, perPage: 40) {
        media(status: FINISHED, sort: END_DATE_DESC, type: ANIME, isAdult: false) {
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
          isAdult
          popularity
          nextAiringEpisode {
            episode
          }
          coverImage {
            extraLarge
            large
          }
        }
      }
      movies: Page(page: 1, perPage: 15) {
        media(format: MOVIE, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
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
          isAdult
          popularity
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
  const finishedFiltered = (json.data.finished.media || [])
    .filter(
      (
        // biome-ignore lint/suspicious/noExplicitAny: API response
        m: any,
      ) => !m.isAdult && m.popularity >= 1500,
    )
    .slice(0, 10);

  const moviesFiltered = (json.data.movies.media || [])
    .filter(
      (
        // biome-ignore lint/suspicious/noExplicitAny: API response
        m: any,
      ) => !m.isAdult,
    )
    .slice(0, 10);

  return {
    finished: finishedFiltered,
    movies: moviesFiltered,
  };
};

function cleanSynopsis(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"');
}

const mapMedia = async (list: AniListMedia[]) => {
  return Promise.all(
    list.map(async (item) => {
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
        title,
        synopsis: tmdbDetails?.overview || cleanSynopsis(item.description),
        score: item.averageScore ? (item.averageScore / 10).toFixed(1) : "8.5",
        episodes: episodesStr,
        tagline:
          item.genres && item.genres.length > 0 ? item.genres[0] : "Anime",
        bannerImage,
        posterImage,
      };
    }),
  );
};

export async function GET() {
  try {
    const { finished, movies } = await fetchAniListFinishedAndMovies();
    const [mappedFinished, mappedMovies] = await Promise.all([
      mapMedia(finished),
      mapMedia(movies),
    ]);

    return NextResponse.json(
      {
        finished: mappedFinished.slice(0, 5),
        movies: mappedMovies.slice(0, 5),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=43200, stale-while-revalidate=1800",
        },
      },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch lists" },
      { status: 500 },
    );
  }
}
