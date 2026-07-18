import { NextResponse } from "next/server";
import { getMappingById } from "@/lib/animeLists";
import { getCachedTMDBDetails } from "@/lib/tmdbCache";

export const dynamic = "force-dynamic";

interface AiringScheduleNode {
  id: number;
  airingAt: number;
  episode: number;
  media: {
    id: number;
    title: {
      english: string | null;
      romaji: string;
    };
    description: string;
    averageScore: number;
    format: string;
    bannerImage: string;
    genres: string[];
    status: string;
    isAdult: boolean;
    popularity: number;
    coverImage?: {
      extraLarge: string;
      large: string;
    };
  };
}

const fetchAniListRecentlyAired = async (): Promise<AiringScheduleNode[]> => {
  // Get current timestamp in seconds
  const currentEpoch = Math.floor(Date.now() / 1000);

  // We look for schedules that aired in the past (up to 14 days ago to populate a solid list)
  const oneWeekAgo = currentEpoch - 14 * 24 * 60 * 60;

  const query = `
    query ($airingAt_greater: Int, $airingAt_lesser: Int) {
      Page(page: 1, perPage: 80) {
        airingSchedules(
          airingAt_greater: $airingAt_greater,
          airingAt_lesser: $airingAt_lesser,
          sort: TIME_DESC
        ) {
          id
          airingAt
          episode
          media {
            id
            title {
              english
              romaji
            }
            description
            averageScore
            format
            bannerImage
            genres
            status
            isAdult
            popularity
            coverImage {
              extraLarge
              large
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
      variables: {
        airingAt_greater: oneWeekAgo,
        airingAt_lesser: currentEpoch,
      },
    }),
  });

  const json = await response.json();
  if (json.errors) {
    console.error("AniList airingSchedules errors:", json.errors);
    return [];
  }
  return json.data.Page.airingSchedules || [];
};

function cleanSynopsis(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"');
}

export async function GET() {
  try {
    const rawSchedules = await fetchAniListRecentlyAired();

    // Filter out duplicate media IDs, NSFW titles, and low popularity (niche/kids) shows
    const seenMediaIds = new Set<number>();
    const uniqueSchedules = rawSchedules
      .filter((schedule) => {
        if (!schedule.media || schedule.media.isAdult) return false;

        // Filter out unwanted formats like Chibi shorts, specials, or music videos
        const format = schedule.media.format;
        if (["TV_SHORT", "SPECIAL", "MUSIC"].includes(format)) return false;

        // Filter out low popularity to clean the feed of obscure spin-offs
        if (schedule.media.popularity < 10000) return false;

        if (seenMediaIds.has(schedule.media.id)) return false;
        seenMediaIds.add(schedule.media.id);
        return true;
      })
      .slice(0, 20); // Keep top 20 unique mainstream shows

    const mappedEntries = await Promise.all(
      uniqueSchedules.map(async (schedule) => {
        const item = schedule.media;
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

        // Display current released episode (e.g., "12EP" format like homepage)
        const episodesStr = `${schedule.episode}EP`;

        return {
          id: item.id,
          title,
          synopsis: tmdbDetails?.overview || cleanSynopsis(item.description),
          score: item.averageScore
            ? (item.averageScore / 10).toFixed(1)
            : "8.5",
          episodes: episodesStr,
          tagline:
            item.genres && item.genres.length > 0 ? item.genres[0] : "Airing",
          bannerImage,
          posterImage,
        };
      }),
    );

    return NextResponse.json(mappedEntries, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          (error as Error).message || "Failed to fetch recently updated anime",
      },
      { status: 500 },
    );
  }
}
