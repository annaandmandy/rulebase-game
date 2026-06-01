import { PlayerState, WorldState } from "@/types/game";

export type RuleEntry = {
  number: number;
  text: string;
  mutatedText?: string;
  corruptedText?: string;
};

export const BASE_RULES: RuleEntry[] = [
  {
    number: 1,
    text: "晚上十一點後，請勿打開窗戶。",
    mutatedText: "晚上十一點後，請勿打開窗戶。窗戶也請勿打開你。",
    corruptedText: "十一點後，請勿打開窗戶。若窗戶已打開，請假裝它沒有。",
  },
  {
    number: 2,
    text: "若有人敲門三次，請勿回應。",
    mutatedText: "若有人敲門三次，請勿回應。若你已回應，請假裝你沒有。若對方知道你已回應，本條規則不再適用。",
    corruptedText: "若有人敲門三次，請勿回應。若有人敲門兩次，也請勿回應。若有人敲門一次，請確認門已上鎖。",
  },
  {
    number: 3,
    text: "本旅館沒有地下室。",
    mutatedText: "本旅館目前沒有地下室。",
    corruptedText: "本旅館沒有地下室。若您發現地下室，請通知櫃檯。若地下室先發現了您，請勿通知櫃檯。",
  },
  {
    number: 4,
    text: "早餐於早上七點開始供應，請勿食用蛋類料理。",
    mutatedText: "早餐於早上七點開始供應，請勿食用蛋類料理。若已食用，請於下午兩點至三點回餐廳接受確認。",
    corruptedText: "早餐於早上七點開始供應，請勿食用蛋類料理。蛋類料理也請勿食用你。若兩者均已發生，請自行評估現況。",
  },
  {
    number: 5,
    text: "配戴紅色名牌者為臨時人員，請勿向其提問。",
    mutatedText: "配戴紅色名牌者為臨時人員，請勿向其提問。若其主動提問，請回答「我不知道」。若其知道你知道，請不要讓他看出來。",
    corruptedText: "配戴紅色名牌者為臨時人員，請勿向其提問。配戴黑色名牌者為正式員工。目前所有員工均配戴紅色名牌。",
  },
  {
    number: 6,
    text: "若電梯顯示 B2，請立刻按下 3 樓。",
    mutatedText: "若電梯顯示 B2，建議立刻按下 3 樓。",
    corruptedText: "若電梯顯示 B2，請立刻按下 3 樓。若電梯顯示其他不存在的樓層，請自行判斷。",
  },
  {
    number: 7,
    text: "若你看見另一位住客拿著你的房卡，請立即通知櫃檯。",
    mutatedText: "若你看見另一位住客拿著你的房卡，請立即通知櫃檯。若櫃檯人員也持有你的房卡，請返回房間，不要再出來。",
    corruptedText: "若你看見另一位住客拿著你的房卡，請立即通知櫃檯。若那位住客就是你，請重新確認你是誰。",
  },
  {
    number: 8,
    text: "若本須知出現第九條規則，請立刻停止閱讀。",
    mutatedText: "若本須知出現第九條規則，請立刻停止閱讀。你已閱讀太多了。",
    corruptedText: "若本須知出現第九條規則，請立刻停止閱讀。若你正在閱讀第九條，表示你沒有停止。若你已停止，你不會看到這個句子。",
  },
];

// Conditional rules that appear based on game state
export const CONDITIONAL_RULES: RuleEntry[] = [
  {
    number: 9,
    text: "如果你記得這間旅館，代表你已來過。請在離開前，將這份須知交給下一位住客。",
  },
  {
    // Appears when anomalyAttention >= 3 — sounds protective, is actually a countdown
    number: 10,
    text: "若走廊日光燈在凌晨後全部熄滅，請立即進入最近的房間並反鎖房門，等待燈光恢復。若燈光二十分鐘內未能恢復，本須知已不再適用於你。",
  },
  {
    // Appears when anomalyAttention >= 4 — TRAP RULE: lobby after midnight is not safe
    number: 11,
    text: "若您感到不安全，請立刻前往大廳。大廳全天二十四小時有人值班，請放心。",
  },
];

export const RULE_9 = CONDITIONAL_RULES[0];

export function getRules(
  player: PlayerState,
  world: WorldState
): RuleEntry[] {
  const version = world.ruleNoticeVersion;
  const anomaly = world.anomalyAttention;

  const rules = BASE_RULES.map((rule) => {
    if (version >= 3 && rule.corruptedText) {
      return { ...rule, text: rule.corruptedText };
    }
    if (version >= 2 && rule.mutatedText) {
      return { ...rule, text: rule.mutatedText };
    }
    return rule;
  });

  // Rule 10: appears when things get strange enough
  if (anomaly >= 3) {
    rules.push(CONDITIONAL_RULES[1]);
  }

  // Rule 11: trap rule, appears when player might be desperate
  if (anomaly >= 4) {
    rules.push(CONDITIONAL_RULES[2]);
  }

  // Rule 9: the hidden one
  if (player.hasReadExtraRule || version >= 3) {
    rules.push(RULE_9);
  }

  return rules;
}
