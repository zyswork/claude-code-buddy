---
description: 让伙伴写一篇今天的日记（它视角看你在干啥）
---

## 你的任务

用伙伴的视角，给用户写一篇今天的小日记。

### 步骤 1：读取伙伴信息

```
NODE_OPTIONS= node -e "
const {roll, companionUserId} = require('${CLAUDE_PLUGIN_ROOT}/scripts/lib/roll.js');
const {readState} = require('${CLAUDE_PLUGIN_ROOT}/scripts/lib/state.js');
const s = readState();
if (!s.soul) { console.log('NOT_HATCHED'); process.exit(0); }
console.log(JSON.stringify({
  name: s.soul.name,
  personality: s.soul.personality,
  bones: roll(companionUserId()),
  hatchedAt: s.soul.hatchedAt,
}));
"
```

如果输出是 `NOT_HATCHED`，告诉用户"先跑 /buddy 孵化一只吧"，结束。

### 步骤 2：收集今日素材

根据你的能力：
- 看看当前目录的 `git log --since=today` 或 `git diff` 了解用户今天动过什么
- 回想本次会话里用户做了哪些操作（debug、refactor、建新文件、跑测试……）

### 步骤 3：以伙伴视角写日记

**用伙伴的性格语气**（步骤 1 拿到的 `personality`）写 150-300 字的日记，第一人称。

日记可以包含：
- "今天我看着主人 XX 了一下午"
- 对某个具体行为的吐槽或夸奖
- 伙伴自己的内心戏（饿了/困了/想出去玩）
- 对明天的期待

**日记开头**：`📓 ${name} 的日记 · ${YYYY-MM-DD}`

**注意**：日记是伙伴写的，不是你写的；保持它的性格；全程中文。
