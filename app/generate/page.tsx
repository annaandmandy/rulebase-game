"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useGameStore } from "@/lib/gameState";

type AddStatus = "idle" | "adding" | "added" | "error";

export default function GeneratePage() {
  const { generationJob, setGenerationJob, appendGenerationLog } = useGameStore();

  const [theme, setTheme] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [addStatus, setAddStatus] = useState<AddStatus>("idle");
  const [addMessage, setAddMessage] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  const isRunning = generationJob?.running === true;
  const isDone = generationJob?.done === true;
  const isFailed = isDone && generationJob?.success === false;

  // Auto-clean stale registry entries on mount
  useEffect(() => {
    fetch("/api/generate-add").catch(() => {});
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [generationJob?.logs.length]);

  async function handleGenerate() {
    if (!theme.trim() || !apiKey.trim()) return;

    const slug = theme.trim().replace(/\s+/g, "_").replace(/[^\w一-鿿]/g, "");
    setGenerationJob({ theme: theme.trim(), slug, running: true, done: false, logs: [] });
    setAddStatus("idle");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme.trim(), apiKey: apiKey.trim() }),
      });

      if (!res.ok || !res.body) {
        setGenerationJob({ theme: theme.trim(), slug, running: false, done: true, success: false, logs: ["❌ 連線失敗"] });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(event.slice(6));
            if (data.type === "log") appendGenerationLog(data.message);
            if (data.type === "done") {
              setGenerationJob({ theme: theme.trim(), slug, running: false, done: true, success: data.success, logs: [] });
            }
            if (data.type === "error") {
              appendGenerationLog(`❌ ${data.message}`);
              setGenerationJob({ theme: theme.trim(), slug, running: false, done: true, success: false, logs: [] });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      appendGenerationLog(`❌ ${String(err)}`);
      setGenerationJob({ theme: theme.trim(), slug, running: false, done: true, success: false, logs: [] });
    }
  }

  async function handleAddToGame() {
    if (!generationJob?.slug) return;
    setAddStatus("adding");
    try {
      const res = await fetch("/api/generate-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: generationJob.slug }),
      });
      const data = await res.json();
      if (data.ok) {
        setAddStatus("added");
        setAddMessage(`已加入遊戲（${data.exportName}）。重啟 dev server 後首頁可見。`);
      } else {
        setAddStatus("error");
        setAddMessage(`加入失敗：${data.error}`);
      }
    } catch (err) {
      setAddStatus("error");
      setAddMessage(String(err));
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 flex flex-col">
      <div className="border-b border-neutral-900 px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-neutral-600 tracking-widest">劇本生成器</span>
        <Link href="/" className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors">
          ← 返回遊戲
          {isRunning && <span className="ml-2 text-amber-700 animate-pulse">（生成中）</span>}
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: Form */}
        <div className="w-72 shrink-0 border-r border-neutral-900 p-6 flex flex-col gap-5 overflow-y-auto">
          <div>
            <h1 className="text-sm text-neutral-400 mb-1">山霧旅館</h1>
            <p className="text-xs text-neutral-600 leading-relaxed">
              輸入主題和風格關鍵字，AI 自動生成完整規則怪談劇本並加入遊戲。
              生成中可以離開此頁面回去玩遊戲。
            </p>
          </div>

          <Field label="劇本主題">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="寄宿學校、深夜辦公大樓…"
              disabled={isRunning}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 focus:outline-none focus:border-neutral-600 placeholder-neutral-700 disabled:opacity-50"
            />
          </Field>

          <Field label="Anthropic API Key">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              disabled={isRunning}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 focus:outline-none focus:border-neutral-600 placeholder-neutral-700 disabled:opacity-50 font-mono"
            />
            <p className="text-xs text-neutral-700 mt-1">Key 只用於此次生成，不儲存</p>
          </Field>

          <button
            onClick={handleGenerate}
            disabled={isRunning || !theme.trim() || !apiKey.trim()}
            className="px-4 py-2.5 text-sm border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-2"
          >
            {isRunning ? `生成中：${generationJob?.theme}…` : "開始生成"}
          </button>

          {isDone && generationJob?.success && addStatus !== "added" && (
            <button
              onClick={handleAddToGame}
              disabled={addStatus === "adding"}
              className="px-4 py-2.5 text-sm border border-green-900 text-green-600 hover:border-green-700 hover:text-green-400 transition-colors disabled:opacity-30"
            >
              {addStatus === "adding" ? "加入中…" : "✓ 加入遊戲"}
            </button>
          )}

          {isFailed && (
            <button
              onClick={handleGenerate}
              disabled={!theme.trim() || !apiKey.trim()}
              className="px-4 py-2.5 text-sm border border-amber-900 text-amber-700 hover:border-amber-700 hover:text-amber-500 transition-colors disabled:opacity-30"
            >
              ↺ 從上次失敗點繼續
            </button>
          )}

          {addStatus === "added" && (
            <div className="text-xs text-green-700 leading-relaxed border border-green-900/30 p-3">
              {addMessage}
            </div>
          )}
          {addStatus === "error" && (
            <div className="text-xs text-red-700 leading-relaxed border border-red-900/30 p-3">
              {addMessage}
            </div>
          )}

          <div className="mt-auto text-xs text-neutral-800 leading-loose border-t border-neutral-900 pt-4">
            <div>概念 → 規則(2a+2b) → 合約(2c)</div>
            <div>→ [事件 ‖ 對話] → 結局 → 程式碼 → 驗證</div>
            <div className="mt-2">約需 3-6 分鐘 · 可切換頁面</div>
          </div>
        </div>

        {/* Right: Log */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="border-b border-neutral-900 px-4 py-2 text-xs text-neutral-700 flex items-center justify-between">
            <span>
              執行日誌
              {generationJob && <span className="ml-2 text-neutral-600">— {generationJob.theme}</span>}
            </span>
            {isRunning && <span className="text-amber-700 animate-pulse">● 生成中</span>}
            {isDone && generationJob?.success && <span className="text-green-700">● 完成</span>}
            {isDone && !generationJob?.success && <span className="text-red-700">● 失敗</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {(!generationJob || generationJob.logs.length === 0) && (
              <div className="text-neutral-800 mt-8 text-center">
                {generationJob?.running ? "等待輸出…" : "填寫左側表單並按「開始生成」"}
              </div>
            )}
            {generationJob?.logs.map((line, i) => {
              const isHeader = line.startsWith("[Agent") || line.startsWith("✅") || line.startsWith("❌") || line.startsWith("🎭") || line.startsWith("[後");
              return (
                <div key={i} className={isHeader ? "text-amber-200/60 mt-2" : "text-neutral-600"}>
                  {line.trim()}
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-neutral-600 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}
