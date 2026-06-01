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
import { postProcess } from "../lib/generator/postProcess.js";
import { addScenarioToRegistry, getScenarioExportName } from "../lib/generator/addToRegistry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

// ─── CLI Args ────────────────────────────────────────────────────────────────

const [, , theme = "廢棄醫院"] = process.argv;
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
  // Try to extract from fenced code block
  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)(?:\s*```|$)/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()) as T; } catch { /* fall through */ }
  }
  // Fallback: find first { and last } (handles truncated code blocks)
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) as T; } catch { /* fall through */ }
  }
  throw new Error(`Cannot parse JSON from agent output.\n\nFirst 200 chars:\n${text.slice(0, 200)}`);
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

（請根據主題自行判斷最適合的恐怖風格。例如：
  - 醫院/療養院 → clinical isolation protocol horror
  - 學校/宿舍 → institutional surveillance rules dormitory
  - 辦公大樓 → corporate bureaucratic liminal overtime
  - 旅館/民宿 → mountain isolation uncanny rural
  以此類推，不需要使用者告訴你）

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
    8000
  );

  return extractJSON<ConceptOutput>(result);
}

// ─── Agent 2a + 2b: 規則設計師（拆成規則 + 文件，避免單次 token 超限）────────

type RulesCore = {
  mainRules: {
    number: number;
    text: string;
    mutatedText: string;
    corruptedText: string;
    triggerDescription: string;
  }[];
  locationRules: Record<string, { number: number; text: string }[]>;
  contradictions: {
    ruleA: string;
    ruleB: string;
    scenario: string;
  }[];
};

type RulesDocs = {
  foundDocuments: {
    id: string;
    title: string;
    source: "official" | "previous_occupant" | "staff" | "unknown";
    lines: string[];
    findLocation: string;
    findAction: string;
  }[];
};

export type RulesOutput = RulesCore & RulesDocs;

async function runRulesArchitect(
  client: Anthropic,
  concept: ConceptOutput
): Promise<RulesOutput> {
  const conceptStr = JSON.stringify(concept, null, 2);

  // Agent 2a: 主規則 + 地點規則 + 矛盾
  const resultA = await callAgent(
    client,
    "Agent 2a 規則設計師（規則）",
    `你是一位規則怪談規則系統設計師。你設計讓玩家感到不安的規則，
每條規則都有其存在的「理由」，但這個理由從來不會被解釋。
規則必須：官僚語氣、冷靜、帶有隱約不合理感。
重要：你的輸出必須嚴格遵守指定的 JSON 格式，不得新增任何額外欄位。`,
    `
根據以下場景概念，設計主要規則系統：

${conceptStr}

設計要求：
1. 6-8條主要規則，每條規則對應一個可觸發的事件
2. 至少2個地點 ID 有自己的額外規則（類似「某病房附加說明」）
3. 至少2組規則矛盾（主規則說一件事，某文件說相反的）
4. 其中至少一條規則是「陷阱」——看似保護玩家，實際導向危險

每條 mainRule 必須有三個文字版本：
- text：原始版（公告板上的第一天）
- mutatedText：輕微腐化（加「目前」「暫時」或一個讓人不安的詞）
- corruptedText：深度腐化（自相矛盾，或暗示它知道你已經違反了）

範例格式（嚴格遵守，只有這些欄位）：
\`\`\`json
{
  "mainRules": [
    {
      "number": 1,
      "text": "凌晨後請勿打開窗戶。",
      "mutatedText": "凌晨後請勿打開窗戶。若窗戶已開，請假裝它沒有開。",
      "corruptedText": "凌晨後請勿打開窗戶。若你正在閱讀本條，表示窗戶已開。",
      "triggerDescription": "玩家在深夜病房內選擇打開窗戶時觸發"
    }
  ],
  "locationRules": {
    "ward_b": [
      { "number": 1, "text": "B 病區的燈不會完全熄滅。若燈熄滅，請立即離開。" }
    ]
  },
  "contradictions": [
    {
      "ruleA": "主規則第2條：若廣播呼叫你的名字，請立即回應。",
      "ruleB": "員工備忘錄：若廣播呼叫住院者姓名為訓練測試，患者不應回應。",
      "scenario": "玩家在深夜聽見廣播呼叫自己姓名時，需選擇回應或忽略"
    }
  ]
}
\`\`\`

請用以上完全相同的欄位名稱輸出，不得增減欄位。規則文字用繁體中文。
`,
    `## 場景概念\n${conceptStr}`,
    8000
  );

  // Agent 2b: 可發現的文件（拿到 2a 完整輸出）
  const resultB = await callAgent(
    client,
    "Agent 2b 規則設計師（文件）",
    `你是一位規則怪談文件設計師。你設計玩家在場景中可以找到的文件。
這些文件彼此矛盾，讓玩家無法確定哪份是真的。
重要：你的輸出必須嚴格遵守指定的 JSON 格式，不得新增任何額外欄位。`,
    `
根據以下場景概念和已設計的規則，設計3-4份可被玩家發現的文件：

場景概念：
${conceptStr}

已設計的主要規則（文件內容必須與其中某些規則矛盾）：
${resultA}

設計要求：
1. 至少一份是官方文件（語氣正式，但第X條內容是陷阱，引導玩家走向危險）
2. 至少一份是前任使用者/患者留下的（直接寫明「第X條是假的，不要相信」）
3. 至少一份是員工內部文件（揭露管理層隱瞞的事，包含「按標準程序處理」卻不說是什麼程序）
4. 文件之間必須互相矛盾（官方文件說往大廳，員工文件說大廳夜間不安全）

範例格式（嚴格遵守，只有這些欄位）：
\`\`\`json
{
  "foundDocuments": [
    {
      "id": "doc_official_notice",
      "title": "夜間患者注意事項",
      "source": "official",
      "lines": [
        "1. 若感到不適，請按床頭呼叫鈴。",
        "2. 夜間廣播為正常院方通知，請配合。",
        "3. 若有工作人員引導您前往特定區域，請勿拒絕。"
      ],
      "findLocation": "reception",
      "findAction": "查看入院資料夾"
    },
    {
      "id": "doc_patient_note",
      "title": "（手寫便條，紙張發黃）",
      "source": "previous_occupant",
      "lines": [
        "給下一個住這間的人：",
        "第三條是假的。不要跟著工作人員走。",
        "我跟著走了。"
      ],
      "findLocation": "ward_b_room",
      "findAction": "掀開床墊查看"
    }
  ]
}
\`\`\`

請用以上完全相同的欄位名稱輸出，source 只能是 official / previous_occupant / staff / unknown 之一。
`,
    `## 場景概念\n${conceptStr}`,
    8000
  );

  const core = extractJSON<RulesCore>(resultA);
  const docs = extractJSON<RulesDocs>(resultB);
  return { ...core, ...docs };
}

// ─── Agent 2c: 一致性協調師 ──────────────────────────────────────────────────

export type DesignContract = {
  // 每條規則必須連結到哪個事件 ID
  ruleEventMap: {
    ruleNumber: number;
    mustTriggerEventId: string;     // 這條規則要對應的事件 ID
    exposedByDocId?: string;        // 哪份文件會揭露/矛盾這條規則
    isTrap: boolean;
  }[];
  // 每個結局的必要條件路徑
  endingPaths: {
    endingId: string;
    title: string;
    requiredFlags: string[];        // 玩家必須設定哪些 flag
    requiredEvents: string[];       // 必須觸發哪些事件 ID
    blockedBy?: string[];           // 什麼條件會阻止這個結局
  }[];
  // 矛盾規則的事件化：玩家何時面對這個矛盾
  contradictionEvents: {
    contradictionIndex: number;
    eventId: string;                // 哪個事件讓玩家面對這個矛盾
    choiceConsequence: string;      // 選不同邊的大致後果
  }[];
  // 文件的觸發點：玩家如何得知對話中可以引用文件
  docUsageHints: {
    docId: string;
    relevantDialogueTopics: string[];  // 找到這份文件後，對話中應該開放哪些新選項
  }[];
};

async function runConsistencyCoordinator(
  client: Anthropic,
  concept: ConceptOutput,
  rules: RulesOutput
): Promise<DesignContract> {
  const result = await callAgent(
    client,
    "Agent 2c 一致性協調師",
    `你是一位遊戲設計協調師。你的任務是建立一份「設計合約」——
這份合約是所有後續 agent（事件設計師、對話作家、結局設計師）的強制約束。
合約必須讓每條規則都有具體的觸發事件，每份文件都有實際的對話用途，每個結局都有明確的達成路徑。`,
    `
根據以下場景和規則，建立設計合約：

場景：${concept.name}
隱藏真相：${concept.hiddenTruth}

規則摘要：
主規則數量：${rules.mainRules.length} 條
文件數量：${rules.foundDocuments.length} 份
矛盾組數：${rules.contradictions.length} 組

規則列表：
${rules.mainRules.map((r) => `  第${r.number}條：${r.text}`).join("\n")}

文件列表：
${rules.foundDocuments.map((d) => `  ${d.id}：${d.title} (${d.source})`).join("\n")}

矛盾列表：
${rules.contradictions.map((c, i) => `  矛盾${i + 1}：${c.scenario}`).join("\n")}

任務：設計一份讓上述所有元素都「連通」的合約。

規則：
- 每條主規則必須對應一個具體的遊戲事件 ID（你來命名，後續的事件工程師必須建立這個 ID）
- 每個結局必須有具體的達成路徑（需要觸發哪些事件、找到哪些文件）
- 每份文件必須在至少一個對話節點中有實際用途
- 至少2個矛盾規則必須有事件讓玩家面對選擇

嚴格規則：
- 只能有 ruleEventMap、endingPaths、contradictionEvents、docUsageHints 這四個頂層 key
- 每個物件只能有範例中出現的欄位，禁止增加 note、description、reason 等額外欄位
- 保持簡潔，每個字串不超過50個中文字
- ruleEventMap 條目數 = 主規則數；endingPaths 條目數 = 5-7

範例格式（嚴格遵守，禁止增加任何額外欄位）：
\`\`\`json
{
  "ruleEventMap": [
    {
      "ruleNumber": 1,
      "mustTriggerEventId": "event_window_night",
      "exposedByDocId": "doc_patient_note",
      "isTrap": false
    }
  ],
  "endingPaths": [
    {
      "endingId": "ending_compliant",
      "title": "模範患者",
      "requiredFlags": ["followedAllRules"],
      "requiredEvents": ["event_morning_assessment"],
      "blockedBy": ["enteredRestrictedZone"]
    }
  ],
  "contradictionEvents": [
    {
      "contradictionIndex": 0,
      "eventId": "event_broadcast_name",
      "choiceConsequence": "回應→觸發接觸事件；忽略→suspicious上升"
    }
  ],
  "docUsageHints": [
    {
      "docId": "doc_staff_memo",
      "relevantDialogueTopics": ["夜間廣播", "限制區域"]
    }
  ]
}
\`\`\`
`,
    `## 完整規則輸出\n${JSON.stringify(rules, null, 2)}`,
    8000
  );

  return extractJSON<DesignContract>(result);
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

const EVENT_SYSTEM_PROMPT = `你是一位互動敘事遊戲事件設計師，專門設計規則怪談風格的事件。
每個事件都應該讓玩家面對一個選擇，而這個選擇沒有明顯的「正確答案」。
恐怖來自選擇的後果，而不是jump scare。
重要：description 控制在 80 字以內，resultText 控制在 60 字以內，保持精簡。`;

const EFFECTS_REF = `效果類型：
- { type: "sanity", value: -15 }
- { type: "anomaly", value: 2 }
- { type: "world", key: "hotelRealityStability", value: -20 }
- { type: "flag", key: "flagName", value: true }
- { type: "sheet", value: "doc_id" }
- { type: "ending", value: "endingId" }`;

// Agent 3 splits into 3a (rule-trigger events) and 3b (contradiction + ending events)
async function runEventEngineer(
  client: Anthropic,
  concept: ConceptOutput,
  rules: RulesOutput,
  contract: DesignContract,
  scenarioSlug: string
): Promise<EventsOutput> {
  const locations = concept.locations.map((l) => l.id).join(", ");
  // Split rule events into thirds to stay under token limit
  const total = contract.ruleEventMap.length;
  const third = Math.ceil(total / 3);
  const ruleMapA = contract.ruleEventMap.slice(0, third);
  const ruleMapB = contract.ruleEventMap.slice(third, third * 2);
  const ruleMapC = contract.ruleEventMap.slice(third * 2);

  const baseContext = `## 規則摘要\n${rules.mainRules.map((r) => `第${r.number}條：${r.text}`).join("\n")}\n\n## 設計合約（ID 必須完全相符）\n${JSON.stringify(contract, null, 2)}`;

  const strictPrompt = `每個事件嚴格控制：description ≤ 60字，resultText ≤ 45字，只輸出必要欄位。\n${EFFECTS_REF}`;

  // Save sub-checkpoints so retry doesn't re-run completed parts
  let eventsA = (await loadCheckpoint(scenarioSlug, "events_3a")) as EventsOutput | null;
  if (!eventsA) {
    const r = await callAgent(client, "Agent 3a 事件工程師（開場+前段）", EVENT_SYSTEM_PROMPT,
      `設計 ${ruleMapA.length + 1} 個事件。場景：${concept.name}，地點：${locations}\n\n1. 開場事件（once: true）：玩家進入場景，收到規則說明\n2. 合約規定事件（ID 必須完全相同）：\n${ruleMapA.map((r) => `   - ${r.mustTriggerEventId}`).join("\n")}\n\n${strictPrompt}\n\n輸出 JSON（\`\`\`json）：{ "events": [...] }`,
      baseContext, 8000);
    eventsA = extractJSON<EventsOutput>(r);
    await saveCheckpoint(scenarioSlug, "events_3a", eventsA);
  }

  let eventsB = (await loadCheckpoint(scenarioSlug, "events_3b")) as EventsOutput | null;
  if (!eventsB) {
    const r = await callAgent(client, "Agent 3b 事件工程師（中段）", EVENT_SYSTEM_PROMPT,
      `設計 ${ruleMapB.length} 個事件。場景：${concept.name}，地點：${locations}\n\n合約規定事件（ID 必須完全相同）：\n${ruleMapB.map((r) => `   - ${r.mustTriggerEventId}`).join("\n")}\n\n${strictPrompt}\n\n輸出 JSON（\`\`\`json）：{ "events": [...] }`,
      baseContext, 8000);
    eventsB = extractJSON<EventsOutput>(r);
    await saveCheckpoint(scenarioSlug, "events_3b", eventsB);
  }

  let eventsC = (await loadCheckpoint(scenarioSlug, "events_3c")) as EventsOutput | null;
  if (!eventsC) {
    const contradictions = contract.contradictionEvents ?? [];
    const contradictionStr = contradictions.map((c) => `- ${c.eventId}：${c.choiceConsequence}`).join("\n");
    const r = await callAgent(client, "Agent 3c 事件工程師（矛盾+清晨）", EVENT_SYSTEM_PROMPT,
      `設計 ${ruleMapC.length + contradictions.length + 1} 個事件。場景：${concept.name}，地點：${locations}\n\n1. 合約規定事件：\n${ruleMapC.map((r) => `   - ${r.mustTriggerEventId}`).join("\n")}\n2. 矛盾規則事件：\n${contradictionStr}\n3. 清晨/離開條件（once: true）：\n${contract.endingPaths.map((e) => `   - 結局 ${e.endingId} 需要：${e.requiredEvents.join(", ")}`).join("\n")}\n\n${strictPrompt}\n\n輸出 JSON（\`\`\`json）：{ "events": [...] }`,
      baseContext, 8000);
    eventsC = extractJSON<EventsOutput>(r);
    await saveCheckpoint(scenarioSlug, "events_3c", eventsC);
  }

  return { events: [...eventsA.events, ...eventsB.events, ...eventsC.events] };
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

// Agent 4 runs once per NPC in parallel to avoid hitting token limits
async function runDialogueWriterForNpc(
  client: Anthropic,
  npc: ConceptOutput["npcs"][0],
  concept: ConceptOutput,
  rules: RulesOutput,
  contract: DesignContract
): Promise<DialoguesOutput["dialogues"][0]> {
  const myHints = contract.docUsageHints
    .map((d) => `- 找到 ${d.docId} 後可問：${d.relevantDialogueTopics.join("、")}`)
    .join("\n");

  const result = await callAgent(
    client,
    `Agent 4 對話作家（${npc.name}）`,
    `你是一位互動敘事遊戲對話設計師，專門設計恐怖規則怪談風格的NPC對話。
NPC說的話永遠帶有一點不對勁——太過官方、太過標準、或者知道一點不該知道的事情。
每次追問都讓事情更奇怪而不是更清楚。
重要：保持每個 npcText 在 60 字以內，choices label 在 20 字以內。`,
    `
為以下單一 NPC 設計多輪對話樹：

場景：${concept.name}
NPC：${JSON.stringify(npc, null, 2)}

【強制要求 — 設計合約】
${myHints}

對話設計要求：
1. 10-12 個對話節點（不要超過，保持精簡）
2. 對話根據玩家狀態給出不同回應：
   - 普通狀態：官方標準回應，帶一點破綻
   - 找到特定文件後：開放質問選項，NPC 有破防反應
   - sanity 低時：NPC 說話更奇怪
3. 必要節點：greet → main_menu → 至少4個主題節點
4. 必要對話路徑：
   - 詢問其他患者/使用者 → 隱私條款回應
   - 詢問某條規則 → 標準回應帶破綻
   - 詢問限制區域 → 閃爍其詞
   - 文件質問 → 破防（condition: "player.foundSheets.includes('doc_id')"）

欄位說明（禁止增加其他欄位）：
- npcText: string（NPC 說的話，60字以內）
- choices: 陣列，每個 choice 有 id、label、condition?、setMemory?、next

輸出單一對話物件 JSON（用 \`\`\`json 包裹）：
{
  "id": "${npc.id}_dialogue",
  "npcName": "${npc.name}",
  "location": "npc所在地點id",
  "startScene": "greet",
  "scenes": { ... }
}
`,
    `## 規則摘要\n${rules.mainRules.map((r) => `第${r.number}條：${r.text}`).join("\n")}\n\n## 設計合約\n${JSON.stringify(contract, null, 2)}`,
    8000
  );

  return extractJSON<DialoguesOutput["dialogues"][0]>(result);
}

async function runDialogueWriter(
  client: Anthropic,
  concept: ConceptOutput,
  rules: RulesOutput,
  contract: DesignContract
): Promise<DialoguesOutput> {
  // Run one agent per NPC in parallel
  const dialogueList = await Promise.all(
    concept.npcs.map((npc) =>
      runDialogueWriterForNpc(client, npc, concept, rules, contract)
    )
  );
  return { dialogues: dialogueList };
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
  events: EventsOutput,
  contract: DesignContract
): Promise<EndingsOutput> {
  const result = await callAgent(
    client,
    "Agent 5 結局設計師",
    `你是一位互動敘事遊戲結局設計師。
好的結局不是「好人得救，壞人受罰」，而是揭示場景背後的邏輯——
而且這個揭示總是帶著一點令人不安的後勁。
結局文字應該簡潔、有餘韻、留下一個未解的問題。`,
    `
根據以下場景和設計合約，設計5-7個結局：

場景：${concept.name}
隱藏真相：${concept.hiddenTruth}

【強制要求 — 設計合約】
以下結局路徑你必須實現（ID 必須完全一致）：
${contract.endingPaths.map((e) => `
- 結局 ID：${e.endingId}（${e.title}）
  需要觸發事件：${e.requiredEvents.join(", ")}
  需要玩家 flag：${e.requiredFlags.join(", ")}
  ${e.blockedBy ? `阻止條件：${e.blockedBy.join(", ")}` : ""}
`).join("")}

設計要求：
1. 每個結局 ID 必須與合約一致
2. 至少一個「表面成功，細節不安」的結局
3. 至少一個「遵守了所有規則，但規則本身是陷阱」的結局
4. 一個隱藏結局（需要找到特定文件組合）
5. 結局文字200-400字，最後一句帶後勁，不解釋謎底

觸發條件寫法範例：
- "player.enteredRestrictedZone"
- "player.sanity <= 20 && world.anomalyAttention >= 5"
- "player.foundSheets.includes('doc_staff_memo') && player.suspicion > 80"

輸出 JSON（用 \`\`\`json 包裹）。
`,
    `## 設計合約\n${JSON.stringify(contract, null, 2)}\n\n## 規則系統摘要\n${JSON.stringify({ mainRules: rules.mainRules.map((r) => ({ number: r.number, text: r.text })), contradictions: rules.contradictions }, null, 2)}\n\n## 已設計事件 ID\n${events.events.map((e) => e.id).join(", ")}`,
    8000
  );

  return extractJSON<EndingsOutput>(result);
}

// ─── Agent 6: 程式碼生成師（拆成 3 個並行 call）────────────────────────────

type CodeOutput = {
  indexTs: string;
  eventsTs: string;
  rulesTs: string;
  ruleSheetsTs: string;
  endingsTs: string;
  dialoguesTs: string;
  locationActionsTs: string;
};

const CODE_GEN_SYSTEM = `你是一位 TypeScript 遊戲開發工程師。
將設計 JSON 轉換為完整的 TypeScript 程式碼。
型別規則：
- GameEvent.trigger: (player: PlayerState, world: WorldState) => boolean
- GameEvent.choices[].condition?: (player: PlayerState, world: WorldState) => boolean
- GameEnding.condition: (player: PlayerState, world: WorldState) => boolean
- LocationAction.resultText: string | ((player: PlayerState, world: WorldState) => string)
時間比較必須用絕對分鐘數（開始時間 + offset）。
所有敘事文字用繁體中文。程式碼識別符用英文。
只輸出純 TypeScript，不要解釋。`;

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
  const { concept, rules, events, dialogues, endings } = allOutputs;
  const startTime = concept.startTime;

  // 6a: events.ts（最大的檔案，單獨跑）
  // 6b: rules.ts + ruleSheets.ts + endings.ts
  // 6c: dialogues/index.ts + locationActions.ts + index.ts
  // One file per agent call, all parallel — prevents any single call from truncating
  const [eventsR, rulesR, sheetsR, endingsR, dialoguesR, locationsR, indexR] =
    await Promise.all([
      // events.ts split into two halves to stay under token limit
      (async () => {
        const half = Math.ceil(events.events.length / 2);
        const eventsA = events.events.slice(0, half);
        const eventsB = events.events.slice(half);
        const [rA, rB] = await Promise.all([
          callAgent(client, "Agent 6 events-a", CODE_GEN_SYSTEM,
            `生成第一批 GameEvent 物件的 TypeScript 程式碼。\n開始時間：${startTime} 分鐘。\n事件資料：${JSON.stringify(eventsA, null, 2)}\n\n輸出 JSON（\`\`\`json）：{ "items": "逗號分隔的 GameEvent 物件字面量（不含 [ ] 和 export）" }`,
            "", 8000),
          callAgent(client, "Agent 6 events-b", CODE_GEN_SYSTEM,
            `生成第二批 GameEvent 物件的 TypeScript 程式碼。\n開始時間：${startTime} 分鐘。\n事件資料：${JSON.stringify(eventsB, null, 2)}\n\n輸出 JSON（\`\`\`json）：{ "items": "逗號分隔的 GameEvent 物件字面量（不含 [ ] 和 export）" }`,
            "", 8000),
        ]);
        const itemsA = extractJSON<{ items: string }>(rA).items;
        const itemsB = extractJSON<{ items: string }>(rB).items;
        const eventsTs = [
          `import type { GameEvent, PlayerState, WorldState } from "@/types/game";`,
          ``,
          `const START = ${startTime};`,
          ``,
          `export const SCENARIO_EVENTS: GameEvent[] = [`,
          itemsA,
          `,`,
          itemsB,
          `];`,
        ].join("\n");
        return JSON.stringify({ eventsTs });
      })(),

      callAgent(client, "Agent 6 rules.ts", CODE_GEN_SYSTEM,
        `生成 rules.ts，export function getRules(player: PlayerState, world: WorldState): RuleEntry[]。\n規則（含三版本）：${JSON.stringify(rules.mainRules, null, 2)}\n地點規則：${JSON.stringify(rules.locationRules, null, 2)}\n\n輸出 JSON：{ "rulesTs": "完整TS內容" }`,
        "", 8000),

      callAgent(client, "Agent 6 ruleSheets.ts", CODE_GEN_SYSTEM,
        `生成 ruleSheets.ts，export const SCENARIO_RULE_SHEETS: Record<string, RuleSheet>。\n文件資料：${JSON.stringify(rules.foundDocuments, null, 2)}\n\n輸出 JSON：{ "ruleSheetsTs": "完整TS內容" }`,
        "", 8000),

      callAgent(client, "Agent 6 endings.ts", CODE_GEN_SYSTEM,
        `生成 endings.ts，export function checkScenarioEnding(player: PlayerState, world: WorldState, forcedId?: string): GameEnding | null。\n結局資料：${JSON.stringify(endings, null, 2)}\n\n輸出 JSON：{ "endingsTs": "完整TS內容" }`,
        "", 8000),

      callAgent(client, "Agent 6 dialogues.ts", CODE_GEN_SYSTEM,
        `生成 dialogues/index.ts，export const SCENARIO_DIALOGUES: Record<string, Dialogue>。\n對話資料：${JSON.stringify(dialogues, null, 2)}\n\n輸出 JSON：{ "dialoguesTs": "完整TS內容" }`,
        "", 8000),

      callAgent(client, "Agent 6 locationActions.ts", CODE_GEN_SYSTEM,
        `生成 locationActions.ts，export const SCENARIO_LOCATIONS: Record<string, LocationData>。\n場景：${concept.name}\n地點清單：${JSON.stringify(concept.locations, null, 2)}\n每個地點設計 2-3 個行動（resultText ≤ 60字，用繁體中文）。\n\n輸出 JSON：{ "locationActionsTs": "完整TS內容" }`,
        "", 8000),

      callAgent(client, "Agent 6 index.ts", CODE_GEN_SYSTEM,
        `生成 index.ts，import 並 export 一個 ScenarioPack 物件。
pack 資訊：
- id: "${concept.slug ?? concept.name}"
- name: "${concept.name}"
- nameEn: "${concept.nameEn ?? ""}"
- tagline: "${concept.tagline}"
- description: "${concept.setting}"
- initialPlayer: 開始時間 ${startTime} 分鐘，從 ${concept.locations[0]?.id} 開始，sanity/suspicion 100/0

imports 來源：
- SCENARIO_EVENTS from "./events"
- getRules from "./rules"
- SCENARIO_RULE_SHEETS from "./ruleSheets"
- checkScenarioEnding from "./endings"
- SCENARIO_DIALOGUES from "./dialogues"
- SCENARIO_LOCATIONS from "./locationActions"

輸出 JSON：{ "indexTs": "完整TS內容" }`,
        "", 8000),
    ]);

  return {
    eventsTs: JSON.parse(eventsR as string).eventsTs,
    rulesTs: extractJSON<{ rulesTs: string }>(rulesR).rulesTs,
    ruleSheetsTs: extractJSON<{ ruleSheetsTs: string }>(sheetsR).ruleSheetsTs,
    endingsTs: extractJSON<{ endingsTs: string }>(endingsR).endingsTs,
    dialoguesTs: extractJSON<{ dialoguesTs: string }>(dialoguesR).dialoguesTs,
    locationActionsTs: extractJSON<{ locationActionsTs: string }>(locationsR).locationActionsTs,
    indexTs: extractJSON<{ indexTs: string }>(indexR).indexTs,
  };
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
  allOutputs: {
    concept: ConceptOutput;
    rules: RulesOutput;
    contract: DesignContract;
    events: EventsOutput;
    endings: EndingsOutput;
  }
): Promise<ValidationOutput> {
  // Only pass IDs and structure, not full text — keeps input small
  // Use ?. and ?? [] to guard against model returning different structure keys
  const r = allOutputs.rules;
  const e = allOutputs.events;
  const en = allOutputs.endings;
  const c = allOutputs.contract;
  const summary = {
    ruleNumbers: (r?.mainRules ?? []).map((x) => x.number),
    eventIds: (e?.events ?? []).map((x) => x.id),
    endingIds: (en?.endings ?? []).map((x) => x.id),
    contractRuleEventMap: c?.ruleEventMap ?? [],
    contractEndingPaths: (c?.endingPaths ?? []).map((p) => ({
      endingId: p.endingId,
      requiredEvents: p.requiredEvents ?? [],
    })),
    contradictionEventIds: (c?.contradictionEvents ?? []).map((x) => x.eventId),
    docIds: (r?.foundDocuments ?? []).map((x) => x.id),
  };

  const result = await callAgent(
    client,
    "Agent 7 驗證師",
    `你是一位遊戲設計驗證師。輸出必須嚴格遵守指定 JSON 格式，禁止增加額外欄位。每條 issue/warning 限 40 字。`,
    `
驗證設計一致性：

${JSON.stringify(summary, null, 2)}

檢查：
1. contract.ruleEventMap 中的每個 mustTriggerEventId 是否都在 eventIds 中？
2. contract.endingPaths 中的每個 requiredEvents 是否都在 eventIds 中？
3. contradictionEventIds 是否都在 eventIds 中？
4. contract.endingPaths 的 endingId 是否都在 endingIds 中？

輸出 JSON（嚴格遵守此格式，禁止增加其他欄位）：
\`\`\`json
{
  "valid": true,
  "issues": ["嚴重問題（缺少必要事件 ID 等）"],
  "warnings": ["輕微問題"],
  "suggestions": ["可選改進"],
  "rulesCoverage": { "1": true, "2": false }
}
\`\`\`
`,
    "",
    3000
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
  console.log(`   輸出：lib/scenarios/${finalSlug}/`);
  console.log(`\n   Pipeline：概念師 → 規則師(2a+2b) → 協調師(2c) → [事件師 ‖ 對話師] → 結局師 → 程式碼師 → 驗證師\n`);

  // Agent 1: Conceiver
  let concept = (await loadCheckpoint(finalSlug, "concept")) as ConceptOutput | null;
  if (!concept) {
    concept = await runConceiver(client);
    await saveCheckpoint(finalSlug, "concept", concept);
  }

  // Agent 2a+2b: Rules Architect (split to avoid token limits)
  let rules = (await loadCheckpoint(finalSlug, "rules")) as RulesOutput | null;
  if (!rules) {
    rules = await runRulesArchitect(client, concept);
    await saveCheckpoint(finalSlug, "rules", rules);
  }

  // Agent 2c: Consistency Coordinator → design contract
  let contract = (await loadCheckpoint(finalSlug, "contract")) as DesignContract | null;
  if (!contract) {
    contract = await runConsistencyCoordinator(client, concept, rules);
    await saveCheckpoint(finalSlug, "contract", contract);
  }

  // Agent 3 + 4: Parallel — both receive the design contract
  let events = (await loadCheckpoint(finalSlug, "events")) as EventsOutput | null;
  let dialogues = (await loadCheckpoint(finalSlug, "dialogues")) as DialoguesOutput | null;

  if (!events || !dialogues) {
    log("Agent 3+4", "事件工程師 + 對話作家 並行執行（依設計合約）...");
    const [eventsResult, dialoguesResult] = await Promise.all([
      events ?? runEventEngineer(client, concept, rules, contract, finalSlug),
      dialogues ?? runDialogueWriter(client, concept, rules, contract),
    ]);
    events = eventsResult;
    dialogues = dialoguesResult;
    await saveCheckpoint(finalSlug, "events", events);
    await saveCheckpoint(finalSlug, "dialogues", dialogues);
  }

  // Agent 5: Endings Designer — receives the design contract
  let endings = (await loadCheckpoint(finalSlug, "endings")) as EndingsOutput | null;
  if (!endings) {
    endings = await runEndingsDesigner(client, concept, rules, events, contract);
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
  const validation = await runValidator(client, { concept, rules, contract, events, endings });
  await saveCheckpoint(finalSlug, "validation", validation);

  // Write output files
  await writeScenario(finalSlug, concept, code, validation);

  // Post-processing: fix imports, dedup IDs, run tsc
  const outDir = join(PROJECT_ROOT, "lib", "scenarios", finalSlug);
  log("後處理", "修正 import 路徑、去重 event ID、驗證 TypeScript...");
  const ppResult = await postProcess(outDir, PROJECT_ROOT);

  if (ppResult.fixed.length > 0) {
    console.log(`\n🔧 自動修正（${ppResult.fixed.length} 項）：`);
    ppResult.fixed.forEach((f) => console.log(`   ✓ ${f}`));
  }

  if (ppResult.tscErrors.length > 0) {
    console.log(`\n⚠️  TypeScript 錯誤（需手動修正）：`);
    ppResult.tscErrors.forEach((e) => console.log(`   ${e}`));
  } else {
    console.log(`   ✓ TypeScript 編譯通過`);
  }

  // Auto-add to registry if validation passed and no tsc errors
  if (validation.valid && ppResult.ok) {
    log("加入遊戲", `正在將 ${finalSlug} 加入 scenarioRegistry.ts...`);
    const exportName = await getScenarioExportName(outDir);
    await addScenarioToRegistry(finalSlug, exportName, PROJECT_ROOT);
    console.log(`   ✓ 已加入 registry（${exportName}）`);
    console.log(`   ✓ 重啟 dev server 後首頁即可看到新劇本`);
  } else {
    console.log(`\n⚠️  未自動加入遊戲（存在問題需先修正）`);
    console.log(`   手動加入：編輯 lib/scenarioRegistry.ts`);
  }
}

main().catch((err) => {
  console.error("\n❌ 生成失敗：", err.message);
  if (err.status === 401) console.error("   請確認 ANTHROPIC_API_KEY 是否正確");
  process.exit(1);
});
