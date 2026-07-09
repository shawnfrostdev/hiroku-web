const fs = require('fs');
const path = './src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Plus to import
content = content.replace(
  'import { Bookmark, ChevronLeft, ChevronRight, Info, Play } from "lucide-react";',
  'import { Bookmark, ChevronLeft, ChevronRight, Info, Play, Plus } from "lucide-react";'
);

// 2. Add to Trending Now, Popular This Season, All Time Popular
const posterAddButton = `
                {/* Add to Library Button */}
                <button 
                  className="absolute top-[8px] right-[8px] z-20 p-[4px] bg-[#141414]/90 backdrop-blur-md border border-[#282828] rounded-full text-[#FFFFFF] hover:bg-[#282828] transition-all opacity-0 group-hover:opacity-100 shadow-md"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Plus className="w-[12px] h-[12px]" />
                </button>
`;

content = content.replace(
  /(\{\/\* Poster Image \*\/\}\s*\{item\.posterImage \? \(\s*<img\s*src=\{item\.posterImage\}\s*alt=\{item\.title\}\s*className="w-full h-full object-cover"\s*loading="lazy"\s*\/>\s*\) : \(\s*<div[^>]*>[\s\S]*?<\/div>\s*\)\})/g,
  `$1${posterAddButton}`
);


// 3. Add to Continue Watching / For You
const landscapeAddButton = `
                  {/* Add to Library Button */}
                  <button 
                    className="absolute top-[8px] right-[8px] z-20 p-[6px] bg-[#141414]/90 backdrop-blur-md border border-[#282828] rounded-full text-[#FFFFFF] hover:bg-[#282828] transition-all opacity-0 group-hover:opacity-100 shadow-md"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Plus className="w-[14px] h-[14px]" />
                  </button>
`;

content = content.replace(
  /(<div\s*className="absolute inset-0"\s*style=\{\{\s*background: "linear-gradient[^}]*\}\}\s*\/>\s*<\/div>\s*\)\})/g,
  `$1${landscapeAddButton}`
);

// 4. Add to Schedule Section (using semantic variables, top left)
const scheduleAddButton = `
                    {/* Add to Library Button (Top Left) */}
                    <button 
                      className="absolute top-[8px] left-[8px] z-20 p-[4px] bg-surface/90 backdrop-blur-md border border-border-line rounded-full text-text-primary hover:bg-control transition-all opacity-0 group-hover:opacity-100 shadow-md"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <Plus className="w-[12px] h-[12px]" />
                    </button>
`;

content = content.replace(
  /(\{\/\* Time Badge \(Top Right\) \*\/\}\s*<div className="absolute top-\[8px\] right-\[8px\] pointer-events-none">\s*<span[^>]*>[\s\S]*?<\/span>\s*<\/div>)/g,
  `$1${scheduleAddButton}`
);

fs.writeFileSync(path, content);
console.log('Injected buttons.');
