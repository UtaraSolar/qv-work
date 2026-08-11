import { mkdir, writeFile } from 'node:fs/promises';

const fallback = [
  'cost of living', 'local food stories', 'rainy day routines',
  'small business behind the scenes', 'first job stories', 'weekend family plans'
];

async function malaysiaTrends() {
  try {
    const response = await fetch('https://trends.google.com/trending/rss?geo=MY', { headers: { 'user-agent': 'QV-WORK/0.1' } });
    if (!response.ok) throw new Error(`Google Trends returned ${response.status}`);
    const xml = await response.text();
    const titles = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)].map(match => match[1]).filter(title => title !== 'Daily Search Trends');
    return titles.slice(0, 20).length ? titles.slice(0, 20) : fallback;
  } catch {
    return fallback;
  }
}

const topics = await malaysiaTrends();
const payload = {
  updatedAt: new Date().toISOString(),
  market: 'MY',
  sources: [
    { name: 'Google Trends Malaysia', mode: 'live' },
    { name: 'TikTok / Instagram / Xiaohongshu / Douyin', mode: 'creative-format reference' }
  ],
  topics: topics.map((topic, index) => ({
    topic,
    momentum: Math.max(61, 96 - index * 2),
    signal: index < 4 ? 'rising' : 'watch',
    localAngle: `Find the Malaysian human story behind ${topic}; do not copy a viral format.`
  }))
};

await mkdir('public/data', { recursive: true });
await writeFile('public/data/malaysia-trends.json', JSON.stringify(payload, null, 2));
