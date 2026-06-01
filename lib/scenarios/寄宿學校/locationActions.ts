import type { LocationData } from "@/types/scenario";

export const SCENARIO_LOCATIONS: Record<string, LocationData> = {
  dorm_room: {
    id: "dorm_room",
    name: "寢室 307",
    mutatedName: "寢室 307（雙人）",
    description: (_p, _w) => "兩張上下舖，但只有你一個人。對面的床鋪鋪得一絲不苟，枕頭上有別人的名牌。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "read_name_tag",
        label: "查看對面枕頭上的名牌",
        resultText: "名牌上的字跡和你的一模一樣，連那個寫錯又劃掉的筆畫都相同。",
        effects: [
          { type: "sanity", value: -6 },
          { type: "clue", value: "對面床的名牌寫著你的名字" },
          { type: "anomaly", value: 5 }
        ]
      },
      {
        id: "check_door_lock",
        label: "檢查房門門鎖",
        resultText: "門鎖完好。門上貼著一張住宿須知，邊角被人反覆摳過。",
        effects: [
          { type: "flag", key: "checkedDoorLock", value: true },
          { type: "clue", value: "房門內側貼著住宿須知" }
        ]
      },
      {
        id: "rest_on_bed",
        label: "在自己的床上躺一下",
        resultText: "你閉上眼。隔壁床傳來翻身的窸窣聲，但你明明確認過沒有人。",
        effects: [
          { type: "sanity", value: 4 },
          { type: "time", value: 10 },
          { type: "anomaly", value: 3 }
        ]
      }
    ]
  },
  corridor: {
    id: "corridor",
    name: "三樓走廊",
    mutatedName: "無盡走廊",
    description: (_p, _w) => "dynamic",
    adjacentLocations: ["dorm_room", "wash_room", "study_hall", "duty_office", "stairwell", "laundry"],
    actions: [
      {
        id: "count_lights",
        label: "數一數走廊的日光燈",
        resultText: "dynamic",
        effects: [
          { type: "clue", value: "走廊燈管的數量每次都不同" },
          { type: "sanity", value: -3 }
        ]
      },
      {
        id: "check_escape_door",
        label: "走到逃生門查看",
        resultText: "門把冰得異常。門上小窗外不是樓梯，而是另一條一模一樣的走廊。",
        effects: [
          { type: "flag", key: "sawLoopedCorridor", value: true },
          { type: "sanity", value: -5 },
          { type: "anomaly", value: 6 }
        ]
      },
      {
        id: "listen_corridor",
        label: "靜下來聽走廊的聲音",
        resultText: "很遠的地方有拖鞋踩在剛拖過地板上的聲音，一步、一步，沒有靠近也沒有遠離。",
        effects: [
          { type: "suspicion", value: 4 },
          { type: "clue", value: "走廊深處有腳步聲，距離永遠不變" }
        ]
      }
    ]
  },
  wash_room: {
    id: "wash_room",
    name: "盥洗室",
    mutatedName: "鏡之盥洗室",
    description: (_p, _w) => "一整排洗手台與鏡子，水龍頭其中一個一直在滴。鏡子裡的日光燈比走廊多一盞。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "close_tap",
        label: "關掉一直在滴水的水龍頭",
        resultText: "你轉緊龍頭，滴水聲停了。三秒後，最末端那個原本沒開的龍頭開始滴。",
        effects: [
          { type: "sanity", value: -4 },
          { type: "anomaly", value: 4 }
        ]
      },
      {
        id: "look_mirror",
        label: "看著鏡子裡的自己",
        resultText: "鏡中的你慢了半拍才眨眼。背後多出的那盞燈，把你的影子拉向不該有的方向。",
        effects: [
          { type: "sanity", value: -7 },
          { type: "clue", value: "鏡中比現實多一盞燈" },
          { type: "anomaly", value: 5 }
        ]
      },
      {
        id: "count_mirror_lights",
        label: "比對鏡中與走廊的燈數",
        resultText: "你回頭數走廊，再看鏡子。鏡裡永遠多一盞，那盞燈底下站著一個剛離開畫面的人。",
        effects: [
          { type: "clue", value: "鏡中多出的燈下似乎有人" },
          { type: "sanity", value: -5 },
          { type: "suspicion", value: 3 }
        ]
      }
    ]
  },
  study_hall: {
    id: "study_hall",
    name: "晚自習教室",
    mutatedName: "值日生教室",
    description: (_p, _w) => "桌椅排列整齊，黑板上寫著今日值日生姓名。其中一個名字被擦掉又重寫。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "read_blackboard",
        label: "讀黑板上的值日生名單",
        resultText: "被擦掉又重寫的那格，墨跡還沒乾——寫的是你的名字，日期是明天。",
        effects: [
          { type: "clue", value: "黑板上明天的值日生是你" },
          { type: "sanity", value: -6 },
          { type: "anomaly", value: 4 }
        ]
      },
      {
        id: "search_desks",
        label: "翻看抽屜裡的東西",
        resultText: "靠窗那張桌的抽屜裡有一張折好的紙條，字跡潦草，像是急著寫完。",
        effects: [
          { type: "sheet", value: "sheet_previous_student" },
          { type: "flag", key: "foundStudentNote", value: true }
        ]
      },
      {
        id: "sit_own_seat",
        label: "坐回自己晚自習的座位",
        resultText: "椅子還是溫的。桌面攤開的課本停在你今晚根本沒讀到的那一頁。",
        effects: [
          { type: "sanity", value: -3 },
          { type: "time", value: 5 }
        ]
      }
    ]
  },
  infirmary: {
    id: "infirmary",
    name: "保健室",
    mutatedName: "登記簿保健室",
    description: (_p, _w) => "白色床簾、體溫紀錄表、消毒水味。登記簿停在某一頁，名字一行行往下，筆跡都一樣。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "read_register",
        label: "翻閱登記簿",
        resultText: "每一行都是不同名字，筆跡卻完全相同。最後一行墨水未乾，等著被填上。",
        effects: [
          { type: "clue", value: "登記簿所有名字筆跡相同" },
          { type: "sheet", value: "sheet_official_notice" },
          { type: "sanity", value: -4 }
        ]
      },
      {
        id: "check_temp_chart",
        label: "查看體溫紀錄表",
        resultText: "所有人的體溫都是 35.0 度，整整齊齊。包括今晚剛被登記、卻沒人來過的那一格。",
        effects: [
          { type: "clue", value: "所有體溫紀錄都是35度" },
          { type: "sanity", value: -3 },
          { type: "anomaly", value: 3 }
        ]
      },
      {
        id: "sign_register",
        label: "在登記簿上簽下自己的名字",
        condition: (p, w) => p.discoveredClues.includes('登記簿所有名字筆跡相同'),
        resultText: "筆一落下，你的字跡竟和上面每一行完全一致。你開始懷疑那些名字本來就是你。",
        effects: [
          { type: "flag", key: "signedRegister", value: true },
          { type: "sanity", value: -10 },
          { type: "anomaly", value: 8 }
        ]
      }
    ]
  },
  duty_office: {
    id: "duty_office",
    name: "舍監值班室",
    mutatedName: "無人值班室",
    description: (_p, _w) => "玻璃窗後亮著燈，桌上有點名冊和一杯沒喝完、卻不冒熱氣的茶。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "knock_window",
        label: "敲玻璃窗叫舍監",
        resultText: "dynamic",
        effects: [
          { type: "suspicion", value: 6 },
          { type: "anomaly", value: 4 }
        ]
      },
      {
        id: "read_rollcall",
        label: "查看桌上的點名冊",
        resultText: "今晚的欄位全部畫了「在寢」的勾，連對面床那個你沒見過的名字也打了勾。",
        effects: [
          { type: "clue", value: "點名冊上對面床的人也被勾為在寢" },
          { type: "sheet", value: "sheet_staff_memo" },
          { type: "sanity", value: -4 }
        ]
      },
      {
        id: "touch_tea",
        label: "摸一摸那杯茶",
        resultText: "茶是冰的，杯壁卻凝著熱氣的水珠。彷彿熱氣被誰先一步取走了。",
        effects: [
          { type: "clue", value: "冷茶外壁卻有熱氣凝結" },
          { type: "sanity", value: -3 }
        ]
      }
    ]
  },
  stairwell: {
    id: "stairwell",
    name: "西側樓梯間",
    mutatedName: "增生的樓梯",
    description: (_p, _w) => "dynamic",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "count_stairs",
        label: "數樓梯的階數",
        resultText: "dynamic",
        effects: [
          { type: "clue", value: "下樓的階數比上樓時多" },
          { type: "sanity", value: -5 },
          { type: "anomaly", value: 5 }
        ]
      },
      {
        id: "descend_stairs",
        label: "嘗試走下樓回一樓",
        resultText: "你走了很久。轉過最後一個彎，迎面又是寫著「三樓」的樓層牌。",
        effects: [
          { type: "flag", key: "triedDescend", value: true },
          { type: "time", value: 15 },
          { type: "sanity", value: -6 }
        ]
      },
      {
        id: "look_over_rail",
        label: "探頭看樓梯井下方",
        resultText: "樓梯井往下沒有盡頭，最底層的微光裡，有個和你一樣探頭往上看的身影。",
        effects: [
          { type: "clue", value: "樓梯井底有人也在往上看" },
          { type: "sanity", value: -7 },
          { type: "suspicion", value: 3 }
        ]
      }
    ]
  },
  laundry: {
    id: "laundry",
    name: "洗衣間",
    mutatedName: "床單洗衣間",
    description: (_p, _w) => "幾台滾筒洗衣機，其中一台在無人操作下緩慢轉動，裡面是一整缸白色床單。",
    adjacentLocations: ["corridor"],
    actions: [
      {
        id: "open_washer",
        label: "打開正在轉的洗衣機",
        resultText: "床單溫熱而乾燥，根本沒沾過水。攤開其中一條，中央印著一個淡淡的人形輪廓。",
        effects: [
          { type: "clue", value: "洗衣機裡的床單印著人形輪廓" },
          { type: "sanity", value: -6 },
          { type: "anomaly", value: 5 }
        ]
      },
      {
        id: "count_sheets",
        label: "清點床單的數量",
        resultText: "你數出三十七條床單，正好是這層樓的床位數加一。多的那一條疊得最整齊。",
        effects: [
          { type: "clue", value: "床單數量比床位多一條" },
          { type: "sanity", value: -3 }
        ]
      },
      {
        id: "hide_in_laundry",
        label: "躲進洗衣間角落喘口氣",
        condition: (p, w) => w.staffMode === 'hostile',
        resultText: "你蜷在洗衣機之間。滾筒持續轉動的悶響，蓋過了走廊上越來越近的腳步。",
        effects: [
          { type: "sanity", value: 6 },
          { type: "suspicion", value: -4 },
          { type: "flag", key: "hidInLaundry", value: true }
        ]
      }
    ]
  }
};
