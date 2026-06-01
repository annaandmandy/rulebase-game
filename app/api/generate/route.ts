import { spawn } from "child_process";
import { join } from "path";

export const runtime = "nodejs";
export const maxDuration = 600; // 10 minutes

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
  const scriptPath = join(projectRoot, "scripts", "generateScenario.ts");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, payload: Record<string, unknown>) => {
        const line = `data: ${JSON.stringify({ type, ...payload })}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      const proc = spawn("npx", ["tsx", scriptPath, theme, ...(keywords ? [keywords] : [])], {
        cwd: projectRoot,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: apiKey,
          FORCE_COLOR: "0",
        },
      });

      proc.stdout.on("data", (data: Buffer) => {
        const text = data.toString().replace(/\x1B\[[0-9;]*m/g, ""); // strip ANSI
        send("log", { message: text });
      });

      proc.stderr.on("data", (data: Buffer) => {
        const text = data.toString().replace(/\x1B\[[0-9;]*m/g, "");
        if (text.trim()) send("log", { message: text });
      });

      proc.on("close", (code) => {
        const slug = theme.replace(/\s+/g, "_").replace(/[^\w一-鿿]/g, "");
        send("done", { success: code === 0, slug, theme });
        controller.close();
      });

      proc.on("error", (err) => {
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
