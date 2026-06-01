import { GameEvent } from "@/types/game";

export const CHECKIN_EVENT: GameEvent = {
  id: "checkin",
  title: "入住",
  trigger: () => false,
  description:
    "深夜，山中，霧。\n\n你不記得自己為什麼在這裡。\n\n旅館的燈光從霧中透出來，帶著某種讓人安心的昏黃。你走進大廳，辦理入住。員工遞給你一份「住客安全須知」和一張 304 號房的房卡，全程沒有說話。\n\n現在是晚上 21:43。",
  choices: [
    {
      id: "checkin_read",
      label: "仔細閱讀安全須知",
      resultText:
        "你仔細閱讀了每一條規則。有些規則讓你感到不安，但你說不清楚是哪條。你把須知折好放進口袋。",
      effects: [
        { type: "time", value: 10 },
        { type: "flag", key: "hasRoomKey", value: true },
        { type: "clue", value: "閱讀了完整的住客安全須知" },
      ],
      nextLocation: "lobby",
    },
    {
      id: "checkin_skip",
      label: "把須知放進口袋，先去房間",
      resultText:
        "你把須知折好放進口袋，拿起房卡，走向電梯。員工沒有說話。旅館很安靜。",
      effects: [
        { type: "time", value: 5 },
        { type: "flag", key: "hasRoomKey", value: true },
      ],
      nextLocation: "elevator",
    },
  ],
  once: true,
};
