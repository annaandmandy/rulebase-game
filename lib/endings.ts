import { GameEnding, PlayerState, WorldState } from "@/types/game";

// Game starts at 21:43 = 1303 minutes. Midnight = 1440. Next morning 7 AM = 1860.
const NEXT_MORNING_5AM = 24 * 60 + 5 * 60;  // 1740
const NEXT_MORNING_7AM = 24 * 60 + 7 * 60;  // 1860
const NEXT_MORNING_730 = 24 * 60 + 7 * 60 + 30; // 1890
const NEXT_MORNING_8AM = 24 * 60 + 8 * 60;  // 1920

export const ENDINGS: GameEnding[] = [
  {
    id: "C",
    title: "臨時員工",
    text: "你走出 B2 的電梯時，已經不記得你進去的時候看到了什麼。\n\n你手上有一個紅色名牌。名牌上是你的名字，下面寫著「臨時人員」。\n\n你站在大廳，等著下一個住客進來。\n\n你覺得你已經在這裡等了很久了。\n\n你不記得你什麼時候開始等的。",
    condition: (player) => player.enteredBasement,
  },
  {
    id: "B",
    title: "304 已入住",
    text: "你回到 304 號房，用房卡打開門。\n\n床上躺著一個人。\n\n你走近一點，那個人的輪廓、頭髮、呼吸的方式——和你一模一樣。\n\n你站在那裡很久，不知道你應該做什麼。\n\n後來你把房卡放在桌上，輕輕把門關上。\n\n你走到大廳，在沙發上坐下，等天亮。\n\n天沒有亮。",
    condition: (player, world) =>
      world.room304State === "occupied_by_self" &&
      player.timeMinutes >= NEXT_MORNING_5AM &&
      !player.enteredBasement,
  },
  {
    id: "hidden",
    title: "第九條規則",
    text: "你在退房的時候，把住客安全須知放在床頭。\n\n員工沒有問你為什麼。\n\n你走出旅館，霧散了一點，你看見遠處的山。\n\n你上了車，看著旅館的招牌：山霧旅館。\n\n你把收據放進口袋，準備離開。\n\n然後你低頭看了一眼收據。\n\n退房日期：明天。\n\n你抬起頭，旅館還在那裡，燈還亮著。\n\n你不確定你是否真的退房了。\n\n——\n\n大約一個小時後，你拿起手機。\n\n你想不起來你去那間旅館之前在做什麼。\n\n你想不起來你是怎麼認識那間旅館的。\n\n但你記得那份規則。\n\n第一條。第二條。第三條……\n\n你全都記得。\n\n你把規則背了一遍，確認沒有錯，然後繼續開車。\n\n你不知道你要去哪裡。",
    condition: (player) =>
      player.hasReadExtraRule &&
      player.timeMinutes >= NEXT_MORNING_7AM &&
      player.sanity <= 30,
  },
  {
    id: "D",
    title: "假清晨",
    text: "你撐到了早餐時間。\n\n你在餐廳吃了土司，喝了稀飯。炒蛋你沒有動。\n\n窗外開始有光。\n\n你想，天亮了。你可以退房了。\n\n但光停在某個角度，沒有繼續升高。\n\n你等了半小時，光沒有變。\n\n你去問員工：「現在幾點了？」\n\n員工看著你說：「早上七點十五分。」\n\n你看著窗外。光還在那個角度。\n\n「太陽呢？」你問。\n\n員工低頭去看文件，沒有回答你。",
    condition: (player, world) =>
      player.timeMinutes >= NEXT_MORNING_730 &&
      !player.ateEggs &&
      !player.enteredBasement &&
      world.hotelRealityStability <= 40,
  },
  {
    id: "A",
    title: "平安退房",
    text: "早晨。\n\n你帶著行李走到大廳，辦理退房。\n\n員工給了你一張收據。\n\n你走出旅館，霧散了一點，你看見遠處的山。\n\n你上了車，看著旅館的招牌：山霧旅館。\n\n你把收據放進口袋，準備離開。\n\n然後你低頭看了一眼收據。\n\n退房日期：明天。\n\n你抬起頭，旅館還在那裡，燈還亮著。\n\n你不確定你是否真的退房了。",
    condition: (player) =>
      player.timeMinutes >= NEXT_MORNING_7AM &&
      player.sanity > 30 &&
      !player.enteredBasement,
  },
];

export function checkEnding(
  player: PlayerState,
  world: WorldState,
  forcedEnding?: string
): GameEnding | null {
  if (forcedEnding) {
    const forced = ENDINGS.find((e) => e.id === forcedEnding);
    if (forced) return forced;
  }

  for (const ending of ENDINGS) {
    if (ending.condition(player, world)) {
      return ending;
    }
  }

  // Hard cutoff: if somehow we reach 8 AM with nothing triggered
  if (player.timeMinutes >= NEXT_MORNING_8AM) {
    return ENDINGS.find((e) => e.id === "A") || null;
  }

  return null;
}
