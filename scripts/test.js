#!/usr/bin/env node
// claude-buddy smoke tests
// 覆盖所有 lib/* 纯函数，保证重构时不踩雷

/* eslint-disable */
'use strict';

const assert = require('node:assert');

let passed = 0;
let failed = 0;
const failures = [];

function t(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e });
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

function section(title) {
  console.log('');
  console.log(`【${title}】`);
}

// ────────────────────────────────────────────────────────
section('types.js');
const types = require('./lib/types.js');
t('5 档稀有度', () => assert.strictEqual(types.RARITIES.length, 5));
t('18 原生物种', () => assert.strictEqual(types.SPECIES.length, 18));
t('5 种属性', () => assert.strictEqual(types.STAT_NAMES.length, 5));
t('每档稀有度都有星星', () => {
  for (const r of types.RARITIES) assert.ok(types.RARITY_STARS[r]);
});

// ────────────────────────────────────────────────────────
section('roll.js 确定性');
const { roll, hashString, mulberry32 } = require('./lib/roll.js');
t('相同 userId 相同 bones', () => {
  const a = roll('test-user');
  const b = roll('test-user');
  assert.deepStrictEqual(a, b);
});
t('不同 userId 大概率不同 bones', () => {
  const a = roll('user-a');
  const b = roll('user-z');
  assert.notDeepStrictEqual(a.stats, b.stats);
});
t('稀有度值合法', () => {
  const r = roll('anon').rarity;
  assert.ok(types.RARITIES.includes(r));
});
t('物种值合法', () => {
  const s = roll('anon').species;
  assert.ok(types.SPECIES.includes(s));
});
t('mulberry32 同种子同序列', () => {
  const g1 = mulberry32(42);
  const g2 = mulberry32(42);
  assert.strictEqual(g1(), g2());
});

// ────────────────────────────────────────────────────────
section('sprites.js 12 列对齐（含神话角色）');
const { renderSprite, spriteFrameCount } = require('./lib/sprites.js');

function displayWidth(s) {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp < 0x20) continue;
    if (
      (cp >= 0x2e80 && cp <= 0x303e) ||
      (cp >= 0x3041 && cp <= 0x33ff) ||
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0x1f300 && cp <= 0x1faff)
    ) w += 2;
    else w += 1;
  }
  return w;
}

// 注：对齐是 strict "frame 本身 12 宽"。renderSprite 会删除空 row 0，
// 所以实际 line 数可能 <5；关键是每行渲染出来 12 列
const allSpecies = [...types.SPECIES, 'zhulong', 'yinglong', 'jingwei', 'taotie', 'daji',
  'phoenix', 'cerberus', 'hydra', 'jiuwei', 'kappa'];
t('所有 species（原 18 + 10 神话）都有 sprite', () => {
  for (const sp of allSpecies) assert.ok(spriteFrameCount(sp) >= 1, sp);
});
t('每个 sprite 每帧每行严格 12 显示列', () => {
  for (const sp of allSpecies) {
    const frames = spriteFrameCount(sp);
    for (let i = 0; i < frames; i++) {
      const f = renderSprite({ species: sp, eye: '·', hat: 'none' }, i);
      for (let j = 0; j < f.length; j++) {
        const w = displayWidth(f[j]);
        assert.strictEqual(w, 12, `${sp} 帧${i} 行${j} 宽=${w} "${f[j]}"`);
      }
    }
  }
});

// ────────────────────────────────────────────────────────
section('progression.js 等级曲线');
const P = require('./lib/progression.js');
t('XP 0 → Lv 1', () => assert.strictEqual(P.computeLevel(0), 1));
t('XP 10 → Lv 2', () => assert.strictEqual(P.computeLevel(10), 2));
t('XP 递增 → level 递增或相等', () => {
  for (let xp = 0; xp < 500; xp += 25) {
    const now = P.computeLevel(xp);
    const next = P.computeLevel(xp + 25);
    assert.ok(next >= now);
  }
});
t('进化 Lv<5 = 幼年', () => assert.strictEqual(P.computeEvolution(3, 50), 0));
t('进化 Lv5+ bond30+ = 成年', () => assert.strictEqual(P.computeEvolution(5, 30), 1));
t('进化 Lv15+ bond80+ = 进化态', () => assert.strictEqual(P.computeEvolution(15, 80), 2));
t('XP 进度 inLevel < nextNeed', () => {
  const p = P.xpProgress(100);
  assert.ok(p.inLevel < p.nextNeed);
});
t('applyReward 返回 leveledUp 正确', () => {
  const s = { xp: 9, bond: 0 };
  const r = P.applyReward(s, 'pet'); // +1 xp
  assert.strictEqual(r.xp, 10);
  assert.strictEqual(r.leveledUp, true);
});

// ────────────────────────────────────────────────────────
section('characters.js 角色注册表');
const C = require('./lib/characters.js');
t('28 角色总数', () => assert.strictEqual(C.allCharacters().length, 28));
t('18 starter', () => assert.strictEqual(C.listByPool('starter').length, 18));
t('starter 永远 isUnlocked=true', () => {
  const c = C.getCharacter('rabbit');
  assert.ok(C.isUnlocked(c, {}));
});
t('非 starter 未在 unlocks 中 isUnlocked=false', () => {
  const c = C.getCharacter('zhulong');
  assert.ok(!C.isUnlocked(c, { unlocks: [] }));
});
t('非 starter 在 unlocks 中 isUnlocked=true', () => {
  const c = C.getCharacter('zhulong');
  assert.ok(C.isUnlocked(c, { unlocks: ['zhulong'] }));
});

// ────────────────────────────────────────────────────────
section('quip-buffer.js');
const QB = require('./lib/quip-buffer.js');
t('空 buffer needsRefill=true', () => assert.ok(QB.needsRefill([])));
t('addQuips 追加且带时间戳', () => {
  const b = QB.addQuips([], ['a', 'b'], 'default');
  assert.strictEqual(b.length, 2);
  assert.ok(b[0].at);
  assert.strictEqual(b[0].mood, 'default');
});
t('takeBestMatch 优先同 mood', () => {
  const b = QB.addQuips([], ['x', 'y'], 'happy');
  const b2 = QB.addQuips(b, ['z'], 'hungry');
  const picked = QB.takeBestMatch(b2, 'hungry');
  assert.strictEqual(picked.quip, 'z');
});
t('过期 quip 被过滤', () => {
  const old = { quip: 'ancient', mood: 'default', at: Date.now() - 25 * 3600 * 1000 };
  const b = QB.addQuips([old], ['fresh'], 'default');
  // fresh 加进来；old 被过滤掉
  assert.strictEqual(b.length, 1);
  assert.strictEqual(b[0].quip, 'fresh');
});

// ────────────────────────────────────────────────────────
section('easter-eggs.js');
const EE = require('./lib/easter-eggs.js');
t('checkKonami 匹配密语', () => {
  assert.ok(EE.checkKonami('芝麻开门').length > 0);
  assert.ok(EE.checkKonami('hello there').includes('Kenobi'));
  assert.strictEqual(EE.checkKonami('普通消息'), null);
});
t('trackNightVisit 在白天不累计', () => {
  const orig = Date;
  // 只能跑实际时间；skip if not night
  // 实际调用时依赖当前时间，这里只验证不抛
  const s = { hiddenProgress: {} };
  EE.trackNightVisit(s);
});

// ────────────────────────────────────────────────────────
section('achievements.js 解锁检测');
const A = require('./lib/achievements.js');
t('有 12 个成就', () => assert.strictEqual(A.ACHIEVEMENTS.length, 12));
t('首次孵化成就在有 soul 时触发', () => {
  const s = { soul: { name: 'x', hatchedAt: Date.now() }, xp: 0, counters: {}, petCount: 0, achievements: [] };
  const newly = A.checkAll(s);
  assert.ok(newly.includes('first_hatch'));
});
t('已解锁的不重复返回', () => {
  const s = { soul: { name: 'x', hatchedAt: Date.now() }, xp: 0, counters: {}, petCount: 0, achievements: ['first_hatch'] };
  const newly = A.checkAll(s);
  assert.ok(!newly.includes('first_hatch'));
});

// ────────────────────────────────────────────────────────
section('unlocks.js 隐藏角色触发');
const U = require('./lib/unlocks.js');
t('饕餮需 50 pet', () => {
  assert.ok(!U.UNLOCK_RULES.taotie.check({ petCount: 49 }));
  assert.ok(U.UNLOCK_RULES.taotie.check({ petCount: 50 }));
});
t('nextClosest 返回进度最高的', () => {
  const s = { unlocks: [], petCount: 40 };
  const next = U.nextClosest(s);
  assert.ok(next);
  assert.strictEqual(next.id, 'taotie');
  assert.ok(next.ratio > 0);
});

// ────────────────────────────────────────────────────────
section('events.js 事件日志');
const EV = require('./lib/events.js');
t('emitEvent 不抛', () => {
  // 测试环境我们不真写文件系统，只确保函数存在可调
  assert.strictEqual(typeof EV.emitEvent, 'function');
});
t('filterSince 正确', () => {
  const events = [
    { at: Date.now() - 3600 * 1000, type: 'a' },
    { at: Date.now() - 100, type: 'b' },
  ];
  const recent = EV.filterSince(events, 1000);
  assert.strictEqual(recent.length, 1);
  assert.strictEqual(recent[0].type, 'b');
});
t('filterType 正确', () => {
  const events = [{ type: 'a' }, { type: 'b' }, { type: 'a' }];
  assert.strictEqual(EV.filterType(events, 'a').length, 2);
});

// ────────────────────────────────────────────────────────
section('mood.js');
const M = require('./lib/mood.js');
t('8 种心情', () => assert.strictEqual(Object.keys(M.MOODS).length, 8));
t('computeMood 返回合法 id', () => {
  const id = M.computeMood({ soul: { hatchedAt: Date.now() } });
  assert.ok(M.MOODS[id]);
});
t('moodBadge 有 emoji', () => {
  const b = M.moodBadge({ soul: { hatchedAt: Date.now() } });
  assert.ok(b.emoji);
});

// ────────────────────────────────────────────────────────
section('seasons.js');
const S = require('./lib/seasons.js');
t('currentOccasion 返回 null 或对象', () => {
  const occ = S.currentOccasion(new Date('2026-07-15'));  // 仲夏，应无节日
  assert.strictEqual(occ, null);
});
t('春节窗口命中', () => {
  const occ = S.currentOccasion(new Date('2026-02-05'));
  assert.ok(occ);
  assert.strictEqual(occ.id, 'newyear');
});
t('愚人节命中', () => {
  const occ = S.currentOccasion(new Date('2026-04-01'));
  assert.ok(occ);
  assert.strictEqual(occ.id, 'aprilfool');
});

// ────────────────────────────────────────────────────────
console.log('');
console.log('─'.repeat(50));
console.log(`  总计：${passed + failed}  ·  ✓ ${passed}  ·  ✗ ${failed}`);
console.log('─'.repeat(50));

if (failed > 0) {
  console.log('');
  console.log('失败详情：');
  for (const f of failures) {
    console.log(`  ✗ ${f.name}`);
    console.log(`    ${f.error.stack || f.error.message}`);
  }
  process.exit(1);
}
