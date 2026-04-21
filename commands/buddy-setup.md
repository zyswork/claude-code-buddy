---
description: 把伙伴精灵装进 statusline（一次设置，永久显示）
---

运行以下命令（注意 `$CLAUDE_PLUGIN_ROOT` 是 Claude Code 在命令执行时注入的环境变量，指向插件实际安装路径；要把它解成绝对路径写进 settings.json，因为 statusline 会在插件上下文外执行）：

```bash
bash -c '
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
if [ -z "$PLUGIN_ROOT" ]; then
  echo "⚠️  无法检测插件安装路径（CLAUDE_PLUGIN_ROOT 未设置）"
  echo "请手动把以下命令写进 ~/.claude/settings.json 的 statusLine.command："
  echo "    node /绝对路径/claude-buddy/scripts/statusline.js"
  exit 1
fi

NODE_OPTIONS= node - <<EOF
const fs = require("fs");
const path = require("path");
const os = require("os");
const settingsPath = path.join(os.homedir(), ".claude", "settings.json");
let s = {};
try { s = JSON.parse(fs.readFileSync(settingsPath, "utf8")); } catch(_) {}
const existing = s.statusLine?.command || "";
const newCmd = "NODE_OPTIONS= node $PLUGIN_ROOT/scripts/statusline.js";
if (existing && !existing.includes("claude-buddy") && existing !== newCmd) {
  console.log("⚠️  检测到你已有其他 statusline：");
  console.log("    " + existing);
  console.log("");
  console.log("claude-buddy 和其他 statusline 同时只能用一个。");
  console.log("要换成 buddy，请手动把 settings.json 的 statusLine.command 改成：");
  console.log("    " + newCmd);
  process.exit(0);
}
s.statusLine = { type: "command", command: newCmd };
fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2), "utf8");
console.log("✓ statusline 已启用");
console.log("  命令：" + newCmd);
console.log("  重启 Claude Code 就能看到你的伙伴常驻底栏");
EOF
'
```

展示输出。
