"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Status = "idle" | "running" | "done" | "error";

type LogEntry = {
  id: number;
  text: string;
  isHeader: boolean;
};

type DonePayload = {
  success: boolean;
  slug: string;
  theme: string;
};

export default function GeneratePage() {
  const [theme, setTheme] = useState("");
  const [keywords, setKeywords] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<DonePayload | null>(null);
  const [addStatus, setAddStatus] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [addMessage, setAddMessage] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);
  const logId = useRef(0);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function addLog(text: string) {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    setLogs((prev) => [
      ...prev,
      ...lines.map((line) => ({
        id: logId.current++,
        text: line,
        isHeader: line.startsWith("[Agent") || line.startsWith("✅") || line.startsWith("❌") || line.startsWith("🎭"),
      })),
    ]);
  }

  async function handleGenerate() {
    if (!theme.trim() || !apiKey.trim()) return;
    setStatus("running");
    setLogs([]);
    setResult(null);
    setAddStatus("idle");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme.trim(), keywords: keywords.trim(), apiKey: apiKey.trim() }),
      });

      if (!res.ok || !res.body) {
        setStatus("error");
        addLog("❌ 連線失敗");
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
            if (data.type === "log") addLog(data.message);
            if (data.type === "done") {
              setResult(data as DonePayload);
              setStatus(data.success ? "done" : "error");
            }
            if (data.type === "error") {
              addLog(`❌ ${data.message}`);
              setStatus("error");
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      addLog(`❌ ${String(err)}`);
      setStatus("error");
    }
  }

  async function handleAddToGame() {
    if (!result?.slug) return;
    setAddStatus("adding");
    try {
      const res = await fetch("/api/generate-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: result.slug }),
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

  const isRunning = status === "running";
  const isDone = status === "done";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 flex flex-col">
      {/* Header */}
      <div className="border-b border-neutral-900 px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-neutral-600 tracking-widest">劇本生成器</span>
        <Link href="/" className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors">
          ← 返回遊戲
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: Form */}
        <div className="w-72 shrink-0 border-r border-neutral-900 p-6 flex flex-col gap-5 overflow-y-auto">
          <div>
            <h1 className="text-sm text-neutral-400 mb-1">山霧旅館</h1>
            <p className="text-xs text-neutral-600 leading-relaxed">
              輸入主題和風格關鍵字，AI 自動生成一個完整的規則怪談劇本並加入遊戲。
            </p>
          </div>

          <Field label="劇本主題">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="廢棄醫院、深夜辦公大樓…"
              disabled={isRunning}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 focus:outline-none focus:border-neutral-600 placeholder-neutral-700 disabled:opacity-50"
            />
          </Field>

          <Field label="風格關鍵字（選填）">
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="isolation clinical、corporate liminal…"
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
            <p className="text-xs text-neutral-700 mt-1">Key 只用於此次生成，不會被儲存</p>
          </Field>

          <button
            onClick={handleGenerate}
            disabled={isRunning || !theme.trim() || !apiKey.trim()}
            className="px-4 py-2.5 text-sm border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-2"
          >
            {isRunning ? "生成中…" : "開始生成"}
          </button>

          {/* Add to game button */}
          {isDone && addStatus !== "added" && (
            <button
              onClick={handleAddToGame}
              disabled={addStatus === "adding"}
              className="px-4 py-2.5 text-sm border border-green-900 text-green-600 hover:border-green-700 hover:text-green-400 transition-colors disabled:opacity-30"
            >
              {addStatus === "adding" ? "加入中…" : "✓ 加入遊戲"}
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

          {/* Pipeline info */}
          <div className="mt-auto text-xs text-neutral-800 leading-loose border-t border-neutral-900 pt-4">
            <div>概念師 → 規則師 → 協調師</div>
            <div>→ [事件師 ‖ 對話師]</div>
            <div>→ 結局師 → 程式碼師 → 驗證師</div>
            <div className="mt-2">約需 3-6 分鐘</div>
          </div>
        </div>

        {/* Right: Log */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="border-b border-neutral-900 px-4 py-2 text-xs text-neutral-700 flex items-center justify-between">
            <span>執行日誌</span>
            {status === "running" && (
              <span className="text-amber-700 animate-pulse">● 生成中</span>
            )}
            {status === "done" && <span className="text-green-700">● 完成</span>}
            {status === "error" && <span className="text-red-700">● 失敗</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {logs.length === 0 && (
              <div className="text-neutral-800 mt-8 text-center">
                填寫左側表單並按「開始生成」
              </div>
            )}
            {logs.map((entry) => (
              <div
                key={entry.id}
                className={entry.isHeader ? "text-amber-200/60 mt-2" : "text-neutral-600"}
              >
                {entry.text}
              </div>
            ))}
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
