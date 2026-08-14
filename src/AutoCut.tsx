import { ChangeEvent, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type Props = { goBack: () => void };
// Vite needs the ESM core. Using the UMD build makes the worker fail silently
// in some browsers even though the CDN file itself is reachable.
const coreBase = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

export default function AutoCut({ goBack }: Props) {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(45);
  const [status, setStatus] = useState("选一条原始视频，先免费试跑一版竖屏成片。");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const onChoose = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) return;
    setFile(selected); setResult(null); setProgress(0);
    setStatus(`已选：${selected.name}。文件只留在这台设备，不会上传。`);
  };
  const render = async () => {
    if (!file) return;
    setResult(null); setProgress(1);
    try {
      let ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        ffmpeg.on("progress", ({ progress: value }) => setProgress(Math.max(2, Math.min(98, Math.round(value * 100)))));
        ffmpeg.on("log", ({ message }) => {
          if (/error|invalid|failed/i.test(message)) setStatus(`处理提示：${message}`);
        });
        setStatus("第一次正在准备本机剪辑引擎（只需下载一次）。");
        await ffmpeg.load({ coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, "text/javascript"), wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, "application/wasm") });
        ffmpegRef.current = ffmpeg;
      }
      setStatus("正在本机裁成竖屏、保留原声。请不要关闭此页面。");
      const extension = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const input = `source.${extension}`;
      await ffmpeg.writeFile(input, await fetchFile(file));
      await ffmpeg.exec(["-i", input, "-t", String(Math.max(5, Math.min(60, duration))), "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "qv-autocut-test.mp4"]);
      const data = await ffmpeg.readFile("qv-autocut-test.mp4");
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
      setResult(URL.createObjectURL(blob)); setProgress(100);
      setStatus("测试成片已完成。先看人物有没有被裁掉、节奏是否合适；满意后才值得开云端自动版。");
    } catch (error) {
      setProgress(0);
      const detail = error instanceof Error ? error.message : String(error || "浏览器没有提供详细原因");
      setStatus(`这台设备暂时无法完成转换：${detail}。可先换 Chrome/Edge 电脑版或使用较短的 MP4 测试。`);
    }
  };
  return <section className="autocut"><div className="autocut-hero"><div><p className="eyebrow">QV AUTOCUT / FREE TEST</p><h2>先拿真实素材试一支。</h2><p>不用绑卡。影片在你的浏览器里处理，不上传 QV WORK，也不会产生云端费用。</p></div><button className="quiet" onClick={goBack}>回到拍摄包</button></div><div className="autocut-grid"><section className="autocut-card"><p className="autocut-step">01 / 放进素材</p><h3>选一条原始视频</h3><label className="file-drop"><input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={onChoose} /><span>{file ? file.name : "选择 MP4、MOV 或 WebM"}</span><small>建议先用 30–90 秒、画面主体清楚的素材。</small></label><label className="duration-label">成片时长（测试版最多 60 秒）<input type="range" min="5" max="60" value={duration} onChange={(event) => setDuration(Number(event.target.value))} /><b>{duration} 秒</b></label><button className="primary autocut-run" disabled={!file || progress > 0 && progress < 100} onClick={render}>{progress > 0 && progress < 100 ? "正在本机处理…" : "免费生成测试版"}</button><p className="autocut-status">{status}</p>{progress > 0 && <div className="autocut-progress"><i style={{ width: `${progress}%` }} /></div>}</section><section className="autocut-card autocut-result"><p className="autocut-step">02 / 看结果</p>{result ? <><video src={result} controls playsInline /><a className="primary download" href={result} download="qv-autocut-test.mp4">下载测试成片</a></> : <div className="autocut-empty"><b>还没有成片</b><span>生成后在这里预览和下载。</span></div>}</section></div><section className="autocut-next"><b>这一版会做什么：</b> 自动转成 9:16、保留原声、输出可看的测试成片。<br/><b>这一版不会假装会做：</b> 自动挑高光、去废片、字幕、人物跟拍裁切——这些需要云端或更强设备。你先用真实素材验证“是否值得继续”，满意后我才接付费云端 AI 自动版。</section></section>;
}
