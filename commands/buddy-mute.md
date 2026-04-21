---
description: 让伙伴闭嘴（或恢复说话）
---

解析用户输入 $ARGUMENTS，如果是 "off" 或空 → 静音；如果是 "on" → 取消静音。

```
NODE_OPTIONS= node -e "
const {readState, updateState} = require('${CLAUDE_PLUGIN_ROOT}/scripts/lib/state.js');
const arg = '$ARGUMENTS'.trim();
const s = readState();
if (!s.soul) { console.log('还没孵化伙伴'); process.exit(0); }
const muted = arg === 'on' ? false : true;
updateState({ muted });
console.log(muted ? (s.soul.name + ' 闭嘴了 🤐') : (s.soul.name + ' 开始说话了 💬'));
"
```

展示输出。
