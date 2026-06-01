import { readFile, writeFile, access } from "fs/promises";
import { join } from "path";

const REGISTRY_PATH = (projectRoot: string) =>
  join(projectRoot, "lib", "scenarioRegistry.ts");

// Add a generated scenario to the registry
export async function addScenarioToRegistry(
  slug: string,
  exportName: string,
  projectRoot: string
): Promise<void> {
  const registryPath = REGISTRY_PATH(projectRoot);
  let content = await readFile(registryPath, "utf-8");

  const importLine = `import { ${exportName} } from "./scenarios/${slug}";`;

  // Already registered — skip
  if (content.includes(`"./scenarios/${slug}"`)) return;

  // Insert import before the ALL_SCENARIOS line
  content = content.replace(
    /^(export const ALL_SCENARIOS)/m,
    `${importLine}\n$1`
  );

  // Add to ALL_SCENARIOS array before closing ];
  const arrayEntry = `  ${exportName},`;
  content = content.replace(
    /(ALL_SCENARIOS[^=]*=\s*\[)([\s\S]*?)(\n\];)/,
    (_, open, middle, close) => `${open}${middle}\n${arrayEntry}${close}`
  );

  await writeFile(registryPath, content, "utf-8");
}

// Remove registry entries for scenarios that no longer exist on disk
export async function cleanRegistry(projectRoot: string): Promise<string[]> {
  const registryPath = REGISTRY_PATH(projectRoot);
  let content = await readFile(registryPath, "utf-8");
  const removed: string[] = [];

  // Find all scenario imports in the registry
  const importRegex = /import \{ ([^}]+) \} from "\.\/scenarios\/([^"]+)";/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const [fullLine, , slug] = match;
    const scenarioDir = join(projectRoot, "lib", "scenarios", slug);
    try {
      await access(join(scenarioDir, "index.ts"));
    } catch {
      // Scenario directory doesn't exist — remove from registry
      const exportName = match[1].trim();
      content = content
        .replace(`\n${fullLine}`, "")  // remove import line
        .replace(`\n  ${exportName},`, "");  // remove from array
      removed.push(slug);
    }
  }

  if (removed.length > 0) {
    await writeFile(registryPath, content, "utf-8");
  }

  return removed;
}

// Derive the export name from the scenario's index.ts
export async function getScenarioExportName(
  scenarioDir: string
): Promise<string> {
  try {
    const content = await readFile(join(scenarioDir, "index.ts"), "utf-8");
    const match = content.match(/export const ([A-Z_]+(?:SCENARIO|PACK))\b/);
    if (match) return match[1];
    const fallback = content.match(/export const ([A-Z_][A-Z0-9_]+)\s*[:=]/);
    if (fallback) return fallback[1];
  } catch {
    // ignore
  }
  const slug = scenarioDir.split("/").pop() ?? "scenario";
  return slug.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_SCENARIO";
}
