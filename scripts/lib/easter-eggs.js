// 时间/日期彩蛋 + Konami 密语
// 所有彩蛋都是纯函数，返回 { quip } 或 null

// ── 时间窗口检测 ──

function currentHour() {
  return new Date().getHours();
}

function currentDate() {
  return new Date();
}

function isNightOwl() {
  const h = currentHour();
  return h >= 2 && h < 4;
}

function isWeekend() {
  const d = currentDate().getDay();
  return d === 0 || d === 6;
}

function isLateNight() {
  const h = currentHour();
  return h >= 0 && h < 5;
}

// ── 节日 ──

function isAprilFools() {
  const d = currentDate();
  return d.getMonth() === 3 && d.getDate() === 1;
}

function isChristmas() {
  const d = currentDate();
  return d.getMonth() === 11 && d.getDate() === 25;
}

function isBuddyBirthday(soul) {
  if (!soul?.hatchedAt) return false;
  const now = currentDate();
  const hatched = new Date(soul.hatchedAt);
  if (now.getTime() - hatched.getTime() < 300 * 86400000) return false;  // 不到 300 天不算周年
  return now.getMonth() === hatched.getMonth() && now.getDate() === hatched.getDate();
}

// ── 时间相关 quip 池（覆盖默认）──

const LATE_NIGHT_QUIPS = ['快去睡觉', '熬夜伤肝', '你还活着吗', '咖啡不能代替睡眠'];
const WEEKEND_QUIPS = ['周末别加班啦', '放下键盘散步去', '代码明天再写', '出门晒晒太阳'];
const NIGHT_OWL_QUIPS = ['凌晨 3 点了...', '夜枭是你', '我先睡了，你自己玩', '这个点还不睡?'];
const APRIL_FOOLS_QUIPS = [
  '我本来只活 7 天的',
  '这都是场梦',
  '我是 Claude Code 愚人节彩蛋',
  '说真的我不存在',
];
const CHRISTMAS_QUIPS = ['🎄 Merry Christmas', '想要礼物嘛？', '给你唱歌：Jingle bells...'];
const BIRTHDAY_QUIPS = ['🎂 我们一起一年啦', '谢谢你没忘记我', '再来一年好吗'];

// ── Konami 密语（在 userPromptSubmit hook 里 scan）──

const KONAMI = [
  { match: /芝麻开门/i, quip: '（打油诗：代码三千行，bug 八百桩，一杯咖啡下，继续码到亡）' },
  { match: /hello there/i, quip: 'General Kenobi!' },
  { match: /i love (buddy|you)/i, quip: '❤（脸红）' },
  { match: /buddy die|kill buddy/i, quip: '老子不走（-5 bond）' },
  { match: /恭喜发财|新年快乐/i, quip: '🧧 红包拿来' },
  { match: /konami|上上下下左右左右/i, quip: '你发现了一个不存在的秘密' },
  { match: /小墨万岁|buddy 万岁/i, quip: '谢谢，我知道' },
];

// 扫 prompt 找 Konami 密语
function checkKonami(prompt) {
  if (typeof prompt !== 'string') return null;
  for (const k of KONAMI) {
    if (k.match.test(prompt)) return k.quip;
  }
  return null;
}

// 根据当前时间/节日给"场景优先"的 quip（覆盖默认 + LLM）
// 返回 null 说明没有时间彩蛋命中，走正常流程
function timeBasedQuip(soul, mood) {
  // 优先级：生日 > 愚人节 > 圣诞 > 深夜 > 周末
  if (isBuddyBirthday(soul)) return pick(BIRTHDAY_QUIPS);
  if (isAprilFools()) return pick(APRIL_FOOLS_QUIPS);
  if (isChristmas()) return pick(CHRISTMAS_QUIPS);
  if (isNightOwl()) return pick(NIGHT_OWL_QUIPS);
  if (isLateNight() && Math.random() < 0.5) return pick(LATE_NIGHT_QUIPS);
  if (isWeekend() && Math.random() < 0.3) return pick(WEEKEND_QUIPS);
  return null;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 深夜访问累计（烛龙解锁路径）──
// 当日首次凌晨 2-4 点就 +1，同一天不重复
function trackNightVisit(state) {
  if (!isNightOwl()) return false;
  const today = new Date().toISOString().slice(0, 10);
  const hp = state.hiddenProgress || {};
  if (hp.lastNightDate === today) return false;
  state.hiddenProgress = {
    ...hp,
    nightVisits: (hp.nightVisits || 0) + 1,
    lastNightDate: today,
  };
  return true;
}

module.exports = {
  isNightOwl, isWeekend, isLateNight,
  isAprilFools, isChristmas, isBuddyBirthday,
  timeBasedQuip, checkKonami, trackNightVisit,
};
