import type { PlayerState, WorldState } from "@/types/game"
import type { LocationData } from "@/types/scenario";

// 時間基準：遊戲開始 22:00 = 1320 分鐘；次日早上 7:00 = 1860 分鐘
export const START_MINUTES = 1320;
export const DAWN_MINUTES = 1860;

export const SCENARIO_LOCATIONS: Record<string, LocationData> = {
  dorm_room: {
    id: "dorm_room",
    name: "寢室 307",
    description: (_p, _w) => "你的床位靠窗，對床的棉被疊得整齊，卻沒有登記室友的名字。床頭貼著《夜間住宿須知》。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "read_notice",
        label: "閱讀《夜間住宿須知》",
        resultText:
          "須知第三條：熄燈後若聽見有人喚你姓名，請應聲報數，切勿開門。你把它記了下來。",
        effects: [
          {
            type: "clue",
            value: "須知第三條：熄燈後被喚名須報數，切勿開門。"
          },
          { type: "sheet", key: "official_notice" },
          { type: "time", value: 5 }
        ]
      },
      {
        id: "check_opposite_bed",
        label: "檢查對床的棉被",
        resultText:
          "棉被下還留著微溫，枕邊壓著一張紙條：『點名時不要替我答有。』字跡發抖。",
        effects: [
          {
            type: "clue",
            value: "前任住客紙條：點名時不要替我答有。"
          },
          { type: "sheet", key: "occupant_note" },
          { type: "sanity", value: -8 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 5 }
        ]
      },
      {
        id: "rest_in_bed",
        label: "躺回床上閉眼休息",
        condition: (p, w) => p.sanity < 50,
        resultText:
          "你閉上眼，走廊的拖鞋聲在門外停了一會兒，又緩緩離去。心跳漸漸平穩。",
        effects: [
          { type: "sanity", value: 6 },
          { type: "time", value: 30 },
          { type: "suspicion", value: 3 }
        ]
      }
    ]
  },

  corridor: {
    id: "corridor",
    name: "三樓走廊",
    description: (_p, _w) => "細長的日光燈走廊，地面反著潮濕的光。熄燈後本應無人，卻偶有拖鞋摩擦地板的聲音。",
    adjacentLocations: [
      "dorm_room",
      "washroom",
      "study_hall",
      "stairwell",
      "roof_door"
    ],
    actions: [
      {
        id: "count_doors",
        label: "數一數走廊的房門",
        resultText: "dynamic",
        effects: [
          { type: "sanity", value: -4 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 4 }
        ]
      },
      {
        id: "follow_slipper_sound",
        label: "循著拖鞋聲走",
        resultText:
          "聲音總在你前方一個轉角。你追到盡頭，只見地上一行濕腳印，止於牆面，沒有出口。",
        effects: [
          {
            type: "clue",
            value: "濕腳印止於牆面，盡頭沒有出口。"
          },
          { type: "sanity", value: -10 },
          { type: "time", value: 10 },
          { type: "anomaly", value: 8 },
          { type: "world", key: "hotelRealityStability", value: -6 }
        ]
      },
      {
        id: "check_lights",
        label: "留意走廊日光燈",
        resultText:
          "最末端那盞燈無聲熄滅，又亮起。熄滅的瞬間，你彷彿看見走廊比剛才長了一截。",
        effects: [
          {
            type: "clue",
            value: "燈熄滅時走廊似乎變長了一截。"
          },
          { type: "sanity", value: -5 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 5 }
        ]
      }
    ]
  },

  washroom: {
    id: "washroom",
    name: "盥洗間",
    description: (_p, _w) => "一整排水槽與鏡子，最末端那面鏡子蒙著霧氣，無論幾點都擦不乾淨。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "wipe_mirror",
        label: "擦拭末端那面霧鏡",
        resultText:
          "霧氣後浮出一行被指尖寫過的字：『出席人數要與床位相符。』隨即又被霧氣蓋住。",
        effects: [
          {
            type: "clue",
            value: "鏡中字跡：出席人數要與床位相符。"
          },
          { type: "sanity", value: -7 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 6 }
        ]
      },
      {
        id: "wash_face",
        label: "用冷水洗把臉",
        resultText:
          "冷水讓你清醒了些。抬頭時，鏡中的你慢了半拍才跟著抬頭。你決定不再多看。",
        effects: [
          { type: "sanity", value: 5 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 3 }
        ]
      },
      {
        id: "count_reflections",
        label: "數鏡子裡的人影",
        condition: (p, w) => w.anomalyAttention >= 20,
        resultText:
          "一排鏡子映出一排你。你數到第七面時，那個影子沒有動，正回頭看著真正的你。",
        effects: [
          {
            type: "clue",
            value: "第七面鏡中的影子會自己回頭。"
          },
          { type: "sanity", value: -12 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 10 },
          { type: "world", key: "hotelRealityStability", value: -8 }
        ]
      }
    ]
  },

  study_hall: {
    id: "study_hall",
    name: "夜讀自習室",
    description: (_p, _w) => "排排座位仍亮著檯燈，桌上攤開的課本停在同一頁。牆上掛著當日的『出席人數』牌。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "check_attendance_board",
        label: "查看『出席人數』牌",
        resultText: "dynamic",
        effects: [
          {
            type: "clue",
            value: "出席人數牌的數字比實際座位多一人。"
          },
          { type: "sanity", value: -6 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 5 }
        ]
      },
      {
        id: "read_open_book",
        label: "翻看攤開的課本",
        resultText:
          "每一本都停在同一頁，頁邊用鉛筆寫著同一句：『輪到我點名時，我已經不在名單上。』",
        effects: [
          {
            type: "clue",
            value: "課本頁邊：輪到我點名時，我已不在名單上。"
          },
          { type: "sheet", key: "student_memo" },
          { type: "sanity", value: -5 },
          { type: "time", value: 5 }
        ]
      },
      {
        id: "sit_and_wait",
        label: "坐到空位上等待",
        resultText:
          "你坐下的瞬間，整排檯燈同時暗了一下，像是替你登記了座號。你不確定這是好事。",
        effects: [
          { type: "suspicion", value: 6 },
          { type: "flag", key: "registeredSeat", value: true },
          { type: "time", value: 10 },
          { type: "anomaly", value: 6 }
        ]
      }
    ]
  },

  stairwell: {
    id: "stairwell",
    name: "西側樓梯間",
    description: (_p, _w) => "通往各樓層的舊樓梯，牆面有一塊被油漆草草蓋過的焦痕。夜裡這裡最冷。",
    adjacentLocations: ["corridor", "duty_office"],
    actions: [
      {
        id: "examine_burn_mark",
        label: "檢查牆上的焦痕",
        resultText:
          "油漆下隱約是一個人形輪廓。指尖一觸，牆面冰得發燙，彷彿火還沒真正熄滅。",
        effects: [
          {
            type: "clue",
            value: "焦痕油漆下藏著一個人形輪廓。"
          },
          { type: "sanity", value: -8 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 7 }
        ]
      },
      {
        id: "listen_downstairs",
        label: "傾聽樓下的動靜",
        resultText:
          "樓下傳來上樓的腳步，一階、一階，數目卻多過樓梯的階數。你退回了原地。",
        effects: [
          {
            type: "clue",
            value: "上樓腳步聲的數目多過實際階數。"
          },
          { type: "sanity", value: -6 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 5 }
        ]
      }
    ]
  },

  duty_office: {
    id: "duty_office",
    name: "舍監值班室",
    description: (_p, _w) => "玻璃窗後亮著一盞檯燈，桌上攤著厚重的點名簿與一支紅筆。值班的人總是低著頭。",
    adjacentLocations: ["stairwell"],
    actions: [
      {
        id: "peek_rollbook",
        label: "偷看桌上的點名簿",
        resultText: "dynamic",
        effects: [
          {
            type: "clue",
            value: "點名簿上有你的名字，後面已被紅筆畫了勾。"
          },
          { type: "sheet", key: "roll_book" },
          { type: "sanity", value: -10 },
          { type: "suspicion", value: 8 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 8 }
        ]
      },
      {
        id: "knock_window",
        label: "敲玻璃窗叫值班舍監",
        resultText:
          "那人緩緩抬頭，臉孔模糊得像隔著霧。他開口：『你還沒報數。』語氣平靜得可怕。",
        effects: [
          { type: "suspicion", value: 10 },
          { type: "sanity", value: -7 },
          { type: "world", key: "staffMode", value: "watching" },
          { type: "time", value: 5 },
          { type: "anomaly", value: 6 }
        ]
      },
      {
        id: "answer_rollcall",
        label: "主動向舍監報數『有』",
        condition: (p, w) => p.discoveredClues.length >= 3,
        resultText:
          "你應了聲『有』。紅筆在簿上輕輕一勾，房裡的寒氣忽然散去，像被准許留下了。",
        effects: [
          { type: "flag", key: "answeredRollcall", value: true },
          { type: "suspicion", value: -10 },
          { type: "sanity", value: 4 },
          { type: "time", value: 5 }
        ]
      }
    ]
  },

  roof_door: {
    id: "roof_door",
    name: "頂樓鐵門",
    description: (_p, _w) => "走廊盡頭的鐵門，掛著『非緊急請勿開啟』的褪色告示。門縫透出夜風，與火災後封閉的傳聞有關。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "read_roof_notice",
        label: "細讀鐵門上的告示",
        resultText:
          "告示下緣有人補了一行小字：『火災那夜，名單上的人全到齊了，多出來的才被留在這裡。』",
        effects: [
          {
            type: "clue",
            value: "告示小字：火災夜名單到齊，多出來的被留下。"
          },
          { type: "sheet", key: "roof_notice" },
          { type: "sanity", value: -9 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 7 }
        ]
      },
      {
        id: "push_roof_door",
        label: "試著推開鐵門",
        condition: (p, w) => p.foundSheets.length >= 4,
        resultText:
          "鐵門無聲開啟。頂樓沒有風，只有一排排空著的床位，等著夜讀生回來點名。",
        effects: [
          { type: "flag", key: "openedRoofDoor", value: true },
          { type: "sanity", value: -12 },
          { type: "world", key: "hotelRealityStability", value: -15 },
          { type: "time", value: 10 },
          { type: "anomaly", value: 12 }
        ]
      },
      {
        id: "feel_draft",
        label: "感受門縫透出的夜風",
        resultText:
          "風裡夾著燒焦與消毒水的氣味。你忽然聽見門後有人，正低聲一個個唸著名字。",
        effects: [
          {
            type: "clue",
            value: "門後有人低聲逐一唸著名字。"
          },
          { type: "sanity", value: -6 },
          { type: "time", value: 5 },
          { type: "anomaly", value: 5 }
        ]
      }
    ]
  }
};

// 動態 resultText 由事件或 UI 層依下列邏輯解析（範例）
export function resolveDynamicResult(
  actionId: string,
  player: PlayerState,
  world: WorldState
): string {
  switch (actionId) {
    case "count_doors":
      return world.anomalyAttention >= 30
        ? "你來回數了三次，門的數目每次都不一樣，最後一次多出了一扇沒有號碼的門。"
        : "走廊兩側的房門排列整齊，數目正常。只是你記得，剛才好像少了一扇。";
    case "check_attendance_board":
      return world.hotelRealityStability < 50
        ? "人數牌的數字正緩緩往上跳動，像在等某個還沒回來的人到齊。"
        : "今日出席人數比實際座位多了一人。多出的那一格，墨跡還是濕的。";
    case "peek_rollbook":
      return player.foundSheets.includes("occupant_note")
        ? "簿上你的名字後是空白的，旁邊一行小字：替你答有的，不是你自己。"
        : "密密麻麻的名字裡，你找到了自己。後面那個紅勾，是你還沒答有之前就畫好的。";
    default:
      return "什麼也沒有發生。";
  }
}
