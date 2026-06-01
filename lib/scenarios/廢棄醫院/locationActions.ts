import { LocationData } from "@/types/scenario";

// 遊戲開始時間：當日 23:47 = 1427 分鐘
// 次日早上 07:00 = 1440 + 420 = 1860 分鐘
export const START_MINUTES = 1427;
export const MORNING_MINUTES = 1860;

export const SCENARIO_LOCATIONS: Record<string, LocationData> = {
  triage_desk: {
    id: "triage_desk",
    name: "夜間掛號台",
    description:
      (_player, _world) => "一盞檯燈、一疊掛號單，上面已經印好你的名字與一個你不記得的病歷號。叫號螢幕停在『000』。",
    adjacentLocations: ["observation_ward", "nurse_station", "morning_exit"],
    actions: [
      {
        id: "read_registration",
        label: "細看那張掛號單",
        resultText:
          "姓名、生日都對，病歷號卻多了一碼。收治時間欄寫著『今晚 23:47』——正是你抬頭看時鐘的這一刻。",
        effects: [
          { type: "clue", value: "掛號單上的收治時間，與你此刻完全相同" },
          { type: "sanity", value: -5 },
          { type: "time", value: 5 }
        ]
      },
      {
        id: "press_number_button",
        label: "按下叫號鈕",
        resultText:
          "螢幕從『000』跳成你的病歷號，廣播以你的聲音念出你的名字，請你『至留觀區報到』。",
        effects: [
          { type: "flag", key: "calledByName", value: true },
          { type: "anomaly", value: 8 },
          { type: "sanity", value: -6 },
          { type: "time", value: 3 }
        ]
      },
      {
        id: "take_notice_sheet",
        label: "取走檯燈下的『夜間留觀須知』",
        condition: (p, w) => !p.foundSheets.includes('official_notice'),
        resultText:
          "一張護貝過的須知壓在燈座下，邊角被翻得發白，像是被許多人讀過、又放回原位。",
        effects: [
          { type: "sheet", value: "official_notice" },
          { type: "clue", value: "夜間留觀須知共列出數條規則" },
          { type: "time", value: 4 }
        ]
      }
    ]
  },

  observation_ward: {
    id: "observation_ward",
    name: "留觀區病床",
    description:
      (_player, _world) => "六張鋪好的病床，只有靠窗那張掀開了棉被，床頭手環袋寫著你的姓氏。心電監視器接著沒有人，卻跑著穩定的波形。",
    adjacentLocations: ["triage_desk", "corridor_b", "nurse_station"],
    actions: [
      {
        id: "check_wristband",
        label: "拿起床頭的手環",
        resultText:
          "手環上是你的姓氏，但出生年比你大了一歲。塑膠扣環是熱的，像剛從某人手腕上取下。",
        effects: [
          { type: "clue", value: "手環上的出生年比你大一歲" },
          { type: "sanity", value: -5 },
          { type: "time", value: 3 }
        ]
      },
      {
        id: "watch_monitor",
        label: "盯著沒接人的心電監視器",
        resultText:
          "波形穩定，每分鐘七十二下。你下意識按住自己的脈搏——跳動的節奏與螢幕分毫不差。",
        effects: [
          { type: "clue", value: "無人的監視器，跳著你的心跳" },
          { type: "anomaly", value: 6 },
          { type: "sanity", value: -7 },
          { type: "time", value: 4 }
        ]
      },
      {
        id: "lie_on_bed",
        label: "依須知躺上靠窗的床",
        resultText:
          "棉被裡還留著別人的體溫。你一躺下，監視器的波形就慢了半拍，彷彿在等你接手。",
        effects: [
          { type: "flag", key: "laidOnBed", value: true },
          { type: "anomaly", value: 10 },
          { type: "sanity", value: -8 },
          { type: "time", value: 8 }
        ]
      }
    ]
  },

  nurse_station: {
    id: "nurse_station",
    name: "護理站",
    description:
      (_player, _world) => "夜班護理師坐在這裡，面前是一本手寫交班簿。牆上時鐘比你手機慢了十一分鐘。",
    adjacentLocations: ["triage_desk", "observation_ward", "exam_room_3"],
    actions: [
      {
        id: "read_handover_book",
        label: "偷看交班簿",
        condition: (p, w) => p.suspicion < 60,
        resultText:
          "最後一行墨跡未乾：『靠窗床病人意識清醒，會自行起身走動，請勿讓他在七點前離院。』",
        effects: [
          { type: "clue", value: "交班簿：請勿讓靠窗床病人在七點前離院" },
          { type: "suspicion", value: 10 },
          { type: "sanity", value: -6 },
          { type: "time", value: 5 }
        ]
      },
      {
        id: "ask_about_clock",
        label: "問護理師時鐘為何慢了",
        resultText:
          "她沒抬頭：『這裡的鐘從來都是準的，慢的是你帶進來的時間。請對時，以我們的為準。』",
        effects: [
          { type: "clue", value: "護理站要求一切以牆上時鐘為準" },
          { type: "suspicion", value: 5 },
          { type: "world", key: "staffMode", value: "watching" },
          { type: "time", value: 3 }
        ]
      },
      {
        id: "find_staff_memo",
        label: "翻找抽屜裡的員工備忘",
        condition: (p, w) => !p.foundSheets.includes('staff_memo'),
        resultText:
          "一張影印備忘夾在病歷夾裡，抬頭蓋著『夜班內部』，內容與牆上的須知並不一致。",
        effects: [
          { type: "sheet", value: "staff_memo" },
          { type: "suspicion", value: 8 },
          { type: "time", value: 4 }
        ]
      }
    ]
  },

  corridor_b: {
    id: "corridor_b",
    name: "B棟連通走廊",
    description:
      (_player, _world) => "兩側貼著褪色的科別指示牌，地上每隔幾步有一個乾掉的腳印。盡頭的逃生門標示亮著綠燈，卻反鎖。",
    adjacentLocations: ["observation_ward", "records_room", "stairwell"],
    actions: [
      {
        id: "follow_footprints",
        label: "順著乾掉的腳印走",
        resultText:
          "腳印只有去程、沒有回程，尺寸與你相同，最後一個正好停在你現在站著的位置。",
        effects: [
          { type: "clue", value: "走廊的腳印與你同尺寸，止於你腳下" },
          { type: "anomaly", value: 7 },
          { type: "sanity", value: -6 },
          { type: "time", value: 5 }
        ]
      },
      {
        id: "try_exit_door",
        label: "推那扇亮著綠燈的逃生門",
        resultText:
          "門紋風不動。綠燈下方有一行小字貼紙：『本門於七點整自動解鎖，提前嘗試者不在保障範圍。』",
        effects: [
          { type: "clue", value: "逃生門七點才解鎖，提前者不受保障" },
          { type: "suspicion", value: 5 },
          { type: "time", value: 4 }
        ]
      }
    ]
  },

  exam_room_3: {
    id: "exam_room_3",
    name: "第三診間",
    description:
      (_player, _world) => "診療床、血壓計、一面照不出你完整身影的鏡子。桌上攤開一份未填完的病史問診表，筆尖還是濕的。",
    adjacentLocations: ["nurse_station", "records_room"],
    actions: [
      {
        id: "look_in_mirror",
        label: "靠近那面鏡子",
        resultText:
          "鏡中只有你的下半身與雙手，脖子以上是一片診間的空白。你動，倒影慢了一拍才跟上。",
        effects: [
          { type: "clue", value: "鏡子照不出你的臉，倒影還會延遲" },
          { type: "anomaly", value: 8 },
          { type: "sanity", value: -9 },
          { type: "time", value: 4 }
        ]
      },
      {
        id: "read_history_form",
        label: "讀那份未填完的問診表",
        resultText:
          "前段是你的真實病史，到一半字跡換了人：『此人否認曾經死亡，仍判定須留觀至天亮。』",
        effects: [
          { type: "clue", value: "問診表：此人否認曾經死亡，仍須留觀" },
          { type: "sanity", value: -8 },
          { type: "anomaly", value: 6 },
          { type: "time", value: 5 }
        ]
      },
      {
        id: "finish_the_form",
        label: "拿起濕筆，把表填完",
        condition: (p, w) => p.discoveredClues.includes('問診表：此人否認曾經死亡，仍須留觀'),
        resultText:
          "你才簽上名，最後一欄自動浮現一行你沒寫的字：『同意』。墨水滲進紙裡，像滲進皮膚。",
        effects: [
          { type: "flag", key: "signedForm", value: true },
          { type: "anomaly", value: 12 },
          { type: "sanity", value: -10 },
          { type: "time", value: 6 }
        ]
      }
    ]
  },

  records_room: {
    id: "records_room",
    name: "病歷室",
    description:
      (_player, _world) => "一整面牆的鐵櫃，按收治日期排列。最新一格的日期是『明天』。空氣裡有冷氣與舊紙張的味道。",
    adjacentLocations: ["corridor_b", "exam_room_3", "stairwell"],
    actions: [
      {
        id: "open_tomorrow_drawer",
        label: "拉開標著『明天』的抽屜",
        resultText:
          "裡面只有一份病歷，封面是你的名字，出院欄已蓋好章，結案註記寫著：『於院內，未離開』。",
        effects: [
          { type: "clue", value: "你的病歷已結案：出院欄註記『未離開』" },
          { type: "sanity", value: -9 },
          { type: "anomaly", value: 8 },
          { type: "time", value: 6 }
        ]
      },
      {
        id: "find_patient_note",
        label: "搜尋夾在舊病歷間的紙條",
        condition: (p, w) => !p.foundSheets.includes('previous_note'),
        resultText:
          "一張皺折的紙條從病歷夾滑落，字跡潦草急促，落款只寫著『靠窗床，前一位』。",
        effects: [
          { type: "sheet", value: "previous_note" },
          { type: "clue", value: "前一位靠窗床病人留下了紙條" },
          { type: "sanity", value: -4 },
          { type: "time", value: 4 }
        ]
      },
      {
        id: "search_own_record",
        label: "翻找今天日期的格子",
        resultText:
          "今天的格子是空的，只貼著一張便利貼：『此人病歷已歸檔至明日，請勿在今日尋找。』",
        effects: [
          { type: "clue", value: "你的病歷被歸檔到『明天』而非今天" },
          { type: "suspicion", value: 5 },
          { type: "time", value: 4 }
        ]
      }
    ]
  },

  stairwell: {
    id: "stairwell",
    name: "後棟樓梯間",
    description:
      (_player, _world) => "通往地下與頂樓的水泥樓梯。感應燈只在你『往下走』時亮起，往上時始終是暗的。",
    adjacentLocations: ["corridor_b", "records_room", "morning_exit"],
    actions: [
      {
        id: "go_up_dark",
        label: "摸黑往上走，找出口",
        resultText:
          "燈不亮。爬了你以為的三層，回頭卻發現自己又站在同一道門前，門牌依舊寫著『留觀區』。",
        effects: [
          { type: "clue", value: "往上走，樓梯總把你帶回留觀區" },
          { type: "anomaly", value: 9 },
          { type: "sanity", value: -7 },
          { type: "time", value: 10 }
        ]
      },
      {
        id: "go_down_lit",
        label: "順著亮起的燈往下走",
        resultText:
          "燈一階一階為你點亮，誘你往下。地下那層飄上一股福馬林味，門縫透出與留觀區一樣的心電聲。",
        effects: [
          { type: "flag", key: "wentDown", value: true },
          { type: "anomaly", value: 11 },
          { type: "sanity", value: -8 },
          { type: "time", value: 8 }
        ]
      },
      {
        id: "wait_on_landing",
        label: "在樓梯平台上等天亮",
        condition: (p, w) => p.timeMinutes < 1860,
        resultText:
          "你蜷在冰冷的平台。每過幾分鐘，下方就傳來一次腳步聲，停在你看不見的轉角，再退回去。",
        effects: [
          { type: "sanity", value: -5 },
          { type: "anomaly", value: 4 },
          { type: "time", value: 20 }
        ]
      }
    ]
  },

  morning_exit: {
    id: "morning_exit",
    name: "一樓大門前廳",
    description:
      (_player, _world) => "玻璃自動門外是停車場與漸亮的天色。門上貼著『出院請至批價櫃台』的指示，但櫃台空無一人。",
    adjacentLocations: ["triage_desk", "stairwell"],
    actions: [
      {
        id: "check_glass_door",
        label: "走近自動門",
        resultText:
          "感應燈閃了，門卻只開一條縫又合上。玻璃映出你身後的前廳——多站了一個沒有臉的你。",
        effects: [
          { type: "clue", value: "玻璃倒影裡，多了一個沒有臉的你" },
          { type: "sanity", value: -7 },
          { type: "anomaly", value: 6 },
          { type: "time", value: 3 }
        ]
      },
      {
        id: "wait_for_seven",
        label: "在前廳等到七點",
        condition: (p, w) => p.timeMinutes < 1860,
        resultText:
          "你看著門上反鎖的綠燈，數著手機的秒。天色一點點亮，廳裡的影子卻一點點不肯退。",
        effects: [
          { type: "sanity", value: -3 },
          { type: "time", value: 15 }
        ]
      },
      {
        id: "leave_after_seven",
        label: "七點後推門離開",
        condition: (p, w) => p.timeMinutes >= 1860,
        resultText:
          "七點整，門鎖『喀』地彈開。晨光罩上來的瞬間，你聽見背後監視器的波形——終於拉成一直線。",
        effects: [
          { type: "flag", key: "reachedMorning", value: true },
          { type: "ending", value: "checkout" }
        ]
      }
    ]
  }
};
