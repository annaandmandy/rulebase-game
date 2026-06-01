import { LocationId, LocationAction, PlayerState, WorldState } from "@/types/game";

export type LocationData = {
  id: LocationId;
  name: string;
  mutatedName?: string;
  description: (player: PlayerState, world: WorldState) => string;
  adjacentLocations: LocationId[];
  actions: LocationAction[];
};

export const LOCATIONS: Record<LocationId, LocationData> = {
  lobby: {
    id: "lobby",
    name: "大廳",
    mutatedName: "大廳（?）",
    description: (player, world) => {
      const base =
        "大廳的燈光昏黃，天花板角落有一盞燈在輕微閃爍。接待台後方的員工正在低頭整理文件，沒有抬頭。大廳角落擺著一張舊沙發，沙發上放著一份今天的報紙。";
      if (world.anomalyAttention > 3) {
        return base + "\n\n你注意到沙發上的報紙，日期欄是空白的。";
      }
      if (world.hotelRealityStability < 50) {
        return base + "\n\n大廳比你記得的更寬。或者說，你記得的大廳從來不是這個樣子。";
      }
      return base;
    },
    adjacentLocations: ["elevator", "restaurant", "front_desk", "stairwell"],
    actions: [
      {
        id: "lobby_newspaper",
        label: "查看沙發上的報紙",
        resultText: (player, world) => {
          if (world.anomalyAttention > 2) {
            return "你拿起報紙。日期欄是空白的。頭版標題是：「山區濃霧持續，___旅館暫停對外___」後面的字看不清楚。你把報紙放回去。";
          }
          return "報紙的日期是今天。頭版是天氣預報：山區濃霧，能見度極低。你想，你已經知道了。";
        },
        effects: [
          { type: "time", value: 10 },
          { type: "clue", value: "大廳沙發上有一份報紙" },
        ],
      },
      {
        id: "lobby_observe_staff",
        label: "觀察接待人員",
        resultText: (player, world) => {
          if (world.staffMode === "watching") {
            return "員工沒有動，但你有一種感覺——他一直知道你在看他。他的手停在文件上，沒有在動筆，也沒有翻頁。他就是停在那裡。";
          }
          return "員工在整理文件。他翻了一頁，停了一下，又翻回去。你不確定他有沒有在工作，還是只是在做某種動作。";
        },
        effects: [{ type: "time", value: 8 }, { type: "suspicion", value: 5 }],
      },
      {
        id: "lobby_sit",
        label: "在沙發上坐一會兒",
        resultText: "你坐在大廳的沙發上。旅館非常安靜。偶爾有細微的嗡嗡聲，來自牆壁裡面，或者天花板裡面。你說不清楚從哪裡來。",
        effects: [{ type: "time", value: 20 }, { type: "sanity", value: 3 }],
      },
    ],
  },

  elevator: {
    id: "elevator",
    name: "電梯",
    description: (player, world) => {
      if (world.elevatorState === "basement_visible") {
        return "電梯門打開了。面板上的數字在正常閃爍。但你注意到，在「1」的下方，有一個按鈕。按鈕上標示著「B2」。沒有「B1」。";
      }
      if (world.elevatorState === "wrong_floor") {
        return "電梯門打開，你走進去。按下「3」。電梯緩緩上升。面板顯示「2」、「3」，然後繼續往上。「4」。你沒有按「4」。電梯在四樓停下來。";
      }
      return "電梯門打開。空間非常小，只能站兩個人。面板上有地下室按鈕的位置是空白的——那個位置從來就沒有安裝按鈕。";
    },
    adjacentLocations: ["lobby", "corridor", "basement_entrance"],
    actions: [
      {
        id: "elevator_panel",
        label: "仔細查看電梯面板",
        resultText: (player, world) => {
          if (world.elevatorState === "basement_visible") {
            return "面板上清楚地有個 B2 的按鈕。按鈕的邊緣有一些磨損，好像被按過很多次。你想起規則六說要按 3 樓。";
          }
          return "面板上的按鈕是：B、1、2、3、4、5、6、7。B 按鈕的位置空白，只有一個圓形的痕跡，按鈕本身不在了。地下室按鈕早就被移除了。";
        },
        effects: [
          { type: "time", value: 8 },
          { type: "clue", value: "電梯面板上的地下室按鈕位置是空的" },
        ],
      },
      {
        id: "elevator_wait",
        label: "在電梯裡等待",
        resultText: (player, world) => {
          const hour = Math.floor((player.timeMinutes % (24 * 60)) / 60);
          if (hour >= 0 && hour < 4) {
            return "電梯的門關上又打開。你沒有按任何按鈕。面板上的數字閃了一下，你看見一個不應該在那裡的數字出現了一瞬間。然後消失了。你走出電梯。";
          }
          return "你站在電梯裡沒有按任何按鈕。電梯靜止。過了幾分鐘，門自動關上，然後又自動打開。你還是在一樓。";
        },
        effects: [
          { type: "time", value: 15 },
          { type: "anomaly", value: 1 },
          { type: "suspicion", value: 5 },
        ],
      },
    ],
  },

  corridor: {
    id: "corridor",
    name: "三樓走廊",
    mutatedName: "走廊",
    description: (player, world) => {
      const base =
        "走廊燈光昏暗，每隔幾步就有一盞日光燈在低頻震動。地毯是深紅色，上面有花紋——你說不清楚是刻意的圖案還是污漬。走廊盡頭是 304 號房。";
      if (world.anomalyAttention > 5) {
        return base + "\n\n你數了一下，走廊兩側共有十二扇門。然後你想起，三樓原本只有八個房間。";
      }
      if (world.hotelRealityStability < 40) {
        return base + "\n\n走廊比你剛才走過來時更長。";
      }
      return base;
    },
    adjacentLocations: ["elevator", "room304", "stairwell"],
    actions: [
      {
        id: "corridor_count_doors",
        label: "數一數走廊的門",
        resultText: (player, world) => {
          if (world.anomalyAttention > 3) {
            return "你從電梯走到 304 號房，沿途數了每一扇門。左邊：301、303、305。右邊：302、304——然後還有一扇門，沒有號碼。你走近看，門把是溫的。";
          }
          return "你數了一下。三樓的房間是 301 到 308，兩側各四間，中間走廊連接電梯。一切正常。";
        },
        effects: [
          { type: "time", value: 12 },
          { type: "anomaly", value: 1 },
          { type: "clue", value: "三樓走廊的門的數量取決於你數的時候" },
        ],
      },
      {
        id: "corridor_listen",
        label: "靜止，聆聽走廊的聲音",
        resultText: (player, world) => {
          const hour = Math.floor((player.timeMinutes % (24 * 60)) / 60);
          if (hour >= 23 || hour < 3) {
            return "走廊非常安靜。然後你聽見，某個房間裡有人在動。不是 304，是另一間。移動停了，好像那個人也在聽你。";
          }
          return "走廊很安靜。日光燈的嗡嗡聲。空調的低鳴。地毯吸收了所有腳步聲。你在這裡站了一會兒，沒有聽見任何奇怪的東西。";
        },
        effects: [{ type: "time", value: 10 }, { type: "sanity", value: -5 }, { type: "anomaly", value: 1 }],
      },
      {
        id: "corridor_door_peep",
        label: "從貓眼看看其他房間",
        condition: (player, world) => world.anomalyAttention >= 2,
        resultText: "你趴在某個房間的貓眼上往裡看。黑暗的。什麼都看不見。然後，從裡面，有什麼東西把貓眼擋住了。它也在從裡面看你。你退開。",
        effects: [
          { type: "time", value: 10 },
          { type: "sanity", value: -15 },
          { type: "anomaly", value: 2 },
        ],
      },
    ],
  },

  room304: {
    id: "room304",
    name: "304 號房",
    description: (player, world) => {
      if (world.room304State === "occupied_by_self") {
        return "你打開門。床上躺著一個人，背對著你。那個人的輪廓——頭髮、肩膀、睡姿——和你平時睡覺的樣子完全一樣。你站在門口很久，沒有進去。";
      }
      if (world.room304State === "duplicated") {
        return "你打開門。房間看起來正常，但桌上有兩張房卡。兩張都是 304。兩張都是你的名字。";
      }
      if (world.room304State === "missing") {
        return "走廊盡頭應該是 304 號房的地方，只有一面牆。沒有門。門牌號碼還在，貼在空白的牆上。";
      }
      const base =
        "房間不大，標準單人房。一張床、一張書桌、一台電視。窗外是濃霧，什麼都看不見。桌上放著一份「住客安全須知」——和你入住時拿到的那份一樣。";
      if (player.openedWindow) {
        return base + "\n\n窗戶還開著。你不記得你有沒有把它關上。冷風吹進來。";
      }
      return base;
    },
    adjacentLocations: ["corridor", "balcony"],
    actions: [
      {
        id: "room304_tv",
        label: "打開電視",
        resultText: (player, world) => {
          const hour = Math.floor((player.timeMinutes % (24 * 60)) / 60);
          if (hour >= 1 && hour < 5) {
            return "電視打開了。白噪音。然後畫面出現——是一個走廊的畫面，鏡頭很固定，像監視器。走廊和你剛才走過來的一模一樣。你在鏡頭畫面裡找了一下自己，沒有找到。";
          }
          return "電視打開，是播著山區天氣預報的頻道。主播面無表情地說：「山霧持續，預計___時間解除。」她說的時間你沒聽清楚。";
        },
        effects: [{ type: "time", value: 15 }, { type: "sanity", value: -8 }, { type: "anomaly", value: 1 }],
      },
      {
        id: "room304_read_notice",
        label: "再讀一遍安全須知",
        resultText: (player, world) => {
          if (world.ruleNoticeVersion >= 2) {
            return "你重新拿起安全須知。第三條規則：「本旅館目前沒有地下室。」你記得你第一次讀的時候，是「本旅館沒有地下室」，沒有「目前」。";
          }
          return "你把安全須知讀了一遍。八條規則，每一條都讓你有點不安，但你說不清楚哪一條是最重要的。";
        },
        effects: [
          { type: "time", value: 10 },
          { type: "clue", value: "安全須知第三條有細微變化" },
          { type: "anomaly", value: 1 },
        ],
      },
      {
        id: "room304_check_window",
        label: "靠近窗戶，看看窗外",
        resultText: (player, world) => {
          if (player.openedWindow) {
            return "冷風還在吹進來。霧裡什麼都看不見。你靠近窗口，往下看，看不見地面。你不確定三樓有多高，但感覺比正常的三樓高很多。";
          }
          const hour = Math.floor((player.timeMinutes % (24 * 60)) / 60);
          if (hour >= 23 || hour < 5) {
            return "窗戶是關著的。你靠近，霧緊貼在玻璃外面，像一面灰色的牆。你把手放在玻璃上，玻璃是冷的，但霧那一側是溫的。";
          }
          return "窗外是霧。霧非常均勻，沒有任何輪廓。你試著找到山，或者燈光，或者任何東西。什麼都沒有。";
        },
        effects: [{ type: "time", value: 10 }, { type: "sanity", value: -5 }],
      },
      {
        id: "room304_rest",
        label: "躺在床上，試著休息",
        resultText: (player) => {
          if (player.timeMinutes >= 24 * 60 + 3 * 60) {
            return "你躺在床上。天花板是白色的，有一個小的水漬，形狀像一隻鳥，或者像一個人在跑。你閉上眼睛。不知道多久之後，你睜開眼，天色還是一樣。";
          }
          return "你試著躺下休息，但沒有辦法睡著。走廊裡有聲音，遠遠的，聽不清楚是什麼。你躺了一會兒，決定還是起來。";
        },
        effects: [{ type: "time", value: 30 }, { type: "sanity", value: 5 }],
      },
    ],
  },

  restaurant: {
    id: "restaurant",
    name: "餐廳",
    description: (player) => {
      if (player.timeMinutes >= 24 * 60 + 7 * 60) {
        return "早餐時間。餐廳比你想像的明亮，但只有你一個住客。自助餐台上擺著幾樣食物：土司、稀飯、水果，還有一盤炒蛋。炒蛋的顏色比正常的炒蛋黃一點。";
      }
      return "餐廳沒有開燈。黑暗中，你可以看到椅子被整齊地放在桌上，椅腳朝上。有一個椅子沒有倒放。那個椅子前面擺著一個杯子，杯子裡有水，水是溫的。";
    },
    adjacentLocations: ["lobby"],
    actions: [
      {
        id: "restaurant_chair",
        label: "查看沒有倒放的椅子",
        condition: (player) => player.timeMinutes < 24 * 60 + 7 * 60,
        resultText: "你走到那個沒有倒放的椅子旁邊。杯子裡的水是溫的，不是熱的，不是冷的。杯緣有淡淡的口紅印，顏色接近深紅色，或者說是深棕色。你把杯子放回去，假裝沒看見。",
        effects: [
          { type: "time", value: 10 },
          { type: "sanity", value: -8 },
          { type: "clue", value: "餐廳有人坐過的痕跡" },
          { type: "anomaly", value: 1 },
        ],
      },
      {
        id: "restaurant_menu",
        label: "查看菜單",
        resultText: (player) => {
          if (player.timeMinutes >= 24 * 60 + 7 * 60) {
            return "早餐菜單在桌上。只有四樣東西：土司、稀飯、水果、炒蛋。菜單的最下面有一行小字：「本旅館對蛋類料理過敏不負任何責任。」";
          }
          return "菜單插在桌上的菜單架裡。你翻了翻，是正常的中式早餐。最後一頁有一行小字，說本旅館對特殊食材過敏不負責。你不確定那算不算正常。";
        },
        effects: [
          { type: "time", value: 8 },
          { type: "clue", value: "菜單上有關於蛋類過敏的免責聲明" },
        ],
      },
      {
        id: "restaurant_smell",
        label: "在餐廳裡站一會兒",
        resultText: (player, world) => {
          const hour = Math.floor((player.timeMinutes % (24 * 60)) / 60);
          if (hour < 7) {
            return "黑暗的餐廳有一股輕微的氣味，說不清楚是什麼，有點像煮過的東西，但餐廳沒有開燈，廚房也沒有聲音。";
          }
          return "餐廳很安靜，只有你一個人。食物看起來很正常。你站在那裡，覺得有什麼東西不對，但你說不清楚是什麼。";
        },
        effects: [{ type: "time", value: 8 }],
      },
    ],
  },

  stairwell: {
    id: "stairwell",
    name: "樓梯間",
    description: (player, world) => {
      const base =
        "樓梯間的燈是感應式的。你走進來，燈亮了。樓梯往上通往四樓，往下通往一樓。在一樓的下方，還有一段樓梯往下延伸，進入黑暗。";
      if (world.anomalyAttention > 4) {
        return base + "\n\n你聽見樓下傳來腳步聲。那個方向不是一樓，而是更下面。";
      }
      return base;
    },
    adjacentLocations: ["lobby", "corridor", "basement_entrance"],
    actions: [
      {
        id: "stairwell_listen",
        label: "靜止，聆聽樓梯間的聲音",
        resultText: (player, world) => {
          const hour = Math.floor((player.timeMinutes % (24 * 60)) / 60);
          if (hour >= 0 && hour < 5) {
            return "非常安靜。然後你聽見，從下面，某個地方，有腳步聲。緩慢、均勻。往上走。你數了一下步數，腳步聲在應該到達一樓的地方停了，然後繼續往上。你跑回走廊。";
          }
          return "樓梯間有一種空曠的回音。你自己的呼吸在這裡聽起來比平時大聲。沒有其他聲音。";
        },
        effects: [{ type: "time", value: 12 }, { type: "sanity", value: -10 }, { type: "anomaly", value: 1 }],
      },
      {
        id: "stairwell_look_down",
        label: "往下看，看看最底下有什麼",
        resultText: (player, world) => {
          if (world.anomalyAttention > 3) {
            return "你趴在樓梯欄杆上往下看。一樓。然後是黑暗。黑暗裡有光，很微弱，從某個縫隙透出來。那個方向不應該有房間。";
          }
          return "你往下看，看見一樓的大廳，和遠遠的接待台。一切正常。然後你注意到，一樓的樓梯下面，有一段往下延伸的暗處，你之前沒有特別注意到。";
        },
        effects: [
          { type: "time", value: 10 },
          { type: "clue", value: "樓梯間最底端有通往下方的樓梯" },
          { type: "anomaly", value: 1 },
        ],
      },
    ],
  },

  basement_entrance: {
    id: "basement_entrance",
    name: "地下室入口",
    description: (player, world) => {
      if (!player.enteredBasement) {
        return "你發現一扇門。門上沒有標示，但它在樓梯間的最底端，通往地下的方向。門縫下有微弱的燈光透出來，帶著某種潮濕的氣味。旅館說沒有地下室。";
      }
      return "你站在地下室入口。你已經去過了。你不太確定你在那裡看到了什麼。";
    },
    adjacentLocations: ["stairwell"],
    actions: [
      {
        id: "basement_sniff",
        label: "靠近門，聞一聞氣味",
        condition: (player) => !player.enteredBasement,
        resultText: "你彎腰靠近門縫。氣味是潮濕的，帶著一種你說不清楚的東西。有點像金屬，有點像某種消毒水，有點像——你說不清楚。你站起來。",
        effects: [{ type: "time", value: 8 }, { type: "sanity", value: -5 }, { type: "anomaly", value: 1 }],
      },
      {
        id: "basement_knock",
        label: "敲一敲門",
        condition: (player) => !player.enteredBasement,
        resultText: "你敲了兩下門。聲音是空洞的，好像門後面有很大的空間。沒有人回應。然後，從門縫下面，透出來的光輕微地閃了一下，然後恢復穩定。",
        effects: [
          { type: "time", value: 10 },
          { type: "sanity", value: -10 },
          { type: "anomaly", value: 2 },
          { type: "world", key: "hotelRealityStability", value: -5 },
        ],
      },
    ],
  },

  balcony: {
    id: "balcony",
    name: "陽台",
    description: () =>
      "304 號房的窗戶推開後是一個小陽台。霧非常濃，你看不見任何遠處的東西。你甚至不確定山還在不在那裡。",
    adjacentLocations: ["room304"],
    actions: [
      {
        id: "balcony_shout",
        label: "朝霧裡喊話",
        resultText: "你喊了一聲。你的聲音被霧吸收，沒有回聲。過了幾秒，從下面某個地方，傳來一個很輕的聲音——你不確定是不是你的回聲，因為那個聲音比你喊話的聲音低很多，而且說的不是同一個字。",
        effects: [{ type: "time", value: 15 }, { type: "sanity", value: -15 }, { type: "anomaly", value: 2 }],
      },
      {
        id: "balcony_look",
        label: "試著看清楚霧裡的東西",
        resultText: (player, world) => {
          const hour = Math.floor((player.timeMinutes % (24 * 60)) / 60);
          if (hour >= 23 || hour < 4) {
            return "你盯著霧看了很久。霧裡有什麼東西在動——不是風，是某種有規律的移動。你一直盯著，直到你開始不確定你看見的是真的，還是你的眼睛在欺騙你。";
          }
          return "霧非常均勻，你試著找到任何輪廓，任何光線，任何聲音的來源。什麼都沒有。霧就是霧。";
        },
        effects: [{ type: "time", value: 12 }, { type: "sanity", value: -8 }],
      },
    ],
  },

  front_desk: {
    id: "front_desk",
    name: "櫃檯",
    description: (player, world) => {
      if (world.staffMode === "watching") {
        return "你走到櫃檯前。員工抬起頭，看著你。沒有說話。過了很久，他才開口問：「有什麼事嗎？」他的名牌是紅色的。你剛才沒有注意到。";
      }
      if (world.staffMode === "false_helpful") {
        return "員工非常親切地向你微笑。「需要什麼幫忙嗎？」他說，「我可以為您安排任何事情。」他的熱情程度比正常的旅館員工高一點。只是高一點。";
      }
      if (world.staffMode === "hostile") {
        return "員工沒有看你。你站在櫃檯前等了很久，他完全沒有反應，好像你不存在。";
      }
      return "員工是個中年男性，制服整齊，面無表情。他在低頭整理文件。";
    },
    adjacentLocations: ["lobby"],
    actions: [
      {
        id: "desk_ask_wifi",
        label: "詢問：「旅館有 Wi-Fi 嗎？」",
        resultText: (player, world) => {
          if (world.staffMode === "hostile") return "員工沒有回應。";
          if (world.staffMode === "false_helpful") {
            return "員工非常熱情地說：「有的，密碼是 304304。」你連上去，但手機顯示已連線，卻沒有任何網路。員工還在微笑。";
          }
          return "員工看了你一眼，說：「山區沒有訊號，我們沒有 Wi-Fi。」然後低頭繼續整理文件。";
        },
        effects: [{ type: "time", value: 8 }],
      },
      {
        id: "desk_ask_checkout",
        label: "詢問：「明天幾點可以退房？」",
        resultText: (player, world) => {
          if (world.staffMode === "hostile") return "員工沒有任何反應。你等了很久，離開了。";
          return "員工抬頭看了你一眼。「退房時間是早上十一點，」他說，「但視情況而定。」你想問「視什麼情況」，但他已經低頭了。";
        },
        effects: [{ type: "time", value: 8 }, { type: "suspicion", value: 5 }],
      },
      {
        id: "desk_observe_badge",
        label: "注意員工的名牌",
        resultText: (player, world) => {
          if (world.staffMode !== "normal") {
            return "你注意到員工的名牌是紅色的。規則五說配戴紅色名牌者為臨時人員，不要向其提問。你已經問了。";
          }
          return "員工的名牌是黑色的，上面有他的名字和「正式員工」的字樣。名牌的邊角有一點磨損，好像戴了很久。";
        },
        effects: [{ type: "time", value: 5 }, { type: "clue", value: "員工名牌顏色可能隨狀態改變" }],
      },
    ],
  },
};

export function getLocationName(id: LocationId, world: WorldState): string {
  const loc = LOCATIONS[id];
  if (world.hotelRealityStability < 30 && loc.mutatedName) {
    return loc.mutatedName;
  }
  return loc.name;
}
