import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_URL =
  "https://cdn.jsdelivr.net/gh/Fribb/anime-lists@master/anime-list-mini.json";
const OUTPUT_PATH = path.join(__dirname, "../src/lib/anime-list-mini.json");

async function main() {
  console.log("Fetching Fribb anime-list mappings...");
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch mappings: ${res.statusText}`);
    }

    const rawData = await res.json();
    if (!Array.isArray(rawData)) {
      throw new Error("Invalid mapping data: expected an array");
    }

    console.log(`Original entries: ${rawData.length}`);

    // Filter and compress
    const compressed = rawData
      .filter(
        (item) => item.anilist_id !== undefined || item.mal_id !== undefined,
      )
      .map((item) => {
        const entry = {};
        if (item.anilist_id !== undefined) entry.anilist_id = item.anilist_id;
        if (item.mal_id !== undefined) entry.mal_id = item.mal_id;
        if (item.thetvdb_id !== undefined) entry.thetvdb_id = item.thetvdb_id;
        if (item.themoviedb_id !== undefined)
          entry.themoviedb_id = item.themoviedb_id;
        if (item.season !== undefined) entry.season = item.season;
        if (item.type !== undefined) entry.type = item.type;
        return entry;
      });

    console.log(`Compressed entries: ${compressed.length}`);

    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(compressed), "utf-8");
    console.log(`Successfully saved compressed mappings to ${OUTPUT_PATH}`);
  } catch (error) {
    console.error("Failed to download or process mappings:", error);
    process.exit(1);
  }
}

main();
