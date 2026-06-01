import { spawn } from "child_process";
import { join } from "path";
import { writeFile, readFile } from "fs/promises";

export const runtime = "nodejs";
export const maxDuration = 600;

// Simple file-based job store so any client can poll status
const JOB_FILE = join(process.cwd(), ".generation-job.json");

async function writeJob(job: Record<string, unknown>) {
  await writeFile(JOB_FILE, JSON.stringify(job, null, 2)).catch(() => {});
}

export async function GET() {
  try {
    const raw = await readFile(JOB_FILE, "utf-8");
    return Response.json(JSON.parse(raw));
  } catch {
    return Response.json({ running: false });
  }
}

export async function POST(request: Request) {
  const { theme, keywords, apiKey } = await request.json() as {
    theme: string;
    keywords: string;
    apiKey: string;
  };

  if (!theme || !apiKey) {
    return new Response("Missing theme or apiKey", { status: 400 });
  }

  const projectRoot = process.cwd();
  const slug = theme.replace(/\s+/g, "_").replace(/[^\w一-鿿]/g, "");
  const scriptPath = join(projectRoot, "scripts", "generateScenario.ts");

  await writeJob({ running: true, theme, slug, startedAt: Date.now(), logs: [] });

  const encoder = new TextEncoder();
  const allLogs: string[] = [];

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...payload })}\n\n`));
      };

      const proc = spawn(
        "npx",
        ["tsx", scriptPath, theme, ...(keywords ? [keywords] : [])],
        {
          cwd: projectRoot,
          env: { ...process.env, ANTHROPIC_API_KEY: apiKey, FORCE_COLOR: "0" },
          detached: false,
        }
      );

      const handleOutput = (text: string) => {
        const clean = text.replace(/\x1B\[[0-9;]*m/g, "");
        allLogs.push(clean);
        // Persist logs every ~5 entries so polling can read them
        if (allLogs.length % 5 === 0) {
          writeJob({ running: true, theme, slug, startedAt: Date.now(), logs: allLogs.slice(-20) });
        }
        send("log", { message: clean });
      };

      proc.stdout.on("data", (d: Buffer) => handleOutput(d.toString()));
      proc.stderr.on("data", (d: Buffer) => { if (d.toString().trim()) handleOutput(d.toString()); });

      proc.on("close", (code) => {
        const success = code === 0;
        writeJob({ running: false, theme, slug, success, doneAt: Date.now(), logs: allLogs.slice(-20) });
        send("done", { success, slug, theme });
        controller.close();
      });

      proc.on("error", (err) => {
        writeJob({ running: false, theme, slug, success: false, error: err.message });
        send("error", { message: err.message });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
