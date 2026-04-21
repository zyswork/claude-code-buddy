#!/usr/bin/env node
// /buddy-review：读当前 cwd 的 git diff，以 buddy 性格评一下本次改动
// 关注点：命名、复杂度、常见坑——不是认真 code review，是朋友视角

const { spawnSync, execSync } = require('child_process');
const { readState } = require('./lib/state.js');

const TIMEOUT_MS = 30000;
const MAX_DIFF_CHARS = 20000;  // 太长就截断

function getDiff(args) {
  try {
    const staged = args.includes('--staged');
    const range = args.find((a) => a.startsWith('HEAD'));
    let cmd;
    if (range) {
      cmd = `git diff ${range}`;
    } else if (staged) {
      cmd = 'git diff --staged';
    } else {
      // 默认：staged + unstaged 合并
      cmd = 'git diff HEAD';
    }
    const out = execSync(cmd, {
      encoding: 'utf8',
      timeout: 8000,
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 10 * 1024 * 1024,
    });
    return out;
  } catch (_e) { return null; }
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

  const args = process.argv.slice(2);
  let diff = getDiff(args);
  if (!diff || diff.trim().length === 0) {
    console.log('  ⚠️  当前目录没有 diff 可看（可能不是 git 仓库，或者没改动）。');
    console.log(`  ${state.soul.name}: "没东西让我评啊。"`);
    return;
  }
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + '\n[...diff 被截断...]';
  }

  const prompt = `你叫"${state.soul.name}"，${state.soul.personality}

主人当前 git 目录的改动 diff：

${diff}

请以你的性格**评一下**这次改动：
1. 说一两句整体观感（变量名/注释/结构怎样）
2. 挑 1-2 处具体细节说（赞美或吐槽）
3. 保持你的语气（${state.soul.personality}），不是严肃 code review

要求：≤180 字，全程中文，一段成文别分条列点。只输出正文。`;

  console.log('');
  console.log(`  ⚡ ${state.soul.name} 在翻你的 diff...`);
  console.log('');
  const reply = callClaude(prompt);
  if (!reply) {
    console.log(`  ${state.soul.name}: "...看不懂（claude -p 没响应）。"`);
    return;
  }

  console.log(`  ══ ${state.soul.name} 的评审 ══`);
  console.log('');
  for (const line of reply.split('\n')) console.log('  ' + line);
  console.log('');
}

try { main(); } catch (e) {
  console.error('review error:', e.message);
  process.exit(1);
}
