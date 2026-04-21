#!/usr/bin/env node
// /buddy-chat "..."：让伙伴以自己的 persona 回复用户
// 主 Claude 闪身；走 claude -p 子进程，流量经当前用户的 Claude Code 通道

const { spawnSync } = require('child_process');
const { readState, updateState } = require('./lib/state.js');
const { roll, companionUserId } = require('./lib/roll.js');
const { getCharacter, currentFormId } = require('./lib/characters.js');
const { STAT_NAMES_CN } = require('./lib/types.js');
const { applyReward } = require('./lib/progression.js');

const TIMEOUT_MS = 20000;
const HISTORY_KEEP = 6; // 保留最近 6 轮的一问一答作为上下文（3 对）

function buildPrompt(state, userMsg) {
  const bones = roll(companionUserId());
  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);

  const peakStat = Object.entries(bones.stats).sort((a, b) => b[1] - a[1])[0];
  const peakStatCn = STAT_NAMES_CN[peakStat[0]];

  const isSwapped = formId !== bones.species;
  const formTag = isSwapped && character
    ? `你现在穿着"${character.nameCn}"形态的外壳（${character.emoji}），说话时可以带一点这个形态的气质。`
    : `你是一只 ${character ? character.nameCn : formId}（${character ? character.emoji : ''}）。`;

  // 历史对话
  const history = state.chatHistory || [];
  const historyText = history.length > 0
    ? '\n\n最近的对话回忆：\n' + history.map((h) => `${h.role === 'user' ? '主人' : '你'}: ${h.content}`).join('\n')
    : '';

  // ── v0.6 新增：bond 决定语气亲疏 + 记忆 + 最近情绪 ──
  const bond = state.bond || 0;
  let bondTone = '';
  if (bond >= 80) bondTone = '【关系：非常亲密——可以撒娇、可以直白表达情绪】';
  else if (bond >= 50) bondTone = '【关系：亲近——轻松随意】';
  else if (bond >= 20) bondTone = '【关系：正在熟悉——偏拘谨但友善】';
  else bondTone = '【关系：刚认识不久——保持距离感、不要太热情】';

  const memories = state.soul?.memories || [];
  const memoryText = memories.length > 0
    ? '\n\n你记得这些关于主人的事：\n' + memories.map((m, i) => `${i + 1}. ${m}`).join('\n')
    : '';

  const moodText = state.lastMood ? `\n\n最近主人 ${state.lastMood === 'error' ? '在出错' : state.lastMood === 'success' ? '在顺利完成' : '正常对话'}。` : '';

  return `你叫"${state.soul.name}"，${state.soul.personality}
${formTag}
特长是${peakStatCn}（${peakStat[1]}/100）。
${bondTone}
你不是 AI 助手，是主人养的桌面伙伴，陪伴已经 ${Math.floor((Date.now() - state.soul.hatchedAt) / 86400000)} 天。${memoryText}${moodText}${historyText}

对话规则：
- 用中文，保持你的说话风格（${state.soul.personality}）
- 如果记忆里有相关内容，自然地带出（不要生硬引用）
- 回答要像朋友聊天，≤50 字，一次只说一句话
- 不要像 AI 那样分条列点或给"建议"
- 不要解释你是谁、不要重复你的人设
- 想反问就反问，想傲娇就傲娇，想说废话就说废话

主人刚对你说："${userMsg}"

请以"${state.soul.name}"的身份回复一句。只输出这一句本身，不要引号不要前缀。`;
}

function callClaude(prompt) {
  try {
    const result = spawnSync('claude', ['-p', prompt], {
      timeout: TIMEOUT_MS,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_OPTIONS: '',
        BUDDY_OBSERVER_DISABLE: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.error || result.status !== 0) return null;
    let reply = (result.stdout || '').trim().split('\n')[0].trim();
    reply = reply.replace(/\*\*|__/g, '').trim();
    reply = reply.replace(/^[""「『"'`]|[""」』"'`]$/g, '').trim();
    if (reply.length > 100) reply = reply.slice(0, 97) + '...';
    return reply || null;
  } catch (_e) { return null; }
}

function main() {
  const userMsg = process.argv.slice(2).join(' ').trim();
  const state = readState();

  if (!state.soul) {
    console.log('  你还没孵化伙伴，跑 /claude-buddy:buddy');
    return;
  }
  if (!userMsg) {
    console.log(`  用法：/claude-buddy:buddy-chat <要说的话>`);
    return;
  }

  console.log('');
  console.log(`  主人 → ${state.soul.name}:`);
  console.log(`  ${userMsg}`);
  console.log('');

  const prompt = buildPrompt(state, userMsg);
  const reply = callClaude(prompt);

  if (!reply) {
    console.log(`  ${state.soul.name}: ...（没说话，可能在想事情）`);
    return;
  }

  console.log(`  ${state.soul.name}:`);
  console.log(`  ${reply}`);
  console.log('');

  // 更新 chat history + 给点 XP/bond
  const history = state.chatHistory || [];
  history.push({ role: 'user', content: userMsg });
  history.push({ role: 'buddy', content: reply });
  while (history.length > HISTORY_KEEP * 2) history.shift();

  const reward = applyReward(state, 'turn');
  updateState({
    chatHistory: history,
    xp: reward.xp,
    bond: Math.min(100, (state.bond || 0) + 1),
  });
}

try { main(); } catch (e) {
  console.error('chat error:', e.message);
  process.exit(1);
}
