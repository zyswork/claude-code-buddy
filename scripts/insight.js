#!/usr/bin/env node
// /buddy-insight：让伙伴读 7 天事件日志 + 当前 state，生成"它对你的观察报告"
// 这是事件总线的"最终归宿"——buddy 真的能反思你

const { spawnSync } = require('child_process');
const { readState } = require('./lib/state.js');
const { roll, companionUserId } = require('./lib/roll.js');
const { readEvents, filterSince, WINDOWS } = require('./lib/events.js');
const { getCharacter, currentFormId } = require('./lib/characters.js');
const { xpProgress, EVOLUTION_LABELS, computeEvolution } = require('./lib/progression.js');
const { moodBadge } = require('./lib/mood.js');

const TIMEOUT_MS = 35000;

// 把事件聚合成易读的摘要，塞进 prompt
function summarizeEvents(events) {
  const counts = {};
  for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1;

  const hourHist = new Array(24).fill(0);
  for (const e of events) {
    const h = new Date(e.at).getHours();
    hourHist[h]++;
  }
  const peakHour = hourHist.indexOf(Math.max(...hourHist));

  const commits = events.filter((e) => e.type === 'bash_commit');
  const debugs = events.filter((e) => e.type === 'debug_keyword');
  const rmRfs = events.filter((e) => e.type === 'bash_rm_rf');
  const unlocks = events.filter((e) => e.type === 'character_unlocked');
  const achievements = events.filter((e) => e.type === 'achievement_unlocked');
  const levelups = events.filter((e) => e.type === 'levelup');
  const pets = events.filter((e) => e.type === 'pet');
  const konamis = events.filter((e) => e.type === 'konami');
  const nights = events.filter((e) => e.type === 'night_visit');

  const cwds = new Set(commits.map((e) => e.cwd).filter(Boolean));

  return {
    total: events.length,
    counts,
    peakHour,
    commitCount: commits.length,
    debugCount: debugs.length,
    rmRfCount: rmRfs.length,
    unlockCount: unlocks.length,
    achievementCount: achievements.length,
    levelupCount: levelups.length,
    petCount: pets.length,
    konamiCount: konamis.length,
    nightCount: nights.length,
    projectCount: cwds.size,
    recentKonamis: konamis.slice(-3).map((e) => e.response),
    recentAchievements: achievements.slice(-3).map((e) => e.name),
    recentUnlocks: unlocks.slice(-3).map((e) => e.nameCn),
  };
}

function buildPrompt(state, summary) {
  const bones = roll(companionUserId());
  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);
  const prog = xpProgress(state.xp || 0);
  const bond = state.bond || 0;
  const evo = computeEvolution(prog.level, bond);
  const mood = moodBadge(state);
  const days = state.soul?.hatchedAt
    ? Math.floor((Date.now() - state.soul.hatchedAt) / 86400000)
    : 0;

  const memories = state.soul?.memories || [];
  const memoryText = memories.length > 0
    ? memories.slice(-5).map((m, i) => `${i + 1}. ${m}`).join('\n')
    : '（主人没教过我什么）';

  return `你是"${state.soul.name}"，一只 ${bones.rarity} 级 ${character ? character.nameCn : formId}。
性格：${state.soul.personality}
你已经陪伴主人 ${days} 天，现在是 Lv ${prog.level} ${EVOLUTION_LABELS[evo]}，亲密度 ♥ ${bond}/100。
你当前的情绪：${mood.label} ${mood.emoji}

你记得主人告诉你的事：
${memoryText}

你过去 7 天的观察（基于事件日志）：
- 陪主人完成了 ${summary.counts.turn_end || 0} 轮对话
- 见证 ${summary.commitCount} 次 git commit，跨 ${summary.projectCount} 个项目
- 听主人说了 ${summary.debugCount} 次 bug/修复相关的话
- 目睹 ${summary.rmRfCount} 次 rm -rf
- 被摸了 ${summary.petCount} 次
- 最活跃的时段是晚上 ${summary.peakHour} 点左右
- ${summary.nightCount > 0 ? `有 ${summary.nightCount} 次深夜 2-4 点还在线` : '没有太晚睡觉'}
- 解锁了 ${summary.unlockCount} 只隐藏角色、${summary.achievementCount} 个成就、升级 ${summary.levelupCount} 次
- 触发密语 ${summary.konamiCount} 次${summary.recentKonamis.length ? '（例如 "' + summary.recentKonamis.join('"、"') + '"）' : ''}
${summary.recentAchievements.length ? '- 最近成就：' + summary.recentAchievements.join('、') : ''}
${summary.recentUnlocks.length ? '- 最近发现：' + summary.recentUnlocks.join('、') : ''}

请基于这些**真实观察**（不是瞎编），以"${state.soul.name}"的身份，用你的性格语气写一份给主人的【本周观察报告】。

结构：
1. **整体观察**（这周主人大致在干嘛，你注意到了什么模式）
2. **想说的话**（具体挑 1-2 件事表扬或吐槽，要提具体数据）
3. **给主人的建议**（基于观察给 1 条真诚建议）
4. **结尾的一句吐槽或心里话**（符合你的性格）

要求：
- 全中文、200-350 字
- 开头不要写"亲爱的主人"这种套话，直接进入正文
- 不要分条列点，写成有感情的段落
- 语气要贴合你的性格（${state.soul.personality}）——别变成专业分析师

只输出正文。`;
}

function callClaude(prompt) {
  try {
    const r = spawnSync('claude', ['-p', prompt], {
      timeout: TIMEOUT_MS,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '', BUDDY_OBSERVER_DISABLE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (r.error || r.status !== 0) return null;
    return (r.stdout || '').trim();
  } catch (_e) { return null; }
}

function main() {
  const state = readState();
  if (!state.soul) {
    console.log('  你还没孵化伙伴');
    return;
  }

  const events = filterSince(readEvents(10000), WINDOWS.week);
  if (events.length < 5) {
    console.log('');
    console.log(`  ${state.soul.name}: "7 天里我没看见什么值得说的..."`);
    console.log('  事件太少（<5 条）。再玩一阵子再来问吧。');
    console.log('');
    return;
  }

  const summary = summarizeEvents(events);
  const prompt = buildPrompt(state, summary);

  console.log('');
  console.log(`  ⚡ ${state.soul.name} 在翻 7 天的记忆...`);
  console.log('');

  const reply = callClaude(prompt);
  if (!reply) {
    console.log(`  ${state.soul.name}: "...突然不想说话了（claude -p 没响应）。"`);
    return;
  }

  console.log('  ══════════════════════════════════════');
  console.log(`  📖 ${state.soul.name} 的本周观察`);
  console.log('  ══════════════════════════════════════');
  console.log('');
  for (const line of reply.split('\n')) console.log('  ' + line);
  console.log('');
  console.log(`  （基于 ${events.length} 条事件观察生成，跨 ${summary.projectCount} 个项目）`);
  console.log('');
}

try { main(); } catch (e) {
  console.error('insight error:', e.message);
  process.exit(1);
}
