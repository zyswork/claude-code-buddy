// 骨骼投骰系统：从 userId 确定性地算出稀有度/物种/帽子/眼睛/属性
// 完全对齐泄露源 src/buddy/companion.ts 的算法

const {
  RARITIES, RARITY_WEIGHTS, RARITY_FLOOR,
  SPECIES, EYES, HATS, STAT_NAMES, SALT,
} = require('./types.js');

// Mulberry32 — 小型种子 PRNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a 32-bit hash（对齐泄露源 fallback 实现）
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function rollRarity(rng) {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (const rarity of RARITIES) {
    roll -= RARITY_WEIGHTS[rarity];
    if (roll < 0) return rarity;
  }
  return 'common';
}

function rollStats(rng, rarity) {
  const floor = RARITY_FLOOR[rarity];
  const peak = pick(rng, STAT_NAMES);
  let dump = pick(rng, STAT_NAMES);
  while (dump === peak) dump = pick(rng, STAT_NAMES);

  const stats = {};
  for (const name of STAT_NAMES) {
    if (name === peak) {
      stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30));
    } else if (name === dump) {
      stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15));
    } else {
      stats[name] = floor + Math.floor(rng() * 40);
    }
  }
  return stats;
}

function rollFrom(rng) {
  const rarity = rollRarity(rng);
  return {
    rarity,
    species: pick(rng, SPECIES),
    eye: pick(rng, EYES),
    hat: rarity === 'common' ? 'none' : pick(rng, HATS),
    shiny: rng() < 0.01,
    stats: rollStats(rng, rarity),
  };
}

// 主入口：给 userId，算出骨骼
// 同一 userId + 同一 SALT + 同一算法 → 永远同一结果
function roll(userId) {
  const seed = hashString(userId + SALT);
  return rollFrom(mulberry32(seed));
}

// 从本地 Claude 全局配置里读 userId
function companionUserId() {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  try {
    const configPath = path.join(os.homedir(), '.claude.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return cfg.oauthAccount?.accountUuid ?? cfg.userID ?? 'anon';
    }
  } catch (_e) { /* 读不到就用 anon */ }
  return 'anon';
}

module.exports = { roll, hashString, mulberry32, companionUserId };
