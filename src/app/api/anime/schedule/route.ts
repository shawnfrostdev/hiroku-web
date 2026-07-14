import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AniListScheduleMedia {
  id: number;
  title: {
    english: string | null;
    romaji: string;
  };
  description: string | null;
  bannerImage: string | null;
  coverImage: {
    extraLarge: string;
  };
}

interface AniListScheduleItem {
  id: number;
  airingAt: number;
  episode: number;
  media: AniListScheduleMedia;
}

const fetchAniListSchedule = async (
  startAt: number,
  endAt: number,
  page: number = 1,
): Promise<AniListScheduleItem[]> => {
  const query = `
    query ($page: Int, $startAt: Int, $endAt: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo {
          hasNextPage
        }
        airingSchedules(airingAt_greater: $startAt, airingAt_lesser: $endAt, sort: TIME) {
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
            bannerImage
            coverImage {
              extraLarge
            }
            countryOfOrigin
            isAdult
            format
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
        page,
        startAt,
        endAt,
      },
    }),
  });

  const json = await response.json();
  if (json.errors) {
    console.error("AniList API Error:", json.errors);
    return [];
  }

  return json.data.Page.airingSchedules;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startAtParam = searchParams.get("startAt");
    const endAtParam = searchParams.get("endAt");

    // Default to a 14-day window starting from today
    const startAt = startAtParam
      ? parseInt(startAtParam, 10)
      : Math.floor(Date.now() / 1000) - 86400; // start from yesterday to cover all timezones loosely
    const endAt = endAtParam ? parseInt(endAtParam, 10) : startAt + 86400 * 14;

    // We'll fetch 6 pages (300 items) concurrently to ensure we have enough data and to make it incredibly fast.
    const pageRequests = Array.from({ length: 6 }, (_, i) =>
      fetchAniListSchedule(startAt, endAt, i + 1),
    );
    const pagesResults = await Promise.all(pageRequests);

    let allSchedules: AniListScheduleItem[] = [];
    pagesResults.forEach((items) => {
      if (items && items.length > 0) {
        allSchedules = allSchedules.concat(items);
      }
    });

    // Filter out irrelevant or adult anime to keep the schedule clean
    const filteredSchedules = allSchedules.filter(
      (
        // biome-ignore lint/suspicious/noExplicitAny: API response
        item: any,
      ) => {
        const media = item.media;
        if (!media) return false;

        // 1. Must be Japanese (removes Chinese donghua, etc.)
        if (media.countryOfOrigin !== "JP") return false;

        // 2. Must not be adult content (Hentai)
        if (media.isAdult) return false;

        // 3. Must not be a Music Video
        if (media.format === "MUSIC") return false;

        return true;
      },
    );

    const mappedData = filteredSchedules.map(
      (
        // biome-ignore lint/suspicious/noExplicitAny: API response
        item: any,
      ) => {
        return {
          id: item.media.id,
          scheduleId: item.id,
          title: item.media.title.english || item.media.title.romaji,
          synopsis: item.media.description?.replace(/<[^>]*>?/gm, ""), // strip HTML tags
          // Fallback to coverImage if bannerImage is null, just so the UI has an image
          bannerImage:
            item.media.bannerImage || item.media.coverImage.extraLarge,
          posterImage: item.media.coverImage.extraLarge,
          episodes: item.episode.toString(),
          airingAt: item.airingAt,
        };
      },
    );

    return NextResponse.json(mappedData, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error in schedule route:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule data" },
      { status: 500 },
    );
  }
}
