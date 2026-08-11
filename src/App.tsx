import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Route =
  | "today"
  | "new"
  | "director"
  | "blueprint"
  | "script"
  | "review"
  | "templates";
type BlueprintBlock = { id: string; label: string; text: string };
type Concept = {
  title: string;
  kind: string;
  idea: string;
  hook: string;
  conflict: string;
  tone: string;
  platform: string;
  difficulty: string;
  strength: string;
  risk: string;
  score: number;
};
type Scene = {
  number: string;
  title: string;
  duration: string;
  location: string;
  characters: string;
  action: string;
  dialogue: string;
  camera: string;
  emotion: string;
  props: string;
  notes: string;
};

const concepts: Concept[] = [
  {
    kind: "OFFICE COMEDY",
    title: "老板的电费审判",
    idea: "一张账单，把全办公室变成嫌疑人。",
    hook: "“谁把冷气开了 24 小时？”",
    conflict: "老板要抓出耗电元凶。",
    tone: "Dry comedy",
    platform: "TikTok / Reels",
    difficulty: "Low",
    strength: "高共鸣",
    risk: "笑点要克制",
    score: 91,
  },
  {
    kind: "MYTH VS FACT",
    title: "太阳能不等于免费电",
    idea: "用一个看似荒谬的问答，拆掉最常见误解。",
    hook: "“装了太阳能，为什么还有电费？”",
    conflict: "期待与真实机制的落差。",
    tone: "Sharp, helpful",
    platform: "Shorts",
    difficulty: "Medium",
    strength: "高价值",
    risk: "避免术语堆叠",
    score: 88,
  },
  {
    kind: "CUSTOMER STORY",
    title: "那张让她迟疑三个月的账单",
    idea: "从客户犹豫，到亲自看懂用电曲线。",
    hook: "“她以为只是账单变贵了。”",
    conflict: "不敢投入，也不想继续浪费。",
    tone: "Warm documentary",
    platform: "Facebook / YouTube",
    difficulty: "Medium",
    strength: "高信任",
    risk: "节奏偏慢",
    score: 84,
  },
  {
    kind: "EXPERIMENT",
    title: "办公室耗电 60 秒实验",
    idea: "逐一关掉设备，让账单数字有画面。",
    hook: "“我们来看看谁最会偷电。”",
    conflict: "肉眼看不见的日常消耗。",
    tone: "Curious, playful",
    platform: "TikTok",
    difficulty: "Medium",
    strength: "高分享",
    risk: "需要现场拍摄",
    score: 86,
  },
];
const defaultBlueprint: BlueprintBlock[] = [
  {
    id: "hook",
    label: "HOOK",
    text: "老板把电费单拍在桌上：“谁把冷气开了 24 小时？”",
  },
  {
    id: "conflict",
    label: "CONFLICT",
    text: "每个人都说不是自己，但账单数字不说谎。",
  },
  {
    id: "escalation",
    label: "ESCALATION",
    text: "镜头切到不断亮着的空会议室与设备。",
  },
  {
    id: "twist",
    label: "TWIST",
    text: "真正的原因不是一个人，而是没有被看见的用电习惯。",
  },
  { id: "value", label: "VALUE", text: "用太阳能与用电监测，让消费变得可见。" },
  {
    id: "cta",
    label: "CTA",
    text: "想知道你的办公室在偷走多少电？留言“BILL”。",
  },
];
const initialScenes: Scene[] = [
  {
    number: "01",
    title: "OFFICE — DAY",
    duration: "7s",
    location: "办公室",
    characters: "老板、员工",
    action: "老板看着电费单，慢慢抬头。",
    dialogue: "老板：“谁把冷气开了 24 小时？”",
    camera: "Medium shot → slow push-in",
    emotion: "Confused / annoyed",
    props: "电费单、马克杯",
    notes: "停顿半秒再说台词。",
  },
  {
    number: "02",
    title: "EMPTY MEETING ROOM — DAY",
    duration: "6s",
    location: "会议室",
    characters: "无",
    action: "空房间的冷气仍亮着。",
    dialogue: "VO：“有些电，从来没人看见。”",
    camera: "Wide shot → detail insert",
    emotion: "Absurd",
    props: "遥控器、灯",
    notes: "用环境声做转场。",
  },
  {
    number: "03",
    title: "OFFICE — DAY",
    duration: "8s",
    location: "办公室",
    characters: "老板",
    action: "老板看向镜头，语气放缓。",
    dialogue: "老板：“先看懂，才省得下来。”",
    camera: "Eye-level medium",
    emotion: "Clear / reassuring",
    props: "平板图表",
    notes: "结尾保留 CTA 版位。",
  },
];
const templates = [
  "Office Comedy",
  "Knowledge Short",
  "Myth vs Fact",
  "Customer Story",
  "Before & After",
  "Mini Drama",
  "Product Education",
  "Challenge",
  "POV",
  "Documentary Style",
  "Founder / Boss IP",
  "Employee IP",
  "FAQ",
  "Storytelling",
  "Soft Sell",
  "Hard Sell",
];

export default function App() {
  const [route, setRoute] = useState<Route>("today");
  const [project, setProject] = useLocalState(
    "creatoros.project",
    "SPOWER Solar",
  );
  const [selected, setSelected] = useLocalState<Concept>(
    "creatoros.concept",
    concepts[0],
  );
  const [blocks, setBlocks] = useLocalState(
    "creatoros.blueprint",
    defaultBlueprint,
  );
  const [scenes, setScenes] = useLocalState("creatoros.scenes", initialScenes);
  const [activeScene, setActiveScene] = useState(0);
  const [notice, setNotice] = useState("");
  const [language, setLanguage] = useLocalState<"zh" | "en">(
    "creatoros.language",
    "zh",
  );
  const [brief, setBrief] = useLocalState(
    "creatoros.brief",
    "为什么我的电费还是很高？",
  );
  const go = (r: Route) => {
    setRoute(r);
    setNotice("");
  };
  const step: Route[] = ["new", "director", "blueprint", "script", "review"];
  const stepIndex = step.indexOf(route);
  const save = () => {
    setNotice("已保存到当前项目");
  };
  const moveBlock = (idx: number, delta: number) => {
    const n = idx + delta;
    if (n < 0 || n >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[n]] = [next[n], next[idx]];
    setBlocks(next);
  };
  const updateScene = (key: keyof Scene, value: string) =>
    setScenes((s) =>
      s.map((x, i) => (i === activeScene ? { ...x, [key]: value } : x)),
    );
  const nav = (language === "zh" ? [["today", "今日情报"],["new", "新建项目"],["director", "导演室"],["blueprint", "故事蓝图"],["script", "剧本编辑器"],["review", "导演复盘"],["templates", "模板库"]] : [["today", "Today"],["new", "New creation"],["director", "Director room"],["blueprint", "Story blueprint"],["script", "Script editor"],["review", "Director review"],["templates", "Template library"]]) as [Route, string][];
  const current = useMemo(() => scenes[activeScene], [scenes, activeScene]);
  return (
    <div className="shell">
      <aside className="rail">
        <button className="brand" onClick={() => go("today")}>
          <i></i>Creator<b>OS</b>
        </button>
        <div className="nav">
          {nav.map(([id, label]) => (
            <button
              key={id}
              className={route === id ? "on" : ""}
              onClick={() => go(id)}
            >
              <span>
                {label === "Today" ? "◫" : label === "New creation" ? "+" : "—"}
              </span>
              {label}
            </button>
          ))}
        </div>
        <div className="railfoot">
          <div className="avatar">Q</div>
          <div>
            <strong>Qui</strong>
            <small>Creative workspace</small>
          </div>
        </div>
      </aside>
      <main className="canvas">
        <header className="mast">
          <div>
            <p className="eyebrow">CREATOROS / ALPHA 0.1</p>
            <h1>
              {route === "today"
                ? language === "zh"
                  ? "今天想创作什么？"
                  : "What will you make today?"
                : route === "director"
                  ? language === "zh"
                    ? "导演室"
                    : "Director room"
                  : route === "blueprint"
                    ? language === "zh"
                      ? "故事蓝图"
                      : "Story blueprint"
                    : route === "script"
                      ? language === "zh"
                        ? "剧本编辑器"
                        : "Script editor"
                      : route === "review"
                        ? language === "zh"
                          ? "导演复盘"
                          : "Director review"
                        : route === "templates"
                          ? language === "zh"
                            ? "模板库"
                            : "Template library"
                          : language === "zh"
                            ? "新建项目"
                            : "New project"}
            </h1>
          </div>
          <div className="topactions">
            <button
              className="quiet"
              onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
            >
              {language === "zh" ? "EN" : "中文"}
            </button>
            {route !== "new" && route !== "templates" && (
              <button className="quiet" onClick={save}>
                {language === "zh" ? "保存更改" : "Save changes"}
              </button>
            )}
          </div>
        </header>
        {notice && <div className="toast">{notice}</div>}
        {route !== "today" && route !== "new" && route !== "templates" && (
          <div className="journey">
            {[
              "Project",
              "Director Room",
              "Blueprint",
              "Script",
              "Review",
              "Export",
            ].map((x, i) => (
              <span key={x} className={i <= stepIndex + 1 ? "done" : ""}>
                {x}
              </span>
            ))}
          </div>
        )}
        {route === "today" && (language === "zh" ? <TodayMalaysia project={project} go={go} /> : <TodayIntelligence project={project} go={go} />)}{" "}
        {route === "new" && (
          <NewProject
            project={project}
            setProject={setProject}
            submit={() => go("director")}
          />
        )}{" "}
        {route === "director" && (
          <Director
            selected={selected}
            setSelected={setSelected}
            next={() => go("blueprint")}
            brief={brief}
            setBrief={setBrief}
            language={language}
          />
        )}{" "}
        {route === "blueprint" && (
          <Blueprint
            blocks={blocks}
            setBlocks={setBlocks}
            move={moveBlock}
            next={() => go("script")}
          />
        )}{" "}
        {route === "script" && (
          <Script
            scenes={scenes}
            current={current}
            active={activeScene}
            setActive={setActiveScene}
            update={updateScene}
            add={() => {
              setScenes([
                ...scenes,
                {
                  ...initialScenes[0],
                  number: String(scenes.length + 1).padStart(2, "0"),
                  title: "NEW SCENE",
                },
              ]);
              setActiveScene(scenes.length);
            }}
            next={() => go("review")}
          />
        )}{" "}
        {route === "review" && <Review go={go} />}{" "}
        {route === "templates" && <Templates useTemplate={() => go("new")} />}
      </main>
    </div>
  );
}

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

function TodayIntelligence({ project, go }: { project: string; go: (r: Route) => void }) {
  const opportunities = [
    { title: "Why is my electricity bill still high?", score: 98, reason: "Search interest is rising, while practical office stories remain underused." },
    { title: "Can solar still generate power on cloudy days?", score: 96, reason: "Weather makes this timely and audience questions are high-intent." },
    { title: "The office aircond bill test", score: 93, reason: "A familiar conflict with a strong comedy hook and easy production." },
    { title: "Solar scams: 3 questions to ask first", score: 91, reason: "Builds trust with a lower-competition education angle." },
  ];
  return <><section className="director-call"><div><p className="eyebrow">TODAY INTELLIGENCE · {project.toUpperCase()}</p><h2>Good afternoon. <em>12 opportunities are worth your attention.</em></h2><p>Ranked for your brand, current series and audience — not raw trends alone.</p></div><button className="primary" onClick={() => go("director")}>Start a director session <b>→</b></button></section><section className="split"><div><Section title="Opportunity Radar" note="Why this is worth your time"><div className="opportunities">{opportunities.map((item, index) => <article key={item.title}><div className="opp-score"><small>0{index + 1}</small><b>{item.score}</b></div><div><span>HIGH OPPORTUNITY</span><h4>{item.title}</h4><p>{item.reason}</p></div><button onClick={() => go("director")}>Direct →</button></article>)}</div></Section><Section title="Creative fusion" note="Use a familiar format, keep your own point of view"><div className="ideas">{concepts.slice(0, 3).map((c) => <button key={c.title} onClick={() => go("director")}><small>{c.kind}</small><b>{c.title}</b><span>{c.hook}</span></button>)}</div></Section></div><div><Section title="Continue the work" note="No lost context"><div className="projectlist"><button onClick={() => go("blueprint")}><span className="projectdot"></span><div><b>{project}</b><small>Story Blueprint</small></div><em>72%</em></button><button onClick={() => go("director")}><span className="projectdot"></span><div><b>Office Comedy</b><small>Series · Episode 18</small></div><em>Ready</em></button></div></Section><Section title="Today’s signal" note="Prepared for your next decision"><button className="scriptlink" onClick={() => go("script")}>Office bill comedy <span>OPEN SCRIPT →</span></button></Section></div></section></>;
}

function TodayMalaysia({ project, go }: { project: string; go: (r: Route) => void }) {
  const [radar, setRadar] = useState<{ updatedAt: string; recommendations: { source: string; topic: string; format: string; localAngle: string; readiness: number }[] } | null>(null);
  useEffect(() => { fetch('./data/malaysia-trends.json').then(response => response.json()).then(setRadar).catch(() => setRadar(null)); }, []);
  return <><section className="director-call"><div><p className="eyebrow">马来西亚创作情报 · {project.toUpperCase()}</p><h2>今天，不用从零开始想。<em>先看哪里有机会。</em></h2><p>趋势只是起点；QV WORK 帮你找适合自己 IP 的拍法。</p></div><button className="primary" onClick={() => go("director")}>开始导演会议 <b>→</b></button></section><section className="section"><div className="sectionhead"><h3>跨平台创意雷达</h3><span>{radar ? `更新于 ${new Date(radar.updatedAt).toLocaleTimeString('zh-MY', { hour: '2-digit', minute: '2-digit' })}` : '正在更新情报'}</span></div><div className="radar-grid">{radar?.recommendations.map(item => <article key={item.source}><small>{item.source} · 可借鉴结构</small><b>{item.topic}</b><span>{item.format}</span><p>{item.localAngle}</p><footer><em>机会值 {item.readiness}</em><button onClick={() => go('director')}>用这个方向 →</button></footer></article>) ?? <p>正在准备本地创作机会…</p>}</div></section><section className="split"><div><Section title="你可以先拍" note="适合马上进入导演室"><div className="ideas">{concepts.slice(0, 3).map((c) => <button key={c.title} onClick={() => go("director")}><small>{c.kind}</small><b>{c.title}</b><span>{c.hook}</span></button>)}</div></Section></div><div><Section title="继续创作" note="故事不会断"><div className="projectlist"><button onClick={() => go("blueprint")}><span className="projectdot"></span><div><b>{project}</b><small>故事蓝图</small></div><em>72%</em></button></div></Section></div></section></>;
}

function TodayChinese({ project, go }: { project: string; go: (r: Route) => void }) {
  const opportunities = [
    ["为什么我的电费还是很高？", 98, "搜索热度正在上升，但实用的办公室故事还不多。"],
    ["阴天太阳能还能发电吗？", 96, "天气让这个问题更及时，用户的提问意图很明确。"],
    ["办公室空调电费实验", 93, "熟悉的冲突，适合低成本拍成有节奏的喜剧。"],
    ["太阳能骗局：先问这 3 个问题", 91, "用较低竞争的知识角度建立品牌信任。"],
  ];
  return <><section className="director-call"><div><p className="eyebrow">今日创作情报 · {project.toUpperCase()}</p><h2>下午好。<em>今天有 12 个值得你拍的机会。</em></h2><p>按你的品牌、受众与现有系列筛选，不只是展示热门趋势。</p></div><button className="primary" onClick={() => go("director")}>开始导演会议 <b>→</b></button></section><section className="split"><div><Section title="机会雷达" note="为什么今天值得拍"><div className="opportunities">{opportunities.map(([title, score, reason], index) => <article key={title}><div className="opp-score"><small>0{index + 1}</small><b>{score}</b></div><div><span>高机会</span><h4>{title}</h4><p>{reason}</p></div><button onClick={() => go("director")}>开始创作 →</button></article>)}</div></Section><Section title="创意融合" note="借用形式，保留自己的观点"><div className="ideas">{concepts.slice(0, 3).map((c) => <button key={c.title} onClick={() => go("director")}><small>{c.kind}</small><b>{c.title}</b><span>{c.hook}</span></button>)}</div></Section></div><div><Section title="继续进行中的工作" note="不丢失上下文"><div className="projectlist"><button onClick={() => go("blueprint")}><span className="projectdot"></span><div><b>{project}</b><small>故事蓝图</small></div><em>72%</em></button><button onClick={() => go("director")}><span className="projectdot"></span><div><b>办公室喜剧</b><small>系列 · 第 18 集</small></div><em>可继续</em></button></div></Section><Section title="今天的提示" note="为你的下一步准备"><button className="scriptlink" onClick={() => go("script")}>办公室电费喜剧 <span>打开剧本 →</span></button></Section></div></section></>;
}

function Dashboard({
  project,
  go,
}: {
  project: string;
  go: (r: Route) => void;
}) {
  return (
    <>
      <section className="director-call">
        <div>
          <p className="eyebrow">ON THE SLATE</p>
          <h2>
            {project}: <em>老板的电费审判</em>
          </h2>
          <p>Short-form vertical · Story Blueprint · Last edited 2h ago</p>
        </div>
        <button className="primary" onClick={() => go("blueprint")}>
          Continue making <b>→</b>
        </button>
      </section>
      <section className="split">
        <div>
          <Section
            title="Start with an intention"
            note="Choose a working direction"
          >
            <button className="creation" onClick={() => go("new")}>
              <b>＋</b>
              <span>
                New creation<small>Build a project, not a prompt</small>
              </span>
              <i>→</i>
            </button>
          </Section>
          <Section title="Suggested for today" note="Built for SPOWER Solar">
            <div className="ideas">
              {concepts.slice(0, 3).map((c) => (
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
          <Section title="Recent projects" note="3 active">
            <div className="projectlist">
              {["SPOWER Solar", "Kedah Café opening", "EON delivery vlog"].map(
                (x, i) => (
                  <button
                    key={x}
                    onClick={() => go(i ? "director" : "blueprint")}
                  >
                    <span className="projectdot"></span>
                    <div>
                      <b>{x}</b>
                      <small>
                        {i === 0 ? "Story Blueprint" : "Director Room"}
                      </small>
                    </div>
                    <em>{i === 0 ? "72%" : "Draft"}</em>
                  </button>
                ),
              )}
            </div>
          </Section>
          <Section title="Recent scripts" note="Open a draft">
            <button className="scriptlink" onClick={() => go("script")}>
              Office bill comedy <span>SCENE 01–03</span>
            </button>
          </Section>
        </div>
      </section>
    </>
  );
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
function NewProject({
  project,
  setProject,
  submit,
}: {
  project: string;
  setProject: (x: string) => void;
  submit: () => void;
}) {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };
  return (
    <form className="projectform" onSubmit={onSubmit}>
      <div className="formintro">
        <p className="eyebrow">A NEW PRODUCTION</p>
        <h2>Give the work a proper brief.</h2>
        <p>CreatorOS will use this context throughout the creative flow.</p>
      </div>
      <div className="fields">
        <label>
          Project name
          <input value={project} onChange={(e) => setProject(e.target.value)} />
        </label>
        <label>
          Industry
          <select defaultValue="Solar">
            <option>Solar</option>
            <option>Real Estate</option>
            <option>Restaurant</option>
            <option>Automotive</option>
            <option>Education</option>
            <option>Beauty</option>
            <option>Insurance</option>
            <option>Personal Creator</option>
            <option>Custom</option>
          </select>
        </label>
        <label>
          Brand / Creator name
          <input defaultValue="SPOWER Solar" />
        </label>
        <label>
          Content goal
          <select defaultValue="Educate">
            <option>Grow Followers</option>
            <option>Build Personal IP</option>
            <option>Brand Awareness</option>
            <option>Educate</option>
            <option>Generate Leads</option>
            <option>Sell Product</option>
            <option>Entertainment</option>
          </select>
        </label>
        <label>
          Target audience
          <input defaultValue="Malaysian homeowners and small businesses" />
        </label>
        <label>
          Primary platform
          <select defaultValue="TikTok">
            <option>TikTok</option>
            <option>Instagram Reels</option>
            <option>YouTube Shorts</option>
            <option>YouTube</option>
            <option>Facebook</option>
            <option>Xiaohongshu</option>
            <option>Other</option>
          </select>
        </label>
        <label className="wide">
          Content style
          <select defaultValue="Office comedy + education">
            <option>Office comedy + education</option>
            <option>Knowledge story</option>
            <option>Customer story</option>
            <option>Documentary</option>
            <option>POV</option>
          </select>
        </label>
      </div>
      <button className="primary" type="submit">
        Enter Director Room <b>→</b>
      </button>
    </form>
  );
}
function Director({
  selected,
  setSelected,
  next,
  brief,
  setBrief,
  language,
}: {
  selected: Concept;
  setSelected: (x: Concept) => void;
  next: () => void;
  brief: string;
  setBrief: (x: string) => void;
  language: "zh" | "en";
}) {
  const [seed, setSeed] = useState(0);
  const [platform, setPlatform] = useLocalState("qv-work.platform", "TikTok");
  const choices = useMemo(
    () => recommend(brief, language, seed, platform),
    [brief, language, seed, platform],
  );
  return (
    <>
      <div className="platform-modes" aria-label="Platform creative mode">
        {['TikTok','Instagram Reels','YouTube Shorts','YouTube','Facebook','Xiaohongshu'].map(item => <button key={item} className={platform === item ? 'active' : ''} onClick={() => setPlatform(item)}>{item}</button>)}
      </div>
      <div className="intent">
        <span>
          {language === "zh" ? "本地创意导演" : "Local creative director"}
        </span>
        <input
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder={
            language === "zh"
              ? "输入任何想法、产品或场景…"
              : "Type any idea, product, or situation…"
          }
        />
        <button className="quiet" onClick={() => setSeed((x) => x + 1)}>
          {language === "zh" ? "生成推荐" : "Recommend"}
        </button>
      </div>
      <p className="engine-note">
        {language === "zh"
          ? "离线规则引擎：按主题、语气与平台生成方向，不会发送你的文字。"
          : "Offline creative engine: generates directions from topic, tone and platform. Your text stays on this device."}
      </p>
      <div className="conceptgrid">
        {choices.map((c) => (
          <article
            className={
              "concept " + (selected.title === c.title ? "picked" : "")
            }
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
              <dt>OPENING HOOK</dt>
              <dd>{c.hook}</dd>
              <dt>CONFLICT</dt>
              <dd>{c.conflict}</dd>
            </dl>
            <div className="pills">
              <span>{c.tone}</span>
              <span>{c.platform}</span>
              <span>{c.difficulty} effort</span>
            </div>
            <div className="strength">
              <span>
                Strength <b>{c.strength}</b>
              </span>
              <span>
                Risk <b>{c.risk}</b>
              </span>
            </div>
            <div className="conceptactions">
              <button onClick={() => setSelected(c)}>
                {selected.title === c.title
                  ? language === "zh"
                    ? "已选择"
                    : "Selected"
                  : language === "zh"
                    ? "使用概念"
                    : "Use concept"}
              </button>
              <button onClick={() => setSelected(c)}>
                {language === "zh" ? "深化" : "Develop"}
              </button>
              <button aria-label="Alternative version">↻</button>
              <button aria-label="Reject concept">×</button>
            </div>
          </article>
        ))}
      </div>
      <div className="forward">
        <span>
          {language === "zh" ? "已选方向：" : "Selected direction:"}{" "}
          <b>{selected.title}</b>
        </span>
        <button className="primary" onClick={next}>
          {language === "zh" ? "制作故事蓝图" : "Build story blueprint"}{" "}
          <b>→</b>
        </button>
      </div>
    </>
  );
}

function recommend(
  input: string,
  language: "zh" | "en",
  seed: number,
  platform: string,
): Concept[] {
  const text = input.toLowerCase();
  const solar = /solar|太阳|电费|electric|bill|energy/.test(text);
  const comedy = /comedy|搞笑|好笑|funny/.test(text);
  const subject = solar
    ? language === "zh"
      ? "电费"
      : "electricity bill"
    : input.trim() || (language === "zh" ? "这个想法" : "this idea");
  const labels =
    language === "zh"
      ? ["办公室喜剧", "知识故事", "迷思破解", "实验挑战"]
      : ["OFFICE COMEDY", "KNOWLEDGE STORY", "MYTH VS FACT", "EXPERIMENT"];
  const titles =
    language === "zh"
      ? [
          `${subject} 的隐藏真相`,
          `${subject}：老板不知道的那一面`,
          `${subject} 到底值不值？`,
          `${subject} 的 60 秒实验`,
        ]
      : [
          `The hidden truth about ${subject}`,
          `What the boss misses about ${subject}`,
          `Is ${subject} actually worth it?`,
          `The 60-second ${subject} experiment`,
        ];
  const platformDirection: Record<string, { tone: string; hook: string; difficulty: string }> = {
    TikTok: { tone: "Fast, playful", hook: "Start with a surprising line in the first second.", difficulty: "Low" },
    "Instagram Reels": { tone: "Polished, relatable", hook: "Open with a visual contrast worth sharing.", difficulty: "Medium" },
    "YouTube Shorts": { tone: "Clear, punchy", hook: "Promise the answer, then earn the reveal.", difficulty: "Medium" },
    YouTube: { tone: "Useful, narrative", hook: "Set up a real question before the explanation.", difficulty: "High" },
    Facebook: { tone: "Warm, conversational", hook: "Begin with a familiar local situation.", difficulty: "Medium" },
    Xiaohongshu: { tone: "Personal, practical", hook: "Lead with a save-worthy problem and proof.", difficulty: "Medium" },
  };
  const mode = platformDirection[platform] ?? platformDirection.TikTok;
  return concepts.map((base, i) => ({
    ...base,
    platform,
    tone: mode.tone,
    difficulty: mode.difficulty,
    kind: labels[i],
    title: titles[(i + seed) % 4],
    idea:
      comedy && i === 0
        ? language === "zh"
          ? "把这个困扰拍成一场有节奏的办公室误会。"
          : "Turn the tension into a timed office misunderstanding."
        : `${base.idea} ${mode.hook}`,
    hook:
      language === "zh"
        ? `“${subject}，你真的看懂了吗？”`
        : `“Do you really understand your ${subject}?”`,
    score: Math.max(74, base.score - seed * 2 + i),
  }));
}
function Blueprint({
  blocks,
  setBlocks,
  move,
  next,
}: {
  blocks: BlueprintBlock[];
  setBlocks: (x: BlueprintBlock[]) => void;
  move: (x: number, d: number) => void;
  next: () => void;
}) {
  return (
    <>
      <div className="blueprintintro">
        <p>
          Move through the story in beats, not paragraphs. Select any beat to
          rewrite it.
        </p>
        <button className="quiet">Suggest alternate flow</button>
      </div>
      <div className="beats">
        {blocks.map((b, i) => (
          <article key={b.id}>
            <div className="beatmark">
              <b>{String(i + 1).padStart(2, "0")}</b>
              <span>{b.label}</span>
              <div>
                <button onClick={() => move(i, -1)}>↑</button>
                <button onClick={() => move(i, 1)}>↓</button>
              </div>
            </div>
            <textarea
              value={b.text}
              onChange={(e) =>
                setBlocks(
                  blocks.map((x) =>
                    x.id === b.id ? { ...x, text: e.target.value } : x,
                  ),
                )
              }
            />
            <button
              className="alternate"
              onClick={() =>
                setBlocks(
                  blocks.map((x) =>
                    x.id === b.id ? { ...x, text: x.text + "（替代版本）" } : x,
                  ),
                )
              }
            >
              ↻ Alternative
            </button>
          </article>
        ))}
      </div>
      <div className="forward">
        <span>6 narrative beats · Editable · Reorderable</span>
        <button className="primary" onClick={next}>
          Open Script Editor <b>→</b>
        </button>
      </div>
    </>
  );
}
function Script({
  scenes,
  current,
  active,
  setActive,
  update,
  add,
  next,
}: {
  scenes: Scene[];
  current: Scene;
  active: number;
  setActive: (n: number) => void;
  update: (key: keyof Scene, value: string) => void;
  add: () => void;
  next: () => void;
}) {
  return (
    <div className="scriptspace">
      <aside className="scenebar">
        <div className="sectionhead">
          <h3>Scenes</h3>
          <button onClick={add}>＋</button>
        </div>
        {scenes.map((s, i) => (
          <button
            key={s.number}
            className={i === active ? "active" : ""}
            onClick={() => setActive(i)}
          >
            <small>SCENE {s.number}</small>
            <b>{s.title}</b>
            <span>{s.duration}</span>
          </button>
        ))}
        <hr />
        <small>STORY STRUCTURE</small>
        <p>Hook → Conflict → Value</p>
        <small>CHARACTERS</small>
        <p>Boss · Employee</p>
      </aside>
      <section className="editor">
        <div className="scenehead">
          <div>
            <span>SCENE {current.number}</span>
            <input
              value={current.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <button className="quiet" onClick={next}>
            Review script →
          </button>
        </div>
        <div className="sceneinfo">
          <label>
            Duration
            <input
              value={current.duration}
              onChange={(e) => update("duration", e.target.value)}
            />
          </label>
          <label>
            Location
            <input
              value={current.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </label>
          <label>
            Characters
            <input
              value={current.characters}
              onChange={(e) => update("characters", e.target.value)}
            />
          </label>
        </div>
        <Editor
          label="Action"
          value={current.action}
          change={(v) => update("action", v)}
        />
        <Editor
          label="Dialogue"
          value={current.dialogue}
          change={(v) => update("dialogue", v)}
        />
      </section>
      <aside className="notebar">
        <h3>Director notes</h3>
        <Editor
          label="Camera"
          value={current.camera}
          change={(v) => update("camera", v)}
        />
        <Editor
          label="Emotion"
          value={current.emotion}
          change={(v) => update("emotion", v)}
        />
        <Editor
          label="Props"
          value={current.props}
          change={(v) => update("props", v)}
        />
        <Editor
          label="Production note"
          value={current.notes}
          change={(v) => update("notes", v)}
        />
      </aside>
    </div>
  );
}
function Editor({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
}) {
  return (
    <label className="editorfield">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => change(e.target.value)} />
    </label>
  );
}
function Review({ go }: { go: (r: Route) => void }) {
  const [boost, setBoost] = useState(0);
  const scores = [
    ["Hook", 89],
    ["Retention", 84],
    ["Story", 87],
    ["Emotion", 76],
    ["Shareability", 82],
    ["Clarity", 92],
    ["Value", 88],
    ["CTA", 79],
  ];
  return (
    <>
      <div className="reviewnote">
        <b>Creative evaluation scores</b>
        <span>
          These are directional creative notes, not scientific predictions.
        </span>
      </div>
      <div className="scores">
        {scores.map(([x, n]) => (
          <div key={x}>
            <span>{x}</span>
            <b>{Math.min(100, Number(n) + boost)}</b>
            <i>
              <em
                style={{ width: `${Math.min(100, Number(n) + boost)}%` }}
              ></em>
            </i>
          </div>
        ))}
      </div>
      <div className="reviewgrid">
        <Section title="Strengths" note="What is working">
          <ul>
            <li>The office premise is instantly legible.</li>
            <li>Bill reveal gives the story a clear conflict.</li>
            <li>Value lands without turning into an ad.</li>
          </ul>
        </Section>
        <Section title="Recommended improvements" note="One pass away">
          <ul>
            <li>Let the first silence run 0.5 seconds longer.</li>
            <li>Make the final line more conversational.</li>
            <li>Bring a staff reaction into scene 02.</li>
          </ul>
        </Section>
      </div>
      <div className="reviewactions">
        {[
          "Improve Hook",
          "Increase Comedy",
          "Shorten Script",
          "Improve CTA",
          "Make More Natural",
        ].map((x) => (
          <button key={x} onClick={() => setBoost((v) => v + 2)}>
            {x}
          </button>
        ))}
      </div>
      <div className="forward">
        <span>Director’s pass complete</span>
        <button className="primary" onClick={() => go("today")}>
          Export project <b>→</b>
        </button>
      </div>
    </>
  );
}
function Templates({ useTemplate }: { useTemplate: () => void }) {
  return (
    <div className="templatelibrary">
      <p>
        Industry-neutral starting forms. Each one becomes a brief, not a fixed
        script.
      </p>
      <div>
        {templates.map((t, i) => (
          <button key={t} onClick={useTemplate}>
            <small>{String(i + 1).padStart(2, "0")} / FORMAT</small>
            <b>{t}</b>
            <span>Use template →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
