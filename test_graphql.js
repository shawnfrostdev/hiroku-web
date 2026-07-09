const fetch = require('node-fetch');

async function test() {
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
            title { english romaji }
            countryOfOrigin
            format
            popularity
            isAdult
          }
        }
      }
    }
  `;
  
  const startAt = Math.floor(Date.now() / 1000);
  const endAt = startAt + (86400 * 14);

  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { page: 1, startAt, endAt } })
  });
  
  const json = await res.json();
  const schedules = json.data.Page.airingSchedules;
  
  for (let i = 0; i < 5; i++) {
    console.log(schedules[i].media.title.romaji, "- Pop:", schedules[i].media.popularity, "- Format:", schedules[i].media.format, "- Country:", schedules[i].media.countryOfOrigin);
  }
  console.log("Total in page 1:", schedules.length);
  console.log("Has next page:", json.data.Page.pageInfo.hasNextPage);
}

test();
