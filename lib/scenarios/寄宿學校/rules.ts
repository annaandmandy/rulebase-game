import { PlayerState, WorldState } from "@/types/game";

// 遊戲開始時間：深夜 21:43 = 1303 分鐘
export const GAME_START_MINUTES = 1303;
// 熄燈廣播時間（與開始時間相同，熄燈後即進入須知生效）
export const LIGHTS_OUT_MINUTES = 1303;
// 次日清晨六點起床鈴 = 開始當日 06:00 隔日 = 30 * 60 = 1800 分鐘
export const MORNING_BELL_MINUTES = 1800;

export type RuleSource = "official" | "location";

export type RuleEntry = {
  number: number;
  source: RuleSource;
  locationId?: string;
  text: string;
  triggerDescription?: string;
};

/**
 * 依據世界狀態的 ruleNoticeVersion（1=原始 2=變化 3=腐化）
 * 以及目前所在地點，回傳當前顯示的全部規則條目。
 * 時間相關判斷一律使用絕對分鐘數。
 */
export function getRules(player: PlayerState, world: WorldState): RuleEntry[] {
  const version = world.ruleNoticeVersion;

  const pick = (original: string, mutated: string, corrupted: string): string => {
    if (version >= 3) return corrupted;
    if (version === 2) return mutated;
    return original;
  };

  const officialRules: RuleEntry[] = [
    {
      number: 1,
      source: "official",
      text: pick(
        "熄燈廣播後，請待在自己的床位上，直到次日清晨六點起床鈴響。",
        "熄燈廣播後，請待在自己被登記的床位上，直到次日清晨六點起床鈴響。目前你的床位仍是 307-A。",
        "熄燈廣播後，請待在自己被登記的床位上。你今晚換過一次床位，本須知已重新核對了你的位置。"
      ),
      triggerDescription: "玩家在熄燈後（時間超過1303分鐘）離開寢室 307 時觸發",
    },
    {
      number: 2,
      source: "official",
      text: pick(
        "舍監進行夜間點名時，聽見自己的姓名請清楚答「有」。未答到者視同缺席。",
        "舍監進行夜間點名時，聽見自己的姓名請清楚答「有」。目前名冊上的姓名數多於在校人數，請務必答到。",
        "舍監進行夜間點名時，聽見自己的姓名請清楚答「有」。今晚被點到的名字不一定屬於你，但缺額仍需有人答到。"
      ),
      triggerDescription: "舍監在值班室或走廊進行點名、念出玩家姓名時觸發",
    },
    {
      number: 3,
      source: "official",
      text: pick(
        "若在走廊聽見有人呼喚你的姓名，而當時並非正式點名時段，請勿回應，並繼續前行。",
        "若在走廊聽見有人呼喚你的姓名，而當時並非正式點名時段，請勿回應。你無法分辨是否為正式點名時，一律視為非正式。",
        "若在走廊聽見有人呼喚你的姓名，請勿回應。你方才已經回應過一次，請勿再回應第二次。"
      ),
      triggerDescription: "玩家位於三樓走廊，且非點名時段聽見走廊深處呼喚自己姓名時觸發",
    },
    {
      number: 4,
      source: "official",
      text: pick(
        "夜讀自習室的「出席人數」牌每日由舍監核對，請勿自行更動牌上數字。",
        "夜讀自習室的「出席人數」牌每日由舍監核對，請勿自行更動牌上數字。若數字與在場人數不符，那是正確的。",
        "夜讀自習室的「出席人數」牌請勿更動。今晚牌上多出的那一人是你，或將是你。"
      ),
      triggerDescription: "玩家在夜讀自習室查看或試圖更動出席人數牌時觸發",
    },
    {
      number: 5,
      source: "official",
      text: pick(
        "遇到任何疑慮，請至舍監值班室登記，由值班舍監協助核對你的在校身分。",
        "遇到任何疑慮，請至舍監值班室登記。目前值班舍監不會抬頭，登記時請將學號報齊。",
        "遇到任何疑慮，請至舍監值班室登記。你登記的那一刻，就同意被算進今晚的核對。"
      ),
      triggerDescription: "玩家進入舍監值班室並向周老師登記或詢問身分時觸發",
    },
    {
      number: 6,
      source: "official",
      text: pick(
        "盥洗間鏡子如有霧氣，請勿擦拭，亦請勿在鏡前報數或自言自語。",
        "盥洗間鏡子如有霧氣，請勿擦拭。霧氣後若映出人數，那不是給你看的。",
        "盥洗間鏡子請勿擦拭。鏡裡的人數比走廊多一個，那一個一直在數你。"
      ),
      triggerDescription: "玩家在盥洗間擦拭末端鏡子或在鏡前出聲時觸發",
    },
    {
      number: 7,
      source: "official",
      text: pick(
        "西側樓梯間與頂樓鐵門於熄燈後封閉。非緊急狀況，請勿開啟頂樓鐵門。",
        "西側樓梯間與頂樓鐵門於熄燈後封閉。目前所謂「緊急狀況」的定義已暫時撤除。",
        "西側樓梯間與頂樓鐵門於熄燈後封閉。三十年前有七個人從這裡出去，至今仍登記在校。"
      ),
      triggerDescription: "玩家於熄燈後試圖開啟頂樓鐵門或進入西側樓梯間焦痕處時觸發",
    },
    {
      number: 8,
      source: "official",
      text: pick(
        "若清晨六點起床鈴未響，表示昨夜核對尚未完成，請留在原地等候舍監再次點名。",
        "若清晨六點起床鈴未響，表示昨夜核對尚未完成，請留在原地等候。等候期間請勿確認自己是否仍被算在學生那一欄。",
        "若清晨六點起床鈴未響，表示缺額尚未補足。你留在原地，就是最方便被補上的那一個。"
      ),
      triggerDescription: "遊戲時間到達清晨六點（次日，1800 分鐘）但核對未完成、玩家仍在宿舍內時觸發",
    },
  ];

  const locationRules: Record<string, RuleEntry[]> = {
    duty_office: [
      {
        number: 1,
        source: "location",
        locationId: "duty_office",
        text: "登記簿以紅筆劃記者為已核對人員。請勿翻閱紅筆之後的頁面。",
      },
      {
        number: 2,
        source: "location",
        locationId: "duty_office",
        text: "若值班舍監抬頭看你，表示你的姓名已被移至需補足之欄位，請立即離開本室。",
      },
    ],
    study_hall: [
      {
        number: 1,
        source: "location",
        locationId: "study_hall",
        text: "自習室檯燈整夜不熄。若某盞檯燈熄滅，代表該座位的學生今晚已不需要光。請勿就坐於該座位。",
      },
      {
        number: 2,
        source: "location",
        locationId: "study_hall",
        text: "牆上出席人數牌只增不減。若你數出的在場人數少於牌上數字，差額已由你補上，無須回報。",
      },
    ],
    dorm_room: [
      {
        number: 1,
        source: "location",
        locationId: "dorm_room",
        text: "對床雖未登記室友姓名，仍屬已分配床位。若對床棉被夜間隆起，請勿掀開查看，亦請勿向其問安。",
      },
    ],
  };

  const result: RuleEntry[] = [...officialRules];

  const localRules = locationRules[player.currentLocation];
  if (localRules) {
    result.push(...localRules);
  }

  return result;
}
