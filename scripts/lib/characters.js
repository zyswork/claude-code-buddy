// 角色注册表 —— 把 18 个物种升级为带 emoji + 中文名 + 池分组的完整对象
// 后续隐藏角色 / 神话角色 也加在这里
// sprite 数据仍然来自 sprites.js；本文件只管元数据

const { SPECIES } = require('./types.js');

// 池分类：
//   starter  初始池（18 原生萌物）
//   spirit   精怪池（半妖半兽）
//   beast    灵兽池（远古灵兽）
//   divine   神兽池（高等神兽）
//   myth     传说池（神话级）
//   secret   神话池（meta 彩蛋，图鉴不显示）
const POOLS = ['starter', 'spirit', 'beast', 'divine', 'myth', 'secret'];

const POOL_LABELS = {
  starter: '初始',
  spirit: '精怪',
  beast: '灵兽',
  divine: '神兽',
  myth: '传说',
  secret: '神话',
};

// 18 个原生物种 —— 全归 starter 池，都是随 userId 投骰可能命中的候选
const CHARACTERS = {
  rabbit:   { id: 'rabbit',   nameCn: '兔精',     emoji: '🐰', pool: 'starter', unlockHint: null },
  duck:     { id: 'duck',     nameCn: '小鸭',     emoji: '🦆', pool: 'starter', unlockHint: null },
  goose:    { id: 'goose',    nameCn: '大鹅',     emoji: '🪿', pool: 'starter', unlockHint: null, emojiFallback: '🦆' },
  blob:     { id: 'blob',     nameCn: '团子',     emoji: '🫧', pool: 'starter', unlockHint: null },
  cat:      { id: 'cat',      nameCn: '猫咪',     emoji: '🐈', pool: 'starter', unlockHint: null },
  dragon:   { id: 'dragon',   nameCn: '小火龙',   emoji: '🐉', pool: 'starter', unlockHint: null },
  octopus:  { id: 'octopus',  nameCn: '章小鱼',   emoji: '🐙', pool: 'starter', unlockHint: null },
  owl:      { id: 'owl',      nameCn: '猫头鹰',   emoji: '🦉', pool: 'starter', unlockHint: null },
  penguin:  { id: 'penguin',  nameCn: '小企鹅',   emoji: '🐧', pool: 'starter', unlockHint: null },
  turtle:   { id: 'turtle',   nameCn: '石龟精',   emoji: '🐢', pool: 'starter', unlockHint: null },
  snail:    { id: 'snail',    nameCn: '小蜗牛',   emoji: '🐌', pool: 'starter', unlockHint: null },
  ghost:    { id: 'ghost',    nameCn: '小魅影',   emoji: '👻', pool: 'starter', unlockHint: null },
  axolotl:  { id: 'axolotl',  nameCn: '六角恐龙', emoji: '🦎', pool: 'starter', unlockHint: null },
  capybara: { id: 'capybara', nameCn: '水豚',     emoji: '🦫', pool: 'starter', unlockHint: null },
  cactus:   { id: 'cactus',   nameCn: '仙人掌',   emoji: '🌵', pool: 'starter', unlockHint: null },
  robot:    { id: 'robot',    nameCn: '机器人',   emoji: '🤖', pool: 'starter', unlockHint: null },
  mushroom: { id: 'mushroom', nameCn: '蘑菇精',   emoji: '🍄', pool: 'starter', unlockHint: null },
  chonk:    { id: 'chonk',    nameCn: '胖胖',     emoji: '🐻', pool: 'starter', unlockHint: null },

  // ─── 精怪池（解锁条件明示）───
  jingwei: {
    id: 'jingwei', nameCn: '精卫', emoji: '🐦‍⬛', pool: 'spirit',
    unlockHint: '目睹 50 次 bug 修复',
  },
  taotie: {
    id: 'taotie', nameCn: '饕餮', emoji: '🥟', pool: 'spirit',
    unlockHint: '累计被摸 50 次',
  },

  // ─── 神兽池（条件暗示）───
  yinglong: {
    id: 'yinglong', nameCn: '应龙', emoji: '🐲', pool: 'divine',
    unlockHint: '目睹 100 次 git commit',
  },

  // ─── 传说池（条件模糊）───
  zhulong: {
    id: 'zhulong', nameCn: '烛龙', emoji: '🌑', pool: 'myth',
    unlockHint: '深夜（凌晨）造访 3 次',
  },

  // ─── 稀有型（完全隐藏，图鉴里只显示 ???）───
  daji: {
    id: 'daji', nameCn: '妲己', emoji: '🦊', pool: 'myth',
    unlockHint: null,   // 不提示，保持神秘
    hidden: true,
  },
};

function getCharacter(id) {
  return CHARACTERS[id];
}

function listByPool(pool) {
  return Object.values(CHARACTERS).filter((c) => c.pool === pool);
}

function allCharacters() {
  return Object.values(CHARACTERS);
}

// 一个 character 是否当前解锁：starter 池永远解锁；其他池看 state.unlocks 数组
function isUnlocked(character, state) {
  if (!character) return false;
  if (character.pool === 'starter') return true;
  const unlocks = state?.unlocks || [];
  return unlocks.includes(character.id);
}

// 当前形态：优先 state.form，否则回退到 bones.species（原投骰得到的）
function currentFormId(state, bonesSpecies) {
  if (state?.form && CHARACTERS[state.form]) return state.form;
  return bonesSpecies;
}

module.exports = {
  POOLS,
  POOL_LABELS,
  CHARACTERS,
  getCharacter,
  listByPool,
  allCharacters,
  isUnlocked,
  currentFormId,
};
