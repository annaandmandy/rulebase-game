#!/usr/bin/env npx tsx
/**
 * 山霧旅館 — 劇本生成 Multi-Agent Workflow
 *
 * Usage:
 *   npx tsx scripts/generateScenario.ts "廢棄醫院" "isolation clinical"
 *   npx tsx scripts/generateScenario.ts "深夜辦公大樓" "corporate liminal"
 *
 * Requires: ANTHROPIC_API_KEY in environment
 *
 * Pipeline:
 *   Agent 1: 概念師   → scenario concept JSON
 *   Agent 2: 規則設計師 → rules + documents JSON
 *   Agent 3+4 (parallel):
 *     Agent 3: 事件工程師 → events JSON
 *     Agent 4: 對話作家   → dialogue trees JSON
 *   Agent 5: 結局設計師 → endings JSON
 *   Agent 6: 程式碼生成師 → TypeScript files
 *   Agent 7: 驗證師   → consistency check
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

// ─── CLI Args ────────────────────────────────────────────────────────────────

const [, , theme = "廢棄醫院", ...keywordArgs] = process.argv;
const keywords = keywordArgs.join(" ") || "isolation liminal clinical";
const slug = theme.replace(/\s+/g, "_").replace(/[^\w一-鿿]/g, "");

// ─── Shared Cached Context ───────────────────────────────────────────────────
// This block is cached with prompt caching — only paid once across all agents.

const SHARED_CONTEXT = `
## 遊戲型別系統 (TypeScript)

\`\`\`typescript
// 玩家可用 Location ID（新劇本可以新增，但至少需要對應的必要地點）
type PlayerState = {
  currentLocation: string;    // location ID
  timeMinutes: number;        // 遊戲開始時間自訂，早上7點 = 開始分鐘 + 足夠時間
  sanity: number;             // 0-100，影響NPC反應和UI腐化
  suspicion: number;          // 0-100，影響員工行為模式
  foundSheets: string[];      // 已找到的文件ID列表
  discoveredClues: string[];  // 已發現線索文字列表
  logs: { time: string; text: string }[];
  // 以及其他 boolean flag（根據劇本需要設計）
};

type WorldState = {
  hotelRealityStability: number;  // 0-100，越低UI越腐化
  anomalyAttention: number;       // 累積，越高觸發更多異常
  ruleNoticeVersion: number;      // 1=原始 2=變化 3=腐化
  staffMode: "normal" | "watching" | "hostile" | "false_helpful";
  // 其他地點相關狀態
};

type Effect = {
  type: "sanity" | "suspicion" | "time" | "location" | "flag" | "clue" | "world" | "ending" | "anomaly" | "sheet";
  key?: string;
  value?: number | boolean | string;
};

type Choice = {
  id: string;
  label: string;           // 玩家看到的選項文字
  resultText: string;      // 選擇後的敘事結果
  effects: Effect[];
  nextLocation?: string;
  condition?: string;      // 條件（用文字描述，代碼生成時轉為函數）
};

type GameEvent = {
  id: string;
  title: string;
  trigger: string;         // 觸發條件（文字描述）
  description: string;     // 事件發生時的敘事文字
  choices: Choice[];
  once?: boolean;
};

type LocationAction = {
  id: string;
  label: string;
  condition?: string;      // 可選條件（文字描述）
  resultText: string | "dynamic";
  effects: Effect[];
};

type LocationData = {
  id: string;
  name: string;
  mutatedName?: string;
  description: string | "dynamic";  // dynamic=根據狀態變化
  adjacentLocations: string[];
  actions: LocationAction[];
};

type Dialogue = {
  id: string;
  npcName: string;
  startScene: string;
  scenes: Record<string, {
    npcText: string | "dynamic";
    choices: {
      id: string;
      label: string;
      condition?: string;
      effects?: Effect[];
      setMemory?: Record<string, boolean | string>;
      next: string | null;
    }[];
  }>;
};

type RuleSheet = {
  id: string;
  title: string;
  source: "official" | "previous_occupant" | "staff" | "unknown";
  lines: string[];
};

type GameEnding = {
  id: string;
  title: string;
  text: string;
  condition: string;  // 觸發條件描述
};
\`\`\`

## 規則怪談設計原則

**核心設計法則：**
1. **規則矛盾**：至少兩組規則應互相矛盾，讓玩家無法全部遵守
2. **不同來源打臉**：官方規則 vs 前任使用者紙條 vs 員工備忘錄，彼此矛盾
3. **陷阱規則**：至少一條規則看似在保護玩家，實際引導玩家走向危險
4. **負空間恐怖**：透過「禁止做什麼」暗示威脅的存在，而非直接描述
5. **官僚語氣**：規則必須冷靜、官方、像真實公告，絕不能說「邪神」「恐怖」
6. **漸進腐化**：規則文字應有 original/mutated/corrupted 三個版本，微妙變化

**好的規則（具體、官僚、有隱藏威脅）：**
「若走廊日光燈在凌晨後全部熄滅，請立即進入最近的房間並反鎖房門，等待燈光恢復。若燈光二十分鐘內未能恢復，本須知已不再適用於你。」

**壞的規則（太直白、不官僚）：**
「邪神會攻擊你，不要去地下室。」

**必要矛盾設計（至少包含一對）：**
- 官方規則A說「遇到緊急情況請到大廳」，但員工備忘錄揭示「凌晨後大廳值班人員非正式員工」
- 房間附加說明說「若有人叫你名字請開門」，前任住客紙條說「那條規則是錯的，不要開門」

**寫作風格要求：**
- 繁體中文，台灣用語
- 第二人稱「你」
- 克制、留白、不解釋太多
- 微小錯誤比巨大怪物更恐怖
- 官方文件語氣帶有隱約不合理感

**時間系統：**
- 遊戲時間以分鐘計算，開始時間自訂（例如深夜21:43 = 1303分鐘）
- 次日早上7點 = 開始分鐘 + 相應分鐘數
- 所有時間比較都用絕對分鐘數
`.trim();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(agent: string, msg: string) {
  console.log(`\n[${agent}] ${msg}`);
}

function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function extractJSON<T>(text: string): T {
  const match = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  const raw = match ? match[1] : text;
  return JSON.parse(raw) as T;
}

// One agent call: cached context + agent-specific prompt
async function callAgent(
  client: Anthropic,
  agentName: string,
  systemPrompt: string,
  userContent: string,
  prevOutputs: string = "",
  maxTokens = 4096
): Promise<string> {
  log(agentName, "thinking...");

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            
            cache_control: { type: "ephemeral" },
            text: SHARED_CONTEXT,
          },
          ...(prevOutputs
            ? [
                {
                  type: "text" as const,
                  
                  cache_control: { type: "ephemeral" },
                  text: `## 前置 Agents 的輸出\n\n${prevOutputs}`,
                },
              ]
            : []),
          {
            type: "text" as const,
            text: userContent,
          },
        ],
      },
    ],
  });

  let charCount = 0;
  stream.on("text", (delta) => {
    charCount += delta.length;
    if (charCount % 200 === 0) process.stdout.write(".");
  });

  const message = await stream.finalMessage();
  console.log(` ✓ (${message.usage.output_tokens} tokens)`);
  return extractText(message);
}

// ─── Agent 1: 概念師 ─────────────────────────────────────────────────────────

type ConceptOutput = {
  name: string;         // 場景名稱（繁體中文）
  nameEn: string;
  slug: string;
  tagline: string;      // 一句話描述
  setting: string;      // 場景背景
  coreHorror: string;   // 核心恐怖概念
  hiddenTruth: string;  // 隱藏真相（玩家可能發現的）
  atmosphere: string;   // 氛圍描述
  startTime: number;    // 遊戲開始時間（分鐘，例如21*60+43）
  locations: { id: string; name: string; description: string }[];
  npcs: { id: string; name: string; role: string; staffMode: string }[];
  playerFlags: string[]; // 需要追蹤的玩家狀態 flag 名稱
};

async function runConceiver(client: Anthropic): Promise<ConceptOutput> {
  const result = await callAgent(
    client,
    "Agent 1 概念師",
    `你是一位規則怪談劇本設計師。你的任務是為互動敘事恐怖遊戲設計場景概念。
遊戲風格：台灣都市傳說、山中旅館怪談、中文網路規則怪談、Liminal horror。
輸出格式：JSON，嚴格符合下方結構。`,
    `
為以下主題設計一個規則怪談遊戲場景：

主題：${theme}
關鍵字：${keywords}

設計要求：
- 場景應該「幾乎正常」，恐怖來自微小錯誤和規則矛盾
- 5-8個地點，每個地點有獨特的異常可能性
- 1-2個主要NPC（可以是服務員、管理員、工作人員等）
- 遊戲從深夜開始，目標是撐到或達成某種條件
- hiddenTruth 是整個場景背後的一致邏輯（玩家通過線索可以推理出來）

輸出 JSON（用 \`\`\`json 包裹）：
{
  "name": "場景名稱",
  "nameEn": "English Name",
  "slug": "ascii_slug",
  "tagline": "一句話描述場景的氛圍",
  "setting": "場景背景（2-3句）",
  "coreHorror": "核心恐怖概念（什麼讓這裡不對勁）",
  "hiddenTruth": "場景背後的隱藏真相（整個規則系統的真實目的）",
  "atmosphere": "氛圍關鍵字（4-6個）",
  "startTime": 1303,
  "locations": [
    { "id": "location_id", "name": "地點名稱", "description": "簡短描述" }
  ],
  "npcs": [
    { "id": "npc_id", "name": "名稱或稱呼", "role": "角色定位", "staffMode": "初始狀態" }
  ],
  "playerFlags": ["flag1", "flag2"]
}
`,
    "",
    2000
  );

  return extractJSON<ConceptOutput>(result);
}

// ─── Agent 2: 規則設計師 ─────────────────────────────────────────────────────

type RulesOutput = {
  mainRules: {
    number: number;
    text: string;
    mutatedText: string;
    corruptedText: string;
    triggerDescription: string; // 這條規則應該如何被觸發
  }[];
  locationRules: Record<string, { number: number; text: string }[]>;
  foundDocuments: {
    id: string;
    title: string;
    source: "official" | "previous_occupant" | "staff" | "unknown";
    lines: string[];
    findLocation: string;  // 在哪個地點找到
    findAction: string;    // 什麼行動才能找到
  }[];
  contradictions: {
    ruleA: string;
    ruleB: string;
    scenario: string;  // 什麼情況下玩家會遇到這個矛盾
  }[];
};

async function runRulesArchitect(
  client: Anthropic,
  concept: ConceptOutput
): Promise<RulesOutput> {
  const result = await callAgent(
    client,
    "Agent 2 規則設計師",
    `你是一位規則怪談規則系統設計師。你設計讓玩家感到不安的規則，
每條規則都有其存在的「理由」，但這個理由從來不會被解釋。
規則必須：官僚語氣、冷靜、帶有隱約不合理感、各有三個版本（original/mutated/corrupted）。`,
    `
根據以下場景概念，設計規則系統：

${JSON.stringify(concept, null, 2)}

設計要求：
1. 6-8條主要規則，每條規則對應一個可觸發的事件
2. 至少2個地點有自己的額外規則（類似「304號房附加說明」）
3. 至少3份可被玩家找到的文件（官方的、前任使用者留下的、員工內部的）
4. 至少2組規則矛盾（文件A說這樣，文件B說相反的）
5. 其中至少一條規則是「陷阱」——看似保護玩家，實際導向危險

規則設計原則：
- "本設施目前沒有地下室" 比 "本設施沒有地下室" 更恐怖（"目前"二字）
- "若燈光二十分鐘內未能恢復，本須知已不再適用於你" 比 "危險，請逃跑" 更恐怖
- 規則應該暗示它知道會發生什麼，但從不解釋

輸出 JSON（用 \`\`\`json 包裹）。
`,
    `## 場景概念\n${JSON.stringify(concept, null, 2)}`,
    4096
  );

  return extractJSON<RulesOutput>(result);
}

// ─── Agent 3: 事件工程師 ─────────────────────────────────────────────────────

type EventsOutput = {
  events: {
    id: string;
    title: string;
    triggerCondition: string;  // 文字描述觸發條件
    description: string;
    choices: {
      id: string;
      label: string;
      resultText: string;
      effects: { type: string; key?: string; value?: unknown }[];
      nextLocation?: string;
      condition?: string;
    }[];
    once: boolean;
    ruleReference?: string;  // 這個事件觸發哪條規則
  }[];
};

async function runEventEngineer(
  client: Anthropic,
  concept: ConceptOutput,
  rules: RulesOutput
): Promise<EventsOutput> {
  const result = await callAgent(
    client,
    "Agent 3 事件工程師",
    `你是一位互動敘事遊戲事件設計師，專門設計規則怪談風格的事件。
每個事件都應該讓玩家面對一個選擇，而這個選擇沒有明顯的「正確答案」。
恐怖來自選擇的後果，而不是jump scare。`,
    `
根據場景概念和規則系統，設計10-15個遊戲事件：

場景：${concept.name}
地點：${concept.locations.map((l) => l.id).join(", ")}

設計要求：
1. 每條主要規則至少對應一個事件（讓規則變得「真實」）
2. 事件觸發條件應該基於：地點、時間、玩家狀態、世界狀態
3. 每個事件有3-4個選項，選項之間的後果要有意義差異
4. 至少3個事件涉及規則矛盾（玩家需要選擇相信哪份文件）
5. 包含一個「入住/進入」事件（遊戲開場）
6. 包含一個「清晨/結束條件」事件
7. 深夜事件（凌晨後）比白天/傍晚事件更奇怪

效果類型參考：
- { type: "sanity", value: -15 }  → 理智降低
- { type: "anomaly", value: 2 }   → 異常關注度增加
- { type: "world", key: "hotelRealityStability", value: -20 }
- { type: "flag", key: "flagName", value: true }
- { type: "sheet", value: "document_id" }  → 玩家找到文件
- { type: "ending", value: "endingId" }   → 觸發結局

輸出 JSON（用 \`\`\`json 包裹）。
`,
    `## 場景概念\n${JSON.stringify(concept, null, 2)}\n\n## 規則系統\n${JSON.stringify(rules, null, 2)}`,
    6000
  );

  return extractJSON<EventsOutput>(result);
}

// ─── Agent 4: 對話作家 ───────────────────────────────────────────────────────

type DialoguesOutput = {
  dialogues: {
    id: string;
    npcName: string;
    location: string;
    startScene: string;
    scenes: Record<
      string,
      {
        npcText: string;
        choices: {
          id: string;
          label: string;
          condition?: string;
          effects?: { type: string; key?: string; value?: unknown }[];
          setMemory?: Record<string, boolean | string>;
          next: string | null;
        }[];
      }
    >;
  }[];
};

async function runDialogueWriter(
  client: Anthropic,
  concept: ConceptOutput,
  rules: RulesOutput
): Promise<DialoguesOutput> {
  const result = await callAgent(
    client,
    "Agent 4 對話作家",
    `你是一位互動敘事遊戲對話設計師，專門設計恐怖規則怪談風格的NPC對話。
NPC說的話永遠帶有一點不對勁——太過官方、太過標準、或者知道一點不該知道的事情。
對話應該多輪，讓玩家能夠追問，但每次追問都讓事情更奇怪而不是更清楚。`,
    `
為以下NPC設計多輪對話樹：

場景：${concept.name}
NPC列表：${JSON.stringify(concept.npcs, null, 2)}

設計要求：
1. 每個NPC一個完整的對話樹（15-25個對話節點）
2. 對話根據玩家狀態（sanity、suspicion、anomalyAttention、foundSheets）給出不同回應
3. 關鍵對話路徑：
   - 詢問其他使用者/訪客（觸發隱私條款）
   - 詢問關於規則（標準回應，但帶有破綻）
   - 詢問關於某個禁區或異常（NPC閃爍其詞）
   - 如果玩家找到了內部文件，可以用文件內容質問NPC
4. 玩家找到內部備忘錄後，對話中可以直接引用條款讓NPC破防
5. 對話節點命名規範：greet → main_menu → [topic]_[detail]

對話節點結構：
- npcText: NPC說的話（可以是字串或根據狀態的條件描述）
- choices: 玩家選項列表
  - condition: 可選（如 "player.foundSheets.includes('staff_memo')"）
  - setMemory: 在此對話記憶中記錄某些事（如 { askedAboutBasement: true }）
  - next: 下一個節點ID或 null（結束對話）

輸出 JSON（用 \`\`\`json 包裹）。
`,
    `## 場景概念\n${JSON.stringify(concept, null, 2)}\n\n## 規則系統（NPC應該知道這些）\n${JSON.stringify(rules, null, 2)}`,
    6000
  );

  return extractJSON<DialoguesOutput>(result);
}

// ─── Agent 5: 結局設計師 ─────────────────────────────────────────────────────

type EndingsOutput = {
  endings: {
    id: string;
    title: string;
    text: string;
    condition: string;  // 觸發條件描述
    priority: number;   // 優先順序（越高越優先檢查）
    type: "good" | "bad" | "ambiguous" | "hidden";
  }[];
};

async function runEndingsDesigner(
  client: Anthropic,
  concept: ConceptOutput,
  rules: RulesOutput,
  events: EventsOutput
): Promise<EndingsOutput> {
  const result = await callAgent(
    client,
    "Agent 5 結局設計師",
    `你是一位互動敘事遊戲結局設計師。
好的結局不是「好人得救，壞人受罰」，而是揭示場景背後的邏輯——
而且這個揭示總是帶著一點令人不安的後勁。
結局文字應該簡潔、有餘韻、留下一個未解的問題。`,
    `
根據以下場景設計5-7個結局：

場景：${concept.name}
隱藏真相：${concept.hiddenTruth}

設計要求：
1. 至少一個「表面上成功離開，但細節讓人不安」的結局（類似「平安退房但收據日期是明天」）
2. 至少一個「玩家選擇相信錯誤的規則」導致的結局
3. 至少一個「遵守了所有規則，但規則本身就是陷阱」的結局
4. 一個隱藏結局（需要發現特定線索組合）
5. 結局文字200-400字，簡潔有力，最後一句話帶有後勁
6. 結局的觸發條件基於：玩家 flag、sanity 值、found documents、worldState

結局觸發條件描述範例：
- "player.enteredBasement"
- "player.sanity <= 20 && player.hasReadExtraRule"
- "world.staffMode === 'hostile' && player.suspicion > 80"
- "player.timeMinutes >= START + MORNING_7AM && !player.ateEggs"

輸出 JSON（用 \`\`\`json 包裹）。
`,
    `## 場景概念\n${JSON.stringify(concept, null, 2)}\n\n## 規則系統\n${JSON.stringify(rules, null, 2)}\n\n## 重要事件\n${JSON.stringify(events.events.slice(0, 5), null, 2)}`,
    3000
  );

  return extractJSON<EndingsOutput>(result);
}

// ─── Agent 6: 程式碼生成師 ──────────────────────────────────────────────────

type CodeOutput = {
  indexTs: string;
  eventsTs: string;
  rulesTs: string;
  ruleSheetsTs: string;
  endingsTs: string;
  dialoguesTs: string;
  locationActionsTs: string;
};

async function runCodeGenerator(
  client: Anthropic,
  allOutputs: {
    concept: ConceptOutput;
    rules: RulesOutput;
    events: EventsOutput;
    dialogues: DialoguesOutput;
    endings: EndingsOutput;
  }
): Promise<CodeOutput> {
  const result = await callAgent(
    client,
    "Agent 6 程式碼生成師",
    `你是一位 TypeScript 遊戲開發工程師。
你的任務是將敘事設計 JSON 轉換為完整的 TypeScript 程式碼，
代碼必須嚴格符合遊戲的現有型別系統，不能引入不存在的型別或方法。

輸出一個包含多個 TypeScript 檔案內容的 JSON 物件。
每個字串值是一個完整的 TypeScript 檔案內容。`,
    `
根據以下設計資料，生成完整的 TypeScript 代碼：

${JSON.stringify(allOutputs, null, 2)}

生成要求：
1. events 的 trigger 條件必須是合法的函數 body
2. 時間比較：遊戲開始時間為 ${allOutputs.concept.startTime} 分鐘
3. 每個 GameEvent 的 trigger 是 \`(player: PlayerState, world: WorldState) => boolean\`
4. LocationAction 的 resultText 如果根據狀態變化，用函數形式 \`(player, world) => string\`
5. condition 字串轉為箭頭函數
6. 所有字串用繁體中文（程式碼識別符可以用英文）

輸出 JSON（用 \`\`\`json 包裹），包含以下鍵：
{
  "indexTs": "// index.ts 內容，export所有東西",
  "eventsTs": "// events.ts 完整內容",
  "rulesTs": "// rules.ts 完整內容",
  "ruleSheetsTs": "// ruleSheets.ts 完整內容",
  "endingsTs": "// endings.ts 完整內容",
  "dialoguesTs": "// dialogues/index.ts 完整內容",
  "locationActionsTs": "// locationActions.ts 完整內容（地點行動資料）"
}
`,
    "",
    8192
  );

  return extractJSON<CodeOutput>(result);
}

// ─── Agent 7: 驗證師 ─────────────────────────────────────────────────────────

type ValidationOutput = {
  valid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
  rulesCoverage: Record<string, boolean>;  // 每條規則是否有對應事件
};

async function runValidator(
  client: Anthropic,
  allOutputs: object
): Promise<ValidationOutput> {
  const result = await callAgent(
    client,
    "Agent 7 驗證師",
    `你是一位遊戲設計驗證師，專門檢查規則怪談遊戲的一致性。
你的任務是找出設計中的問題：規則沒有被觸發、矛盾沒有出口、結局條件不可達等。`,
    `
驗證以下遊戲設計的一致性：

${JSON.stringify(allOutputs, null, 2)}

檢查項目：
1. 每條主要規則是否有對應的事件讓它「真實」？
2. 規則矛盾是否有事件讓玩家面對這個矛盾？
3. 每個結局是否可達（觸發條件是否合理）？
4. 是否有孤立的地點（沒有事件也沒有行動）？
5. 對話樹是否有死路（next: null 的 choice 前路是否合理）？
6. 陷阱規則是否有對應的「真相揭露」時刻？

輸出 JSON（用 \`\`\`json 包裹）。
`,
    "",
    2000
  );

  return extractJSON<ValidationOutput>(result);
}

// ─── Output Writer ────────────────────────────────────────────────────────────

async function writeScenario(
  scenarioSlug: string,
  concept: ConceptOutput,
  code: CodeOutput,
  validation: ValidationOutput
) {
  const outDir = join(PROJECT_ROOT, "lib", "scenarios", scenarioSlug);
  await mkdir(outDir, { recursive: true });
  await mkdir(join(outDir, "dialogues"), { recursive: true });

  const files: Record<string, string> = {
    "index.ts": code.indexTs,
    "events.ts": code.eventsTs,
    "rules.ts": code.rulesTs,
    "ruleSheets.ts": code.ruleSheetsTs,
    "endings.ts": code.endingsTs,
    "dialogues/index.ts": code.dialoguesTs,
    "locationActions.ts": code.locationActionsTs,
    "concept.json": JSON.stringify(concept, null, 2),
    "validation.json": JSON.stringify(validation, null, 2),
  };

  for (const [filename, content] of Object.entries(files)) {
    await writeFile(join(outDir, filename), content, "utf-8");
  }

  console.log(`\n✅ 劇本生成完成！`);
  console.log(`📁 輸出目錄：lib/scenarios/${scenarioSlug}/`);

  if (!validation.valid) {
    console.log(`\n⚠️  驗證問題（${validation.issues.length}）：`);
    validation.issues.forEach((i) => console.log(`   • ${i}`));
  }
  if (validation.warnings.length > 0) {
    console.log(`\n💡 建議（${validation.warnings.length}）：`);
    validation.warnings.slice(0, 3).forEach((w) => console.log(`   • ${w}`));
  }

  console.log(`\n📋 整合說明：`);
  console.log(`   1. 在 lib/scenarios/${scenarioSlug}/index.ts 可以找到所有 exports`);
  console.log(`   2. 將場景 import 到主遊戲的 gameState.ts 中替換預設內容`);
  console.log(`   3. 確保 TypeScript 編譯：npx tsc --noEmit`);
}

// ─── Checkpoint System ────────────────────────────────────────────────────────

async function loadCheckpoint(slug: string, step: string): Promise<unknown | null> {
  try {
    const p = join(PROJECT_ROOT, ".checkpoints", `${slug}_${step}.json`);
    const raw = await readFile(p, "utf-8");
    console.log(`  [checkpoint] 讀取 ${step} 快取`);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveCheckpoint(slug: string, step: string, data: unknown) {
  const dir = join(PROJECT_ROOT, ".checkpoints");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `${slug}_${step}.json`),
    JSON.stringify(data, null, 2)
  );
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ 請設定 ANTHROPIC_API_KEY 環境變數");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const finalSlug = slug || "generated_scenario";

  console.log(`\n🎭 山霧旅館 — 劇本生成器`);
  console.log(`   主題：${theme}`);
  console.log(`   關鍵字：${keywords}`);
  console.log(`   輸出：lib/scenarios/${finalSlug}/`);
  console.log(`\n   Pipeline：概念師 → 規則師 → [事件師 ‖ 對話師] → 結局師 → 程式碼師 → 驗證師\n`);

  // Agent 1: Conceiver
  let concept = (await loadCheckpoint(finalSlug, "concept")) as ConceptOutput | null;
  if (!concept) {
    concept = await runConceiver(client);
    await saveCheckpoint(finalSlug, "concept", concept);
  }

  // Agent 2: Rules Architect
  let rules = (await loadCheckpoint(finalSlug, "rules")) as RulesOutput | null;
  if (!rules) {
    rules = await runRulesArchitect(client, concept);
    await saveCheckpoint(finalSlug, "rules", rules);
  }

  // Agent 3 + 4: Parallel (Events Engineer + Dialogue Writer)
  let events = (await loadCheckpoint(finalSlug, "events")) as EventsOutput | null;
  let dialogues = (await loadCheckpoint(finalSlug, "dialogues")) as DialoguesOutput | null;

  if (!events || !dialogues) {
    log("Agent 3+4", "事件工程師 + 對話作家 並行執行...");
    const [eventsResult, dialoguesResult] = await Promise.all([
      events ?? runEventEngineer(client, concept, rules),
      dialogues ?? runDialogueWriter(client, concept, rules),
    ]);
    events = eventsResult;
    dialogues = dialoguesResult;
    await saveCheckpoint(finalSlug, "events", events);
    await saveCheckpoint(finalSlug, "dialogues", dialogues);
  }

  // Agent 5: Endings Designer
  let endings = (await loadCheckpoint(finalSlug, "endings")) as EndingsOutput | null;
  if (!endings) {
    endings = await runEndingsDesigner(client, concept, rules, events);
    await saveCheckpoint(finalSlug, "endings", endings);
  }

  // Agent 6: Code Generator
  let code = (await loadCheckpoint(finalSlug, "code")) as CodeOutput | null;
  if (!code) {
    code = await runCodeGenerator(client, { concept, rules, events, dialogues, endings });
    await saveCheckpoint(finalSlug, "code", code);
  }

  // Agent 7: Validator
  log("Agent 7 驗證師", "checking consistency...");
  const validation = await runValidator(client, { concept, rules, events, endings });
  await saveCheckpoint(finalSlug, "validation", validation);

  // Write output files
  await writeScenario(finalSlug, concept, code, validation);
}

main().catch((err) => {
  console.error("\n❌ 生成失敗：", err.message);
  if (err.status === 401) console.error("   請確認 ANTHROPIC_API_KEY 是否正確");
  process.exit(1);
});
