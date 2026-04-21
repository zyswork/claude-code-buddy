// 季节/节日皮肤：按本地日期返回一行 sprite 装饰（12 宽）
// 用于覆盖 sprite 第 0 行（hat 槽位）；如果当天没节日就返回 null

function pad12(s) {
  const len = [...s].length;
  if (len >= 12) return s.slice(0, 12);
  const left = Math.floor((12 - len) / 2);
  const right = 12 - len - left;
  return ' '.repeat(left) + s + ' '.repeat(right);
}

// 节日配置：优先级从高到低，第一个命中就用
const OCCASIONS = [
  {
    id: 'newyear',
    label: '春节',
    decor: pad12('🧧福🧧'),
    match: (m, d) => (m === 0 && d >= 20) || (m === 1 && d <= 20), // 1/20 - 2/20 粗略范围
  },
  {
    id: 'aprilfool',
    label: '愚人节',
    decor: pad12('>_<'),
    match: (m, d) => m === 3 && d === 1,
  },
  {
    id: 'labor',
    label: '劳动节',
    decor: pad12('⚒⚒⚒'),
    match: (m, d) => m === 4 && d >= 1 && d <= 5,
  },
  {
    id: 'dragon_boat',
    label: '端午',
    decor: pad12('🍣 粽 🍣'),   // 凑合
    match: (m, d) => m === 5 && d >= 10 && d <= 25, // 粗略
  },
  {
    id: 'valentine',
    label: '情人节',
    decor: pad12('♥ ♥ ♥'),
    match: (m, d) => m === 1 && d === 14,
  },
  {
    id: 'mid_autumn',
    label: '中秋',
    decor: pad12('🌕月饼🌕'),
    match: (m, d) => m === 8 && d >= 15 && d <= 20,
  },
  {
    id: 'national',
    label: '国庆',
    decor: pad12('★ 国庆 ★'),
    match: (m, d) => m === 9 && d >= 1 && d <= 7,
  },
  {
    id: 'halloween',
    label: '万圣夜',
    decor: pad12('🎃 🦇 🎃'),
    match: (m, d) => m === 9 && d >= 24 && d <= 31,
  },
  {
    id: 'christmas',
    label: '圣诞',
    decor: pad12('🎄 ❄ 🎄'),
    match: (m, d) => m === 11 && d >= 20 && d <= 26,
  },
  {
    id: 'newyear_eve',
    label: '跨年',
    decor: pad12('★ 新年 ★'),
    match: (m, d) => m === 11 && d >= 27 && d <= 31,
  },
];

function currentOccasion(now = new Date()) {
  const m = now.getMonth();
  const d = now.getDate();
  for (const o of OCCASIONS) {
    if (o.match(m, d)) return o;
  }
  return null;
}

module.exports = { currentOccasion, OCCASIONS };
