#!/usr/bin/env node
// Statusline：每次 Claude Code UI 重绘时调用，输出单行
// 环境变量 BUDDY_STATUSLINE_STYLE 可选：
//   emoji  → 🐰 墨墨  "吐槽"
//   ascii  → ★ (·..·) 墨墨  "吐槽"  （纯等宽字符）
//   both   → ★ 🐰 (·..·) 墨墨  "吐槽"  （默认，信息最全）
// 如果没孵化、被静音，都会降级

const { roll, companionUserId } = require('./lib/roll.js');
const { renderFace } = require('./lib/sprites.js');
const { readState } = require('./lib/state.js');
const { getCharacter, currentFormId } = require('./lib/characters.js');
const { xpProgress } = require('./lib/progression.js');
const { RARITY_STARS, RARITY_COLORS, RESET_COLOR } = require('./lib/types.js');

function main() {
  const state = readState();
  if (!state.soul) {
    process.stdout.write('  /buddy 孵化你的伙伴 🐣');
    return;
  }
  if (state.muted) return;

  const bones = roll(companionUserId());
  const color = RARITY_COLORS[bones.rarity];
  const stars = RARITY_STARS[bones.rarity];

  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);
  const emoji = character?.emoji || '❔';

  const face = renderFace({ ...bones, species: formId });
  const name = state.soul.name;

  // 等级标识
  const prog = xpProgress(state.xp || 0);
  const lvTag = `Lv${prog.level}`;

  // 吐槽 10 秒窗口期
  let quip = '';
  if (state.quip && state.quipAt && Date.now() - state.quipAt < 10_000) {
    quip = `  "${state.quip}"`;
  }

  const style = (process.env.BUDDY_STATUSLINE_STYLE || 'both').toLowerCase();

  let output;
  if (style === 'emoji') {
    output = `${color}${stars}${RESET_COLOR} ${emoji} ${name} ${lvTag}${quip}`;
  } else if (style === 'ascii') {
    output = `${color}${stars}${RESET_COLOR} ${color}${face}${RESET_COLOR} ${name} ${lvTag}${quip}`;
  } else {
    output = `${color}${stars}${RESET_COLOR} ${emoji} ${color}${face}${RESET_COLOR} ${name} ${lvTag}${quip}`;
  }

  process.stdout.write(output);
}

try { main(); } catch (e) {
  if (process.env.BUDDY_DEBUG) console.error(e);
}
