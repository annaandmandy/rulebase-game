import { PlayerState, WorldState } from "./types";

export type RuleEntry = {
  number: number;
  title: string;
  source: "official" | "previous_occupant" | "staff" | "unknown";
  text: string;
};

/**
 * 依據世界狀態回傳當前版本的院內留觀須知。
 * ruleNoticeVersion: 1=原始 2=變化(mutated) 3=腐化(corrupted)
 * 當現實穩定度過低或異常注意度過高時，個別規則會提前腐化。
 */
export function getRules(player: PlayerState, world: WorldState): RuleEntry[] {
  const version = world.ruleNoticeVersion;
  const stability = world.hotelRealityStability;
  const attention = world.anomalyAttention;

  // 決定單條規則要顯示哪個版本：基礎版本 + 局部腐化判定
  const pickVersion = (localCorrupt: boolean): 1 | 2 | 3 => {
    if (version >= 3 || localCorrupt) return 3;
    if (version === 2) return 2;
    return 1;
  };

  const select = (
    localCorrupt: boolean,
    original: string,
    mutated: string,
    corrupted: string
  ): string => {
    switch (pickVersion(localCorrupt)) {
      case 3:
        return corrupted;
      case 2:
        return mutated;
      default:
        return original;
    }
  };

  const rules: RuleEntry[] = [];

  // 規則一：床頭手環
  rules.push({
    number: 1,
    title: "留觀身分手環",
    source: "official",
    text: select(
      player.foundSheets.includes("wristband_worn") && stability < 40,
      "為加速夜間留觀流程，請於抵達後三十分鐘內自行配戴床頭手環。手環有助於本院在交班時確認您的留觀身分。",
      "為加速夜間留觀流程，請於抵達後三十分鐘內自行配戴床頭手環。手環一經配戴，目前無法自行取下，這是正常現象。",
      "手環有助於本院確認您的身分。若您仍認為自己沒有戴上手環，請查看您的左手腕，並停止這種想法。"
    ),
  });

  // 規則二：心電監視器
  rules.push({
    number: 2,
    title: "心電監視器導線",
    source: "official",
    text: select(
      player.discoveredClues.includes("flatline_without_lead") || stability < 30,
      "心電監視器的波形代表您目前的生命徵象，請勿自行拔除導線。任何時刻監視器都不應顯示為一直線。",
      "心電監視器的波形代表您目前的生命徵象，請勿自行拔除導線。若您並未連接任何導線，波形仍會持續，這是正常現象。",
      "監視器顯示的是您的生命徵象。它已經穩定運作了很久——比您站在這裡的時間更久。請勿打斷它。"
    ),
  });

  // 規則三：留觀程序
  rules.push({
    number: 3,
    title: "離院前置程序",
    source: "official",
    text: select(
      player.foundSheets.includes("history_form_filled") && attention > 50,
      "完成體溫測量與病史問診是順利出院的必要程序。請於黎明交班前完成所有未填欄位，以免延誤您的離院時間。",
      "完成體溫測量與病史問診是順利出院的必要程序。請於黎明交班前完成所有未填欄位。每完成一項，您的離院時間將更接近。",
      "每完成一項程序，您將更接近出院。您已完成的程序越多，我們越歡迎您留下。這兩件事並不矛盾。"
    ),
  });

  // 規則四：交班時間廣播
  rules.push({
    number: 4,
    title: "交班時間就定位",
    source: "official",
    text: select(
      player.discoveredClues.includes("two_of_you") || stability < 25,
      "院內廣播播報「交班時間」時，所有留觀病患請就定位並留在自己的床位，以便完成交班核對。",
      "院內廣播播報「交班時間」時，所有留觀病患請就定位並留在自己的床位。被核對到的病患，目前不再列為留觀。",
      "交班時間請就定位。若您此刻不在床上，名冊上的那個您將代替您被核對。屆時將有兩份您，我們只保留一份。"
    ),
  });

  // 規則五：夜班護理人員（陷阱規則）
  rules.push({
    number: 5,
    title: "夜班護理人員指引",
    source: "official",
    text: select(
      world.staffMode === "hostile" || world.staffMode === "false_helpful",
      "夜班護理人員受過完整訓練，會主動協助您完成所有留觀程序。請信任並配合其指引，這是為了您的安全。",
      "夜班護理人員會主動協助您完成所有留觀程序。請配合其指引。她比您更早來到這裡，也比您更了解離開需要什麼。",
      "請信任夜班護理人員的指引。她曾和您一樣站在掛號台前。她現在很盡責，您將會明白為什麼。"
    ),
  });

  // 規則六：病歷室
  rules.push({
    number: 6,
    title: "病歷調閱與歸檔",
    source: "official",
    text: select(
      player.foundSheets.includes("own_chart") || stability < 35,
      "病歷室僅供院方人員調閱。您的病歷將於黎明交班時正式歸檔，在此之前請勿翻找或更動任何文件。",
      "病歷室僅供院方人員調閱。您的病歷目前暫存於最新一格，日期標示為明天。請勿更動，這是為您保留的位置。",
      "請勿更動您的病歷。它已經填好了，包括您尚未回答的病史與您尚未發生的離院。作廢它需要您不曾存在過。"
    ),
  });

  // 規則七：批價離院
  rules.push({
    number: 7,
    title: "出院批價程序",
    source: "official",
    text: select(
      player.discoveredClues.includes("door_rejects_patient") || attention > 60,
      "出院請至一樓批價櫃台辦理。批價完成後，玻璃自動門將為您開啟。請勿在批價前嘗試強行離院。",
      "出院請至一樓批價櫃台辦理。批價完成後，玻璃自動門將為您開啟。櫃台目前無人，但您的帳目仍在持續累計。",
      "出院請先批價。您的住院帳目自掛號起累計，從未停止。在您付清之前，自動門認得您是病患，不會為您開啟。"
    ),
  });

  // === 地點附加規則：留觀區 ===
  if (player.currentLocation === "observation_ward") {
    rules.push({
      number: 101,
      title: "靠窗床位（留觀區附註）",
      source: "staff",
      text: "靠窗床位已為您鋪好，床頭手環袋上印有您的姓氏。該床位專屬於您，請勿讓給他人，亦請勿堅稱該床位不屬於您。",
    });
    rules.push({
      number: 102,
      title: "棉被狀態（留觀區附註）",
      source: "previous_occupant",
      text: "若您發現靠窗床位的棉被在您離開後再次被掀開，表示有人正在等您回來。請勿確認是誰。",
    });
  }

  // === 地點附加規則：後棟樓梯間 ===
  if (player.currentLocation === "stairwell") {
    rules.push({
      number: 201,
      title: "感應燈指引（樓梯間附註）",
      source: "staff",
      text: "後棟樓梯間感應燈僅於下行時亮起。請依照燈光指引行進，這代表本院為您規劃的方向。",
    });
    rules.push({
      number: 202,
      title: "上行燈光（樓梯間附註）",
      source: "previous_occupant",
      text: "上行時樓梯間維持黑暗為正常狀態。若上行時感應燈竟然亮起，表示您已不被視為留觀病患——請把握，並勿回頭。",
    });
  }

  return rules;
}
