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
          "你把炒蛋放上盤子，吃了一口。味道是正常的。你吃完了。然後你感覺一點點不對，但你說不清楚是哪裡不對。可能什麼都沒有。可能有。",
        effects: [
          { type: "time", value: 20 },
          { type: "flag", key: "ateEggs", value: true },
          { type: "sanity", value: -5 },
          { type: "world", key: "hotelRealityStability", value: -10 },
          { type: "anomaly", value: 1 },
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

  // Event 10 — 清晨 (handled in endings)
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
