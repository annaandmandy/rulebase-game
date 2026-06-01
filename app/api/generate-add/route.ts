import { join } from "path";
import { postProcess } from "@/lib/generator/postProcess";
import { addScenarioToRegistry, getScenarioExportName } from "@/lib/generator/addToRegistry";
import { readFile } from "fs/promises";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { slug } = await request.json() as { slug: string };

  if (!slug) return new Response("Missing slug", { status: 400 });

  const projectRoot = process.cwd();
  const outDir = join(projectRoot, "lib", "scenarios", slug);

  try {
    // Run post-processing
    const ppResult = await postProcess(outDir, projectRoot);

    // Get export name
    const exportName = await getScenarioExportName(outDir);

    // Add to registry
    await addScenarioToRegistry(slug, exportName, projectRoot);

    // Read validation.json
    let validation = null;
    try {
      const v = await readFile(join(outDir, "validation.json"), "utf-8");
      validation = JSON.parse(v);
    } catch { /* ignore */ }

    return Response.json({
      ok: true,
      exportName,
      ppResult,
      validation,
    });
  } catch (err: unknown) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
