export type RuleEntry = {
  number: number;
  text: string;
  mutatedText?: string;
};

export const BASE_RULES: RuleEntry[] = [
  {
    number: 1,
    text: "晚上十一點後，請勿打開窗戶。",
    mutatedText: "晚上十一點後，請勿打開窗戶。窗戶也請勿打開你。",
  },
  {
    number: 2,
    text: "若有人敲門三次，請勿回應。",
    mutatedText: "若有人敲門三次，請勿回應。若你已回應，請假裝沒有。",
  },
  {
    number: 3,
    text: "本旅館沒有地下室。",
    mutatedText: "本旅館目前沒有地下室。",
  },
  {
    number: 4,
    text: "早餐於早上七點開始供應，請勿食用蛋類料理。",
    mutatedText: "早餐於早上七點開始供應，請勿食用蛋類料理。蛋類料理也請勿食用你。",
  },
  {
    number: 5,
    text: "配戴紅色名牌者為臨時人員，請勿向其提問。",
    mutatedText: "配戴紅色名牌者為臨時人員，請勿向其提問。若其主動提問，請回答「我不知道」。",
  },
  {
    number: 6,
    text: "若電梯顯示 B2，請立刻按下 3 樓。",
    mutatedText: "若電梯顯示 B2，建議立刻按下 3 樓。",
  },
  {
    number: 7,
    text: "若你看見另一位住客拿著你的房卡，請立即通知櫃檯。",
    mutatedText: "若你看見另一位住客拿著你的房卡，請立即通知櫃檯。若櫃檯人員也持有你的房卡，請返回房間。",
  },
  {
    number: 8,
    text: "若本須知出現第九條規則，請立刻停止閱讀。",
    mutatedText: "若本須知出現第九條規則，請立刻停止閱讀。你已閱讀太多了。",
  },
];

export const RULE_9: RuleEntry = {
  number: 9,
  text: "如果你記得這間旅館，代表你已來過。請在離開前，將這份須知交給下一位住客。",
};

export function getRules(version: number, hasReadExtra: boolean): RuleEntry[] {
  const rules = BASE_RULES.map((rule) => {
    if (version >= 2 && rule.mutatedText) {
      return { ...rule, text: rule.mutatedText };
    }
    return rule;
  });

  if (hasReadExtra || version >= 3) {
    rules.push(RULE_9);
  }

  return rules;
}
