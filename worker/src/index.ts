export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

const jsonHeaders = { "content-type": "application/json; charset=UTF-8" };

function corsHeaders(origin: string, env: Env) {
  return origin === env.ALLOWED_ORIGIN
    ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", vary: "Origin" }
    : {};
}

function response(body: unknown, status: number, origin: string, env: Env) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...corsHeaders(origin, env) } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin") ?? "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/creative-direction") return response({ error: "未找到这个服务" }, 404, origin, env);
    if (origin !== env.ALLOWED_ORIGIN) return response({ error: "来源不被允许" }, 403, origin, env);
    let body: { brief?: unknown; platform?: unknown };
    try { body = await request.json(); } catch { return response({ error: "请求内容无效" }, 400, origin, env); }
    const brief = typeof body.brief === "string" ? body.brief.trim().slice(0, 800) : "";
    const platform = typeof body.platform === "string" ? body.platform.trim().slice(0, 80) : "TikTok";
    if (!brief) return response({ error: "请先写下你的想法" }, 400, origin, env);
    const prompt = `你是马来西亚内容导演。用自然、有画面感、不像 AI 的中文，为以下创作想法提出一支短视频方向。只给：标题、开场一句、冲突、结尾互动问题。不要解释你的角色。主题：${brief}。平台：${platform}。`;
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent", { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 1, maxOutputTokens: 400 } }) });
    const data = await upstream.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } };
    if (!upstream.ok) return response({ error: data.error?.message || "AI 暂时无法回应" }, 502, origin, env);
    return response({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || "AI 没有返回内容，请再试一次。" }, 200, origin, env);
  },
};
