const fs = require("fs");
const glob = require("glob"); // wait, node 18 might not have glob readily available. I'll just hardcode the 3 files.

const files = [
  "src/app/anime/[id]/page.tsx",
  "src/app/page.tsx",
  "src/app/browse/page.tsx",
  "src/app/watch/[id]/[episode]/page.tsx",
];

files.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");

    // Fix [...Array(X)].map((_, _i) => ( ... key={id} )
    content = content.replace(
      /\{\[\.\.\.Array\((\d+)\)\]\.map\(\(_, _i\) => \(/g,
      "{Array.from({ length: $1 }, (_, i) => `skel-${i}`).map((id) => (",
    );

    // Fix [...Array(X)].map((_, i) => ( ... key={id} )
    content = content.replace(
      /\{\[\.\.\.Array\((\d+)\)\]\.map\(\(_, i\) => \(/g,
      "{Array.from({ length: $1 }, (_, i) => `skel-${i}`).map((id) => (",
    );

    // Fix Array.from({ length: X }).map((_, _i) => ( ... key={id} )
    content = content.replace(
      /Array\.from\(\{ length: (\d+) \}\)\.map\(\(_, _i\) => \(/g,
      "Array.from({ length: $1 }, (_, i) => `skel-${i}`).map((id) => (",
    );

    // Fix Array.from({ length: X }).map((_, i) => ( ... key={id} )
    content = content.replace(
      /Array\.from\(\{ length: (\d+) \}\)\.map\(\(_, i\) => \(/g,
      "Array.from({ length: $1 }, (_, i) => `skel-${i}`).map((id) => (",
    );

    fs.writeFileSync(file, content, "utf8");
  }
});
