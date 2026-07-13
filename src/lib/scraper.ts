const SCRAPER_URL = (process.env.NEXT_PUBLIC_SCRAPER_API_URL || 'http://localhost:4000').replace(/\/v1$/, '');

export const formatProviderName = (prov: string) => {
  if (prov === 'solaris') return 'Solaris';
  if (prov === 'lunar') return 'Lunar';
  if (prov === 'prism') return 'Prism';
  if (prov === 'lynx') return 'Lynx';
  if (prov === 'frost') return 'Frost';
  if (prov === 'nexus') return 'Nexus';
  return prov.charAt(0).toUpperCase() + prov.slice(1);
};

export async function fetchAnimeEpisodes(anilistId: string) {
  const res = await fetch(`${SCRAPER_URL}/api/episodes/${anilistId}`, {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch episodes: ${res.statusText}`);
  }
  
  const data = await res.json();
  const epMap = new Map<number, any>();
  
  for (const [providerId, providerData] of Object.entries(data)) {
    // softsubEps: Solaris/Frost — HLS + separate VTT track (toggle off/on)
    const softsubEps = (providerData as any)?.episodes?.softsub || [];
    // subEps: hard-sub providers — subs burned into the video
    const subEps = (providerData as any)?.episodes?.sub || [];
    const dubEps = (providerData as any)?.episodes?.dub || [];
    
    const addEp = (ep: any, category: string) => {
      const epNum = ep.number;
      if (!epMap.has(epNum)) {
        epMap.set(epNum, {
          number: epNum,
          title: ep.title || `Episode ${epNum}`,
          episodeId: String(epNum),
          providers: []
        });
      }
      const existing = epMap.get(epNum);
      // Avoid duplicate provider+category combos and explicitly ignore 'orion'
      if (providerId !== 'orion' && !existing.providers.some((prov: any) => prov.provider === providerId && prov.category === category)) {
        existing.providers.push({ provider: providerId, category });
      }
    };

    for (const ep of softsubEps) addEp(ep, 'softsub');
    for (const ep of subEps) addEp(ep, 'sub');
    for (const ep of dubEps) addEp(ep, 'dub');
  }
  
  const sortedEpisodes = Array.from(epMap.values()).sort((a, b) => a.number - b.number);
  
  return {
    success: true,
    data: sortedEpisodes
  };
}
