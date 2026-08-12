import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Route =
  | "today"
  | "new"
  | "director"
  | "blueprint"
  | "script"
  | "review"
  | "templates"
  | "ai";
type Provider = "puter" | "gemini" | "custom";
type Concept = {
  title: string;
  kind: string;
  idea: string;
  hook: string;
  conflict: string;
  platform: string;
  score: number;
};
type Beat = { id: string; label: string; text: string };
type Scene = {
  id: string;
  title: string;
  duration: string;
  location: string;
  people: string;
  action: string;
  dialogue: string;
  camera: string;
  note: string;
};
type AiSettings = {
  provider: Provider;
  monthlyLimit: number;
  used: number;
  resetMonth: string;
  geminiKey: string;
  customBaseUrl: string;
  customKey: string;
  customModel: string;
};
declare global {
  interface Window {
    puter?: {
      auth: { isSignedIn: () => boolean; signIn: () => Promise<unknown> };
      ai: {
        chat: (
          prompt: string,
          options?: Record<string, unknown>,
        ) => Promise<unknown>;
      };
    };
  }
}

const baseConcepts: Concept[] = [
  {
    kind: "反差剧情",
    title: "大家都以为很简单，结果最难的是这一步",
    idea: "从一个人人都有的误会开始，再用真实经历翻转它。",
    hook: "你也以为这样做就够了吗？",
    conflict: "表面的答案与真实体验不一样。",
    platform: "TikTok",
    score: 92,
  },
  {
    kind: "人物故事",
    title: "我以前不敢说的那件小事",
    idea: "用一个具体瞬间带出你的观点，不像在上课。",
    hook: "这件事我本来不想讲，但它改变了我。",
    conflict: "想被理解，却怕被误会。",
    platform: "Instagram Reels",
    score: 89,
  },
  {
    kind: "可收藏干货",
    title: "别急着做，先用这三个问题检查",
    idea: "把复杂经验拆成能保存、能转发的清单。",
    hook: "先别花钱，先问自己这三个问题。",
    conflict: "大家急着行动，却忽略判断。",
    platform: "小红书",
    score: 87,
  },
  {
    kind: "实验挑战",
    title: "我用一天验证这个大家都相信的说法",
    idea: "让过程本身有悬念，答案放到最后。",
    hook: "我决定亲自试一次，看它到底是不是真的。",
    conflict: "传言很流行，但没有人真的验证过。",
    platform: "YouTube Shorts",
    score: 85,
  },
];
const defaultBeats: Beat[] = [
  {
    id: "hook",
    label: "开场钩子",
    text: "先说一句让人想停下来的话，或给一个不合理的画面。",
  },
  {
    id: "context",
    label: "场景",
    text: "用一两句让观众知道：这件事发生在谁身上，为什么和他有关。",
  },
  {
    id: "conflict",
    label: "冲突",
    text: "说出大家以为的答案，然后让它出现裂缝。",
  },
  { id: "turn", label: "转折", text: "给出具体细节、反应或发现，让故事转向。" },
  {
    id: "point",
    label: "你的观点",
    text: "像聊天一样说出你真正想让人带走的东西。",
  },
  { id: "end", label: "收尾动作", text: "留一个自然的问题或下一集伏笔。" },
];
const starterScenes: Scene[] = [
  {
    id: "1",
    title: "开场 · 白天",
    duration: "6 秒",
    location: "你最熟悉的场景",
    people: "主角",
    action: "主角停下来，看向镜头，像突然想到一件事。",
    dialogue: "你有没有发现，大家都把这件事想得太简单？",
    camera: "中景，慢慢推近",
    note: "开头先留半秒空白。",
  },
  {
    id: "2",
    title: "冲突出现 · 白天",
    duration: "8 秒",
    location: "同一场景",
    people: "主角 / 另一位角色",
    action: "一个真实细节出现，打断原本的想法。",
    dialogue: "等等，这跟我以为的完全不一样。",
    camera: "广角切细节特写",
    note: "用表情或动作代替解释。",
  },
  {
    id: "3",
    title: "观点落地 · 白天",
    duration: "7 秒",
    location: "面对镜头",
    people: "主角",
    action: "主角说出新理解，语气放松。",
    dialogue: "后来我才懂，重点从来不是这个。",
    camera: "平视中景",
    note: "结尾给观众一个能回应的问题。",
  },
];
const templates = [
  "老板 / 创办人 IP",
  "员工日常",
  "人物故事",
  "反差剧情",
  "热点借势",
  "观点短评",
  "知识拆解",
  "客户故事",
  "POV",
  "一天实验",
  "产品教育",
  "系列连续剧",
];
const nav: [Route, string][] = [
  ["today", "今天拍什么"],
  ["director", "AI 一起做"],
  ["script", "我的拍摄包"],
];
const titles: Record<Route, string> = {
  today: "今天，拍什么才像你？",
  new: "先把创作方向说清楚",
  director: "导演室",
  blueprint: "故事蓝图",
  script: "我的拍摄包",
  review: "导演复盘",
  templates: "创意模板",
  ai: "AI 与额度",
};

export default function App() {
  const [route, setRoute] = useState<Route>("today");
  const [project, setProject] = useLocalState("qv.project", "我的个人 IP");
  const [brief, setBrief] = useLocalState(
    "qv.brief",
    "我想拍一支真实、有共鸣的内容",
  );
  const [selected, setSelected] = useLocalState<Concept>(
    "qv.selected",
    baseConcepts[0],
  );
  const [beats, setBeats] = useLocalState<Beat[]>("qv.beats", defaultBeats);
  const [scenes, setScenes] = useLocalState<Scene[]>(
    "qv.scenes",
    starterScenes,
  );
  const [ai, setAi] = useLocalState<AiSettings>("qv.ai", {
    provider: "puter",
    monthlyLimit: 30,
    used: 0,
    resetMonth: monthKey(),
    geminiKey: "",
    customBaseUrl: "",
    customKey: "",
    customModel: "gpt-4o-mini",
  });
  const [notice, setNotice] = useState("");
  const [showGuide, setShowGuide] = useState(() => localStorage.getItem("qv.guide-seen") !== "yes");
  useEffect(() => {
    if (ai.resetMonth !== monthKey())
      setAi({ ...ai, used: 0, resetMonth: monthKey() });
  }, [ai, setAi]);
  const go = (to: Route) => {
    setRoute(to);
    setNotice("");
  };
  return (
    <div className="shell">
      <aside className="rail">
        <button
          className="brand"
          onClick={() => go("today")}
          aria-label="QV WORK"
        >
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}brand/qv-work-logo.png`} alt="QV WORK Creative Enterprise" />
        </button>
        <div className="brand-subtitle">CREATIVE ENTERPRISE</div>
        <div className="nav">
          {nav.map(([id, label]) => (
            <button
              key={id}
              className={route === id ? "on" : ""}
              onClick={() => go(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="railfoot" onClick={() => go("ai")}>
          <div className="avatar">Q</div>
          <div>
            <strong>
              {ai.provider === "puter" ? "QV 默认 AI" : "自定义 AI"}
            </strong>
            <small>
              {Math.max(0, ai.monthlyLimit - ai.used)}/{ai.monthlyLimit} 次可用
            </small>
          </div>
        </button>
      </aside>
      <main className="canvas">
        <header className="mast">
          <div>
            <p className="eyebrow">QV WORK / CREATIVE ENTERPRISE</p>
            <h1>{titles[route]}</h1>
          </div>
          <div className="topactions"><button className="quiet" onClick={() => setShowGuide(true)}>新手教学</button><button className="quiet" onClick={() => setNotice("已保存在当前设备")}>保存</button></div>
        </header>
        {notice && <div className="toast">{notice}</div>}
        {route === "today" && <Today project={project} setBrief={setBrief} go={go} />}
        {route === "new" && (
          <NewProject
            project={project}
            setProject={setProject}
            submit={() => go("director")}
          />
        )}
        {route === "director" && (
          <Director
            brief={brief}
            setBrief={setBrief}
            selected={selected}
            setSelected={setSelected}
            ai={ai}
            setAi={setAi}
            go={go}
          />
        )}
        {route === "blueprint" && (
          <Blueprint beats={beats} setBeats={setBeats} go={go} />
        )}
        {route === "script" && (
          <Script scenes={scenes} setScenes={setScenes} go={go} />
        )}
        {route === "review" && <Review go={go} />}
        {route === "templates" && (
          <Templates
            useTemplate={(value) => {
              setBrief(`我想用「${value}」形式做一支内容`);
              go("director");
            }}
          />
        )}
        {route === "ai" && <AiSettingsPanel ai={ai} setAi={setAi} />}
        {showGuide && <Guide close={() => { localStorage.setItem("qv.guide-seen", "yes"); setShowGuide(false); }} go={go} />}
      </main>
    </div>
  );
}

function Guide({ close, go }: { close: () => void; go: (route: Route) => void }) { const start = () => { close(); go("today"); }; return <div className="guide-backdrop" role="dialog" aria-modal="true" aria-label="QV WORK 新手教学"><section className="guide-card"><button className="guide-close" onClick={close} aria-label="关闭教学">×</button><p className="eyebrow">WELCOME TO QV WORK</p><h2>第一次用？<br/>三步就能开始。</h2><div className="guide-steps"><article><b>01</b><div><strong>先看今日情报</strong><span>不用想提示词。先从趋势、雷达或你的旧项目挑一个方向。</span></div></article><article><b>02</b><div><strong>进入导演室</strong><span>写下一个想法，选择平台；QV WORK 会给你可选的内容角度。</span></div></article><article><b>03</b><div><strong>变成可拍剧本</strong><span>从故事蓝图到分镜、台词与复盘，一步一步完成。</span></div></article></div><div className="guide-tip"><b>AI 怎么用？</b><span>最简单：在「AI 设置」选 QV 默认 AI，再回导演室按「让 AI 想一个」。自定义 API 只适合懂接口设置的人。</span></div><div className="guide-actions"><button className="quiet" onClick={() => { close(); go("ai"); }}>先设置 AI</button><button className="primary" onClick={start}>从今日情报开始 <b>→</b></button></div></section></div>; }

function useLocalState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}
function monthKey() {
  return new Date().toISOString().slice(0, 7);
}
function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="sectionhead">
        <h3>{title}</h3>
        <span>{note}</span>
      </div>
      {children}
    </section>
  );
}
function Today({ project, setBrief, go }: { project: string; setBrief: (value: string) => void; go: (to: Route) => void }) {
  const [radar, setRadar] = useState<{
    updatedAt: string;
    recommendations: {
      source: string;
      topic: string;
      format: string;
      localAngle: string;
      readiness: number;
    }[];
  } | null>(null);
  useEffect(() => {
    fetch("./data/malaysia-trends.json")
      .then((r) => r.json())
      .then(setRadar)
      .catch(() => setRadar(null));
  }, []);
  const startFromSignal = (item: { topic: string; source: string; format: string; localAngle: string }) => {
    setBrief(`我想把「${item.topic}」做成适合马来西亚受众的原创短片。参考形式：${item.format}。我的切入角度：${item.localAngle}。不要复制原内容，要有自己的观点、真实细节和评论互动。`);
    go("director");
  };
  return (
    <>
      <section className="director-call">
        <div>
          <p className="eyebrow">为 {project} 准备</p>
          <h2>
            不用硬想。<em>先看今天什么值得你说。</em>
          </h2>
          <p>
            从马来西亚趋势、平台节奏与个人表达出发，帮你找到不是复制别人、而是像你自己的内容方向。
          </p>
        </div>
        <button className="primary" onClick={() => go("director")}>
          我有自己的想法 <b>→</b>
        </button>
      </section>
      <section className="section">
        <div className="sectionhead">
          <h3>跨平台创意雷达</h3>
          <span>
            {radar
              ? `更新于 ${new Date(radar.updatedAt).toLocaleTimeString("zh-MY", { hour: "2-digit", minute: "2-digit" })}`
              : "正在更新本地情报"}
          </span>
        </div>
        <div className="radar-grid">
          {radar?.recommendations.map((item) => (
            <article key={item.source}>
              <small>{item.source} · 今天的创作信号</small>
              <b>{item.topic}</b>
              <span>{item.format}</span>
              <p>{item.localAngle}</p>
              <footer>
                <em>机会值 {item.readiness}</em>
                <button onClick={() => startFromSignal(item)}>把它变成我的内容 →</button>
              </footer>
            </article>
          )) ?? <p>正在准备今天的创作机会。</p>}
        </div>
      </section>
      <section className="section inspiration-section">
        <div className="sectionhead">
          <h3>同一个信号，能拍成很多种你</h3>
          <span>不是追热点；从热点借一个入口</span>
        </div>
        <div className="inspiration-grid">
          {[
            ["真实故事", "从你亲身遇过的一个小瞬间说起", "我以前也以为这件事很简单，直到那一天。"],
            ["反差剧情", "把大家的预期故意翻转", "所有人都以为我会这样做，结果我先做了另一件事。"],
            ["可收藏清单", "变成观众用得上的三步方法", "如果你也正在经历这个，先做这三件事。"],
            ["人物 POV", "用一个角色的视角制造情绪", "如果这件事发生在你老板／妈妈／客户身上……"],
          ].map(([type, angle, hook]) => <button key={type} onClick={() => { setBrief(`我想用「${type}」做短片。角度：${angle}。开头感觉：${hook}。内容要自然、有画面感，适合马来西亚受众，不要 AI 腔。`); go("director"); }}><small>{type}</small><b>{angle}</b><span>{hook}</span><em>用这个结构 →</em></button>)}
        </div>
      </section>
      <section className="split">
        <div>
          <Section
            title="你可以先拍"
            note="不一定要跟风；重点是它能不能成为你的观点"
          >
            <div className="ideas">
              {baseConcepts.slice(0, 3).map((c) => (
                <button key={c.title} onClick={() => go("director")}>
                  <small>{c.kind}</small>
                  <b>{c.title}</b>
                  <span>{c.hook}</span>
                </button>
              ))}
            </div>
          </Section>
        </div>
        <div>
          <Section title="继续创作" note="你的想法、蓝图与剧本都留在这里">
            <div className="projectlist">
              <button onClick={() => go("blueprint")}>
                <span className="projectdot" />
                <div>
                  <b>{project}</b>
                  <small>故事蓝图</small>
                </div>
                <em>继续</em>
              </button>
              <button onClick={() => go("templates")}>
                <span className="projectdot" />
                <div>
                  <b>还没想到主题？</b>
                  <small>从一套创意模板开始</small>
                </div>
                <em>查看</em>
              </button>
            </div>
          </Section>
        </div>
      </section>
    </>
  );
}
function NewProject({
  project,
  setProject,
  submit,
}: {
  project: string;
  setProject: (value: string) => void;
  submit: () => void;
}) {
  const send = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };
  return (
    <form className="projectform" onSubmit={send}>
      <p>不是要你填完所有资料。先给 QV WORK 一个方向，它会陪你把内容想出来。</p>
      <div className="fields">
        <label>
          这个创作空间叫什么？
          <input value={project} onChange={(e) => setProject(e.target.value)} />
        </label>
        <label>
          你现在最想达成什么？
          <select defaultValue="建立个人 IP">
            <option>建立个人 IP</option>
            <option>增加曝光</option>
            <option>教育市场</option>
            <option>带来询问</option>
            <option>推广产品或服务</option>
          </select>
        </label>
        <label>
          你想和谁说话？
          <input defaultValue="马来西亚会看短内容的人" />
        </label>
        <label>
          主要发布哪里？
          <select defaultValue="TikTok">
            <option>TikTok</option>
            <option>Instagram Reels</option>
            <option>Facebook</option>
            <option>YouTube Shorts</option>
            <option>小红书</option>
            <option>抖音</option>
          </select>
        </label>
        <label className="wide">
          你想让别人记得你的什么感觉？
          <input defaultValue="真实、有创意、容易理解" />
        </label>
      </div>
      <button className="primary" type="submit">
        进入导演室 <b>→</b>
      </button>
    </form>
  );
}
function Director({
  brief,
  setBrief,
  selected,
  setSelected,
  ai,
  setAi,
  go,
}: {
  brief: string;
  setBrief: (v: string) => void;
  selected: Concept;
  setSelected: (v: Concept) => void;
  ai: AiSettings;
  setAi: (v: AiSettings) => void;
  go: (r: Route) => void;
}) {
  const [platform, setPlatform] = useLocalState("qv.platform", "TikTok");
  const [seed, setSeed] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [reply, setReply] = useState("");
  const remaining = Math.max(0, ai.monthlyLimit - ai.used);
  const choices = useMemo(
    () => makeConcepts(brief, platform, seed),
    [brief, platform, seed],
  );
  const prompt = `你是马来西亚内容导演。用自然、有画面感、不像 AI 的中文，为以下创作想法提出一支短视频方向。只给：标题、开场一句、冲突、结尾互动问题。主题：${brief}。平台：${platform}。`;
  const runAi = async () => {
    if (remaining <= 0) {
      setReply("本月 AI 额度已用完；下个月会自动重置，或到 AI 设置调整上限。");
      return;
    }
    setThinking(true);
    try {
      let output = "";
      if (ai.provider === "puter") {
        const response = await fetch("https://qv-work-ai.weiqianchan33.workers.dev/default-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const raw = await response.text();
        let data: { text?: string; error?: string } | undefined;
        try { data = JSON.parse(raw); } catch { throw new Error("默认 AI 服务暂时无法回应，请稍后再试。"); }
        if (!response.ok) throw new Error(data?.error || "默认 AI 服务暂时无法回应，请稍后再试。");
        output = data?.text || "默认 AI 没有返回文字。";
      } else if (ai.provider === "gemini") {
        if (!ai.geminiKey) throw new Error("请先在 AI 设置贴上 Gemini API Key。项目编号不用填写。");
        try {
          const response = await fetch("https://qv-work-ai.weiqianchan33.workers.dev/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: ai.geminiKey, prompt }),
          });
          const raw = await response.text();
          const data = JSON.parse(raw) as { text?: string; error?: string };
          if (!response.ok) throw new Error(data.error || "Gemini 暂时无法回应，请稍后再试。");
          output = data.text || "Gemini 没有返回文字。";
        } catch (proxyError) {
          if (!(proxyError instanceof TypeError)) throw proxyError;
          const response = await fetch("https://generativelanguage.googleapis.com/v1beta2/interactions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": ai.geminiKey },
            body: JSON.stringify({ model: "gemini-3.6-flash", input: prompt }),
          });
          const raw = await response.text();
          let data: { steps?: { type?: string; content?: { type?: string; text?: string }[] }[]; error?: { message?: string } } | undefined;
          try { data = JSON.parse(raw); } catch { throw new Error("连接 Gemini 失败，请检查网络后再试。 "); }
          if (!response.ok) throw new Error(data?.error?.message || "Gemini 暂时无法回应，请稍后再试。");
          output = data?.steps?.find((step) => step.type === "model_output")?.content?.find((content) => content.type === "text")?.text || "Gemini 没有返回文字。";
        }
      } else {
        if (!ai.customBaseUrl || !ai.customKey || !ai.customModel)
          throw new Error("请先在 AI 设置填入接口地址、密钥和模型名称。");
        const endpoint = `${ai.customBaseUrl.replace(/\/$/, "")}/chat/completions`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ai.customKey}`,
          },
          body: JSON.stringify({
            model: ai.customModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 1,
            max_tokens: 400,
          }),
        });
        const raw = await response.text();
        let data: { choices?: { message?: { content?: string } }[]; error?: any } | undefined;
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error("接口没有返回 AI 数据。请确认接口基础地址是 OpenAI 兼容地址（例如以 /v1 结尾），不是普通网页网址。");
        }
        if (!response.ok)
          throw new Error(
            data?.error?.message || data?.error || "自定义接口没有回应",
          );
        output = data?.choices?.[0]?.message?.content || "模型没有返回文字。";
      }
      setReply(output);
      setAi({ ...ai, used: ai.used + 1 });
    } catch (error) {
      setReply(
        error instanceof Error
          ? `无法生成：${error.message}`
          : "AI 暂时无法回应，请稍后再试。",
      );
    } finally {
      setThinking(false);
    }
  };
  return (
    <>
      <div className="platform-modes">
        {[
          "TikTok",
          "Instagram Reels",
          "YouTube Shorts",
          "YouTube",
          "Facebook",
          "小红书",
          "抖音",
        ].map((item) => (
          <button
            key={item}
            className={platform === item ? "active" : ""}
            onClick={() => setPlatform(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="intent">
        <span>你的想法</span>
        <input
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="想到什么就写什么，例如：我想讲创业后最意外的一件事"
        />
        <button className="quiet" onClick={() => setSeed((v) => v + 1)}>
          换一批方向
        </button>
      </div>
      <div className="ai-inline">
        <div>
          <b>
            {ai.provider === "puter" ? "QV 默认 AI · Puter" : ai.provider === "gemini" ? "我的 Gemini Key" : "自定义 AI 接口"}
          </b>
          <small>
            本月剩余 {remaining} / {ai.monthlyLimit} 次 · 仅在你按下按钮时使用
          </small>
        </div>
        <button className="quiet" disabled={thinking} onClick={runAi}>
          {thinking ? "正在想…" : "让 AI 想一个"}
        </button>
      </div>
      {reply && <div className="ai-reply">{reply}</div>}
      <div className="auto-flow" aria-label="AI 自动完成内容流程">
        <span>AI 会自动补齐</span><b>开场钩子</b><b>故事节奏</b><b>台词</b><b>镜头提示</b><b>发布文案</b>
      </div>
      <p className="engine-note">
        默认 AI 首次使用会要求登入 Puter；若你切换自定义接口，Key
        只留在当前设备。
      </p>
      <div className="conceptgrid">
        {choices.map((c) => (
          <article
            className={`concept ${selected.title === c.title ? "picked" : ""}`}
            key={c.title}
          >
            <div className="concepttop">
              <small>{c.kind}</small>
              <b>
                {c.score}
                <i>/100</i>
              </b>
            </div>
            <h2>{c.title}</h2>
            <p>{c.idea}</p>
            <dl>
              <dt>开场钩子</dt>
              <dd>{c.hook}</dd>
              <dt>故事冲突</dt>
              <dd>{c.conflict}</dd>
            </dl>
            <div className="pills">
              <span>{c.platform}</span>
              <span>低制作压力</span>
            </div>
            <div className="conceptactions">
              <button onClick={() => setSelected(c)}>
                {selected.title === c.title ? "已选择" : "选这个"}
              </button>
              <button
                onClick={() => setBrief(`${brief}，我想发展「${c.title}」`)}
              >
                再发展
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="forward">
        <span>
          已选方向：<b>{selected.title}</b>
        </span>
        <button className="primary" onClick={() => go("script")}>
          生成拍摄包 <b>→</b>
        </button>
      </div>
    </>
  );
}
function readAiText(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const item = value as {
      message?: { content?: string };
      content?: string;
      text?: string;
      toString?: () => string;
    };
    return (
      item.message?.content ||
      item.content ||
      item.text ||
      item.toString?.() ||
      "AI 没有返回文字。"
    );
  }
  return "AI 没有返回文字。";
}
function makeConcepts(
  input: string,
  platform: string,
  seed: number,
): Concept[] {
  const subject = input.trim() || "这个想法";
  return baseConcepts.map((item, index) => ({
    ...item,
    platform,
    title: [
      `关于「${subject}」，大家最容易误会的地方`,
      `我没想到「${subject}」会变成这样`,
      `别急着做「${subject}」，先看这一点`,
      `我用一天测试「${subject}」`,
    ][(index + seed) % 4],
    idea: `${item.idea} ${platform === "小红书" ? "把重点写得具体，让人愿意收藏。" : platform === "TikTok" ? "前一秒就让人看到反差。" : "让画面先说话，再给观点。"}`,
    score: Math.max(74, item.score - seed + index),
  }));
}
function Blueprint({
  beats,
  setBeats,
  go,
}: {
  beats: Beat[];
  setBeats: (beats: Beat[]) => void;
  go: (route: Route) => void;
}) {
  const move = (index: number, direction: number) => {
    const destination = index + direction;
    if (destination < 0 || destination >= beats.length) return;
    const copy = [...beats];
    [copy[index], copy[destination]] = [copy[destination], copy[index]];
    setBeats(copy);
  };
  return (
    <>
      <div className="blueprintintro">
        <p>
          一个故事不必写得很长。把它拆成六个有感觉的节拍，再决定每一拍怎么说。
        </p>
        <button className="quiet">给我另一种节奏</button>
      </div>
      <div className="beats">
        {beats.map((beat, index) => (
          <article key={beat.id}>
            <div className="beatmark">
              <b>{String(index + 1).padStart(2, "0")}</b>
              <span>{beat.label}</span>
              <div>
                <button onClick={() => move(index, -1)}>↑</button>
                <button onClick={() => move(index, 1)}>↓</button>
              </div>
            </div>
            <textarea
              value={beat.text}
              onChange={(e) =>
                setBeats(
                  beats.map((value) =>
                    value.id === beat.id
                      ? { ...value, text: e.target.value }
                      : value,
                  ),
                )
              }
            />
            <button
              className="alternate"
              onClick={() =>
                setBeats(
                  beats.map((value) =>
                    value.id === beat.id
                      ? {
                          ...value,
                          text: `${value.text}（换一种更口语的说法）`,
                        }
                      : value,
                  ),
                )
              }
            >
              换一种说法
            </button>
          </article>
        ))}
      </div>
      <div className="forward">
        <span>6 个故事节拍 · 可编辑 · 可调顺序</span>
        <button className="primary" onClick={() => go("script")}>
          打开剧本工作台 <b>→</b>
        </button>
      </div>
    </>
  );
}
function Script({
  scenes,
  setScenes,
  go,
}: {
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  go: (route: Route) => void;
}) {
  const [active, setActive] = useState(0);
  const scene = scenes[active];
  const update = (key: keyof Scene, value: string) =>
    setScenes(
      scenes.map((item, index) =>
        index === active ? { ...item, [key]: value } : item,
      ),
    );
  return (
    <div className="shoot-pack">
      <div className="shoot-pack__intro">
        <div><p className="eyebrow">READY TO SHOOT</p><h2>照着拍就好，不用懂分镜。</h2><p>一支短片被拆成 {scenes.length} 段。每段拍完再拍下一段；想改就直接改文字。</p></div>
        <button className="quiet" onClick={() => go("review")}>拍完，帮我检查 →</button>
      </div>
      <div className="shot-tabs" aria-label="拍摄段落">
        {scenes.map((item, index) => <button key={item.id} className={index === active ? "active" : ""} onClick={() => setActive(index)}><small>第 {index + 1} 段 · {item.duration}</small><b>{item.title}</b></button>)}
      </div>
      <section className="shoot-card">
        <div className="shoot-card__head"><span>现在拍 · 第 {active + 1} 段</span><input aria-label="这一段的标题" value={scene.title} onChange={(e) => update("title", e.target.value)} /></div>
        <div className="shoot-step"><b>1</b><div><small>你要说什么</small><textarea aria-label="台词" value={scene.dialogue} onChange={(e) => update("dialogue", e.target.value)} /></div></div>
        <div className="shoot-step"><b>2</b><div><small>手机怎么拍</small><textarea aria-label="拍摄方式" value={`${scene.camera}。${scene.action}`} onChange={(e) => { const [camera, ...action] = e.target.value.split("。"); update("camera", camera); update("action", action.join("。").trim()); }} /></div></div>
        <details className="shoot-details"><summary>需要才看：地点、人物与小提醒</summary><div className="shoot-details__grid"><Field label="地点" value={scene.location} change={(value) => update("location", value)} /><Field label="出镜的人" value={scene.people} change={(value) => update("people", value)} /><Editor label="小提醒" value={scene.note} change={(value) => update("note", value)} /></div></details>
        <div className="shoot-next"><span>拍好这一段后，点下一段继续。</span>{active < scenes.length - 1 ? <button className="primary" onClick={() => setActive(active + 1)}>下一段 <b>→</b></button> : <button className="primary" onClick={() => go("review")}>全部拍好了 <b>→</b></button>}</div>
      </section>
    </div>
  );
}
function Field({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input value={value} onChange={(e) => change(e.target.value)} />
    </label>
  );
}
function Editor({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: (value: string) => void;
}) {
  return (
    <label className="editorfield">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => change(e.target.value)} />
    </label>
  );
}
function Review({ go }: { go: (route: Route) => void }) {
  const scores = [
    ["开场吸引力", 89],
    ["看完机会", 84],
    ["故事连贯", 87],
    ["情绪感染", 76],
    ["愿意分享", 82],
    ["表达清楚", 92],
    ["内容价值", 88],
    ["收尾互动", 79],
  ];
  return (
    <>
      <div className="reviewnote">
        <b>创意复盘</b>
        <span>这是创作方向的提醒，不是假装精确的流量预测。</span>
      </div>
      <div className="scores">
        {scores.map(([name, score]) => (
          <div key={String(name)}>
            <span>{name}</span>
            <b>{score}</b>
            <i>
              <em style={{ width: `${score}%` }} />
            </i>
          </div>
        ))}
      </div>
      <div className="reviewgrid">
        <Section title="已经做对的事" note="保留它们">
          <ul>
            <li>开头不是先解释，而是先让人好奇。</li>
            <li>故事有一个能被看见的具体瞬间。</li>
            <li>观点放在后面，听起来不像硬广告。</li>
          </ul>
        </Section>
        <Section title="再好一点的方法" note="不用大改">
          <ul>
            <li>第一句再短一点，留出半秒反应。</li>
            <li>给冲突加一个人物表情或动作。</li>
            <li>结尾用提问取代「记得关注」。</li>
          </ul>
        </Section>
      </div>
      <div className="forward">
        <span>导演复盘完成</span>
        <button className="primary" onClick={() => go("today")}>
          回到今日情报 <b>→</b>
        </button>
      </div>
    </>
  );
}
function Templates({ useTemplate }: { useTemplate: (value: string) => void }) {
  return (
    <div className="templatelibrary">
      <p>每一套只是开始方式，不会把你锁成固定的 AI 文案。</p>
      <div>
        {templates.map((template, index) => (
          <button key={template} onClick={() => useTemplate(template)}>
            <small>{String(index + 1).padStart(2, "0")} / 创作形式</small>
            <b>{template}</b>
            <span>用这个开始 →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
function AiSettingsPanel({
  ai,
  setAi,
}: {
  ai: AiSettings;
  setAi: (value: AiSettings) => void;
}) {
  const remaining = Math.max(0, ai.monthlyLimit - ai.used);
  const reset = () =>
    setAi({
      ...ai,
      provider: "puter",
      customBaseUrl: "",
      customKey: "",
      customModel: "gpt-4o-mini",
    });
  return (
    <section className="ai-settings">
      <div className="ai-meter">
        <p>本月 AI 创作额度</p>
        <strong>
          {remaining}
          <small> / {ai.monthlyLimit} 次剩余</small>
        </strong>
        <i>
          <em
            style={{
              width: `${ai.monthlyLimit ? (ai.used / ai.monthlyLimit) * 100 : 0}%`,
            }}
          />
        </i>
        <span>已使用 {ai.used} 次；达到上限后，QV WORK 不再发送请求。</span>
      </div>
      <div className="ai-form">
        <h3>选择 AI 模式</h3>
        <div className="provider-choice">
          <button
            className={ai.provider === "puter" ? "active" : ""}
            onClick={() => setAi({ ...ai, provider: "puter" })}
          >
            <b>QV 默认 AI</b>
            <small>Puter 多模型 · 首次使用登入 Puter</small>
          </button>
          <button
            className={ai.provider === "custom" ? "active" : ""}
            onClick={() => setAi({ ...ai, provider: "custom" })}
          >
            <b>自定义接口</b>
            <small>OpenAI 兼容 API · 使用你的 Key</small>
          </button>
          <button
            className={ai.provider === "gemini" ? "active" : ""}
            onClick={() => setAi({ ...ai, provider: "gemini" })}
          >
            <b>我的 Gemini Key</b>
            <small>只要贴上 API Key · 不需要项目编号</small>
          </button>
        </div>
        {ai.provider === "gemini" ? (
          <div className="custom-api">
            <p><b>最简单的 Gemini 设置：</b>只贴 API Key。截图中的 <code>gen-lang-client-…</code> 是项目编号，不需要填写。</p>
            <label>
              Gemini API Key
              <input
                type="password"
                value={ai.geminiKey || ""}
                onChange={(e) => setAi({ ...ai, geminiKey: e.target.value })}
                placeholder="贴上 Google AI Studio 建立的 API Key"
                autoComplete="off"
              />
            </label>
            <button className="quiet" onClick={reset}>恢复 QV 默认 AI</button>
          </div>
        ) : ai.provider === "custom" ? (
          <div className="custom-api">
            <label>
              接口基础地址
              <input
                value={ai.customBaseUrl}
                onChange={(e) =>
                  setAi({ ...ai, customBaseUrl: e.target.value })
                }
                placeholder="例如 https://api.openai.com/v1"
              />
            </label>
            <label>
              模型名称
              <input
                value={ai.customModel}
                onChange={(e) => setAi({ ...ai, customModel: e.target.value })}
                placeholder="例如 gpt-4o-mini"
              />
            </label>
            <label>
              API Key
              <input
                type="password"
                value={ai.customKey}
                onChange={(e) => setAi({ ...ai, customKey: e.target.value })}
                placeholder="只保存在此设备"
                autoComplete="off"
              />
            </label>
            <button className="quiet" onClick={reset}>
              恢复 QV 默认 AI
            </button>
          </div>
        ) : (
          <p>
            默认使用
            Puter。它会在第一次生成内容时要求登入，之后你可以在任何时候切换为自己的接口。
          </p>
        )}
        <label>
          每月最多使用次数
          <input
            type="number"
            min="1"
            max="500"
            value={ai.monthlyLimit}
            onChange={(e) =>
              setAi({
                ...ai,
                monthlyLimit: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />
        </label>
        <button
          className="quiet"
          onClick={() => setAi({ ...ai, used: 0, resetMonth: monthKey() })}
        >
          重置本月计数
        </button>
        <p className="ai-note">
          自定义 Key
          只存在当前浏览器。正式多人帐户版本会改由服务器按帐号限制额度。
        </p>
      </div>
    </section>
  );
}
