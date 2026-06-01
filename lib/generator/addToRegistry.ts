import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export async function addScenarioToRegistry(
  slug: string,
  exportName: string,
  projectRoot: string
): Promise<void> {
  const registryPath = join(projectRoot, "lib", "scenarioRegistry.ts");
  let content = await readFile(registryPath, "utf-8");

  const importLine = `import { ${exportName} } from "./scenarios/${slug}";`;
  const arrayEntry = `  ${exportName},`;

  // Check if already registered
  if (content.includes(importLine)) return;

  // Add import after the last import statement
  content = content.replace(
    /(import \{ [^}]+ \} from "[^"]+";(?:\s*\/\/[^\n]*)?\n)(\nexport)/,
    `$1${importLine}\n$2`
  );

  // If the above didn't match (no trailing imports before export), add before export
  if (!content.includes(importLine)) {
    content = content.replace(
      /^(export const ALL_SCENARIOS)/m,
      `${importLine}\n\n$1`
    );
  }

  // Add to ALL_SCENARIOS array before the closing ];
  content = content.replace(
    /(ALL_SCENARIOS[^=]*=\s*\[[\s\S]*?)(\n\];)/,
    `$1\n${arrayEntry}$2`
  );

  await writeFile(registryPath, content, "utf-8");
}

// Derive the export name from the scenario's index.ts
export async function getScenarioExportName(
  scenarioDir: string
): Promise<string> {
  try {
    const indexPath = join(scenarioDir, "index.ts");
    const content = await readFile(indexPath, "utf-8");
    // Look for: export const SOMETHING_SCENARIO: ScenarioPack
    const match = content.match(/export const ([A-Z_]+(?:SCENARIO|PACK))/);
    if (match) return match[1];
    // Fallback: look for any exported ScenarioPack
    const fallback = content.match(/export const ([A-Z_]+)\s*[:=]/);
    if (fallback) return fallback[1];
  } catch {
    // ignore
  }
  // Last resort: derive from directory name
  const slug = scenarioDir.split("/").pop() ?? "scenario";
  return slug.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_SCENARIO";
}
