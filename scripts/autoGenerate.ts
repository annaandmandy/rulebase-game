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
const THEMES: string[] = [
  "寄宿學校",
  "深夜辦公大樓",
  "山中療養院",
  "孤島渡假村",
  "地下購物商場",
  "郵輪",
  "圖書館",
  "老舊公寓大廈",
  "機場轉機區",
  "政府機關大樓",
  "溫泉旅館",
  "研究站",
  "神學院",
  "地下實驗室",
  "廢棄遊樂園",
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
  const available = THEMES.filter((t) => !existingSlugs.has(sanitize(t)));

  if (available.length === 0) {
    console.log("✅ 所有主題庫中的劇本都已生成完畢。");
    return;
  }

  // Pick a random theme
  const theme = available[Math.floor(Math.random() * available.length)];
  console.log(`\n🎲 今日劇本：${theme}\n`);

  // Run the generator (no keywords — system auto-determines style)
  const scriptPath = join(PROJECT_ROOT, "scripts", "generateScenario.ts");
  execSync(
    `npx tsx "${scriptPath}" "${theme}"`,
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
