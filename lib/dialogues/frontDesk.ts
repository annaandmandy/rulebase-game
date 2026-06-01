import { Dialogue } from "@/types/dialogue";

export const FRONT_DESK_DIALOGUE: Dialogue = {
  id: "front_desk",
  npcName: "旅館員工",
  location: "front_desk",
  startScene: "greet",
  scenes: {
    // ─── Opening ────────────────────────────────────────────────────────────
    greet: {
      id: "greet",
      npcText: (_p, w, _m) => {
        switch (w.staffMode) {
          case "normal":
            return "您好，有什麼可以幫您的嗎？";
          case "watching":
            return "……有什麼事嗎？";
          case "false_helpful":
            return "歡迎歡迎！有什麼需要我幫忙的嗎？任何事情都可以問我！";
          case "hostile":
            return "（員工沒有抬頭。你站在櫃台前，他的視線始終停在桌面的文件上，就像你不存在。過了很久，他才緩緩開口。）「……有事嗎。」";
          default:
            return "您好，有什麼可以幫您的嗎？";
        }
      },
      choices: [
        {
          id: "greet_yes",
          label: "「有，我想問幾件事。」",
          next: "main_menu",
        },
        {
          id: "greet_look",
          label: "（先打量一下員工）",
          next: "main_menu",
        },
      ],
    },

    // ─── Main Menu ───────────────────────────────────────────────────────────
    main_menu: {
      id: "main_menu",
      npcText: (_p, w, _m) => {
        if (w.staffMode === "hostile") return "（員工等著你說話，沒有表情。）";
        return "（請問有什麼需要？）";
      },
      choices: [
        {
          id: "ask_guests",
          label: "「我想問一下其他住客的事。」",
          next: "other_guests",
        },
        {
          id: "ask_basement",
          label: "「旅館有沒有地下室？」",
          next: "basement_question",
        },
        {
          id: "ask_checkout",
          label: "「我想提早退房，現在可以嗎？」",
          next: "early_checkout",
        },
        {
          id: "ask_keycard",
          label: "「我看見有人拿著我的房卡。」",
          condition: (p, _w, _m) => p.sawDuplicateGuest,
          next: "report_keycard",
        },
        {
          id: "ask_name_calling",
          label: "「我剛才在走廊聽見有人叫我的名字。」",
          condition: (p, _w, _m) => p.heardName,
          next: "report_name_calling",
        },
        {
          id: "ask_previous_guest",
          label: "「我想問一下前任住客的事。」",
          condition: (p, _w, _m) => p.foundPreviousNote,
          next: "previous_guest",
        },
        {
          id: "ask_badge",
          label: "「關於名牌的顏色……」",
          condition: (_p, w, _m) => w.staffMode !== "normal",
          next: "badge_color",
        },
        {
          id: "leave",
          label: "「沒什麼，謝謝。」",
          next: null,
        },
      ],
    },

    // ─── Other Guests ────────────────────────────────────────────────────────
    other_guests: {
      id: "other_guests",
      npcText:
        "本旅館尊重住客隱私，恕無法提供其他住客的相關資訊。",
      choices: [
        {
          id: "push_floor3",
          label: "「只是想確認，三樓還有沒有其他人。」",
          effects: [
            { type: "suspicion", value: 5 },
            {
              type: "clue",
              value: "詢問其他住客 — 旅館以隱私為由拒絕",
            },
          ],
          next: "other_guests_push",
        },
        {
          id: "guests_ok",
          label: "「好，沒關係。」",
          effects: [
            {
              type: "clue",
              value: "詢問其他住客 — 旅館以隱私為由拒絕",
            },
          ],
          next: "main_menu",
        },
      ],
    },

    other_guests_push: {
      id: "other_guests_push",
      npcText: (p, w, _m) => {
        if (w.anomalyAttention >= 3 && p.sanity > 50) {
          return "（員工停頓了一下。）「目前……只有您一位住客。正式登記的。」（他特別強調了「正式登記的」四個字，然後低下頭。）";
        }
        if (p.sanity <= 50) {
          return "（員工用一種奇怪的眼神看著你。）「您是說……三樓的人？」（長時間的靜默。）「我沒辦法告訴您。」";
        }
        return "「這部分我真的無法提供。請您放心，旅館的安全是我們的首要考量。」";
      },
      choices: [
        {
          id: "guests_push_back",
          label: "（返回）",
          effects: [{ type: "anomaly", value: 1 }],
          next: "main_menu",
        },
      ],
    },

    // ─── Basement Question ───────────────────────────────────────────────────
    basement_question: {
      id: "basement_question",
      npcText: "本旅館沒有地下室。",
      choices: [
        {
          id: "basement_saw_door",
          label: "「我在樓梯間看見一扇往下的門。」",
          condition: (p, _w, _m) =>
            p.discoveredClues.some(
              (c) =>
                c.includes("地下室") ||
                c.includes("樓梯間最底端") ||
                c.includes("往下延伸")
            ),
          effects: [{ type: "clue", value: "員工說沒有地下室" }],
          next: "basement_push",
        },
        {
          id: "basement_ok",
          label: "「好，謝謝。」",
          effects: [{ type: "clue", value: "員工說沒有地下室" }],
          next: "main_menu",
        },
      ],
    },

    basement_push: {
      id: "basement_push",
      npcText: (_p, w, _m) => {
        if (w.staffMode === "watching") {
          return "（員工停頓了很長的時間。）「那扇門……不應該在那裡的。」（他低下頭。）「請您待在您的房間裡。」";
        }
        return "「那可能是維修間的入口。不對外開放，請不要靠近。」";
      },
      choices: [
        {
          id: "basement_memo",
          label: "「你們的備忘錄第22條說員工不得單獨前往三樓以外的區域——為什麼？」",
          condition: (p, _w, _m) => p.foundSheets.includes("staff_memo"),
          next: "basement_memo_callout",
        },
        {
          id: "basement_ok2",
          label: "「好，我不會去的。」",
          next: "main_menu",
        },
      ],
    },

    basement_memo_callout: {
      id: "basement_memo_callout",
      npcText:
        "（員工僵住了。很長的沉默。）「您在哪裡看到那份文件的？」（他的語氣沒有變，但他放下了手上的筆。）",
      choices: [
        {
          id: "memo_callout_end",
          label: "（員工不再說話。你離開。）",
          effects: [
            { type: "world", key: "staffMode", value: "hostile" },
            { type: "anomaly", value: 2 },
            { type: "suspicion", value: 30 },
          ],
          next: null,
        },
      ],
    },

    // ─── Early Checkout ──────────────────────────────────────────────────────
    early_checkout: {
      id: "early_checkout",
      npcText: (p, _w, _m) => {
        if (p.timeMinutes >= 24 * 60) {
          return "「凌晨時段我們暫時無法辦理退房手續，建議您等到天亮後再辦理。」";
        }
        return "「退房時間是早上十一點，目前還不到退房時間。」";
      },
      choices: [
        {
          id: "checkout_memo_push",
          label: "「你們備忘錄第23條說凌晨後要婉拒退房要求——這是規定？」",
          condition: (p, _w, _m) =>
            p.timeMinutes >= 24 * 60 && p.foundSheets.includes("staff_memo"),
          effects: [{ type: "clue", value: "凌晨後無法辦理退房" }],
          next: "checkout_memo_callout",
        },
        {
          id: "checkout_wait",
          label: "「好，我等到天亮。」",
          effects: [{ type: "clue", value: "凌晨後無法辦理退房" }],
          next: "main_menu",
        },
      ],
    },

    checkout_memo_callout: {
      id: "checkout_memo_callout",
      npcText:
        "「……這只是為了確保住客安全。凌晨山路能見度低。」（停頓。）「請您安心休息。」（答案太流暢，太準確，像是背過的。）",
      choices: [
        {
          id: "checkout_memo_back",
          label: "（你無法反駁，也不確定想反駁什麼。）",
          effects: [
            { type: "suspicion", value: 15 },
            { type: "sanity", value: -5 },
          ],
          next: "main_menu",
        },
      ],
    },

    // ─── Report Keycard ──────────────────────────────────────────────────────
    report_keycard: {
      id: "report_keycard",
      npcText:
        "「感謝您告知。我們會立即處理。」（員工做了一個記錄。）「您看到的是在走廊上嗎？」",
      choices: [
        {
          id: "keycard_corridor",
          label: "「是，在三樓走廊。」",
          setMemory: { reportedKeycard: true },
          next: "report_keycard_detail",
        },
        {
          id: "keycard_unsure",
          label: "「我不確定在哪裡。」",
          setMemory: { reportedKeycard: true },
          next: "main_menu",
        },
      ],
    },

    report_keycard_detail: {
      id: "report_keycard_detail",
      npcText:
        "「我們會派人確認。」（停頓。員工在寫著什麼。）「請問那個人的外貌您有印象嗎？」",
      choices: [
        {
          id: "keycard_similar",
          label: "「和我很像。」",
          next: "report_keycard_similar",
        },
        {
          id: "keycard_unclear",
          label: "「我沒看清楚。」",
          next: "main_menu",
        },
      ],
    },

    report_keycard_similar: {
      id: "report_keycard_similar",
      npcText:
        "（很長的沉默。員工沒有再寫任何東西。）「我明白了。謝謝您告知。」（他的語氣變了。不是變冷，而是變成某種更平靜、更確定的東西。他知道這意味著什麼，而那個意思不好。）",
      choices: [
        {
          id: "keycard_similar_end",
          label: "（你說不出任何話。你離開。）",
          effects: [
            { type: "sanity", value: -15 },
            { type: "anomaly", value: 2 },
            { type: "world", key: "room304State", value: "occupied_by_self" },
          ],
          next: null,
        },
      ],
    },

    // ─── Name Calling ─────────────────────────────────────────────────────────
    report_name_calling: {
      id: "report_name_calling",
      npcText:
        "「可能是幻覺，建議您休息。」",
      choices: [
        {
          id: "name_memo_callout",
          label: "「你說的和你們備忘錄第17條的標準回應一模一樣。」",
          condition: (p, _w, _m) => p.foundSheets.includes("staff_memo"),
          effects: [
            {
              type: "clue",
              value: "員工對走廊叫名字的回應和備忘錄第17條一字不差",
            },
          ],
          next: "report_name_memo",
        },
        {
          id: "name_ok",
          label: "「好。」",
          effects: [
            {
              type: "clue",
              value: "員工對走廊叫名字的回應和備忘錄第17條一字不差",
            },
          ],
          next: "main_menu",
        },
      ],
    },

    report_name_memo: {
      id: "report_name_memo",
      npcText:
        "（員工停止了表演。）「……請問您是在哪裡找到那份文件的？」",
      choices: [
        {
          id: "name_memo_desk",
          label: "「在你的桌上。」",
          effects: [
            { type: "suspicion", value: 20 },
            { type: "anomaly", value: 2 },
          ],
          next: "memo_confrontation",
        },
        {
          id: "name_memo_silent",
          label: "「不告訴你。」",
          effects: [
            { type: "suspicion", value: 20 },
            { type: "anomaly", value: 2 },
          ],
          next: "main_menu",
        },
      ],
    },

    memo_confrontation: {
      id: "memo_confrontation",
      npcText:
        "（員工把他的記事本合上。）「那份文件不完整。有些規則您沒有看到。」（停頓。）「建議您回房間休息。」",
      choices: [
        {
          id: "confrontation_end",
          label: "（你無話可說。你的心跳得很快。你離開。）",
          effects: [
            { type: "sanity", value: -15 },
            { type: "world", key: "hotelRealityStability", value: -15 },
            { type: "anomaly", value: 2 },
            { type: "flag", key: "knewTooMuch", value: true },
          ],
          next: null,
        },
      ],
    },

    // ─── Previous Guest ──────────────────────────────────────────────────────
    previous_guest: {
      id: "previous_guest",
      npcText:
        "「本旅館不追蹤住客離店後的行蹤。」",
      choices: [
        {
          id: "guest_303",
          label: "「303號房的前任住客呢？」",
          effects: [{ type: "clue", value: "員工說不追蹤前任住客" }],
          next: "previous_guest_303",
        },
        {
          id: "guest_ok",
          label: "「好。」",
          effects: [{ type: "clue", value: "員工說不追蹤前任住客" }],
          next: "main_menu",
        },
      ],
    },

    previous_guest_303: {
      id: "previous_guest_303",
      npcText:
        "（員工停頓了很長時間。）「303……」（他看了一眼登記本，然後視線移開。）「那個房間最近沒有住客記錄。」（但你知道那張紙條在那裡。它是發黃的，它是舊的。）",
      choices: [
        {
          id: "guest_303_back",
          label: "（你沒有繼續說。）",
          effects: [
            { type: "sanity", value: -10 },
            { type: "anomaly", value: 2 },
            { type: "clue", value: "員工說303號房最近沒有住客記錄" },
          ],
          next: "main_menu",
        },
      ],
    },

    // ─── Badge Color ─────────────────────────────────────────────────────────
    badge_color: {
      id: "badge_color",
      npcText: (_p, _w, m) => {
        if (m.askedAboutBadgeBefore) {
          return "「我剛才已經解釋過了。」";
        }
        return "「名牌顏色代表員工等級，紅色是臨時人員，黑色是正式員工。」";
      },
      choices: [
        {
          id: "badge_when_changed",
          label: "「你的名牌什麼時候變成紅色的？」",
          setMemory: { askedAboutBadgeBefore: true },
          next: "badge_changed",
        },
        {
          id: "badge_temp_staff",
          label: "「所以你是臨時人員？」",
          setMemory: { askedAboutBadgeBefore: true },
          next: "badge_temp",
        },
        {
          id: "badge_thanks",
          label: "「好，謝謝。」",
          next: "main_menu",
        },
      ],
    },

    badge_changed: {
      id: "badge_changed",
      npcText:
        "（員工看了一眼自己的名牌。然後抬頭看著你。）「我……一直都是這個顏色。」",
      choices: [
        {
          id: "badge_changed_end",
          label: "（你說不出話。你走了。）",
          effects: [
            { type: "sanity", value: -15 },
            { type: "anomaly", value: 2 },
            { type: "clue", value: "員工說名牌一直是紅色的" },
          ],
          next: null,
        },
      ],
    },

    badge_temp: {
      id: "badge_temp",
      npcText:
        "「臨時人員是……補充性質的服務人員。」（員工沒有看你的眼睛。）「您還有其他問題嗎？」",
      choices: [
        {
          id: "badge_rule5_aware",
          label: "「規則說不能問你問題。我違反了規則。」",
          next: "rule5_awareness",
        },
        {
          id: "badge_temp_thanks",
          label: "「好，謝謝。」",
          effects: [{ type: "suspicion", value: 10 }],
          next: "main_menu",
        },
      ],
    },

    rule5_awareness: {
      id: "rule5_awareness",
      npcText:
        "（員工微笑了。微笑沒有到達他的眼睛。）「沒有關係。這次算例外。」",
      choices: [
        {
          id: "rule5_end",
          label: "（那個微笑讓你感到極度不安。你離開。）",
          effects: [
            { type: "sanity", value: -20 },
            { type: "anomaly", value: 3 },
            { type: "world", key: "anomalyAttention", value: 2 },
          ],
          next: null,
        },
      ],
    },
  },
};
