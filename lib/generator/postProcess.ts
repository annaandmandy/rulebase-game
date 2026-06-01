import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type PostProcessResult = {
  fixed: string[];
  tscErrors: string[];
  ok: boolean;
};

export async function postProcess(
  outDir: string,
  projectRoot: string
): Promise<PostProcessResult> {
  const fixed: string[] = [];
  const tscErrors: string[] = [];

  const tsFiles = [
    "index.ts",
    "events.ts",
    "rules.ts",
    "ruleSheets.ts",
    "endings.ts",
    "locationActions.ts",
    "dialogues/index.ts",
  ];

  for (const file of tsFiles) {
    const filePath = join(outDir, file);
    let content: string;
    try {
      content = await readFile(filePath, "utf-8");
    } catch {
      continue;
    }

    const original = content;

    // 1. Fix import paths — generator sometimes uses relative or bare paths
    content = content
      .replace(/from ["']\.\.\/types\/game["']/g, 'from "@/types/game"')
      .replace(/from ["']\.\/types\/game["']/g, 'from "@/types/game"')
      .replace(/from ["']\.\.\/types\/scenario["']/g, 'from "@/types/scenario"')
      .replace(/from ["']\.\/types\/scenario["']/g, 'from "@/types/scenario"')
      .replace(/from ["']\.\.\/types\/dialogue["']/g, 'from "@/types/dialogue"')
      .replace(/from ["']\.\/types\/dialogue["']/g, 'from "@/types/dialogue"');

    // Fix bare "../types" or "./types" — detect from what's imported
    content = content.replace(
      /import\s+(?:type\s+)?{([^}]+)}\s+from\s+["']\.\.?\/types["']/g,
      (match, imports: string) => {
        const names = imports.split(",").map((s) => s.trim());
        // Determine which type file based on what's imported
        if (names.some((n) => ["Dialogue", "DialogueScene", "DialogueChoice", "DialogueMemory"].includes(n))) {
          return match.replace(/from\s+["']\.\.?\/types["']/, 'from "@/types/dialogue"');
        }
        if (names.some((n) => ["LocationData", "ScenarioPack"].includes(n))) {
          return match.replace(/from\s+["']\.\.?\/types["']/, 'from "@/types/scenario"');
        }
        return match.replace(/from\s+["']\.\.?\/types["']/, 'from "@/types/game"');
      }
    );

    // 2. Convert string conditions to arrow functions
    // Must handle nested quotes: "player.arr.includes('id')" and 'player.arr.includes("id")'
    const convertCondition = (expr: string): string => {
      return `(p, w, m) => ${expr.replace(/\bplayer\./g, "p.").replace(/\bworld\./g, "w.").replace(/\bmemory\./g, "m.")}`;
    };
    // Double-quoted condition (may contain single quotes inside)
    content = content.replace(
      /(\bcondition:\s*)"((?:[^"\\]|\\.)*)"/g,
      (_, pre, expr: string) => `${pre}${convertCondition(expr)}`
    );
    // Single-quoted condition (may contain double quotes inside)
    content = content.replace(
      /(\bcondition:\s*)'((?:[^'\\]|\\.)*)'/g,
      (_, pre, expr: string) => `${pre}${convertCondition(expr)}`
    );

    // 2b. Add missing `next: null` to dialogue choices that lack `next`
    if (file.includes("dialogues")) {
      content = content.replace(
        /(\{\s*id:\s*"[^"]+",\s*label:\s*"[^"]+"(?:,\s*condition:[^,}]+)?)\s*\}/g,
        (match) => {
          if (match.includes("next:")) return match;
          return match.replace(/\s*\}$/, ", next: null }");
        }
      );
    }

    // 2c. Convert string location descriptions to arrow functions
    if (file === "locationActions.ts") {
      content = content.replace(
        /\bdescription: "([^"]+)"/g,
        (_m, s) => `description: (_p, _w) => "${s}"`
      );
    }

    // 3. Dedup event IDs in events.ts
    if (file === "events.ts") {
      const idRegex = /(\bid:\s*["'])([^"']+)(["'])/g;
      const seen = new Map<string, number>();
      content = content.replace(idRegex, (match, pre, id, post) => {
        const count = (seen.get(id) ?? 0) + 1;
        seen.set(id, count);
        if (count > 1) {
          const newId = `${id}_${count}`;
          fixed.push(`Renamed duplicate event ID: ${id} → ${newId}`);
          return `${pre}${newId}${post}`;
        }
        return match;
      });
    }

    // 3. Fix ScenarioPack import in index.ts
    if (file === "index.ts") {
      if (!content.includes("@/types/scenario") && content.includes("ScenarioPack")) {
        content = `import type { ScenarioPack } from "@/types/scenario";\n` + content;
        fixed.push("Added missing ScenarioPack import to index.ts");
      }
    }

    if (content !== original) {
      await writeFile(filePath, content, "utf-8");
    }
  }

  // 4. Run tsc --noEmit to check for errors
  try {
    await execAsync("npx tsc --noEmit", { cwd: projectRoot });
  } catch (err: unknown) {
    const stderr = (err as { stdout?: string; stderr?: string }).stdout ?? "";
    // Filter to only errors in the generated scenario directory
    const scenarioDir = outDir.replace(projectRoot + "/", "");
    const relevantErrors = stderr
      .split("\n")
      .filter((line) => line.includes(scenarioDir))
      .slice(0, 10);
    tscErrors.push(...relevantErrors);
  }

  return {
    fixed,
    tscErrors,
    ok: tscErrors.length === 0,
  };
}
