#!/usr/bin/env node
// 打印伙伴的完整名片：ASCII 精灵 + 名字 + 稀有度 + 属性表
// 用法：
//   node render.js            → 打印当前伙伴卡片（未孵化则提示）
//   node render.js --face     → 只打印一行表情（statusline 用）
//   node render.js --frame N  → 指定抖动帧（0/1/2）

const { roll, companionUserId } = require('./lib/roll.js');
const { renderSprite, renderFace } = require('./lib/sprites.js');
const { readState } = require('./lib/state.js');
const { getCharacter, currentFormId } = require('./lib/characters.js');
const { xpProgress, EVOLUTION_LABELS, computeEvolution } = require('./lib/progression.js');
const {
  RARITY_STARS, RARITY_COLORS, STAT_NAMES, STAT_NAMES_CN,
  RESET_COLOR, BOLD,
} = require('./lib/types.js');

function padRight(s, width) {
  const len = [...s].length;
  return s + ' '.repeat(Math.max(0, width - len));
}

function renderStatBar(value) {
  const filled = Math.round(value / 5);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

function renderCard(bones, soul, state) {
  const color = RARITY_COLORS[bones.rarity];
  const stars = RARITY_STARS[bones.rarity];

  // 当前形态可能是 swap 过的，不等于 bones.species
  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);
  const emoji = character?.emoji || '';
  const nameCn = character?.nameCn || formId;

  // 渲染 sprite 时用当前形态而非原 bones
  const spriteBones = { ...bones, species: formId };
  const sprite = renderSprite(spriteBones, 0);

  const isSwapped = formId !== bones.species;

  const lines = [];
  lines.push('');
  lines.push(`  ${color}${BOLD}${stars}${RESET_COLOR} ${color}${bones.rarity.toUpperCase()}${RESET_COLOR}${bones.shiny ? ' ✨ SHINY' : ''}`);
  lines.push('');
  for (const s of sprite) {
    lines.push(`  ${color}${s}${RESET_COLOR}`);
  }
  const swapTag = isSwapped ? `  ${color}[变身形态]${RESET_COLOR}` : '';
  lines.push(`  ${emoji} ${BOLD}${soul.name}${RESET_COLOR}  · ${nameCn}${swapTag}`);
  lines.push('');
  if (soul.personality) {
    lines.push(`  ${soul.personality}`);
    lines.push('');
  }
  // ── 成长状态 ──
  const prog = xpProgress(state?.xp || 0);
  const bond = state?.bond || 0;
  const evo = computeEvolution(prog.level, bond);
  const xpBar = renderProgressBar(prog.inLevel, prog.nextNeed, 20);
  const bondBar = renderProgressBar(bond, 100, 10);

  lines.push(`  ${BOLD}Lv ${prog.level}${RESET_COLOR}  ${EVOLUTION_LABELS[evo]}`);
  lines.push(`  XP ${xpBar} ${prog.inLevel}/${prog.nextNeed}`);
  lines.push(`  ♥  ${bondBar} ${bond}/100`);

  if (soul.hatchedAt) {
    const days = Math.floor((Date.now() - soul.hatchedAt) / 86400000);
    lines.push(`  陪伴 ${days} 天`);
  }
  lines.push('');

  // ── 累计数据 ──
  const c = state?.counters || {};
  lines.push(`  见证：对话 ${c.totalTurns || 0} 轮 · commit ${c.totalCommits || 0} · debug ${c.totalDebugs || 0}${c.rmRfSightings ? ' · rm -rf ' + c.rmRfSightings : ''}`);
  lines.push(`  互动：摸摸 ${state?.petCount || 0} 次`);
  lines.push('');

  lines.push('  ── 属性 ──');
  for (const stat of STAT_NAMES) {
    const v = bones.stats[stat];
    lines.push(`  ${padRight(STAT_NAMES_CN[stat], 6)} ${renderStatBar(v)}  ${v}`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderProgressBar(value, max, width) {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  return '█'.repeat(Math.min(filled, width)) + '░'.repeat(Math.max(0, width - filled));
}

function main() {
  const args = process.argv.slice(2);
  const bones = roll(companionUserId());
  const state = readState();

  if (args.includes('--face')) {
    if (!state.soul) {
      process.stdout.write('(孵化中...)');
      return;
    }
    const color = RARITY_COLORS[bones.rarity];
    const formId = currentFormId(state, bones.species);
    const face = renderFace({ ...bones, species: formId });
    process.stdout.write(`${color}${face}${RESET_COLOR} ${state.soul.name}`);
    return;
  }

  if (!state.soul) {
    console.log('');
    console.log('  你还没有伙伴。跑 /buddy 孵化一只。');
    console.log('');
    return;
  }

  console.log(renderCard(bones, state.soul, state));
}

main();
