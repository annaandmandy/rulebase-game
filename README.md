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

### 生成新劇本

使用 Multi-Agent 生成器（需要 Anthropic API Key）：

```bash
export ANTHROPIC_API_KEY=sk-ant-...

# 生成劇本
npx tsx scripts/generateScenario.ts "廢棄醫院" "isolation clinical"
npx tsx scripts/generateScenario.ts "深夜辦公大樓" "corporate liminal"
npx tsx scripts/generateScenario.ts "孤島渡假村" "tropical ritual"
```

生成完成後，輸出在 `lib/scenarios/[劇本名]/`：

```
lib/scenarios/廢棄醫院/
  index.ts           ← ScenarioPack export
  events.ts
  rules.ts
  ruleSheets.ts
  endings.ts
  locationActions.ts
  dialogues/index.ts
  concept.json       ← 原始設計資料
  validation.json    ← 一致性報告
```

### 將生成的劇本加入遊戲

編輯 `lib/scenarioRegistry.ts`，加入兩行：

```ts
import { MY_SCENARIO } from "./scenarios/廢棄醫院";

export const ALL_SCENARIOS: ScenarioPack[] = [
  SHANWU_SCENARIO,
  MY_SCENARIO,   // ← 新增這行
];
```

重新整理頁面，首頁會自動出現新劇本卡片。

### 生成器 Pipeline

```
主題輸入
   ↓
Agent 1  概念師      → 場景概念（地點/NPC/隱藏真相）
   ↓
Agent 2  規則設計師  → 規則系統（矛盾規則/陷阱規則/三個文字版本）
   ↓
Agent 3 ─────────── Agent 4     ← 並行
事件工程師           對話作家
（事件+觸發條件）   （NPC多輪對話樹）
   ↓
Agent 5  結局設計師  → 5-7個結局
   ↓
Agent 6  程式碼生成師 → TypeScript 檔案
   ↓
Agent 7  驗證師      → 一致性報告
```

失敗可從中間續跑（checkpoint 存在 `.checkpoints/`）。

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
  scenarios/shanwu/     山霧旅館劇本
  events.ts             事件資料
  locations.ts          地點資料
  dialogues/            NPC 對話樹
  rules.ts              規則資料
  ruleSheets.ts         可發現的文件
  endings.ts            結局資料

types/
  game.ts               基礎型別
  scenario.ts           ScenarioPack 型別
  dialogue.ts           對話系統型別

scripts/
  generateScenario.ts   Multi-Agent 劇本生成器
```
