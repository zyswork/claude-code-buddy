// 稀有度、物种、帽子、眼睛、属性的所有常量
// 数据结构对齐泄露源码 src/buddy/types.ts，但全部改成普通 JS

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

const RARITY_STARS = {
  common: '★',
  uncommon: '★★',
  rare: '★★★',
  epic: '★★★★',
  legendary: '★★★★★',
};

// ANSI 终端色号
const RARITY_COLORS = {
  common: '\x1b[90m',      // 暗灰
  uncommon: '\x1b[32m',    // 绿
  rare: '\x1b[36m',        // 青
  epic: '\x1b[35m',        // 紫
  legendary: '\x1b[33m',   // 黄金
};

const RARITY_FLOOR = {
  common: 5,
  uncommon: 15,
  rare: 25,
  epic: 35,
  legendary: 50,
};

// 18 种物种，跟原版一致；可以在这里增删换成中国神兽
const SPECIES = [
  'duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl',
  'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara',
  'cactus', 'robot', 'rabbit', 'mushroom', 'chonk',
];

const EYES = ['·', '✦', '×', '◉', '@', '°'];

const HATS = [
  'none', 'crown', 'tophat', 'propeller', 'halo',
  'wizard', 'beanie', 'tinyduck',
];

const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'];

// 中文属性名（展示用）
const STAT_NAMES_CN = {
  DEBUGGING: '调试力',
  PATIENCE: '耐心值',
  CHAOS: '混沌值',
  WISDOM: '智慧点',
  SNARK: '毒舌度',
};

// 重置盐（salt）会让所有用户重抽一次——相当于开新赛季
const SALT = 'friend-2026-401';

const RESET_COLOR = '\x1b[0m';
const BOLD = '\x1b[1m';

module.exports = {
  RARITIES,
  RARITY_WEIGHTS,
  RARITY_STARS,
  RARITY_COLORS,
  RARITY_FLOOR,
  SPECIES,
  EYES,
  HATS,
  STAT_NAMES,
  STAT_NAMES_CN,
  SALT,
  RESET_COLOR,
  BOLD,
};
