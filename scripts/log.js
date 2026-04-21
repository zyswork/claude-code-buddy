#!/usr/bin/env node
// /buddy-log：查看最近事件
// 用法：
//   node log.js                      → 最近 20 条
//   node log.js --type bash_commit   → 只看某类型
//   node log.js --since 1h           → 最近 1 小时

const { readEvents, filterSince, filterType, WINDOWS } = require('./lib/events.js');

function parseSince(s) {
  if (!s) return null;
  const m = s.match(/^(\d+)([hdwm])$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult = { h: WINDOWS.hour, d: WINDOWS.day, w: WINDOWS.week, m: WINDOWS.month }[unit];
  return n * mult;
}

function formatTime(ts) {
  const now = Date.now();
  const d = now - ts;
  if (d < 60000) return '刚刚';
  if (d < 3600000) return Math.floor(d / 60000) + '分钟前';
  if (d < 86400000) return Math.floor(d / 3600000) + '小时前';
  return Math.floor(d / 86400000) + '天前';
}

const TYPE_LABELS = {
  turn_end:              '💬 一轮对话结束',
  night_visit:           '🌑 深夜造访',
  bash_commit:           '✅ git commit',
  bash_rm_rf:            '💥 rm -rf 目睹',
  debug_keyword:         '🐛 debug 关键词',
  konami:                '🔮 密语触发',
  pet:                   '❤  摸摸',
  rename:                '✏  改名',
  daily_login:           '📅 每日首登录',
  greeting:              '👋 主动问候',
  achievement_unlocked:  '🏆 成就解锁',
  character_unlocked:    '✨ 发现角色',
  levelup:               '⬆  升级',
  evolve:                '🌟 进化',
};

function describe(e) {
  switch (e.type) {
    case 'bash_commit':         return `${TYPE_LABELS[e.type]}  @ ${e.cwd?.split('/').pop()}`;
    case 'bash_rm_rf':          return `${TYPE_LABELS[e.type]}  「${(e.command || '').slice(0, 30)}」`;
    case 'debug_keyword':       return `${TYPE_LABELS[e.type]}  累计 ${e.totalDebugs}`;
    case 'konami':              return `${TYPE_LABELS[e.type]}  → "${e.response}"`;
    case 'pet':                 return `${TYPE_LABELS[e.type]}  累计 ${e.petCount} 次`;
    case 'rename':              return `${TYPE_LABELS[e.type]}  ${e.from} → ${e.to}`;
    case 'achievement_unlocked':return `${TYPE_LABELS[e.type]}  ${e.name}`;
    case 'character_unlocked':  return `${TYPE_LABELS[e.type]}  ${e.nameCn}（${e.pool}）`;
    case 'levelup':             return `${TYPE_LABELS[e.type]}  Lv ${e.level}`;
    case 'evolve':              return `${TYPE_LABELS[e.type]}  阶段 ${e.stage}`;
    case 'greeting':            return `${TYPE_LABELS[e.type]}  "${e.text}"`;
    case 'night_visit':         return `${TYPE_LABELS[e.type]}  累计 ${e.count}`;
    case 'turn_end':            return `${TYPE_LABELS[e.type]}  +${e.xpGain} XP`;
    case 'daily_login':         return `${TYPE_LABELS[e.type]}  ${e.date}`;
    default:                    return `📎 ${e.type}`;
  }
}

function main() {
  const args = process.argv.slice(2);
  const typeIdx = args.indexOf('--type');
  const sinceIdx = args.indexOf('--since');
  const limitIdx = args.indexOf('--limit');

  const type = typeIdx >= 0 ? args[typeIdx + 1] : null;
  const sinceMs = sinceIdx >= 0 ? parseSince(args[sinceIdx + 1]) : null;
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 20;

  let events = readEvents(5000);
  if (type) events = filterType(events, type);
  if (sinceMs) events = filterSince(events, sinceMs);
  events = events.slice(-limit);

  if (events.length === 0) {
    console.log('');
    console.log('  事件日志为空（或过滤后无结果）。');
    console.log('  随便聊几轮、摸几下、改个名，事件会被记录到 ~/.claude/buddy-events.jsonl');
    console.log('');
    return;
  }

  console.log('');
  console.log(`  📋 事件流 · 最近 ${events.length} 条`);
  console.log('');
  for (const e of events) {
    const ago = formatTime(e.at).padStart(8);
    console.log(`  ${ago}  ${describe(e)}`);
  }
  console.log('');
  console.log('  tip：/claude-buddy:buddy-log --type bash_commit --since 24h');
  console.log('');
}

try { main(); } catch (e) {
  console.error('log error:', e.message);
  process.exit(1);
}
