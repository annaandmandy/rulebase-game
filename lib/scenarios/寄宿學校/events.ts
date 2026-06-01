import type { GameEvent, PlayerState, WorldState } from "@/types/game";

const START = 1303;

export const SCENARIO_EVENTS: GameEvent[] = [
{
  id: "event_intro_dorm",
  title: "熄燈前的住宿須知",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "dorm_room",
  description:
    "晚自習剛結束。床頭貼著一張護貝過的《夜間住宿須知》，墨色比牆面還新。走廊另一端傳來拖鞋摩擦地板的聲音，接著停了。你發現門牌上的名字不是你的，卻又莫名熟悉。",
  choices: [
    {
      id: "read_notice",
      label: "仔細閱讀住宿須知",
      resultText: "你記下七條規則。最後一行的字跡似乎被人重描過。",
      effects: [
        { type: "sheet", value: "doc_official_bedtime_notice" },
        { type: "clue", value: "須知第7條的墨色與其他條不同" }
      ]
    },
    {
      id: "check_drawer",
      label: "翻找床底與抽屜",
      resultText: "抽屜深處有張皺紙條，字跡潦草：「別照做。」",
      effects: [
        { type: "sheet", value: "doc_previous_student_note" },
        { type: "sanity", value: -15 }
      ]
    },
    {
      id: "lie_down",
      label: "什麼都不做，先躺上床",
      resultText: "你閉上眼。走廊的拖鞋聲又響起，這次停在你門口。",
      effects: [
        { type: "anomaly", value: 2 },
        { type: "suspicion", value: 5 }
      ]
    }
  ],
  once: true
},
{
  id: "event_corridor_curfew",
  title: "熄燈後的走廊",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "corridor" && player.timeMinutes >= 1290,
  description:
    "走廊燈光剩下每隔一盞亮著。須知第1條要你回寢室，但牆上另貼了張公告：「遇緊急狀況，請至一樓大廳尋求值班人員協助。」兩張紙的口吻一模一樣，卻彼此矛盾。",
  choices: [
    {
      id: "return_room",
      label: "依第1條回寢室",
      resultText: "你退回房內反鎖。拖鞋聲在門外來回三次才離去。",
      effects: [
        { type: "flag", key: "obeyedCurfew", value: true },
        { type: "anomaly", value: 1 }
      ],
      nextLocation: "dorm_room"
    },
    {
      id: "go_lobby",
      label: "依公告前往大廳求助",
      resultText: "值班人員背對你坐著，轉過頭時，那張臉還沒長好。",
      effects: [
        { type: "flag", key: "wentToLobby", value: true },
        { type: "ending", value: "ending_lobby_devoured" }
      ]
    },
    {
      id: "stay_corridor",
      label: "留在走廊觀察",
      resultText: "亮著的燈一盞盞熄滅，最後只剩你頭頂這盞。",
      effects: [
        { type: "sanity", value: -15 },
        { type: "world", key: "hotelRealityStability", value: -20 },
        { type: "anomaly", value: 2 }
      ]
    }
  ],
  once: true
},
{
  id: "event_third_bell",
  title: "多出來的鐘聲",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.timeMinutes >= 1320 &&
    (player.currentLocation === "dorm_room" || player.currentLocation === "corridor"),
  description:
    "須知第2條寫著每晚只有兩響鐘聲：晚自習結束鐘與熄燈鐘。你都聽過了。可是此刻，第三響鐘正穿過寂靜的宿舍緩緩盪開——比前兩響都長，也都低。",
  choices: [
    {
      id: "ignore_bell",
      label: "當作沒聽見，繼續躺著",
      resultText: "鐘聲停了。你卻覺得自己漏聽了某個該回應的指令。",
      effects: [
        { type: "anomaly", value: 1 },
        { type: "suspicion", value: 5 }
      ]
    },
    {
      id: "respond_bell",
      label: "起身，循鐘聲做出作息動作",
      resultText: "你坐起身。第三響鐘為你補上了名冊裡的一格。",
      effects: [
        { type: "flag", key: "heardThirdBell", value: true },
        { type: "sanity", value: -15 },
        { type: "ending", value: "ending_third_bell_listed" }
      ]
    },
    {
      id: "find_timetable",
      label: "翻出原始作息表核對",
      resultText: "舊作息表上有第三響，旁註：「為未結束隔離夜所設。」",
      effects: [
        { type: "sheet", value: "doc_original_timetable" },
        { type: "flag", key: "foundOriginalTimetable", value: true },
        { type: "clue", value: "第三響鐘是補名用的，不該回應" }
      ]
    }
  ],
  once: true
},
{
  id: "event_roll_call",
  title: "夜間點名",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "dorm_room" && player.timeMinutes >= 1320,
  description:
    "腳步聲在走廊逐間停留。每停一次，便有一個名字被低聲唸出，接著傳來悶悶的一聲「到」。腳步停在你門外。你聽見有人唸出你的名字——念得很標準，標準得像早就練過。",
  choices: [
    {
      id: "answer_present",
      label: "依第3條清楚應答「到」",
      resultText: "門外的呼吸鬆了。你被確認在床，名冊上多了一筆。",
      effects: [
        { type: "flag", key: "answeredRollCall", value: true },
        { type: "suspicion", value: -10 }
      ]
    },
    {
      id: "stay_silent",
      label: "屏住呼吸，保持沉默",
      resultText: "腳步在門外停了很久，終於離開。你不在今晚的名單上。",
      effects: [
        { type: "flag", key: "avoidedRollCall", value: true },
        { type: "sanity", value: -15 },
        { type: "anomaly", value: 2 }
      ]
    },
    {
      id: "answer_wrong_name",
      label: "故意應答一個錯的名字",
      resultText: "「……更正完畢。」門外溫和地說。你不確定改的是名字，還是你。",
      effects: [
        { type: "suspicion", value: 15 },
        { type: "world", key: "hotelRealityStability", value: -20 }
      ]
    }
  ],
  once: true
},
{
  id: "event_infirmary_sign",
  title: "保健室的登記簿",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "infirmary",
  description:
    "保健室沒人，量體溫的電子計顯示著別人的數字。桌上攤開一本登記簿，第4條要你簽下本名以便隔日追蹤。你瞄到上一行的名字，後面用紅筆寫著小小的「已追蹤」。",
  choices: [
    {
      id: "sign_real_name",
      label: "依第4條簽下本名",
      resultText: "筆尖一落，紅墨自動在你名字後浮現：「待追蹤」。",
      effects: [
        { type: "flag", key: "signedInfirmaryLog", value: true },
        { type: "ending", value: "ending_infirmary_logged" }
      ]
    },
    {
      id: "read_memo",
      label: "翻看櫃台後的員工備忘錄",
      resultText: "備忘錄列著「歸檔三程序」，簽名是其中第一項。",
      effects: [
        { type: "sheet", value: "doc_staff_memo" },
        { type: "clue", value: "登記簿簽名是歸檔程序的第一步" },
        { type: "sanity", value: -15 }
      ]
    },
    {
      id: "leave_unsigned",
      label: "不登記，悄悄離開",
      resultText: "你退出保健室。身後傳來翻頁聲，像有人在替你補簽。",
      effects: [
        { type: "anomaly", value: 2 },
        { type: "suspicion", value: 10 }
      ]
    }
  ],
  once: true
},
{
  id: "event_roll_call_contradiction",
  title: "點名",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "dorm_room" && player.timeMinutes >= 1320,
  description:
    "腳步聲沿走廊逼近，停在你門外。低沉嗓音逐字唸出你的本名。官方須知第3條要你應答「到」，但前任住客紙條的字跡此刻在你腦中浮現：那條規則是錯的，不要應答。",
  choices: [
    {
      id: "answer",
      label: "依須知應答「到」",
      resultText: "你出聲。門外停頓片刻，記下一筆。你被列為在床。",
      effects: [
        { type: "flag", key: "answeredRollCall", value: true },
        { type: "anomaly", value: 2 }
      ]
    },
    {
      id: "silent",
      label: "屏息不應答",
      resultText: "你咬住舌。門外久久不去，最後離開。你未被記入名單。",
      effects: [
        { type: "flag", key: "avoidedRollCall", value: true },
        { type: "suspicion", value: 20 },
        { type: "sanity", value: -10 }
      ]
    },
    {
      id: "peek",
      label: "悄悄查看門縫",
      resultText: "門縫外沒有人影，唸名聲卻仍持續。你看見了不該看的東西。",
      effects: [
        { type: "sanity", value: -15 },
        { type: "clue", value: "唸名的聲音沒有來源，名單卻一直在增加。" }
      ]
    }
  ],
  once: true
}
,
{
  id: "event_third_bell_2",
  title: "多出來的鐘聲",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    (player as any).lightsOutBellRung === true && world.anomalyAttention >= 5,
  description:
    "須知第2條明載每晚僅有兩響鐘。可你分明聽見第三響在走廊盡頭悠悠盪開。原始作息表上曾寫過一行被劃去的字：第三響，補名用。鐘聲一下下，像在數人頭。",
  choices: [
    {
      id: "listen",
      label: "靜靜聽完第三響",
      resultText: "鐘停時你心頭一空，彷彿某張名單上補進了你的名字。",
      effects: [
        { type: "flag", key: "heardThirdBell", value: true },
        { type: "anomaly", value: 2 },
        { type: "sanity", value: -10 },
      ],
    },
    {
      id: "cover_ears",
      label: "摀住耳朵不去數",
      resultText: "你拒絕計數。鐘聲含糊散去，似乎漏算了你。",
      effects: [
        { type: "suspicion", value: 10 },
        { type: "sanity", value: -5 },
      ],
    },
    {
      id: "check_table",
      label: "翻找作息表確認",
      resultText: "你找到泛黃的原始作息表，那行劃去的字仍依稀可辨。",
      effects: [
        { type: "sheet", value: "doc_original_timetable" },
        { type: "flag", key: "foundOriginalTimetable", value: true },
      ],
    },
  ],
  once: true,
},
{
  id: "event_washroom_lights",
  title: "盥洗室的燈",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "wash_room" && (player as any).usedWashRoom === true,
  description:
    "你洗漱完畢。須知第5條要你隨手關燈以維持夜間秩序。但你按下開關的瞬間，鏡面深處似乎還站著一個沒走的身影，正等著黑暗降臨。關，或不關。",
  choices: [
    {
      id: "turn_off",
      label: "依規定關燈離開",
      resultText: "燈滅。你背後傳來水珠落地的聲音，明明沒人在洗。",
      effects: [
        { type: "flag", key: "washroomLightsOff", value: true },
        { type: "anomaly", value: 1 },
        { type: "sanity", value: -8 },
      ],
    },
    {
      id: "keep_on",
      label: "違規留燈快步離開",
      resultText: "你留著燈逃出。秩序被你破壞，某處記下了這筆違規。",
      effects: [
        { type: "suspicion", value: 15 },
        { type: "world", key: "hotelRealityStability", value: -10 },
      ],
    },
    {
      id: "look_mirror",
      label: "回頭直視鏡子",
      resultText: "鏡中身影與你動作差了半拍。你寧可從沒看清。",
      effects: [
        { type: "sanity", value: -15 },
        { type: "clue", value: "鏡裡的人比你晚半拍關燈。" },
      ],
    },
  ],
  once: true,
},
{
  id: "event_infirmary_sign_2",
  title: "保健室登記簿",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "infirmary" && (player as any).feelingUnwell === true,
  description:
    "你發冷想登記體溫。須知第4條要你簽下本名以便隔日追蹤。員工備忘錄卻夾在簿子裡：登記簿是歸檔三項程序之一，本名一旦落筆，追蹤便不再以隔日為限。",
  choices: [
    {
      id: "sign_real",
      label: "簽下本名登記",
      resultText: "筆尖一頓，名字滲入紙裡。你成了登記簿上又一行。",
      effects: [
        { type: "flag", key: "signedInfirmaryLog", value: true },
        { type: "anomaly", value: 2 },
        { type: "sanity", value: -10 },
      ],
    },
    {
      id: "leave_blank",
      label: "不簽名，悄悄離開",
      resultText: "你放下筆退出保健室。發冷未退，但你的名字還是你的。",
      effects: [
        { type: "suspicion", value: 10 },
        { type: "sanity", value: -5 },
      ],
    },
    {
      id: "read_memo_2",
      label: "細讀夾著的備忘錄",
      resultText: "你讀完員工備忘錄，背脊比發燒更冷。",
      effects: [
        { type: "sheet", value: "doc_staff_memo" },
        { type: "clue", value: "歸檔需三項程序：應答、登記、在床受確認。" },
      ],
    },
  ],
  once: true,
},
{
  id: "event_west_stairwell",
  title: "西側樓梯",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.currentLocation === "stairwell" && player.timeMinutes < 1860,
  description:
    "須知第6條嚴禁夜間使用西側樓梯，須待起床鐘後方可自由活動。但前任住客的紙條釘在門邊：第6條沒有騙你——樓梯本身是安全的，要趕在被點到之前下去，天亮就來不及了。",
  choices: [
    {
      id: "descend",
      label: "趁夜走下西側樓梯",
      resultText: "你違規下樓。冷風灌入，門在身後闔上，再沒鐘聲追上你。",
      effects: [
        { type: "flag", key: "usedWestStairwell", value: true },
        { type: "flag", key: "leftBedBeforeSeven", value: true },
        { type: "suspicion", value: 25 },
      ],
    },
    {
      id: "obey",
      label: "守規定退回寢室等天亮",
      resultText: "你折返床上。樓梯口的紙條被風翻過，露出更密的字。",
      effects: [
        { type: "flag", key: "stayedForMorning", value: true },
        { type: "anomaly", value: 1 },
      ],
    },
    {
      id: "read_note",
      label: "讀完前任住客的紙條",
      resultText: "紙條最後一行：別等在床上被確認，那不是放你走。",
      effects: [
        { type: "sheet", value: "doc_previous_student_note" },
        { type: "clue", value: "離床才能離校；在床受確認等於被歸檔。" },
      ],
    },
  ],
  once: true,
},
{
  id: "event_morning_rollcheck",
  title: "起床鐘的在床確認",
  trigger: (player: PlayerState, world: WorldState): boolean =>
    player.timeMinutes >= 1860,
  description:
    "起床鐘響。須知第7條要全體住宿生留在床上，由舍監完成在床確認後方可活動。可你已讀過的字句在耳邊打架：在床受確認，就是歸檔的最後一程。腳步聲正一間間逼近你的門。",
  choices: [
    {
      id: "stay_bed",
      label: "依第7條躺在床上受確認",
      condition: (player: PlayerState, world: WorldState): boolean =>
        (player as any).answeredRollCall === true,
      resultText: "舍監推門，俯身確認。你被妥善歸檔，再不必離校。",
      effects: [
        { type: "flag", key: "stayedInBedAtSeven", value: true },
        { type: "ending", value: "ending_archived" },
      ],
    },
    {
      id: "silent_in_bed",
      label: "留床但全程沉默裝睡",
      condition: (player: PlayerState, world: WorldState): boolean =>
        (player as any).avoidedRollCall === true,
      resultText: "你未曾應答也未離床。舍監確認後離去，你仍被留下。",
      effects: [
        { type: "flag", key: "stayedInBedAtSeven", value: true },
        { type: "ending", value: "ending_confirmed_silent" },
      ],
    },
    {
      id: "logged_in_bed",
      label: "留床等待，回想登記簿",
      condition: (player: PlayerState, world: WorldState): boolean =>
        (player as any).signedInfirmaryLog === true,
      resultText: "確認完成。你的本名與在床紀錄對齊，歸檔生效。",
      effects: [
        { type: "flag", key: "stayedInBedAtSeven", value: true },
        { type: "ending", value: "ending_infirmary_logged" },
      ],
    },
    {
      id: "leave_bed",
      label: "鐘響前已離床，趁亂離開",
      condition: (player: PlayerState, world: WorldState): boolean =>
        (player as any).avoidedRollCall === true &&
        (player as any).foundOriginalTimetable === true &&
        (player as any).usedWestStairwell === true,
      resultText: "你不在床上。確認落空，名單上沒有你這一行。",
      effects: [
        { type: "flag", key: "leftBedBeforeSeven", value: true },
        { type: "ending", value: "ending_true_escape" },
      ],
    },
  ],
  once: true,
}
];