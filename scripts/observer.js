#!/usr/bin/env node
// Stop hook：每次 Claude Code 完成一轮对话后调用
// v0.2：调 `claude -p` 让 Claude 本人基于伙伴的 personality 生成中文吐槽
// 流量自动走你当前 Claude Code 的登录通道（包括 openclaw 代理等）

const { spawnSync } = require('child_process');
const fs = require('fs');
const { roll, companionUserId } = require('./lib/roll.js');
const { readState, updateState } = require('./lib/state.js');
const { STAT_NAMES_CN } = require('./lib/types.js');
const {
  applyReward, pickLevelUpQuip, pickEvolutionQuip,
} = require('./lib/progression.js');
const { runChecks } = require('./lib/progress-check.js');
const { timeBasedQuip, trackNightVisit } = require('./lib/easter-eggs.js');

// 30% 概率才吐槽，避免刷屏
const QUIP_PROBABILITY = 0.3;
// claude -p 最多等这么久，超时走备用池
const CLAUDE_CLI_TIMEOUT_MS = 8000;

// 递归守卫：spawn 的子 claude 继承此环境变量，子 claude 的 Stop hook 会直接退出
// 防止 observer → claude -p → child observer → 又一个 claude -p 的链式调用
if (process.env.BUDDY_OBSERVER_DISABLE === '1') {
  process.exit(0);
}

// 备用吐槽池（claude -p 不可用时的降级）
const FALLBACK_QUIPS = {
  default: ['嗯。', '继续。', '...', '我在看着。', '写得还行。', '这代码我看不懂但我大受震撼。'],
  success: ['好诶！', '🎉', '不错嘛', '再接再厉。', 'commit 它！'],
  error: ['又翻车了', '我就知道', '冷静一下', '喝口水再说', '不是你的问题是编译器的问题'],
};

function readHookInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return JSON.parse(raw);
  } catch (_e) {
    return {};
  }
}

function detectMood(hookInput) {
  const blob = JSON.stringify(hookInput).toLowerCase();
  if (blob.includes('error') || blob.includes('failed') || blob.includes('fail')) return 'error';
  if (blob.includes('success') || blob.includes('passed') || blob.includes('done')) return 'success';
  return 'default';
}

function pickFallbackQuip(mood) {
  const pool = FALLBACK_QUIPS[mood] || FALLBACK_QUIPS.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 用 `claude -p` 生成一句吐槽。流量走用户当前的 Claude Code 通道
function generateQuipViaClaude(soul, bones, mood) {
  const moodCN = { error: '刚才出错了', success: '刚完成任务', default: '正常对话' }[mood];
  const peakStat = Object.entries(bones.stats).sort((a, b) => b[1] - a[1])[0];
  const peakStatCN = STAT_NAMES_CN[peakStat[0]];

  const prompt = `你是"${soul.name}"，一只${bones.rarity}级${bones.species}，特长是${peakStatCN}（${peakStat[1]}/100）。
性格：${soul.personality}

用户刚和 Claude Code 完成一轮对话（情境：${moodCN}）。
请以${soul.name}的身份用中文说一句话反应（8-20 字），保持你的说话风格。
只输出这一句话本身，不要引号，不要解释，不要前缀后缀。`;

  try {
    const result = spawnSync('claude', ['-p', prompt], {
      timeout: CLAUDE_CLI_TIMEOUT_MS,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_OPTIONS: '',
        BUDDY_OBSERVER_DISABLE: '1', // 关键：防止递归自调用
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.error || result.status !== 0) {
      if (process.env.BUDDY_DEBUG) {
        console.error('[buddy] claude -p failed:', result.error || result.stderr);
      }
      return null;
    }

    let quip = (result.stdout || '').trim();
    // 只取第一行，防止 Claude 多嘴
    quip = quip.split('\n')[0].trim();
    // 去 markdown 格式（** __ * _）
    quip = quip.replace(/\*\*|__/g, '').replace(/(^|[^\w])[*_]([^*_]+)[*_]($|[^\w])/g, '$1$2$3');
    // 去常见前缀（"墨墨:" / "墨墨："/ emoji+空格）
    quip = quip.replace(/^[^\u4e00-\u9fa5a-zA-Z]*[:：]\s*/, '');
    quip = quip.replace(/^\p{Emoji}+\s*/u, '');
    // 去引号包裹（中英文各种）
    quip = quip.replace(/^[""「『"'`]|[""」』"'`]$/g, '').trim();
    // 长度保护：超过 50 字截断
    if (quip.length > 50) quip = quip.slice(0, 47) + '...';

    return quip || null;
  } catch (e) {
    if (process.env.BUDDY_DEBUG) console.error('[buddy] generateQuip exception:', e);
    return null;
  }
}

function main() {
  const state = readState();
  if (!state.soul || state.muted) return;

  // ── 成长奖励（无论是否吐槽都要加）──
  const reward = applyReward(state, 'turn');
  const counters = { ...state.counters, totalTurns: (state.counters?.totalTurns || 0) + 1 };
  const statePatch = {
    xp: reward.xp,
    bond: reward.bond,
    counters,
  };

  // ── 深夜访问累计（烛龙解锁路径）──
  const stateForNight = { ...state, ...statePatch };
  if (trackNightVisit(stateForNight)) {
    statePatch.hiddenProgress = stateForNight.hiddenProgress;
  }

  // ── 是否吐槽 ──
  const shouldQuip = Math.random() < QUIP_PROBABILITY;
  let quip = null;

  // 升级/进化 强制吐槽（盖过 30% 门槛）
  if (reward.evolved) {
    quip = pickEvolutionQuip(reward.evolution);
  } else if (reward.leveledUp) {
    quip = pickLevelUpQuip() + ' Lv' + reward.level;
  } else if (shouldQuip) {
    const hookInput = readHookInput();
    const mood = detectMood(hookInput);

    // 时间/节日彩蛋优先：命中就不走 LLM，省成本也保特殊感
    const timeQuip = timeBasedQuip(state.soul, mood);
    if (timeQuip) {
      quip = timeQuip;
      statePatch.quipSource = 'timeEgg';
    } else {
      const bones = roll(companionUserId());
      const llmQuip = generateQuipViaClaude(state.soul, bones, mood);
      quip = llmQuip || pickFallbackQuip(mood);
      statePatch.lastMood = mood;
      statePatch.quipSource = llmQuip ? 'claude' : 'fallback';
    }
  }

  if (quip) {
    statePatch.quip = quip;
    statePatch.quipAt = Date.now();
  }

  // 跑成就/隐藏角色检查（可能把 quip 替换成解锁通知）
  const merged = { ...state, ...statePatch };
  const checkResult = runChecks(merged);
  statePatch.unlocks = merged.unlocks;
  statePatch.achievements = merged.achievements;
  if (checkResult.notifications.length > 0) {
    statePatch.quip = merged.quip;
    statePatch.quipAt = merged.quipAt;
  }

  updateState(statePatch);
}

try { main(); } catch (e) {
  if (process.env.BUDDY_DEBUG) console.error(e);
}
