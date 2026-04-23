#!/usr/bin/env node
// Statusline：每次 Claude Code UI 重绘时调用
// 环境变量 BUDDY_STATUSLINE_STYLE:
//   both   → 单行 ★ 🐰 (·..·) 名字 Lv 心情 气泡（默认，最兼容）
//   emoji  → 单行 ★ 🐰 名字 Lv 心情 气泡
//   ascii  → 单行 ★ (·..·) 名字 Lv 心情 气泡
//   sprite → 多行 ASCII sprite + 名字 + 气泡（最接近原版 /buddy，需要 CC 支持多行 statusline）
// 静音/未孵化 自动降级

const { roll, companionUserId } = require('./lib/roll.js');
const { renderFace, renderSprite } = require('./lib/sprites.js');
const { readState } = require('./lib/state.js');
const { getCharacter, currentFormId } = require('./lib/characters.js');
const { xpProgress } = require('./lib/progression.js');
const { moodBadge } = require('./lib/mood.js');
const { RARITY_STARS, RARITY_COLORS, RESET_COLOR, BOLD } = require('./lib/types.js');

const BUBBLE_TTL_MS = 10_000;

// 把一条 quip 包进 ASCII 气泡（圆角边框）
function renderBubble(text) {
  const maxWidth = 26;
  // 简单断行（中文按字符）
  const chars = [...text];
  const lines = [];
  let cur = '';
  for (const ch of chars) {
    if (([...cur].length) >= maxWidth) {
      lines.push(cur);
      cur = '';
    }
    cur += ch;
  }
  if (cur) lines.push(cur);
  // 气泡边框（中西混排宽度由终端/字体决定；这里保证每行左右对齐）
  const width = Math.max(...lines.map((l) => [...l].length));
  const top    = '╭' + '─'.repeat(width + 2) + '╮';
  const bottom = '╰' + '─'.repeat(width + 2) + '╯';
  const body = lines.map((l) => {
    const pad = ' '.repeat(width - [...l].length);
    return `│ ${l}${pad} │`;
  });
  return [top, ...body, bottom];
}

// 多行渲染：sprite 在左，气泡在右（同行合成）
function renderMultiLine(bones, soul, state) {
  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);
  const color = RARITY_COLORS[bones.rarity];
  const stars = RARITY_STARS[bones.rarity];
  const emoji = character?.emoji || '';
  const prog = xpProgress(state.xp || 0);
  const bond = state.bond || 0;
  const mood = moodBadge(state);

  // 选一帧（用当前秒做种子）—— 让 sprite 在重绘时轻微变化
  const frame = Math.floor(Date.now() / 3000) % 3;
  const spriteLines = renderSprite({ ...bones, species: formId }, frame);

  // 气泡只有在最近 10s 有 quip 时才画
  const hasBubble = state.quip && state.quipAt && Date.now() - state.quipAt < BUBBLE_TTL_MS;
  const bubbleLines = hasBubble ? renderBubble(state.quip) : [];

  // 逐行拼接：左 sprite（12 宽 + 2 空格） 右 bubble
  const rowCount = Math.max(spriteLines.length, bubbleLines.length);
  const out = [];
  for (let i = 0; i < rowCount; i++) {
    const left = spriteLines[i] ?? ' '.repeat(12);
    const right = bubbleLines[i] ?? '';
    out.push(`${color}${left}${RESET_COLOR}  ${right}`);
  }
  // 名字行放最上
  const header = `${color}${stars}${RESET_COLOR} ${emoji} ${BOLD}${soul.name}${RESET_COLOR} Lv${prog.level} ♥${bond} ${mood.emoji}`;
  return [header, ...out].join('\n');
}

function renderSingleLine(bones, soul, state, style) {
  const color = RARITY_COLORS[bones.rarity];
  const stars = RARITY_STARS[bones.rarity];
  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);
  const emoji = character?.emoji || '❔';
  const face = renderFace({ ...bones, species: formId });
  const prog = xpProgress(state.xp || 0);
  const mood = moodBadge(state);

  let quip = '';
  if (state.quip && state.quipAt && Date.now() - state.quipAt < BUBBLE_TTL_MS) {
    quip = `  "${state.quip}"`;
  }
  const lvTag = `Lv${prog.level}`;
  if (style === 'emoji') {
    return `${color}${stars}${RESET_COLOR} ${emoji} ${soul.name} ${lvTag} ${mood.emoji}${quip}`;
  } else if (style === 'ascii') {
    return `${color}${stars}${RESET_COLOR} ${color}${face}${RESET_COLOR} ${soul.name} ${lvTag} ${mood.emoji}${quip}`;
  } else {
    return `${color}${stars}${RESET_COLOR} ${emoji} ${color}${face}${RESET_COLOR} ${soul.name} ${lvTag} ${mood.emoji}${quip}`;
  }
}

function main() {
  const state = readState();
  if (!state.soul) {
    process.stdout.write('  /buddy 孵化你的伙伴 🐣');
    return;
  }
  if (state.muted) return;

  const bones = roll(companionUserId());
  const style = (process.env.BUDDY_STATUSLINE_STYLE || 'both').toLowerCase();

  let output;
  if (style === 'sprite') {
    output = renderMultiLine(bones, state.soul, state);
  } else {
    output = renderSingleLine(bones, state.soul, state, style);
  }

  process.stdout.write(output);
}

try { main(); } catch (e) {
  if (process.env.BUDDY_DEBUG) console.error(e);
}
