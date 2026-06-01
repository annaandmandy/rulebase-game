#!/usr/bin/env npx tsx
/**
 * 自動劇本生成器 — 從主題庫隨機挑選，生成並加入遊戲
 * Usage: npx tsx scripts/autoGenerate.ts
 * Requires: ANTHROPIC_API_KEY in environment
 */

import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readdir } from "fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

// ─── 主題庫 ────────────────────────────────────────────────────────────────
// 每個主題有 name + keywords，設計時已考量規則怪談的適配性
const THEMES: { name: string; keywords: string }[] = [
  { name: "寄宿學校",      keywords: "institutional dormitory surveillance rules" },
  { name: "深夜辦公大樓",  keywords: "corporate liminal overtime isolation" },
  { name: "山中療養院",    keywords: "recovery isolation clinical mountain" },
  { name: "孤島渡假村",    keywords: "tropical ritual isolation confined" },
  { name: "地下購物商場",  keywords: "consumer labyrinth fluorescent liminal" },
  { name: "郵輪",         keywords: "maritime isolation luxury uncanny" },
  { name: "圖書館",        keywords: "archival silence institutional knowledge" },
  { name: "老舊公寓大廈",  keywords: "urban vertical community surveillance" },
  { name: "機場轉機區",    keywords: "transit liminal waiting isolation" },
  { name: "政府機關大樓",  keywords: "bureaucratic institutional paperwork absurd" },
  { name: "溫泉旅館",      keywords: "traditional ritual onsen mountain" },
  { name: "研究站",        keywords: "scientific isolation arctic protocol" },
  { name: "神學院",        keywords: "religious institutional devotion rules" },
  { name: "地下實驗室",    keywords: "scientific protocol isolation classified" },
  { name: "廢棄遊樂園",    keywords: "abandoned joy liminal decay surveillance" },
];

// ─── 已生成的劇本 ──────────────────────────────────────────────────────────

async function getExistingScenarios(): Promise<string[]> {
  try {
    const entries = await readdir(join(PROJECT_ROOT, "lib", "scenarios"));
    return entries;
  } catch {
    return [];
  }
}

function sanitize(name: string): string {
  return name.replace(/\s+/g, "_").replace(/[^\w一-鿿]/g, "");
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ 請設定 ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const existing = await getExistingScenarios();
  const existingSlugs = new Set(existing.map(sanitize));

  // Filter out already-generated themes
  const available = THEMES.filter((t) => !existingSlugs.has(sanitize(t.name)));

  if (available.length === 0) {
    console.log("✅ 所有主題庫中的劇本都已生成完畢。");
    return;
  }

  // Pick a random theme
  const theme = available[Math.floor(Math.random() * available.length)];
  console.log(`\n🎲 今日劇本：${theme.name} (${theme.keywords})\n`);

  // Run the generator
  const scriptPath = join(PROJECT_ROOT, "scripts", "generateScenario.ts");
  execSync(
    `npx tsx "${scriptPath}" "${theme.name}" "${theme.keywords}"`,
    {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      env: process.env,
    }
  );
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
