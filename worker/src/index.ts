export interface Env {
  ALLOWED_ORIGIN: string;
  GEMINI_API_KEY?: string;
}

type ScoutItem = {
  source: string;
  topic: string;
  format: string;
  localAngle: string;
  readiness: number;
  momentum: "rising" | "peak" | "cooling";
  window: string;
};

const jsonHeaders = { "content-type": "application/json; charset=UTF-8" };
const scoutKey = new Request("https://qv-work-cache.internal/scout/latest");

function cors(origin: string, env: Env) {
  return origin === env.ALLOWED_ORIGIN
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        vary: "Origin",
      }
    : {};
}

function json(value: unknown, status: number, origin: string, env: Env, extra: HeadersInit = {}) {
  return new Response(JSON.stringify(value), { status, headers: { ...jsonHeaders, ...cors(origin, env), ...extra } });
}

function fallbackScout(topics: string[] = []): ScoutItem[] {
  const seeds = topics.length ? topics : ["雨天", "开学", "省钱", "小生意", "周末"].map((topic) => topic);
  return seeds.slice(0, 4).map((topic, index) => ({
    source: "Malaysia public trend signal",
    topic,
    format: index % 2 ? "真实经历 + 一个反转" : "先说一个你也遇过的瞬间",
    localAngle: `不要解释「${topic}」本身。把它放进一个真实选择、尴尬瞬间或人物关系里，让观众想说：我也有过。`,
    readiness: 91 - index * 3,
    momentum: index === 2 ? "peak" : "rising",
    window: index === 2 ? "今天拍最刚好" : "未来 48 小时内",
  }));
}

async function malaysiaTopics(): Promise<string[]> {
  try {
    const response = await fetch("https://trends.google.com/trending/rss?geo=MY", {
      headers: { "user-agent": "QV-WORK-AI-Scout/1.0" },
    });
    if (!response.ok) return [];
    const xml = await response.text();
    return [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g)]
      .map((match) => (match[1] || match[2] || "").trim())
      .filter((title) => title && title !== "Daily Search Trends")
      .slice(0, 8);
  } catch {
    return [];
  }
}

async function geminiText(apiKey: string, prompt: string, maxOutputTokens = 1800): Promise<string> {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens } }),
  });
  const raw = await response.text();
  let data: { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[]; error?: { message?: string } };
  try { data = JSON.parse(raw) as typeof data; } catch { throw new Error(`Gemini response was not JSON (${response.status})`); }
  if (!response.ok) throw new Error(data.error?.message || "Gemini request failed");
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.filter((part) => !part.thought).map((part) => part.text || "").filter(Boolean).join("\n")
    || parts.map((part) => part.text || "").filter(Boolean).join("\n");
}

function parseScout(text: string, topics: string[]): ScoutItem[] {
  try {
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(clean) as ScoutItem[];
    if (!Array.isArray(parsed) || !parsed.length) throw new Error("empty scout");
    return parsed.slice(0, 4).map((item, index) => ({
      source: "Malaysia public trend signal",
      topic: String(item.topic || topics[index] || "今天的真实瞬间").slice(0, 80),
      format: String(item.format || "真实经历 + 反转").slice(0, 100),
      localAngle: String(item.localAngle || "从一个真实、具体的瞬间开始。不要复制任何原帖。").slice(0, 240),
      readiness: Math.max(70, Math.min(99, Number(item.readiness) || 85)),
      momentum: item.momentum === "peak" || item.momentum === "cooling" ? item.momentum : "rising",
      window: String(item.window || "未来 48 小时内").slice(0, 60),
    }));
  } catch {
    return fallbackScout(topics);
  }
}

async function refreshScout(env: Env) {
  const topics = await malaysiaTopics();
  let recommendations = fallbackScout(topics);
  if (env.GEMINI_API_KEY) {
    try {
      const text = await geminiText(env.GEMINI_API_KEY, `你是住在马来西亚、懂短视频节奏的创意总监。以下是今天的公开搜索趋势：${topics.join("、") || "暂时没有可用趋势"}。

请只根据这些「信号」提出 4 个原创、实际能拍的 45-60 秒短片方向。不是新闻摘要、不是销售文案、不是套模板；要像真正的人会说、会拍的内容。不要复制任何平台帖子或台词。适用于不同领域的个人 IP 或小团队。

只输出 JSON 数组，不要 markdown。每项必须有：topic、format、localAngle、readiness（70-99）、momentum（rising/peak/cooling）、window。localAngle 请用自然中文写出具体人、场景或反差。`);
      recommendations = parseScout(text, topics);
    } catch {
      // A reliable public-signal fallback is better than showing an error screen.
    }
  }
  const payload = { updatedAt: new Date().toISOString(), live: true, automated: true, recommendations };
  const response = new Response(JSON.stringify(payload), { headers: { ...jsonHeaders, "cache-control": "public, max-age=21600" } });
  await caches.default.put(scoutKey, response.clone());
  return response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin") ?? "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin, env) });
    if (origin !== env.ALLOWED_ORIGIN) return json({ error: "来源不被允许" }, 403, origin, env);
    const path = new URL(request.url).pathname;

    if (request.method === "GET" && path === "/scout") {
      const cached = await caches.default.match(scoutKey);
      if (cached) return new Response(cached.body, { status: cached.status, headers: { ...Object.fromEntries(cached.headers), ...cors(origin, env) } });
      const fresh = await refreshScout(env);
      return new Response(fresh.body, { status: fresh.status, headers: { ...Object.fromEntries(fresh.headers), ...cors(origin, env) } });
    }

    if (request.method !== "POST" || !["/gemini", "/default-ai"].includes(path)) return json({ error: "找不到服务" }, 404, origin, env);
    let body: { apiKey?: unknown; prompt?: unknown };
    try { body = await request.json(); } catch { return json({ error: "请求内容无效" }, 400, origin, env); }
    const apiKey = path === "/default-ai" ? (env.GEMINI_API_KEY || "") : (typeof body.apiKey === "string" ? body.apiKey.trim() : "");
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2500) : "";
    if (!apiKey || !prompt) return json({ error: path === "/default-ai" ? "QV 默认 AI 还没有完成安全设置" : "需要 Gemini API Key 与创作内容" }, 400, origin, env);
    try {
      const text = await geminiText(apiKey, prompt, 2048);
      return json({ text: text || "Gemini 没有返回文字。" }, 200, origin, env);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "无法连接 Gemini 服务，请稍后再试" }, 502, origin, env);
    }
  },

  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }) {
    ctx.waitUntil(refreshScout(env));
  },
};
