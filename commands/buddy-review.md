---
description: 让伙伴基于 git diff 评一下你当前的改动（友好型，非严肃 review）
---

运行（带参数；默认看 HEAD diff，--staged 看已暂存，HEAD~3 看最近 3 个 commit 范围）：

```
NODE_OPTIONS= node ${CLAUDE_PLUGIN_ROOT}/scripts/review.js $ARGUMENTS
```

展示输出。
