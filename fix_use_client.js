const fs = require("fs");
const path = require("path");

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk("./src", (filePath) => {
  if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
    let content = fs.readFileSync(filePath, "utf8");
    const original = content;

    // Check if "use client" is in the file but not at the very start
    const match = content.match(
      /^(?:import [^\n]+;\n\s*)*\s*\(?["']use client["']\)?;?/m,
    );

    if (
      content.includes("use client") &&
      !content.startsWith('"use client"') &&
      !content.startsWith("'use client'")
    ) {
      // Remove all instances of "use client" or ("use client")
      content = content.replace(/\s*\(?["']use client["']\)?;\s*/g, "\n");
      // Prepend it cleanly
      content = '"use client";\n' + content.trimStart();
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log("Fixed use client in", filePath);
    }
  }
});
