#!/usr/bin/env bash
# 在 ~/.zshrc 或 ~/.bashrc 注入 `bd`/`buddy` 别名
# 让你在普通终端里直接跟伙伴说话（绕过 Claude Code UI）
#
# 用法：
#   bash scripts/setup-alias.sh
#   bd "最近怎么样"
#   buddy "帮我看看这个 bug"

set -euo pipefail

# 找到 claude-buddy 的安装位置
CACHE="${HOME}/.claude/plugins/cache/claude-code-buddy"
if [ -d "$CACHE" ]; then
  BUDDY_DIR="$(find "$CACHE" -maxdepth 3 -name chat.js -type f -exec dirname {} \; | head -1)"
else
  # 回退到脚本所在位置（开发场景）
  BUDDY_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

if [ ! -f "$BUDDY_DIR/chat.js" ]; then
  echo "❌ 没找到 claude-buddy 的 chat.js。先装插件再运行。"
  exit 1
fi

# 检测 shell
SHELL_NAME="$(basename "${SHELL:-/bin/bash}")"
case "$SHELL_NAME" in
  zsh)  RC_FILE="$HOME/.zshrc" ;;
  bash) RC_FILE="$HOME/.bashrc" ;;
  *)    RC_FILE="$HOME/.profile" ;;
esac

MARKER="# >>> claude-buddy aliases >>>"
END_MARKER="# <<< claude-buddy aliases <<<"

# 如果已有标记，提示用户手动清
if grep -q "$MARKER" "$RC_FILE" 2>/dev/null; then
  echo "⚠️  $RC_FILE 里已有 claude-buddy 别名。先删除再重装，或手动更新。"
  exit 1
fi

cat >> "$RC_FILE" <<EOF

$MARKER
# claude-code-buddy: 终端快速呼唤
alias bd='NODE_OPTIONS= node $BUDDY_DIR/chat.js'
alias buddy='NODE_OPTIONS= node $BUDDY_DIR/chat.js'
alias bdpet='NODE_OPTIONS= node $BUDDY_DIR/pet.js'
alias bdcard='NODE_OPTIONS= node $BUDDY_DIR/card.js'
alias bddex='NODE_OPTIONS= node $BUDDY_DIR/dex.js'
alias bddaily='NODE_OPTIONS= node $BUDDY_DIR/daily.js'
$END_MARKER
EOF

echo "✓ 别名已写入 $RC_FILE"
echo "  运行 'source $RC_FILE' 或重开终端即可使用："
echo "    bd \"最近怎么样\"   # 跟伙伴说话"
echo "    bdpet              # 摸摸"
echo "    bdcard             # 查看名片"
echo "    bddex              # 图鉴"
echo "    bddaily            # 今日任务"
