---
description: 跟伙伴直接对话（它以自己的性格回复，你不用跟 Claude 说）
---

运行（带用户说的话 $ARGUMENTS）：

```
NODE_OPTIONS= node ${CLAUDE_PLUGIN_ROOT}/scripts/chat.js $ARGUMENTS
```

把输出**原样**展示给用户，**不要加任何解释或补充**。这是伙伴的直接回应，不是你（Claude）的话。
