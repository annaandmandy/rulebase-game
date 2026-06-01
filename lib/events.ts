import { GameEvent, PlayerState, WorldState } from "@/types/game";

export const GAME_EVENTS: GameEvent[] = [
  // Event 1 — 入住 (triggered at game start)
  {
    id: "checkin",
    title: "入住",
    trigger: () => false, // handled manually at game start
    description:
      "深夜，山中，霧。\n\n你不記得自己為什麼在這裡。\n\n旅館的燈光從霧中透出來，帶著某種讓人安心的昏黃。你走進大廳，辦理入住。員工遞給你一份「住客安全須知」和一張房卡，全程沒有說話。\n\n現在是晚上 21:43。",
    choices: [
      {
        id: "checkin_read",
        label: "閱讀安全須知",
        resultText: "你仔細閱讀了每一條規則。有些規則讓你感到不安，但你說不清楚是哪條。",
        effects: [
          { type: "time", value: 10 },
          { type: "clue", value: "閱讀了住客安全須知" },
        ],
        nextLocation: "lobby",
      },
      {
        id: "checkin_skip",
        label: "先把須知放進口袋",
        resultText: "你把須知折好放進口袋，打算之後再看。員工沒有任何反應。",
        effects: [{ type: "time", value: 5 }],
        nextLocation: "lobby",
      },
    ],
    once: true,
  },

  // Event 2 — 三次敲門
  {
    id: "three_knocks",
    title: "三次敲門",
    trigger: (player, world) =>
      player.currentLocation === "room304" &&
      player.timeMinutes >= 23 * 60 &&
      !player.answeredKnock &&
      !player.openedWindow,
    description:
      "你正在 304 號房。\n\n門外傳來三次敲門聲。\n\n很輕，很規律。\n\n咚。咚。咚。\n\n然後是沉默。",
    choices: [
      {
        id: "knock_ignore",
        label: "不理會",
        resultText:
          "你沒有出聲，也沒有動。沉默持續了幾分鐘。然後什麼都沒有了。你覺得，你做對了某件事。",
        effects: [
          { type: "time", value: 10 },
          { type: "sanity", value: -5 },
        ],
      },
      {
        id: "knock_ask",
        label: "詢問是誰",
        resultText:
          "「請問是誰？」你問。門外沒有回答。然後，第四聲敲門聲響起。然後是第五聲。然後停了。你感覺自己做錯了某件事，但你說不清楚是哪件事。",
        effects: [
          { type: "time", value: 15 },
          { type: "sanity", value: -15 },
          { type: "flag", key: "answeredKnock", value: true },
          { type: "anomaly", value: 1 },
        ],
      },
      {
        id: "knock_open",
        label: "開門",
        resultText:
          "你打開門。走廊裡沒有人。但地毯上有一條細小的痕跡，從你的門口一路延伸到走廊盡頭——消失在牆壁裡。你關上門，不確定自己剛才有沒有看見什麼。",
        effects: [
          { type: "time", value: 20 },
          { type: "sanity", value: -20 },
          { type: "flag", key: "answeredKnock", value: true },
          { type: "anomaly", value: 2 },
          { type: "world", key: "hotelRealityStability", value: -15 },
        ],
      },
      {
        id: "knock_peephole",
        label: "從貓眼查看",
        resultText:
          "你靠近門，把眼睛貼上貓眼。走廊裡沒有人。但你等了很久，看見走廊盡頭的燈突然滅了，然後又亮了。那一兩秒的黑暗裡，你覺得你看見了什麼東西。但你不確定。",
        effects: [
          { type: "time", value: 15 },
          { type: "sanity", value: -10 },
          { type: "clue", value: "走廊盡頭的燈會在某些時候熄滅" },
          { type: "anomaly", value: 1 },
        ],
      },
    ],
    once: true,
  },

  // Event 3 — 窗外霧聲
  {
    id: "window_voice",
    title: "窗外有聲音",
    trigger: (player, world) =>
      player.currentLocation === "room304" &&
      player.timeMinutes >= 22 * 60 &&
      player.timeMinutes < 23 * 60,
    description:
      "你在 304 號房。\n\n窗外的霧非常濃。\n\n你聽見霧裡有人在說話。\n\n聲音很小，你聽不清楚說什麼，但你確定那是人聲。聲音來自窗外。\n\n你在三樓。",
    choices: [
      {
        id: "window_open",
        label: "打開窗戶",
        resultText:
          "你把窗戶推開。霧氣立刻湧進來，帶著潮濕和某種你說不清楚的氣味。聲音更清晰了，但你還是聽不懂在說什麼——不是語言的問題，是你的腦子沒有辦法把它轉化成意思。你把窗戶關上。你的手在抖。",
        effects: [
          { type: "time", value: 20 },
          { type: "sanity", value: -25 },
          { type: "flag", key: "openedWindow", value: true },
          { type: "world", key: "room304State", value: "duplicated" },
          { type: "world", key: "hotelRealityStability", value: -20 },
          { type: "anomaly", value: 2 },
        ],
      },
      {
        id: "window_stay",
        label: "不要打開，繼續聽",
        resultText:
          "你站在窗邊聽了一會兒。聲音斷斷續續，然後消失了。你回到床上，但你沒有辦法不去想那個聲音。",
        effects: [
          { type: "time", value: 15 },
          { type: "sanity", value: -10 },
          { type: "clue", value: "深夜的霧裡有聲音" },
        ],
      },
      {
        id: "window_ignore",
        label: "拉上窗簾，不去看",
        resultText: "你把窗簾拉上，背對著窗戶。聲音過了一會兒停了。你覺得這樣更好。",
        effects: [{ type: "time", value: 10 }, { type: "sanity", value: -3 }],
      },
    ],
    once: true,
  },

  // Event 4 — B2
  {
    id: "elevator_b2",
    title: "電梯顯示 B2",
    trigger: (player, world) =>
      player.currentLocation === "elevator" &&
      world.elevatorState === "basement_visible",
    description:
      "電梯門關上。\n\n你按了「3」。\n\n電梯開始下降。\n\n不是上升，是下降。\n\n面板顯示「1」，然後繼續往下。然後出現一個數字，不是「B1」，而是「B2」。電梯停了。",
    choices: [
      {
        id: "b2_press3",
        label: "立刻按下 3 樓",
        resultText:
          "你按下「3」。電梯沒有立刻移動。停頓了大約兩秒——你數過了——然後開始上升。你回到三樓，門打開，走廊是正常的。你覺得你做對了，但你不知道規則六是怎麼知道這件事的。",
        effects: [
          { type: "time", value: 15 },
          { type: "sanity", value: -10 },
          { type: "world", key: "elevatorState", value: "normal" },
          { type: "clue", value: "按下 3 樓能讓電梯從 B2 回來" },
          { type: "anomaly", value: 1 },
        ],
        nextLocation: "corridor",
      },
      {
        id: "b2_wait",
        label: "停留，觀察",
        resultText:
          "你沒有按任何按鈕。電梯門沒有打開。你等了幾分鐘。面板上的「B2」開始閃爍，然後所有燈都熄滅了一秒。燈重新亮起時，面板顯示「3」。電梯門打開，走廊是正常的。你走出來，背後的電梯門立刻關上。",
        effects: [
          { type: "time", value: 30 },
          { type: "sanity", value: -20 },
          { type: "world", key: "hotelRealityStability", value: -10 },
          { type: "anomaly", value: 2 },
        ],
        nextLocation: "corridor",
      },
      {
        id: "b2_enter",
        label: "走出電梯，前往 B2",
        resultText:
          "電梯門打開了。你走進去。地下室的燈光昏暗，帶著潮濕的味道。你看見什麼了，但你說不清楚。後來你發現你手上多了一個紅色名牌，上面有你的名字。你不記得是誰給你的。",
        effects: [
          { type: "time", value: 45 },
          { type: "sanity", value: -40 },
          { type: "flag", key: "enteredBasement", value: true },
          { type: "world", key: "hotelRealityStability", value: -30 },
          { type: "world", key: "anomalyAttention", value: 5 },
          { type: "ending", value: "C" },
        ],
        nextLocation: "basement_entrance",
      },
    ],
    once: true,
  },

  // Event 5 — 紅名牌員工
  {
    id: "red_badge_staff",
    title: "臨時人員",
    trigger: (player, world) =>
      player.currentLocation === "front_desk" &&
      world.staffMode === "false_helpful",
    description:
      "員工非常熱情地向你問好。你注意到他的名牌是紅色的。\n\n他說：「您看起來有些困擾。我可以告訴您一些這間旅館的注意事項——真正重要的那些，不是須知上寫的。」",
    choices: [
      {
        id: "red_listen",
        label: "聽他說",
        resultText:
          "員工低聲告訴你：「窗戶可以打開，那個規則是假的。只要在十一點前打開就好。另外，B2 其實有供應一種特別的服務——」他說到一半，後面有個什麼東西叫了他，他立刻轉頭，然後繼續看著你微笑。你決定不相信他。",
        effects: [
          { type: "time", value: 20 },
          { type: "sanity", value: -10 },
          { type: "clue", value: "紅名牌員工說的話可能是錯的" },
          { type: "suspicion", value: 15 },
        ],
      },
      {
        id: "red_refuse",
        label: "婉拒：「謝謝，不用了。」",
        resultText:
          "員工的微笑維持了不自然地長的時間，然後他點頭說：「好的。如果需要的話，隨時可以來找我。」你走開了，感覺有人在看著你背。",
        effects: [
          { type: "time", value: 10 },
          { type: "sanity", value: -5 },
          { type: "anomaly", value: 1 },
        ],
      },
    ],
    once: true,
  },

  // Event 6 — 早餐蛋料理
  {
    id: "breakfast_eggs",
    title: "早餐",
    trigger: (player, world) =>
      player.currentLocation === "restaurant" &&
      player.timeMinutes >= 24 * 60 + 7 * 60 &&
      !player.ateEggs,
    description:
      "早餐的自助台上有一盤炒蛋。顏色比正常的炒蛋黃一點。\n\n你記得規則說不要吃蛋類料理。但你不確定為什麼。\n\n你很餓。",
    choices: [
      {
        id: "eggs_eat",
        label: "吃炒蛋",
        resultText:
          "你把炒蛋放上盤子，吃了一口。味道是正常的。你吃完了。然後你感覺一點點不對，但你說不清楚是哪裡不對。\n\n服務員走過來，把一張小紙條放在你桌上，說：「這是給您的通知。」然後就走了。\n\n紙條說，系統顯示您食用了蛋類料理，請於下午兩點至三點前往餐廳接受確認。",
        effects: [
          { type: "time", value: 20 },
          { type: "flag", key: "ateEggs", value: true },
          { type: "sanity", value: -8 },
          { type: "world", key: "hotelRealityStability", value: -10 },
          { type: "anomaly", value: 1 },
          { type: "sheet", value: "egg_verification" },
          { type: "clue", value: "吃了蛋——收到確認通知，下午兩點至三點需前往餐廳" },
        ],
      },
      {
        id: "eggs_skip",
        label: "只拿其他食物",
        resultText:
          "你拿了土司和稀飯，跳過了炒蛋。服務員（你剛才沒有注意到有服務員）走過來把那盤炒蛋收走了。你沒有問他為什麼。",
        effects: [
          { type: "time", value: 20 },
          { type: "sanity", value: 5 },
          { type: "clue", value: "沒有吃蛋類料理，感覺是正確的" },
        ],
      },
      {
        id: "eggs_examine",
        label: "靠近查看炒蛋",
        resultText:
          "你把臉湊近那盤炒蛋。看起來正常。但仔細看，你覺得炒蛋的紋路有點像什麼東西——你說不出來是什麼。你決定不吃。",
        effects: [
          { type: "time", value: 15 },
          { type: "sanity", value: -8 },
          { type: "clue", value: "炒蛋有某種奇怪的紋路" },
        ],
      },
    ],
    once: true,
  },

  // Event 7 — 重複房卡
  {
    id: "duplicate_keycard",
    title: "另一位住客",
    trigger: (player, world) =>
      player.currentLocation === "corridor" &&
      player.timeMinutes >= 24 * 60 &&
      !player.sawDuplicateGuest,
    description:
      "你在三樓走廊遇到另一位住客。\n\n他看起來很疲憊，穿著和你相似的衣服。\n\n你注意到他手上拿著一張房卡。\n\n「304」。\n\n是你的房間號碼。",
    choices: [
      {
        id: "dup_confront",
        label: "質問：「那是我的房卡。」",
        resultText:
          "他看著你。他的表情很奇怪——不像是被抓到的慌亂，而是一種你說不清楚的困惑。「我的房卡，」他說，「304 號房。」你們對看了很久，然後他走進走廊盡頭，消失了。你去前台詢問，前台說只有你一個住客入住了 304。",
        effects: [
          { type: "time", value: 20 },
          { type: "sanity", value: -20 },
          { type: "flag", key: "sawDuplicateGuest", value: true },
          { type: "world", key: "room304State", value: "duplicated" },
          { type: "anomaly", value: 2 },
          { type: "clue", value: "有人和你拿著同一張 304 房卡" },
        ],
      },
      {
        id: "dup_front_desk",
        label: "去通知櫃檯",
        resultText:
          "你走回大廳，告訴員工你看見另一個人持有 304 的房卡。員工沉默了一秒，然後說：「謝謝您告知。我們會處理的。」你回到三樓，走廊空無一人。",
        effects: [
          { type: "time", value: 25 },
          { type: "flag", key: "sawDuplicateGuest", value: true },
          { type: "clue", value: "遵循規則七，去通知了櫃檯" },
          { type: "anomaly", value: 1 },
        ],
        nextLocation: "front_desk",
      },
      {
        id: "dup_ignore",
        label: "假裝沒看見，走過去",
        resultText:
          "你低頭走過他身邊。他沒有說話。你走進 304 號房，關上門，把房卡放在桌上。你看著桌上的那張房卡很久。",
        effects: [
          { type: "time", value: 10 },
          { type: "sanity", value: -10 },
          { type: "flag", key: "sawDuplicateGuest", value: true },
          { type: "world", key: "room304State", value: "duplicated" },
          { type: "anomaly", value: 1 },
        ],
        nextLocation: "room304",
      },
    ],
    once: true,
  },

  // Event 8 — 第九條規則
  {
    id: "rule_nine",
    title: "第九條規則",
    trigger: (player, world) =>
      !player.hasReadExtraRule && world.ruleNoticeVersion >= 2,
    description:
      "你再次閱讀住客安全須知。\n\n數到第八條之後，你往下看。\n\n有第九條。\n\n規則八說若看見第九條，請立刻停止閱讀。\n\n但你已經看到了第九條的第一個字。",
    choices: [
      {
        id: "rule9_read",
        label: "繼續讀第九條",
        resultText:
          "「如果你記得這間旅館，代表你已來過。請在離開前，將這份須知交給下一位住客。」\n\n你把須知放下。你試著想起什麼時候來過這間旅館。你沒有任何記憶，但你有一種熟悉感——走廊的燈光，電梯的聲音，304 號房的氣味。彷彿你認識這個地方，但你不知道從什麼時候開始。",
        effects: [
          { type: "time", value: 15 },
          { type: "flag", key: "hasReadExtraRule", value: true },
          { type: "sanity", value: -20 },
          { type: "clue", value: "第九條規則：如果你記得這間旅館，代表你已來過。" },
          { type: "world", key: "hotelRealityStability", value: -20 },
          { type: "world", key: "ruleNoticeVersion", value: 3 },
          { type: "anomaly", value: 3 },
        ],
      },
      {
        id: "rule9_stop",
        label: "立刻停止閱讀",
        resultText:
          "你把須知折起來，放進口袋。你沒有讀第九條。你覺得你做對了一件事，但你不知道那件事是什麼。",
        effects: [
          { type: "time", value: 5 },
          { type: "sanity", value: 5 },
          { type: "clue", value: "須知有第九條，但你沒有讀" },
        ],
      },
    ],
    once: true,
  },

  // Event 9 — 地下室入口
  {
    id: "basement_found",
    title: "地下室",
    trigger: (player, world) =>
      player.currentLocation === "basement_entrance" &&
      !player.enteredBasement,
    description:
      "你站在那扇門前。\n\n旅館說沒有地下室。\n\n但這裡有扇門。門縫下面有光，和潮濕的氣味。\n\n你把手放在門把上，感覺到一點振動，像是遠方有什麼東西在運轉。",
    choices: [
      {
        id: "basement_enter",
        label: "推開門，進去",
        resultText:
          "你推開門。裡面有一條走廊，燈光昏暗，牆壁是磁磚。走廊盡頭有一個房間，房間裡有一張椅子，椅子上放著一個紅色名牌。上面有你的名字。你拿起名牌，走回去，但你不確定你走了多久。",
        effects: [
          { type: "time", value: 60 },
          { type: "sanity", value: -35 },
          { type: "flag", key: "enteredBasement", value: true },
          { type: "world", key: "hotelRealityStability", value: -25 },
          { type: "anomaly", value: 3 },
          { type: "ending", value: "C" },
          { type: "clue", value: "地下室裡有你名字的紅色名牌" },
        ],
        nextLocation: "stairwell",
      },
      {
        id: "basement_leave",
        label: "離開，當作沒看見",
        resultText:
          "你放開門把，轉身離開。身後的門沒有聲音。你走回樓梯間，往上，走廊，回到 304。第二天早上，你走過樓梯間，那扇門不在了。只有空白的牆。",
        effects: [
          { type: "time", value: 10 },
          { type: "sanity", value: -5 },
          { type: "clue", value: "選擇不進入地下室" },
        ],
        nextLocation: "stairwell",
      },
    ],
    once: true,
  },

  // Event 10 — 電話響起
  {
    id: "phone_ring",
    title: "電話",
    trigger: (player, world) =>
      player.currentLocation === "room304" &&
      player.timeMinutes >= 23 * 60 &&
      !player.phoneAnswered,
    description:
      "304 號房的電話響了。\n\n你不知道這個號碼有誰知道。你沒有告訴任何人你住在哪裡。\n\n電話繼續響。\n\n房間附加說明說：若電話響起，您可選擇接聽或不接聽。不接聽是較為建議的選擇。\n\n前任住客的字跡說：電話不要接。不管響幾聲。\n\n電話已經響了五聲。",
    choices: [
      {
        id: "phone_answer",
        label: "接電話",
        resultText:
          "你拿起話筒。\n\n沉默。\n\n然後有人說話了。聲音是你自己的聲音。\n\n「你昨晚為什麼要來這裡？」\n\n你掛上電話。你沒有回答。你的手在抖，但你說不清楚是因為恐懼還是因為你不確定那個問題的答案。",
        effects: [
          { type: "time", value: 15 },
          { type: "flag", key: "phoneAnswered", value: true },
          { type: "sanity", value: -25 },
          { type: "anomaly", value: 2 },
          { type: "world", key: "hotelRealityStability", value: -15 },
          { type: "clue", value: "電話裡的聲音和你的聲音一樣" },
        ],
      },
      {
        id: "phone_ignore",
        label: "不接，等它停",
        resultText:
          "你坐在床上看著電話響。十二聲。二十聲。三十聲。\n\n你數到四十七聲的時候，電話停了。\n\n你不知道為什麼你要數。你把那個數字記在心裡，四十七，然後你不知道它有什麼意義。",
        effects: [
          { type: "time", value: 20 },
          { type: "flag", key: "phoneAnswered", value: true },
          { type: "sanity", value: -10 },
          { type: "clue", value: "電話響了四十七聲，沒有人接" },
        ],
      },
      {
        id: "phone_unplug",
        label: "拔掉電話線",
        resultText:
          "你走過去，把電話線從牆上的插孔拔出來。電話停了。\n\n你把電話線放在床頭。\n\n半小時後，電話又響了。\n\n你低頭看了一下，電話線還在你手上。",
        effects: [
          { type: "time", value: 25 },
          { type: "flag", key: "phoneAnswered", value: true },
          { type: "sanity", value: -20 },
          { type: "anomaly", value: 2 },
          { type: "world", key: "hotelRealityStability", value: -10 },
          { type: "clue", value: "電話拔掉插頭後仍然能響" },
        ],
      },
    ],
    once: true,
  },

  // Event 11 — 走廊的名字
  {
    id: "name_calling",
    title: "有人在叫你",
    trigger: (player, world) =>
      player.currentLocation === "room304" &&
      player.timeMinutes >= 24 * 60 &&
      !player.heardName,
    description:
      "你在 304 號房。\n\n走廊傳來聲音，有人在叫你的名字。\n\n你的名字。你的本名，不是你在旅館登記的名字。\n\n聲音很輕，但你聽得非常清楚。\n\n房間附加說明第六條說：若走廊有人呼叫您的姓名，請立刻開門確認。此為旅館安全機制。\n\n前任住客的紙條說：如果有人在走廊叫你的名字——不要回應。附加說明的第六條是錯的。\n\n你的名字又被叫了一聲。",
    choices: [
      {
        id: "name_open_door",
        label: "開門（遵守附加說明第六條）",
        resultText:
          "你打開門。\n\n走廊空無一人。\n\n但你注意到，你的門對面，301 號房的門開著一條縫。黑暗的縫。沒有燈光從裡面透出來，因為那個房間沒有窗戶——或者說，它的窗戶朝向的方向不是外面。\n\n你把自己的門關上，反鎖。你在門縫裡塞了一張紙，確認沒有人能悄悄打開它。\n\n你的名字不再被叫了。",
        effects: [
          { type: "time", value: 15 },
          { type: "flag", key: "heardName", value: true },
          { type: "sanity", value: -20 },
          { type: "anomaly", value: 2 },
          { type: "world", key: "hotelRealityStability", value: -10 },
          { type: "clue", value: "301 號房的門在深夜開著" },
        ],
      },
      {
        id: "name_ignore",
        label: "不回應，不開門（遵守前任住客的建議）",
        resultText:
          "你沒有動。\n\n你的名字被叫了第三聲，然後停了。\n\n沉默。\n\n你等了很久，什麼都沒有發生。你不知道那是不是代表你做對了，還是代表它知道你聽見了，只是決定等待。",
        effects: [
          { type: "time", value: 20 },
          { type: "flag", key: "heardName", value: true },
          { type: "sanity", value: -10 },
          { type: "clue", value: "不回應走廊的呼叫，什麼都沒有發生" },
        ],
      },
      {
        id: "name_ask",
        label: "隔著門問：「是誰？」",
        resultText:
          "「是誰？」你的聲音比你預期的更穩。\n\n走廊那邊有短暫的沉默。\n\n然後，用你的聲音，走廊那邊說：「是我。」\n\n你沒有再開口。走廊那邊也沒有。你們就這樣各自沉默了很久，直到某個時間點，你意識到外面的聲音已經消失了，但你不知道它是什麼時候離開的。",
        effects: [
          { type: "time", value: 20 },
          { type: "flag", key: "heardName", value: true },
          { type: "sanity", value: -30 },
          { type: "anomaly", value: 3 },
          { type: "world", key: "hotelRealityStability", value: -15 },
          { type: "clue", value: "走廊的聲音用你的聲音回答了「是我」" },
        ],
      },
    ],
    once: true,
  },

  // Event 12 — 衣櫃
  {
    id: "wardrobe_event",
    title: "衣櫃",
    trigger: (player, world) =>
      player.currentLocation === "room304" &&
      player.timeMinutes >= 24 * 60 + 1 * 60 &&
      !player.wardrobeOpened &&
      world.anomalyAttention >= 2,
    description:
      "你聽見衣櫃裡有聲音。\n\n不是風，不是管線，不是建築物的自然收縮。\n\n是移動的聲音。像是有東西在衣櫃裡換姿勢。\n\n然後，衣櫃的門緩緩地自己打開了。\n\n房間附加說明第二條說：若衣櫃自行開啟，請立即以被子蓋住頭部，不要查看衣櫃內部，等待聲音停止後再繼續活動。\n\n衣櫃門現在開著。",
    choices: [
      {
        id: "wardrobe_cover",
        label: "拿被子蓋住頭，等待（遵守規則）",
        resultText:
          "你抓起被子，蓋住頭。\n\n黑暗。\n\n你聽見衣櫃裡有東西在動。靠近。更靠近。\n\n然後，停了。\n\n你不知道等了多久，可能是十分鐘，可能是一小時。你把被子拿開。衣櫃是關著的。像是什麼都沒有發生過。\n\n你看了一眼衣櫃的縫隙。沒有人在裡面——但你衣服上的扣子全都被解開了，整齊地放在桌上。",
        effects: [
          { type: "time", value: 40 },
          { type: "flag", key: "wardrobeOpened", value: true },
          { type: "sanity", value: -15 },
          { type: "clue", value: "遵守衣櫃規則——衣服的扣子被解開了" },
        ],
      },
      {
        id: "wardrobe_look",
        label: "查看衣櫃裡面",
        resultText:
          "你走向衣櫃，拉開門。\n\n裡面是你自己的衣服，整齊地掛著。\n\n然後你看見，掛在最裡面的那件衣服——你沒有帶這件來。你不擁有這件衣服。但它在那裡，大小是你的尺寸，上面有你的體溫。\n\n你把衣櫃門關上，退回到床上。你沒有辦法解釋那件衣服，所以你選擇不去解釋它。",
        effects: [
          { type: "time", value: 20 },
          { type: "flag", key: "wardrobeOpened", value: true },
          { type: "sanity", value: -25 },
          { type: "anomaly", value: 2 },
          { type: "world", key: "hotelRealityStability", value: -15 },
          { type: "clue", value: "衣櫃裡有一件你沒帶來的衣服" },
        ],
      },
      {
        id: "wardrobe_leave_room",
        label: "逃出房間",
        resultText:
          "你直接走到門口，開門，走進走廊。\n\n走廊的燈光正常，日光燈的頻率讓你的眼睛不舒服。\n\n你站在走廊裡，不知道要去哪裡。你不想回房間，但走廊在深夜感覺也不是安全的地方。\n\n你轉頭看了一眼 304 號房的門，門是關著的。你在外面聽不見衣櫃的聲音了。",
        effects: [
          { type: "time", value: 15 },
          { type: "flag", key: "wardrobeOpened", value: true },
          { type: "sanity", value: -5 },
        ],
        nextLocation: "corridor",
      },
    ],
    once: true,
  },

  // Event 13 — 走廊的孩子
  {
    id: "corridor_child",
    title: "孩子",
    trigger: (player, world) =>
      player.currentLocation === "corridor" &&
      player.timeMinutes >= 24 * 60 + 1 * 60 &&
      player.timeMinutes < 24 * 60 + 3 * 60 &&
      !player.talkedToChild,
    description:
      "走廊盡頭站著一個孩子。\n\n大約八到十歲，穿著整齊的學校制服，但你說不清楚是哪所學校的制服。孩子看著你，沒有動。\n\n旅館的規則沒有提到孩子。\n\n但旅館說它不提供兒童服務——這在入住時有人告訴過你嗎？還是你只是假設？\n\n孩子開口了：「你有沒有看到我媽媽？」",
    choices: [
      {
        id: "child_help",
        label: "「沒有，你媽媽在哪裡？」",
        resultText:
          "孩子走近一步。「她在裡面，」孩子說，指著 304 號房，「她說她在裡面等我。」\n\n你的房間。\n\n你問孩子：「你的媽媽叫什麼名字？」\n\n孩子說出了一個名字。那個名字你不認識，但你有一種奇怪的感覺，好像你應該認識。\n\n你轉頭看了一眼 304 的方向，然後轉回來，走廊空了。孩子不在了。你沒有聽見腳步聲。",
        effects: [
          { type: "time", value: 20 },
          { type: "flag", key: "talkedToChild", value: true },
          { type: "sanity", value: -20 },
          { type: "anomaly", value: 2 },
          { type: "clue", value: "走廊的孩子說他媽媽在 304 號房" },
        ],
      },
      {
        id: "child_return",
        label: "「抱歉，我不知道。」然後回到房間",
        resultText:
          "你說你不知道，轉身走回 304 號房，把門關上。\n\n你沒有讓孩子進來，也沒有繼續談話。你不確定你做的是不是對的，但你覺得旅館裡的孩子可能不是真正的孩子。\n\n你在門縫裡聽見走廊有輕微的腳步聲，然後消失了。",
        effects: [
          { type: "time", value: 10 },
          { type: "flag", key: "talkedToChild", value: true },
          { type: "sanity", value: -8 },
          { type: "clue", value: "拒絕和走廊的孩子溝通" },
        ],
        nextLocation: "room304",
      },
      {
        id: "child_ask_room",
        label: "「你是哪個房間的住客？」",
        resultText:
          "孩子想了一下，說：「303。」\n\n303 號房。前任住客留下紙條簽名的房間號碼。\n\n你不知道怎麼反應。孩子看著你說：「你認識 303 的人嗎？」\n\n你說不認識。孩子點頭，說：「好，那你不要去 303。」然後轉身走進走廊盡頭的黑暗，消失了。",
        effects: [
          { type: "time", value: 20 },
          { type: "flag", key: "talkedToChild", value: true },
          { type: "sanity", value: -25 },
          { type: "anomaly", value: 3 },
          { type: "world", key: "hotelRealityStability", value: -10 },
          { type: "clue", value: "走廊的孩子說他住 303——和留紙條的前任住客一樣" },
        ],
      },
    ],
    once: true,
  },

  // Event 14 — 鄰房的音樂
  {
    id: "neighbor_music",
    title: "302 號房",
    trigger: (player, world) =>
      player.currentLocation === "corridor" &&
      player.timeMinutes >= 24 * 60 &&
      player.timeMinutes < 24 * 60 + 4 * 60 &&
      world.anomalyAttention >= 2,
    description:
      "你在走廊，聽見 302 號房傳來音樂聲。\n\n是老式的音樂，帶著錄音雜音，像是很舊的卡帶。你認不出這首曲子，但它有一種讓你感到不安的規律感。\n\n你確定這間旅館只有你一個住客。\n\n302 號房的燈縫透著光。",
    choices: [
      {
        id: "music_knock",
        label: "敲門",
        resultText:
          "你敲了門。音樂停了。\n\n沒有人來應門。\n\n沉默了幾秒，音樂又開始了，從頭開始，那首沒有名字的曲子。\n\n你走開了。你不確定那個房間裡有什麼，但你覺得敲門是一個錯誤，即使什麼都沒有發生。",
        effects: [
          { type: "time", value: 15 },
          { type: "sanity", value: -15 },
          { type: "anomaly", value: 2 },
          { type: "clue", value: "302 號房深夜有音樂，但無人應門" },
        ],
      },
      {
        id: "music_listen",
        label: "站在門外，聽一會兒",
        resultText:
          "你站在 302 號房門口聽了幾分鐘。音樂在某個地方重複，像是放到特定位置就跳回去。\n\n然後你聽見，在音樂之下，有某種非常低頻的聲音，不是音樂的一部分。你意識到那是呼吸聲。非常緩慢的呼吸聲，比正常人的呼吸慢很多。\n\n你離開了，走得比來的時候快。",
        effects: [
          { type: "time", value: 20 },
          { type: "sanity", value: -20 },
          { type: "anomaly", value: 2 },
          { type: "clue", value: "302 號房的音樂背後有不正常的呼吸聲" },
        ],
      },
      {
        id: "music_ignore",
        label: "假裝沒聽見，繼續走",
        resultText:
          "你加快腳步，走過 302 號房。音樂在你背後繼續播放，你走到走廊盡頭，音樂還是聽得見。你上電梯，電梯門關上，音樂消失了。\n\n你覺得這樣更好。",
        effects: [
          { type: "time", value: 8 },
          { type: "sanity", value: -5 },
        ],
      },
    ],
    once: true,
  },

  // Event 15 — 蛋的後續（若吃了蛋，下午兩點到三點）
  {
    id: "egg_verification",
    title: "健康確認",
    trigger: (player, world) =>
      player.ateEggs &&
      !player.eggVerificationDone &&
      player.timeMinutes >= 24 * 60 + 14 * 60 &&
      player.timeMinutes < 24 * 60 + 15 * 60,
    description:
      "你在旅館裡。某個地方，你意識到現在是下午兩點。\n\n前任住客的紙條說：如果你吃了蛋，下午兩點到三點之間不要去餐廳。如果你吃了蛋，不要讓他們做「確認」。\n\n但你沒有收到任何通知……或者你有，而你沒有注意到。\n\n你想起安全須知的第四條現在寫的是：若已食用，請於下午兩點至三點回餐廳接受確認。\n\n現在是下午兩點。",
    choices: [
      {
        id: "egg_go",
        label: "前往餐廳（遵守變化後的規則）",
        resultText:
          "你走進餐廳。一個員工在等你，名牌是紅色的。他說：「您今天的健康確認。請坐。」\n\n你坐下。他拿出一個表格，表格上已經有你的名字，你的生日，你今天早上吃了什麼。\n\n他說：「請問您目前是否記得住進旅館之前的任何事？」\n\n你說你記得。\n\n他在表格上打了一個勾，說：「非常好。確認完成。感謝您的配合。」\n\n他沒有說清楚他確認了什麼。",
        effects: [
          { type: "time", value: 30 },
          { type: "flag", key: "eggVerificationDone", value: true },
          { type: "sanity", value: -20 },
          { type: "suspicion", value: 20 },
          { type: "anomaly", value: 2 },
          { type: "clue", value: "接受蛋的健康確認——員工問你是否記得住進前的事" },
        ],
        nextLocation: "restaurant",
      },
      {
        id: "egg_refuse",
        label: "不去餐廳（遵守前任住客的建議）",
        resultText:
          "你沒有去餐廳。你待在房間，等下午三點過去。\n\n下午兩點五十分，房間電話響了一聲，停了。你沒有接。\n\n三點過後，你去餐廳。餐廳是空的，沒有任何員工，椅子全都倒放在桌上，就像你深夜進去時一樣。好像早餐時間從來沒有發生過。",
        effects: [
          { type: "time", value: 90 },
          { type: "flag", key: "eggVerificationDone", value: true },
          { type: "sanity", value: -10 },
          { type: "clue", value: "拒絕接受蛋的確認——餐廳在下午三點後像從沒開過" },
        ],
      },
    ],
    once: true,
  },
];

export function getTriggeredEvent(
  player: PlayerState,
  world: WorldState,
  triggeredIds: Set<string>
): GameEvent | null {
  for (const event of GAME_EVENTS) {
    if (event.once && triggeredIds.has(event.id)) continue;
    if (event.trigger(player, world)) {
      return event;
    }
  }
  return null;
}
