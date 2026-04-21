#!/usr/bin/env node
// /buddy-card：生成可截图/复制的 ASCII 名片

const { readState } = require('./lib/state.js');
const { roll, companionUserId } = require('./lib/roll.js');
const { renderSprite } = require('./lib/sprites.js');
const { getCharacter, currentFormId } = require('./lib/characters.js');
const { xpProgress, EVOLUTION_LABELS, computeEvolution } = require('./lib/progression.js');
const { getAchievement } = require('./lib/achievements.js');
const { RARITY_STARS, STAT_NAMES, STAT_NAMES_CN } = require('./lib/types.js');

const WIDTH = 40;
const BORDER_TOP    = '╭' + '─'.repeat(WIDTH - 2) + '╮';
const BORDER_BOT    = '╰' + '─'.repeat(WIDTH - 2) + '╯';
const BORDER_MID    = '├' + '─'.repeat(WIDTH - 2) + '┤';

function pad(s, width) {
  const len = [...s].length;
  if (len >= width) return s.slice(0, width);
  return s + ' '.repeat(width - len);
}

function centerPad(s, width) {
  const len = [...s].length;
  if (len >= width) return s.slice(0, width);
  const left = Math.floor((width - len) / 2);
  const right = width - len - left;
  return ' '.repeat(left) + s + ' '.repeat(right);
}

function row(inner) {
  return '│' + pad(inner, WIDTH - 2) + '│';
}

function centerRow(inner) {
  return '│' + centerPad(inner, WIDTH - 2) + '│';
}

function main() {
  const state = readState();
  if (!state.soul) {
    console.log('  你还没孵化伙伴');
    return;
  }

  const bones = roll(companionUserId());
  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);
  const prog = xpProgress(state.xp || 0);
  const bond = state.bond || 0;
  const evo = computeEvolution(prog.level, bond);
  const stars = RARITY_STARS[bones.rarity];

  const sprite = renderSprite({ ...bones, species: formId }, 0);
  const days = state.soul.hatchedAt
    ? Math.floor((Date.now() - state.soul.hatchedAt) / 86400000)
    : 0;

  const lines = [];
  lines.push(BORDER_TOP);
  lines.push(centerRow(`${stars} ${bones.rarity.toUpperCase()}${bones.shiny ? ' ✨' : ''}`));
  lines.push(BORDER_MID);
  for (const s of sprite) lines.push(centerRow(s));
  lines.push(centerRow(`${character ? character.emoji : ''} ${state.soul.name}`));
  lines.push(centerRow(character ? character.nameCn : formId));
  lines.push(BORDER_MID);
  lines.push(row(` Lv ${prog.level}  ${EVOLUTION_LABELS[evo]}   ♥ ${bond}/100`));
  lines.push(row(` 陪伴 ${days} 天  XP ${state.xp || 0}`));
  lines.push(BORDER_MID);

  // 精选 2 条属性（最高和最低）
  const statEntries = STAT_NAMES.map((s) => [s, bones.stats[s]]).sort((a, b) => b[1] - a[1]);
  const top = statEntries[0];
  const bottom = statEntries[statEntries.length - 1];
  lines.push(row(` 最强: ${STAT_NAMES_CN[top[0]]} ${top[1]}/100`));
  lines.push(row(` 最弱: ${STAT_NAMES_CN[bottom[0]]} ${bottom[1]}/100`));
  lines.push(BORDER_MID);

  // 累计数据
  const c = state.counters || {};
  lines.push(row(` 见证 commit ${c.totalCommits || 0} · debug ${c.totalDebugs || 0}`));
  lines.push(row(` 被摸 ${state.petCount || 0} 次`));
  if (c.rmRfSightings) lines.push(row(` 🚨 目睹 rm -rf ${c.rmRfSightings} 次`));

  // 成就
  const achs = (state.achievements || []).map(getAchievement).filter(Boolean);
  if (achs.length > 0) {
    lines.push(BORDER_MID);
    lines.push(row(' 成就:'));
    for (const a of achs.slice(0, 4)) {
      lines.push(row(`   🏆 ${a.name}`));
    }
    if (achs.length > 4) lines.push(row(`   ... 还有 ${achs.length - 4} 个`));
  }

  // 隐藏解锁
  if ((state.unlocks || []).length > 0) {
    const unlockedChars = state.unlocks.map(getCharacter).filter(Boolean);
    lines.push(BORDER_MID);
    lines.push(row(' 隐藏角色:'));
    lines.push(row(`   ${unlockedChars.map((c) => c.emoji).join(' ')}`));
  }

  lines.push(BORDER_MID);
  lines.push(centerRow('claude-buddy · built with ❤'));
  lines.push(BORDER_BOT);

  console.log('');
  for (const l of lines) console.log(l);
  console.log('');
  console.log('  （截图或复制上面这张名片分享给朋友）');
  console.log('');
}

try { main(); } catch (e) {
  console.error('card error:', e.message);
  process.exit(1);
}
