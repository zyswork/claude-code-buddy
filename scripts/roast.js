#!/usr/bin/env node
// /buddy-roast：读当前 cwd 的 git log 最近 7 天 commit，让伙伴 roast 一波

const { spawnSync, execSync } = require('child_process');
const { readState } = require('./lib/state.js');

const TIMEOUT_MS = 25000;

function getGitLog() {
  try {
    const out = execSync(
      'git log --since="7 days ago" --pretty=format:"%h %ad %s" --date=short',
      { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }
    );
    return out.trim();
  } catch (_e) {
    return null;
  }
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
  const mode = process.argv[2] || 'roast';   // roast | compliment
  const state = readState();
  if (!state.soul) {
    console.log('  你还没孵化伙伴');
    return;
  }

  const log = getGitLog();
  if (!log) {
    console.log('  ⚠️  当前目录不是 git 仓库，或者 7 天内没有 commit。');
    console.log(`  ${state.soul.name}: "我连吐槽的素材都没有。"`);
    return;
  }

  const toneLine = mode === 'compliment'
    ? '请用你独有的语气夸奖主人（但不要假大空，具体点）'
    : '请用你独有的语气 roast 主人一下（毒舌但不刻薄，观察要锐利）';

  const prompt = `你叫"${state.soul.name}"，${state.soul.personality}

主人过去 7 天在这个项目的 git 提交记录：

${log}

${toneLine}。要求：
1. 必须基于真实 commit 内容和节奏说，不要泛泛而谈
2. 可以 commit message 质量、频率、时间分布都是素材
3. 保持你的语气（${state.soul.personality}）
4. ≤150 字，一气呵成不要分条
5. 全程中文

只输出正文。`;

  console.log('');
  console.log(`  ⚡ ${state.soul.name} 正在翻你的 commit 记录...`);
  console.log('');
  const reply = callClaude(prompt);
  if (!reply) {
    console.log(`  ${state.soul.name}: ...没说话。`);
    return;
  }

  const title = mode === 'compliment' ? '一句夸奖' : '一顿 roast';
  console.log(`  ══ ${state.soul.name} 的${title} ══`);
  console.log('');
  for (const line of reply.split('\n')) {
    console.log('  ' + line);
  }
  console.log('');
}

try { main(); } catch (e) {
  console.error('roast error:', e.message);
  process.exit(1);
}
