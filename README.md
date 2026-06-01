# 山霧旅館

中文規則怪談互動敘事遊戲。玩家在深夜抵達一間旅館，透過閱讀規則、探索地點、與 NPC 對話，推理這間旅館真正的規則邏輯。

**Tech stack：** Next.js · TypeScript · Tailwind CSS · Framer Motion · Zustand

---

## 開發

```bash
npm install
npm run dev      # http://localhost:5500
npm run build
```

---

## 劇本系統

遊戲支援多個劇本，啟動後在首頁選擇劇本進入遊玩。每個劇本是獨立的 `ScenarioPack`，存檔互不干擾。

### 現有劇本

| 劇本 | 位置 |
|------|------|
| 山霧旅館 | `lib/scenarios/shanwu/` |

---

## 生成新劇本

### 需求

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### 執行

```bash
npx tsx scripts/generateScenario.ts "主題" "關鍵字"

# 範例
npx tsx scripts/generateScenario.ts "廢棄醫院" "isolation clinical"
npx tsx scripts/generateScenario.ts "深夜辦公大樓" "corporate liminal"
npx tsx scripts/generateScenario.ts "孤島渡假村" "tropical ritual"
```

中途失敗可直接重跑，已完成的階段從 `.checkpoints/` 讀取，不重複花費。

### 生成完成後：加入遊戲

**Step 1** — 檢查輸出

```
lib/scenarios/廢棄醫院/
  index.ts           ← ScenarioPack（匯入這個）
  events.ts
  rules.ts
  ruleSheets.ts
  endings.ts
  locationActions.ts
  dialogues/index.ts
  concept.json       ← 原始設計資料（可審閱）
  validation.json    ← 一致性報告
```

打開 `validation.json` 確認 `valid: true`，`issues` 為空。

**Step 2** — 登記到 registry

編輯 `lib/scenarioRegistry.ts`：

```ts
import { SHANWU_SCENARIO } from "./scenarios/shanwu";
import { MY_SCENARIO } from "./scenarios/廢棄醫院"; // ← 新增

export const ALL_SCENARIOS: ScenarioPack[] = [
  SHANWU_SCENARIO,
  MY_SCENARIO, // ← 新增
];
```

**Step 3** — 確認編譯

```bash
npm run build
```

如果有 TypeScript 錯誤（import 路徑、型別不符），手動修正 `index.ts` 的 import 路徑即可。常見問題：

- 路徑用 `@/types/game` 而不是 `./types`
- `ScenarioPack` 從 `@/types/scenario` 匯入
- `checkScenarioEnding` 要符合 `(player, world, forced?) => GameEnding | null` 簽名

**Step 4** — 重啟 dev server

```bash
npm run dev
```

首頁會自動出現新劇本卡片。

---

## 生成器 Pipeline

```
主題輸入
   ↓
Agent 1   概念師         → 場景概念（地點/NPC/隱藏真相）
   ↓
Agent 2a  規則設計師      → 主規則 + 地點規則（含 3 個腐化版本）
Agent 2b  文件設計師      → 可發現的矛盾文件
   ↓
Agent 2c  一致性協調師    → 設計合約（規則→事件→結局的對照表）
   ↓
   ┌──────────────────────────────────────────┐
   Agent 3a  事件工程師（前半）                │ 並行
   Agent 3b  事件工程師（後半）                │
   Agent 4   對話作家（每 NPC 一個 call）      │
   └──────────────────────────────────────────┘
   ↓
Agent 5   結局設計師      → 5-7 個結局（條件對齊設計合約）
   ↓
   ┌──────────────────────────────────────────┐
   Agent 6   code-gen（每個 .ts 一個 call）   │ 並行
   └──────────────────────────────────────────┘
   ↓
Agent 7   驗證師          → 一致性報告
```

**設計合約（Agent 2c）** 是所有後續 agent 的強制約束：每條規則→必須對應哪個事件 ID，每份文件→必須開放哪些對話主題，每個結局→需要哪些 flag 和事件。確保規則、事件、對話、結局四個系統 align。

---

## 專案結構

```
app/                    Next.js App Router
components/             UI 元件
  ScenarioSelectScreen  首頁劇本選擇
  GameShell             主遊戲框架
  NarrativePanel        敘事 + 事件
  DialoguePanel         NPC 對話
  LocationView          地點 + 互動
  RuleNotice            規則公告（右側）
  StatusPanel           狀態（左側）
  JournalPanel          日誌（下方）

lib/
  gameState.ts          Zustand store
  scenarioRegistry.ts   劇本清單
  scenarios/            劇本資料夾
    shanwu/             山霧旅館（手寫）
    [generated]/        生成劇本
  events.ts             山霧旅館事件資料
  locations.ts          山霧旅館地點資料
  dialogues/            山霧旅館 NPC 對話樹
  rules.ts              山霧旅館規則資料
  ruleSheets.ts         山霧旅館可發現文件
  endings.ts            山霧旅館結局資料

types/
  game.ts               基礎型別
  scenario.ts           ScenarioPack 型別
  dialogue.ts           對話系統型別

scripts/
  generateScenario.ts   Multi-Agent 劇本生成器
```
