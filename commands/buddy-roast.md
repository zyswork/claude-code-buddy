---
description: 让伙伴基于你过去 7 天 git log 毒舌一下（或加 compliment 改为夸奖）
---

解析 $ARGUMENTS：如果包含 "compliment" / "夸" 就走夸奖模式，否则默认 roast。

```
NODE_OPTIONS= node ${CLAUDE_PLUGIN_ROOT}/scripts/roast.js $ARGUMENTS
```

把输出原样展示给用户。
