import type { PlayerState, WorldState, GameEnding } from '@/types/game';

// 取得已觸發事件清單（容錯：可能掛在 player 或 world 上）
function getTriggeredEvents(player: PlayerState, world: WorldState): string[] {
  const p = player as unknown as { triggeredEvents?: string[] };
  const w = world as unknown as { triggeredEvents?: string[] };
  return p.triggeredEvents ?? w.triggeredEvents ?? [];
}

type ScenarioEnding = GameEnding & {
  condition: (player: PlayerState, world: WorldState) => boolean;
};

export const SCENARIO_ENDINGS: ScenarioEnding[] = [
  {
    id: 'ending_never_registered',
    title: '從未掛號的人',
    text: '你把那疊還沒乾的墨水扔進碎紙機，看著自己的名字被切成無法辨認的細絲。交班廣播第三次響起時，你沒有躺回那張床，而是站在病歷室冰冷的鐵櫃之間，聽著走廊上拖鞋的聲音一間一間地核對過去——然後在你這一格停了下來，遲疑，又走開了。\n\n他們找不到你的資料。沒有手環、沒有體溫、沒有問診表，沒有任何一張你簽過名的同意書。系統判定你從未抵達。\n\n天亮時玻璃門無聲地開了，沒有人攔你，因為攔阻需要一份檔案來記錄這件事，而你不存在於任何檔案裡。你走出去，晨光很正常，街道很正常，公車也準時。\n\n只是接下來的每一天，當你掛號、刷健保卡、填任何一張表，櫃台後的人都會抬頭看你比應該的時間久一點點。\n\n你開始懷疑，被判定為「從未存在」的人，到底還能不能算是回來了。',
    condition: (player, world) => {
      const triggeredEvents = getTriggeredEvents(player, world);
      const p = player as unknown as Record<string, unknown>;
      return (
        player.foundSheets.includes('doc_records_label') &&
        triggeredEvents.includes('event_records_room') &&
        triggeredEvents.includes('event_handover_broadcast') &&
        p.voidedRecords === true &&
        p.woreWristband !== true &&
        p.filledHistoryForm !== true &&
        p.returnedToBedAtBroadcast !== true
      );
    },
  },
  {
    id: 'ending_escape_stairs',
    title: '上行燈亮的那一次',
    text: '廣播說「交班時間」，你卻往後棟跑。樓梯間的感應燈一階一階在你腳前亮起——上行的燈亮了，這代表你已不再被視為留觀病患。前任的字跡是對的：勿回頭。\n\n你沒有回頭。身後傳來廣播裡那句平靜的核對聲，一個一個床號，唸到你的時候停頓了異常久，像在等一個不會躺下的答案。\n\n你爬過七樓、八樓，樓層牌上的數字開始重複，但燈始終為你而亮，所以你繼續爬。終於有一扇門通往屋頂，外面是清晨的天空，冷而真實。\n\n你得救了。\n\n只是當你低頭，想確認手腕上沒有手環時，你發現自己根本不記得有沒有戴過——你不記得昨晚是怎麼來的，不記得自己為什麼住院，甚至不太確定自己原本的名字。\n\n燈一路為你亮著，把你帶離了那份名冊。\n\n但它從來沒有告訴你，它把你帶去了哪一份。',
    condition: (player, world) => {
      const triggeredEvents = getTriggeredEvents(player, world);
      const p = player as unknown as Record<string, unknown>;
      return (
        triggeredEvents.includes('event_handover_broadcast') &&
        p.fledUpstairs === true &&
        p.returnedToBedAtBroadcast !== true
      );
    },
  },
  {
    id: 'ending_filed',
    title: '正式收治',
    text: '你做了一個乖病人該做的每一件事。你量了體溫，戴上手環，把病史表上的每一個空格都工整地填好，連家族病史那欄都誠實作答。廣播響起時，你準時躺回床位，雙手放在棉被上，等待核對。\n\n拖鞋聲在床尾停下。有人輕聲唸出你的名字、你的床號、你的入院時間，然後在某張表上打了一個勾。\n\n「核對完成。」\n\n你鬆了一口氣，以為這代表可以出院了。護理師微笑著替你調整枕頭，說早上醫師查房後就會安排。你閉上眼，覺得這一夜總算結束。\n\n等你再睜開眼，窗外是另一個白天，手環換成了新的顏色，床頭的牌子多了一行字：長期留觀。你問護理師什麼時候能走，她還是那個溫柔的笑：「您剛入院喔，先好好休息。」\n\n你想說你已經住很久了。\n\n可是你發現，你已經想不起來「很久」之前，是什麼樣子。',
    condition: (player, world) => {
      const triggeredEvents = getTriggeredEvents(player, world);
      const p = player as unknown as Record<string, unknown>;
      return (
        triggeredEvents.includes('event_handover_broadcast') &&
        p.filledHistoryForm === true &&
        p.returnedToBedAtBroadcast === true &&
        p.voidedRecords !== true
      );
    },
  },
  {
    id: 'ending_nurse_replacement',
    title: '下一班的她',
    text: '你選擇相信她。她替你戴好手環，幫你把病史表一欄一欄填妥，陪你走過每一道你原本害怕的程序。她真的很盡責，盡責到你幾乎沒注意到，她從不曾離開這層樓，也從不曾有人來替她交班。\n\n黎明的廣播響起時，她握住你的手，說：「都辦好了，接下來換你了。」\n\n你不懂這句話的意思，直到你看見她的身影在晨光裡變得越來越淡，像一張被歸檔太久而褪色的照片。她對你笑，那笑容裡有一種終於可以休息的、深深的疲憊。\n\n「謝謝你，」她說，「我等這一班，等了好久。」\n\n她走了。真的走了，走進那扇你始終打不開的玻璃門。\n\n而你低頭，發現自己手上多了一件燙得筆挺的制服，胸前的名牌還沒有名字。\n\n走廊深處，新的拖鞋聲正一步一步靠近。\n\n你聽見自己用一種溫柔的、訓練有素的聲音對那個方向開口：「別怕，我來協助您完成留觀程序。」',
    condition: (player, world) => {
      const triggeredEvents = getTriggeredEvents(player, world);
      const p = player as unknown as Record<string, unknown>;
      return (
        triggeredEvents.includes('event_nurse_help') &&
        p.acceptedNurseHelp === true &&
        p.woreWristband === true &&
        p.voidedRecords !== true
      );
    },
  },
  {
    id: 'ending_two_yous',
    title: '名冊上保留一份',
    text: '廣播唸到「交班時間」，你既沒有乖乖躺回床上，也沒有往樓上逃。你只是站在走廊正中央，看著兩個方向，遲遲沒有選。\n\n核對的拖鞋聲走近了。一個聲音在你的床號前停下，翻著名冊，皺起眉。\n\n「這一床……怎麼有兩筆資料？」\n\n另一個聲音回答得很慢：「一筆已躺回、一筆未就定位。系統不允許同一人同時開啟與結束。」\n\n「那就保留一份。」\n\n你想開口說那都是你，只有一個你——可是話還沒出口，你忽然分不清此刻站在走廊上的，究竟是「躺回床上的那個」，還是「沒有躺回的那個」。\n\n天亮了。其中一個你被推著輪椅送進長期病房，另一個你走出了玻璃門。\n\n你不知道自己是哪一個。\n\n你只知道，那本名冊上，永遠為你保留著另一份——隨時等你回來，認領那個沒被選走的自己。',
    condition: (player, world) => {
      const triggeredEvents = getTriggeredEvents(player, world);
      const p = player as unknown as Record<string, unknown>;
      return (
        triggeredEvents.includes('event_handover_broadcast') &&
        p.returnedToBedAtBroadcast !== true &&
        p.fledUpstairs !== true
      );
    },
  },
  {
    id: 'ending_flatline',
    title: '比你更久的波形',
    text: '你受夠了那台機器。它的嗶聲像一根針，一下一下扎進你的太陽穴，於是你伸手扯掉了導線——須知第二條明明說，任何時刻監視器都不應顯示為一直線。\n\n你以為螢幕會變成那條平直的線。\n\n它沒有。\n\n導線已經離開你的身體，貼片捲在床欄上，可是螢幕上的波形依然規律地跳動著，一下、一下，平穩而健康，彷彿那顆心臟根本不在你的胸口，而在別的地方，獨立地、持續地活著。\n\n你按住自己的胸口，感覺不到任何節律。你不敢確定那是因為你太緊張，還是因為——\n\n護理師走進來，看了一眼螢幕，神色比看你還要溫柔。她在表上記下一行字：「徵象穩定，可長期留觀。」\n\n你想告訴她線是你拔的，那波形不是你的。\n\n但她只是輕輕拍拍床沿，看著那條跳動的線，像在看一個比你更早住進來、也會比你留得更久的病人。\n\n「它很乖，」她說，「從來不吵著要走。」',
    condition: (player, world) => {
      const triggeredEvents = getTriggeredEvents(player, world);
      const p = player as unknown as Record<string, unknown>;
      return (
        triggeredEvents.includes('event_monitor_check') &&
        p.pulledMonitorLine === true
      );
    },
  },
];

export function checkScenarioEnding(
  player: PlayerState,
  world: WorldState,
  forcedId?: string
): GameEnding | null {
  if (forcedId) {
    const forced = SCENARIO_ENDINGS.find((e) => e.id === forcedId);
    if (forced) {
      return forced;
    }
    return null;
  }

  for (const ending of SCENARIO_ENDINGS) {
    if (ending.condition(player, world)) {
      return ending;
    }
  }

  return null;
}
