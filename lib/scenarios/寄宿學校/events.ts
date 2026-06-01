import type { GameEvent, PlayerState, WorldState } from "@/types/game";

const START = 1303;

export const SCENARIO_EVENTS: GameEvent[] = [
{
  id: "event_intro_dorm_arrival",
  title: "夜讀生報到",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "dorm_room" && !player.firstDormArrival,
  description:
    "你被分配到靠窗的空床。枕邊壓著一張《夜間住宿須知》，墨色很新。對床的棉被鼓起，像有人蓋著，卻沒有呼吸聲。",
  choices: [
    {
      id: "read_rules",
      label: "讀完須知並收好",
      resultText: "你記下八條規則。熄燈廣播在窗外響起。",
      effects: [
        { type: "sheet", value: "doc_official_dorm_guide" },
        { type: "flag", key: "readDormGuide", value: true }
      ]
    },
    {
      id: "check_bed",
      label: "掀開對床的棉被看看",
      resultText: "棉被下是疊好的舊衣，名牌被撕去。你背脊發涼。",
      effects: [
        { type: "sheet", value: "doc_official_dorm_guide" },
        { type: "sanity", value: -15 },
        { type: "anomaly", value: 2 }
      ]
    }
  ],
  once: true
},
{
  id: "event_leave_dorm_night",
  title: "熄燈後的腳步",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "dorm_room" &&
    player.timeMinutes >= 1320 &&
    !!player.readDormGuide,
  description:
    "走廊那端傳來規律的拖鞋聲，像在等你跟上。須知第一條說待在床位，可那聲音停在你門外，不走也不敲。",
  choices: [
    {
      id: "stay_bed",
      label: "遵守規則，留在床上",
      resultText: "你閉眼裝睡。腳步聲在門外停了一整夜。",
      effects: [
        { type: "flag", key: "stayedInBed", value: true },
        { type: "sanity", value: -10 }
      ]
    },
    {
      id: "go_out",
      label: "開門查看走廊",
      resultText: "走廊空無一人。床鋪卻在你身後悄悄被人坐過。",
      effects: [
        { type: "sheet", value: "doc_previous_student_note" },
        { type: "anomaly", value: 2 },
        { type: "sanity", value: -15 },
        { type: "location", value: "corridor" }
      ]
    }
  ],
  once: true
},
{
  id: "event_night_rollcall",
  title: "夜間點名",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "dorm_room" && player.timeMinutes >= 1440,
  description:
    "手電筒光掃過每張床。舍監念著名字，聲音平板。輪到你時，他念的姓名只差一個字——卻又像在等你答「有」。",
  choices: [
    {
      id: "answer_yes",
      label: "清楚答「有」",
      resultText: "你應聲。舍監在簿上劃去你，光熄了。",
      effects: [
        { type: "flag", key: "answeredRollcall", value: true },
        { type: "anomaly", value: 2 }
      ]
    },
    {
      id: "stay_silent",
      label: "屏息，不出聲",
      resultText: "他停頓良久，記下「缺席」，繼續往下一床。",
      effects: [
        { type: "flag", key: "neverAnswered", value: true },
        { type: "sanity", value: -10 },
        { type: "sheet", value: "doc_burnt_register_page" }
      ]
    }
  ],
  once: true
},
{
  id: "event_hallway_name_call",
  title: "走廊喊名",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "corridor",
  description:
    "燈管嗡嗡作響。有人在轉角喊你全名，語氣熟得像同寢室友。第三條說別回應、繼續前行——但聲音越喊越近。",
  choices: [
    {
      id: "reply",
      label: "回應一聲再走",
      resultText: "你才開口，名冊上便多了一筆，少了你。",
      effects: [
        { type: "flag", key: "answeredRollcall", value: true },
        { type: "sanity", value: -15 },
        { type: "anomaly", value: 2 }
      ]
    },
    {
      id: "walk_on",
      label: "沉默，繼續前行",
      resultText: "你低頭快步。聲音停在你身後，沒再跟來。",
      effects: [
        { type: "flag", key: "ignoredHallwayCall", value: true },
        { type: "sheet", value: "doc_previous_student_note" },
        { type: "sanity", value: -5 }
      ]
    }
  ],
  once: true
},
{
  id: "event_attendance_board",
  title: "出席人數牌",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "study_hall",
  description:
    "夜讀自習室空無一人，牌上「出席人數」寫著「6」，但你數了座位，分明只有五個人坐過的痕跡。粉筆擱在溝槽裡，似乎在等你。",
  choices: [
    {
      id: "change_number",
      label: "把數字改成正確的「5」",
      resultText: "你擦掉6寫上5。牌面滲出第六道筆跡：與你同名。",
      effects: [
        { type: "flag", key: "changedAttendanceBoard", value: true },
        { type: "sanity", value: -15 },
        { type: "anomaly", value: 2 },
        { type: "ending", value: "ending_board_補入" }
      ]
    },
    {
      id: "leave_board",
      label: "不動牌子，離開",
      resultText: "你退出自習室。背後傳來粉筆自行書寫的沙沙聲。",
      effects: [
        { type: "sanity", value: -5 },
        { type: "anomaly", value: 1 }
      ],
      nextLocation: "corridor"
    },
    {
      id: "read_memo",
      label: "翻找講桌下的紙張",
      condition: (player: PlayerState, world: WorldState): boolean =>
        !player.foundSheets.includes("doc_staff_memo"),
      resultText:
        "一張員工備忘錄：『缺額由夜讀生改數字補足，勿讓其察覺。』",
      effects: [
        { type: "sheet", value: "doc_staff_memo" },
        { type: "sanity", value: -8 }
      ]
    }
  ],
  once: true
},
{
  id: "event_duty_office_register",
  title: "值班室登記簿",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "duty_office",
  description:
    "值班室亮著燈，舍監低頭翻著名冊，未抬眼。桌上攤開登記簿，第五條規則說有疑慮應在此登記，核對在校身分。筆尖正對著空白欄。",
  choices: [
    {
      id: "register",
      label: "寫下姓名登記",
      resultText: "舍監緩緩抬頭：『查到了，原來你在這。』他笑了。",
      effects: [
        { type: "flag", key: "registeredAtOffice", value: true },
        { type: "flag", key: "wardenLookedUp", value: true },
        { type: "sanity", value: -15 },
        { type: "anomaly", value: 2 },
        { type: "ending", value: "ending_register_trap" }
      ]
    },
    {
      id: "refuse_register",
      label: "不登記，安靜退出",
      resultText: "你縮回手退出。舍監始終沒抬頭，名冊上少了一行。",
      effects: [
        { type: "flag", key: "neverRegistered", value: true },
        { type: "sanity", value: -5 }
      ],
      nextLocation: "corridor"
    },
    {
      id: "peek_register",
      label: "偷看名冊內頁",
      resultText: "你瞥見三十年前的名單，七個名字被劃掉，墨跡仍濕。",
      effects: [
        {
          type: "clue",
          value: "三十年前有七名缺額，被劃掉的名字墨跡未乾"
        },
        { type: "sanity", value: -10 }
      ]
    }
  ],
  once: true
},
{
  id: "event_bathroom_mirror",
  title: "起霧的鏡子",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "washroom",
  description:
    "盥洗間鏡面蒙著一層霧氣，看不清自己的臉。規則寫著霧氣勿擦、勿在鏡前報數或自言自語。霧裡似乎浮著一行被寫過又擦掉的數字。",
  choices: [
    {
      id: "wipe_mirror",
      label: "擦掉霧氣看清楚",
      resultText: "鏡中映出你身後多站了一人，正張嘴替你報數。",
      effects: [
        { type: "sanity", value: -15 },
        { type: "anomaly", value: 2 },
        { type: "world", key: "hotelRealityStability", value: -20 }
      ]
    },
    {
      id: "leave_mirror",
      label: "不碰鏡子，轉身離開",
      resultText: "你別開視線。霧氣裡的數字無聲地多了一位。",
      effects: [
        { type: "sanity", value: -5 },
        { type: "anomaly", value: 1 }
      ],
      nextLocation: "corridor"
    },
    {
      id: "listen_memo",
      label: "察看洗手台下的字條",
      condition: (player: PlayerState, world: WorldState): boolean =>
        !player.foundSheets.includes("doc_staff_memo"),
      resultText:
        "潮濕的備忘錄：『鏡前報數者會被算成在場，切勿出聲。』",
      effects: [
        { type: "sheet", value: "doc_staff_memo" },
        { type: "sanity", value: -8 }
      ]
    }
  ],
  once: true
}
,
{
  id: "event_night_rollcall_2",
  title: "夜間點名",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.timeMinutes >= 1320 && player.currentLocation === "dormitory" && !player.lightsOn,
  description: "腳步聲在床位間移動，停在你床尾。低沉的聲音唱出你的姓名，等待回答。整間寢室靜得只剩呼吸。",
  choices: [
    {
      id: "answer_yes_2",
      label: "清楚答「有」",
      resultText: "你的名字被勾起。腳步離開後，你的床鋪空了。",
      effects: [
        { type: "flag", key: "answeredRollcall", value: true },
        { type: "sanity", value: -10 },
        { type: "ending", value: "ending_taken_by_rollcall" }
      ]
    },
    {
      id: "stay_silent_2",
      label: "屏住呼吸，不出聲",
      resultText: "唱名重複三次後停止。它在名冊上記你缺席，離開了。",
      effects: [
        { type: "flag", key: "neverAnswered", value: true },
        { type: "sanity", value: -15 },
        { type: "anomaly", value: 2 }
      ]
    }
  ],
  once: true
},
{
  id: "event_hallway_name_call_2",
  title: "走廊喊名",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.timeMinutes >= 1320 && player.currentLocation === "hallway",
  description: "走廊盡頭沒有人，卻有聲音清楚喚著你的名字，一聲比一聲近。這不是點名時段。",
  choices: [
    {
      id: "reply_2",
      label: "回應一聲「我在」",
      resultText: "聲音瞬間停在耳邊。你被當作答到的人帶走。",
      effects: [
        { type: "flag", key: "answeredRollcall", value: true },
        { type: "sanity", value: -20 }
      ]
    },
    {
      id: "walk_on_2",
      label: "不回應，加快腳步前行",
      resultText: "你越走越快。背後的呼喚把你算進了今晚的缺額。",
      effects: [
        { type: "anomaly", value: 2 },
        { type: "sanity", value: -10 }
      ]
    },
    {
      id: "stand_still",
      label: "停下，沉默不動也不前進",
      resultText: "你閉眼站定。聲音繞著你打轉，最後散去。你還在。",
      effects: [
        { type: "flag", key: "neverAnswered", value: true },
        { type: "sheet", value: "doc_previous_student_note" }
      ]
    }
  ],
  once: true
},
{
  id: "event_attendance_board_2",
  title: "出席人數牌",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "study_room" && player.timeMinutes >= 1320,
  description: "自習室空無一人，出席牌卻寫著「7」。員工備忘提過：缺額需有人補足。你的手停在牌前。",
  choices: [
    {
      id: "change_number_2",
      label: "把數字改成正確的人數",
      resultText: "牌一翻動，你的名字浮上備忘錄，成為被補入的多餘一人。",
      effects: [
        { type: "flag", key: "changedAttendanceBoard", value: true },
        { type: "sanity", value: -15 },
        { type: "ending", value: "ending_board_補入" }
      ]
    },
    {
      id: "leave_board_2",
      label: "不碰牌，安靜離開",
      resultText: "你退出自習室。今晚的核對，沒有把你算進去。",
      effects: [
        { type: "sheet", value: "doc_staff_memo" },
        { type: "anomaly", value: 1 }
      ]
    }
  ],
  once: true
},
{
  id: "event_duty_office_register_2",
  title: "值班室登記",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "duty_office" && player.timeMinutes >= 1320,
  description: "值班室燈亮著。舍監低頭翻著名冊，沒抬眼，只把登記本推向你：「寫上名字，我替你核對在校身分。」",
  choices: [
    {
      id: "register_2",
      label: "簽下姓名，請求核對",
      resultText: "舍監緩緩抬頭，瞳孔對準你。「找到了。」名字從名冊被移走。",
      effects: [
        { type: "flag", key: "registeredAtOffice", value: true },
        { type: "flag", key: "wardenLookedUp", value: true },
        { type: "sanity", value: -15 },
        { type: "ending", value: "ending_register_trap" }
      ]
    },
    {
      id: "leave_office",
      label: "藉口退出，不登記",
      resultText: "你縮回手退出門外。舍監始終沒抬頭。你的身分仍是空白。",
      effects: [
        { type: "flag", key: "neverRegistered", value: true },
        { type: "sheet", value: "doc_staff_memo" }
      ]
    }
  ],
  once: true
},
{
  id: "event_rooftop_door",
  title: "頂樓鐵門",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "rooftop_door" && player.timeMinutes >= 1320,
  description: "鐵門上掛著三十年前的封條。門縫透出焦味。你想起燒毀的名冊上，那七個答到後再也走不出去的名字。",
  choices: [
    {
      id: "open_door",
      label: "撕開封條，推開鐵門",
      resultText: "焦黑的天台上排著七個身影，全在等點名。你終於懂了一切。",
      effects: [
        { type: "flag", key: "knewAllTruth", value: true },
        { type: "sheet", value: "doc_burnt_register_page" },
        { type: "sanity", value: -20 }
      ]
    },
    {
      id: "leave_door",
      label: "不開門，退回樓梯",
      resultText: "你放開把手。焦味卻一路跟著你下樓。",
      effects: [
        { type: "anomaly", value: 2 },
        { type: "sanity", value: -8 }
      ]
    }
  ],
  once: true
},
{
  id: "event_morning_bell",
  title: "鈴未響",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.timeMinutes >= 1800,
  description: "窗外天色微亮，起床鈴卻沒響。規則寫著：昨夜核對未完成，請留在原地等候舍監再次點名。",
  choices: [
    {
      id: "stay_wait",
      label: "依規則留在原地等待",
      resultText: "你坐著等。日光卡在六點不再前進，鈴永遠不會響。",
      effects: [
        { type: "flag", key: "stayedAndWaited", value: true },
        { type: "ending", value: "ending_waiting_forever" }
      ],
      condition: (player: PlayerState, world: WorldState): boolean =>
        !player.neverAnswered
    },
    {
      id: "walk_out_truth",
      label: "帶著真相走向校門",
      resultText: "你看穿了名冊的把戲，走出大門。身後七個名字目送你離開。",
      effects: [
        { type: "ending", value: "ending_seven_truth" }
      ],
      condition: (player: PlayerState, world: WorldState): boolean =>
        player.knewAllTruth === true && !player.answeredRollcall && !player.registeredAtOffice
    },
    {
      id: "leave_uncounted",
      label: "不等了，自己走出宿舍",
      resultText: "沒人記得你的名字，也沒人能把你點走。你成了數不到的人。",
      effects: [
        { type: "ending", value: "ending_uncounted_survivor" }
      ],
      condition: (player: PlayerState, world: WorldState): boolean =>
        player.neverAnswered === true && player.neverRegistered === true
    }
  ],
  once: true
}
];