import { PlayerState, WorldState } from "@/types/game";

// 規則開始時間：夜間九點半 = 1290 分鐘（21:30）
// 次日早上七點 = 1290 + 570 = 1860 分鐘
export const START_MINUTES = 1290;
export const SEVEN_AM_MINUTES = 1860;
export const MIDNIGHT_MINUTES = 1440;

export type RuleEntry = {
  number: number;
  source: "official" | "previous_occupant" | "staff" | "unknown";
  text: string;
  version: 1 | 2 | 3;
};

type RuleVariants = {
  number: number;
  source: RuleEntry["source"];
  original: string;
  mutated: string;
  corrupted: string;
};

const GLOBAL_RULES: RuleVariants[] = [
  {
    number: 1,
    source: "official",
    original:
      "夜間九點半起即為熄燈作息時間，請待在所屬寢室內，勿在走廊逗留。",
    mutated:
      "夜間九點半起即為熄燈作息時間，請待在所屬寢室內，勿在走廊逗留。目前走廊上不應有任何人。",
    corrupted:
      "夜間九點半起請待在所屬寢室內。我們已注意到走廊上多了一組腳步聲，請確認那是你的。",
  },
  {
    number: 2,
    source: "official",
    original:
      "每晚作息鐘聲響起兩次：晚自習結束鐘與熄燈鐘。聽見鐘聲後請依鐘聲完成對應作息。",
    mutated:
      "每晚作息鐘聲響起兩次。若你聽見第三次鐘聲，請暫時忽略它並繼續就寢。",
    corrupted:
      "每晚作息鐘聲響起兩次。第三次鐘聲不是給你的，但你既然數到了第三聲，名單上就會有你。",
  },
  {
    number: 3,
    source: "official",
    original:
      "夜間舍監將於就寢後進行點名。聽見自己的姓名時，請於床上清楚應答「到」。",
    mutated:
      "夜間舍監將於就寢後進行點名。聽見自己的姓名時請應答「到」，即使你不確定那是不是你的姓名。",
    corrupted:
      "點名時請應答「到」。你昨晚已經應答過了，今晚的應答只是為了確認你仍在床上。你在嗎？",
  },
  {
    number: 4,
    source: "official",
    original:
      "身體不適者請至保健室登記體溫，並於登記簿簽下本名，以便隔日追蹤。",
    mutated:
      "身體不適者請至保健室登記並簽名。若登記簿上已有你的名字，請在其下方再簽一次。",
    corrupted:
      "請至保健室簽名。登記簿上每一行都是你的名字，這代表你每一晚都很配合。今晚也請簽。",
  },
  {
    number: 5,
    source: "official",
    original: "盥洗後請隨手關閉盥洗室燈光，以維持夜間節電與秩序。",
    mutated:
      "盥洗後請隨手關閉盥洗室燈光。請勿注意鏡中比實際多出的那一盞燈是否也熄滅。",
    corrupted:
      "請關閉盥洗室燈光。鏡子那一側的燈由鏡子裡的人負責關，你關掉這一側，就輪到他出來關那一側。",
  },
  {
    number: 6,
    source: "official",
    original:
      "為維護住宿生安全，夜間請勿使用西側樓梯離開宿舍區，待天亮起床鐘後方可自由活動。",
    mutated:
      "夜間請勿使用西側樓梯。樓梯目前的階數與日間不符，這屬於正常範圍，請勿計算。",
    corrupted:
      "夜間請勿使用西側樓梯。你若堅持往下走，會在第幾階遇見正在往上走、和你長得一樣的住宿生？",
  },
  {
    number: 7,
    source: "official",
    original:
      "早上七點起床鐘響時，全體住宿生應在床上，由舍監完成在床確認後，方可開始一日作息。",
    mutated:
      "早上七點起床鐘響時請務必在床上等待在床確認。未被確認在床者，作息將無法為其開始。",
    corrupted:
      "七點請在床上等待確認。已確認在床者永遠不會離校，這是我們對你最周到的安排。你要被確認嗎？",
  },
];

function resolveVersion(player: PlayerState, world: WorldState): 1 | 2 | 3 {
  // 以 ruleNoticeVersion 為主，並受現實穩定度與理智值影響
  if (world.ruleNoticeVersion >= 3) return 3;
  if (world.ruleNoticeVersion === 2) {
    if (world.hotelRealityStability <= 25 || player.sanity <= 20) return 3;
    return 2;
  }
  if (world.hotelRealityStability <= 40 || player.sanity <= 35) return 2;
  return 1;
}

function pickText(rule: RuleVariants, version: 1 | 2 | 3): string {
  if (version === 3) return rule.corrupted;
  if (version === 2) return rule.mutated;
  return rule.original;
}

export function getRules(player: PlayerState, world: WorldState): RuleEntry[] {
  const version = resolveVersion(player, world);
  return GLOBAL_RULES.map((rule) => ({
    number: rule.number,
    source: rule.source,
    text: pickText(rule, version),
    version,
  }));
}

export type LocationRuleEntry = {
  number: number;
  source: RuleEntry["source"];
  text: string;
};

const LOCATION_RULES: Record<string, LocationRuleEntry[]> = {
  infirmary: [
    {
      number: 1,
      source: "staff",
      text: "保健室登記簿不得撕除任何一頁。每一行名字都對應一位仍在追蹤中的住宿生。",
    },
    {
      number: 2,
      source: "unknown",
      text: "若你在登記簿上讀到自己尚未寫下的名字，表示流程已為你預先完成，請勿塗改。",
    },
  ],
  duty_office: [
    {
      number: 1,
      source: "staff",
      text: "值班室桌上的茶不冒熱氣屬正常現象，請勿替舍監加熱或更換。",
    },
    {
      number: 2,
      source: "staff",
      text: "點名冊僅由舍監翻閱。若你看見冊上已有今晚的勾記，請假裝那一筆不是你的。",
    },
  ],
  dorm_room: [
    {
      number: 1,
      source: "previous_occupant",
      text: "對面床鋪的名牌不得取下。寢室長隨時可能回來，請為他保留鋪位整潔。",
    },
  ],
};

export function getLocationRules(
  locationId: string,
  _player: PlayerState,
  _world: WorldState
): LocationRuleEntry[] {
  return LOCATION_RULES[locationId] ?? [];
}
