#!/usr/bin/env node
// 后台批量生成吐槽 worker。被 observer 在缓冲低时 detached spawn。
// 独立进程 → 不阻塞 Stop hook
//
// 用法：
//   node refill-quips.js            # 生成 5 条 default mood 的
//   node refill-quips.js hungry 6   # 指定 mood 和条数

const { spawnSync } = require('child_process');
const { readState, updateState } = require('./lib/state.js');
const { roll, companionUserId } = require('./lib/roll.js');
const { readBuffer, addQuips, MAX_BUFFER } = require('./lib/quip-buffer.js');
const { STAT_NAMES_CN } = require('./lib/types.js');
const { moodBadge } = require('./lib/mood.js');
const { getCharacter, currentFormId } = require('./lib/characters.js');
const { xpProgress, EVOLUTION_LABELS, computeEvolution } = require('./lib/progression.js');

// 避免递归
if (process.env.BUDDY_OBSERVER_DISABLE === '1') process.exit(0);

const TIMEOUT_MS = 30000;
const BATCH_SIZE = 5;

function buildBatchPrompt(state, mood, count) {
  const bones = roll(companionUserId());
  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);
  const moodInfo = moodBadge({ ...state, lastMood: mood });
  const prog = xpProgress(state.xp || 0);
  const bond = state.bond || 0;
  const evo = computeEvolution(prog.level, bond);
  const days = state.soul?.hatchedAt
    ? Math.floor((Date.now() - state.soul.hatchedAt) / 86400000)
    : 0;

  const peakStat = Object.entries(bones.stats).sort((a, b) => b[1] - a[1])[0];
  const peakStatCn = STAT_NAMES_CN[peakStat[0]];

  const memories = state.soul?.memories || [];
  const memoryText = memories.length > 0
    ? `\n主人告诉你的事：${memories.slice(-5).join(' / ')}`
    : '';

  const unlockedCount = (state.unlocks || []).length;

  let bondTone = '';
  if (bond >= 80) bondTone = '（关系非常亲密，可以撒娇）';
  else if (bond >= 50) bondTone = '（关系亲近，轻松随意）';
  else if (bond >= 20) bondTone = '（偏拘谨但友善）';
  else bondTone = '（刚认识不久，保持距离感）';

  const moodScene = {
    default:  '一轮普通对话',
    success: '刚顺利完成任务',
    error:   '刚出错了',
    ecstatic: '状态极好',
    happy:    '心情不错',
    focused:  '专注工作',
    tired:    '疲惫',
    grumpy:   '烦躁',
    lonely:   '想你',
    hungry:   '一天没互动了',
    shiny:    '亢奋',
  }[mood] || '对话中';

  return `你是"${state.soul.name}"，一只 ${bones.rarity} 级 ${character ? character.nameCn : formId}。
性格：${state.soul.personality}
当前等级 Lv ${prog.level} ${EVOLUTION_LABELS[evo]}  ·  亲密度 ♥ ${bond}/100  ·  陪伴 ${days} 天${bondTone}
特长：${peakStatCn} ${peakStat[1]}/100
情绪：${moodInfo.label} ${moodInfo.emoji}
场景：${moodScene}${memoryText}
${unlockedCount > 0 ? `已解锁 ${unlockedCount} 只隐藏角色。` : ''}

请**一次性生成 ${count} 条**你要对主人说的短吐槽。要求：
- 全中文，每条 8-20 字
- 严格保持你的性格语气（${state.soul.personality}）
- ${count} 条之间要有差异：口吻/情绪/角度各异，不要重复套路
- 不要解释、不要分条编号、不要 emoji 前缀
- 直接输出，每条占一行，共 ${count} 行
- 不要引号包裹

示例（仅示范格式，别重复内容）：
嗯。
写得还行。
这代码我看不懂但我大受震撼。

现在请给出 ${count} 条。`;
}

function callClaudeBatch(prompt) {
  try {
    const r = spawnSync('claude', ['-p', prompt], {
      timeout: TIMEOUT_MS,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '', BUDDY_OBSERVER_DISABLE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (r.error || r.status !== 0) {
      if (process.env.BUDDY_DEBUG) console.error('[refill] claude 失败', r.error || r.stderr);
      return null;
    }
    return (r.stdout || '').trim();
  } catch (e) {
    if (process.env.BUDDY_DEBUG) console.error('[refill] exception', e);
    return null;
  }
}

function parseQuips(raw, expected) {
  if (!raw) return [];
  const lines = raw.split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    // 去编号前缀、markdown 粗体
    .map((l) => l.replace(/^\d+[\.\)、]\s*/, ''))
    .map((l) => l.replace(/\*\*|__/g, ''))
    .map((l) => l.replace(/^[""「『"'`]|[""」』"'`]$/g, ''))
    .filter((l) => l.length >= 2 && l.length <= 50);
  return lines.slice(0, expected);
}

function main() {
  const mood = process.argv[2] || 'default';
  const count = parseInt(process.argv[3], 10) || BATCH_SIZE;

  const state = readState();
  if (!state.soul) return;

  const prompt = buildBatchPrompt(state, mood, count);
  const raw = callClaudeBatch(prompt);
  const quips = parseQuips(raw, count);

  if (quips.length === 0) return;

  // 再读一次 state，避免并发覆盖别人的改动
  const fresh = readState();
  const buffer = readBuffer(fresh);
  const newBuffer = addQuips(buffer, quips, mood);
  updateState({ quipBuffer: newBuffer });
}

try { main(); } catch (e) {
  if (process.env.BUDDY_DEBUG) console.error('[refill] main error', e);
}
