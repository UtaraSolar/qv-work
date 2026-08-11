export interface Env { ALLOWED_ORIGIN: string; GEMINI_API_KEY?: string; }

const jsonHeaders = { "content-type": "application/json; charset=UTF-8" };
function cors(origin: string, env: Env) { return origin === env.ALLOWED_ORIGIN ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", vary: "Origin" } : {}; }
function json(value: unknown, status: number, origin: string, env: Env) { return new Response(JSON.stringify(value), { status, headers: { ...jsonHeaders, ...cors(origin, env) } }); }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin") ?? "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin, env) });
    if (origin !== env.ALLOWED_ORIGIN) return json({ error: "来源不被允许" }, 403, origin, env);
    const path = new URL(request.url).pathname;
    if (request.method !== "POST" || !["/gemini", "/default-ai"].includes(path)) return json({ error: "未找到服务" }, 404, origin, env);
    let body: { apiKey?: unknown; prompt?: unknown };
    try { body = await request.json(); } catch { return json({ error: "请求内容无效" }, 400, origin, env); }
    const apiKey = path === "/default-ai" ? (env.GEMINI_API_KEY || "") : (typeof body.apiKey === "string" ? body.apiKey.trim() : "");
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2500) : "";
    if (!apiKey || !prompt) return json({ error: path === "/default-ai" ? "QV 默认 AI 还没有完成安全设置" : "需要 Gemini API Key 与创作内容" }, 400, origin, env);
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta2/interactions", { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify({ model: "gemini-3.6-flash", input: prompt }) });
    const data = await upstream.json() as { steps?: { type?: string; content?: { type?: string; text?: string }[] }[]; error?: { message?: string } };
    if (!upstream.ok) return json({ error: data.error?.message || "Gemini 暂时无法回应" }, 502, origin, env);
    const text = data.steps?.find((step) => step.type === "model_output")?.content?.find((item) => item.type === "text")?.text;
    return json({ text: text || "Gemini 没有返回文字。" }, 200, origin, env);
  },
};
