#!/usr/bin/env node
// 在终端等宽渲染指定 sprite，带列尺和位宽检查
// 用法：
//   node scripts/preview-sprite.js              → 列出所有
//   node scripts/preview-sprite.js duck         → 渲染 duck，3 帧
//   node scripts/preview-sprite.js duck --eye ✦ → 用指定眼睛
//   node scripts/preview-sprite.js duck --audit → 额外显示每行实际字符数/显示列数
//   node scripts/preview-sprite.js --all        → 所有物种逐一渲染
//   node scripts/preview-sprite.js --new        → 只渲染 v2 新设计（sprites-v2.js）

const path = require('path');

// 计算字符串的"显示列宽"（East Asian Wide / Ambiguous 会占 2 列）
// 不是完整 wcwidth，但覆盖常见情况
function displayWidth(str) {
  let w = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    // 控制字符 0 宽
    if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) continue;
    // East Asian Wide / Fullwidth 范围
    if (
      (cp >= 0x1100 && cp <= 0x115f) ||   // Hangul Jamo
      (cp >= 0x2e80 && cp <= 0x303e) ||   // CJK 标点
      (cp >= 0x3041 && cp <= 0x33ff) ||   // 平片假名 + 汉字兼容
      (cp >= 0x3400 && cp <= 0x4dbf) ||   // CJK Ext A
      (cp >= 0x4e00 && cp <= 0x9fff) ||   // CJK 基本
      (cp >= 0xa000 && cp <= 0xa4cf) ||   // Yi
      (cp >= 0xac00 && cp <= 0xd7a3) ||   // Hangul 音节
      (cp >= 0xf900 && cp <= 0xfaff) ||   // CJK 兼容
      (cp >= 0xfe30 && cp <= 0xfe4f) ||   // CJK 兼容表格
      (cp >= 0xff00 && cp <= 0xff60) ||   // 全角 ASCII
      (cp >= 0xffe0 && cp <= 0xffe6) ||   // 全角符号
      (cp >= 0x1f300 && cp <= 0x1faff)    // Emoji 大部分
    ) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}

// 给一行加上列尺 + 长度审计
function auditLine(line, expected = 12) {
  const actual = displayWidth(line);
  const charCount = [...line].length;
  const tag =
    actual === expected ? '✓'
      : actual < expected ? `✗ 少 ${expected - actual}`
      : `✗ 多 ${actual - expected}`;
  return `${line.padEnd(20)}│ 字符数=${charCount} 显示列=${actual} ${tag}`;
}

function renderRuler() {
  const ruler = '123456789012';
  return '\x1b[90m' + ruler + '\x1b[0m';
}

function renderFrame(frame, eye, label, audit) {
  const lines = frame.map((l) => l.replaceAll('{E}', eye));
  const out = [];
  out.push(`\x1b[1m${label}\x1b[0m`);
  out.push('┌────────────');
  out.push('│' + renderRuler() + '  ← 列尺');
  for (const line of lines) {
    out.push('│' + line);
  }
  out.push('└────────────');
  if (audit) {
    out.push('\x1b[90m审计（严格 12 列）:\x1b[0m');
    for (const line of lines) {
      out.push('  ' + auditLine(line));
    }
  }
  return out.join('\n');
}

function loadSprites(useV2) {
  const base = require(path.join(__dirname, 'lib', 'sprites.js'));
  // v2 文件可能不存在，优雅降级
  let v2 = null;
  try {
    v2 = require(path.join(__dirname, 'lib', 'sprites-v2.js'));
  } catch (_) { /* ok */ }
  return useV2 && v2 ? v2 : base;
}

function main() {
  const args = process.argv.slice(2);
  const audit = args.includes('--audit');
  const useV2 = args.includes('--new');
  const showAll = args.includes('--all');
  const eyeIdx = args.indexOf('--eye');
  const eye = eyeIdx >= 0 ? args[eyeIdx + 1] : '·';

  // 跳过 flag 找名字
  const name = args.find((a) => !a.startsWith('--') && a !== eye);

  const sprites = loadSprites(useV2);

  // 需要直接拿 BODIES 记录（v1/v2 都应导出）
  // sprites.js 里没导出 BODIES，我们借 renderSprite 逐帧调
  const { renderSprite, spriteFrameCount } = sprites;

  // 枚举可用物种：目前从 lib/types.js 读
  const { SPECIES } = require('./lib/types.js');

  const list = showAll ? SPECIES : (name ? [name] : null);

  if (!list) {
    console.log('\n可用物种：\n' + SPECIES.join(' · '));
    console.log('\n用法：');
    console.log('  node scripts/preview-sprite.js <物种>');
    console.log('  node scripts/preview-sprite.js <物种> --audit');
    console.log('  node scripts/preview-sprite.js <物种> --eye ✦');
    console.log('  node scripts/preview-sprite.js --all');
    console.log('  node scripts/preview-sprite.js --new     (渲染 sprites-v2.js)');
    return;
  }

  for (const species of list) {
    if (!SPECIES.includes(species)) {
      console.log(`\n⚠️  未知物种: ${species}`);
      continue;
    }
    const frameCount = spriteFrameCount(species);
    console.log('\n' + '═'.repeat(40));
    console.log(`\x1b[1;33m物种: ${species}\x1b[0m  眼睛: ${eye}  帧数: ${frameCount}`);
    console.log('═'.repeat(40));
    for (let i = 0; i < frameCount; i++) {
      const fakeBones = { species, eye, hat: 'none' };
      const frame = renderSprite(fakeBones, i);
      console.log(renderFrame(frame, eye, `—— 帧 ${i} ——`, audit));
      console.log('');
    }
  }
}

try { main(); } catch (e) {
  console.error('preview 出错：', e.message);
  process.exit(1);
}
