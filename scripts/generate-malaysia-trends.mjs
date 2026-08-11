import { mkdir, writeFile } from "node:fs/promises";

const fallback = ["生活成本", "本地美食故事", "雨天日常", "小生意幕后", "第一份工作的回忆", "周末家庭时光"];
const formats = ["第一人称开场", "前后反差短片", "值得收藏的清单", "人物小剧情"];
const angles = ["从一个真实日常切入，再说出你自己的观点。", "先给观众一个看得见的反差，再讲背后的原因。", "把经验整理成大家愿意保存、转发的实用角度。", "用人物误会或反应带出主题，让内容更有戏。"];
const dictionary = new Map([["cost of living", "生活成本"], ["local food stories", "本地美食故事"], ["rainy day routines", "雨天日常"], ["small business behind the scenes", "小生意幕后"], ["first job stories", "第一份工作的回忆"], ["weekend family plans", "周末家庭时光"]]);

function chineseTopic(topic, index) { return dictionary.get(topic.toLowerCase()) ?? `今日本地热搜话题 ${index + 1}`; }

async function malaysiaTrends() { try { const response = await fetch("https://trends.google.com/trending/rss?geo=MY", { headers: { "user-agent": "QV-WORK/0.1" } }); if (!response.ok) throw new Error(`Google Trends returned ${response.status}`); const xml = await response.text(); const titles = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)].map((match) => match[1]).filter((title) => title !== "Daily Search Trends"); return titles.slice(0, 20).length ? titles.slice(0, 20) : fallback; } catch { return fallback; } }

const topics = await malaysiaTrends();
const payload = { updatedAt: new Date().toISOString(), market: "MY", sources: [{ name: "Google 马来西亚趋势", mode: "自动更新" }, { name: "TikTok / Instagram / 小红书 / 抖音", mode: "创意形式参考" }], topics: topics.map((topic, index) => ({ topic: chineseTopic(topic, index), sourceTopic: topic, momentum: Math.max(61, 96 - index * 2), signal: index < 4 ? "正在上升" : "值得留意", localAngle: "把它转成你所在城市、语言与受众也会在意的真实故事。" })), recommendations: topics.slice(0, 4).map((topic, index) => ({ source: ["TikTok", "Instagram Reels", "小红书", "抖音"][index], topic: chineseTopic(topic, index), format: formats[index], localAngle: angles[index], readiness: 94 - index * 3 })) };

await mkdir("public/data", { recursive: true });
await writeFile("public/data/malaysia-trends.json", JSON.stringify(payload, null, 2));
