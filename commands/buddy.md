---
description: 孵化/查看你的 ASCII 桌面伙伴（含 starter 选择流）
---

## 你的任务

这个命令的行为分成两种情况：**已孵化** 直接展示卡片；**未孵化** 走"命定+可选"流程。

### 分支 1：已孵化

先跑：

```
NODE_OPTIONS= node ${CLAUDE_PLUGIN_ROOT}/scripts/render.js
```

如果输出里 **没有** "你还没有伙伴" 字样，任务完成。把输出原样展示给用户，结束。

### 分支 2：未孵化（首次）

如果输出里含有 "你还没有伙伴"，按下面步骤走 starter 选择流。

#### 步骤 1：展示"命定主角色"

先读取命定骨骼：

```
NODE_OPTIONS= node -e "const {roll, companionUserId} = require('${CLAUDE_PLUGIN_ROOT}/scripts/lib/roll.js'); const {getCharacter} = require('${CLAUDE_PLUGIN_ROOT}/scripts/lib/characters.js'); const b = roll(companionUserId()); const c = getCharacter(b.species); console.log(JSON.stringify({...b, character: c}));"
```

把解析结果展示给用户，告诉他们**宇宙给了你一只这个**：

```
宇宙给你的伙伴是：

    ★★ UNCOMMON                 ← 这里填实际稀有度
    
    🐰 兔精                      ← 这里填实际物种和 emoji
    
    调试力 55 · 耐心 20 · 混沌 10 · 智慧 80 · 毒舌 5

这是你的"本命角色"，终身不变。不过你可以：
1. 留下它 —— 就用这只孵化
2. 或者换个 starter —— 我给你看 18 种备选
```

然后**停下来等用户回复**选择。

#### 步骤 2a：用户选"留下"

以命定的 species 为基础，让你（Claude）生成灵魂（name + personality），参考 `examples/personality-presets.md` 的风格（东北话/软妹/文言/毒舌等随机挑一种匹配物种气质）。

然后写入 state：

```
NODE_OPTIONS= node -e "
const NAME = JSON.parse(\`<NAME_JSON>\`);
const PERSONALITY = JSON.parse(\`<PERSONALITY_JSON>\`);
const {updateState} = require('${CLAUDE_PLUGIN_ROOT}/scripts/lib/state.js');
updateState({
  soul: { name: NAME, personality: PERSONALITY, hatchedAt: Date.now() },
  form: null,
});
console.log('✓ 孵化完成：' + NAME);
"
```

其中 `<NAME_JSON>` 和 `<PERSONALITY_JSON>` 是 `JSON.stringify("中文名")` 和 `JSON.stringify("性格描述")` 的结果（自己算好，不要自动套引号）。

最后 `NODE_OPTIONS= node ${CLAUDE_PLUGIN_ROOT}/scripts/render.js` 展示完整卡片。

#### 步骤 2b：用户选"换个"

跑：

```
NODE_OPTIONS= node ${CLAUDE_PLUGIN_ROOT}/scripts/dex.js --pool starter
```

把 18 种 starter 列表展示给用户。告诉他 "选一个名字告诉我"。

等用户回复后，你要：

1. 确认他选的物种存在（对应 character.id 或 nameCn）
2. 根据**用户选的物种**（而不是命定的）生成灵魂
3. 写入 state，同时把 `form` 设成用户选的 id（这样视觉就变他选的；但骨骼仍是命定的，保持身份绑定）：

```
NODE_OPTIONS= node -e "
const NAME = JSON.parse(\`<NAME_JSON>\`);
const PERSONALITY = JSON.parse(\`<PERSONALITY_JSON>\`);
const FORM = '<CHOSEN_SPECIES_ID>';
const {updateState} = require('${CLAUDE_PLUGIN_ROOT}/scripts/lib/state.js');
updateState({
  soul: { name: NAME, personality: PERSONALITY, hatchedAt: Date.now() },
  form: FORM,
});
console.log('✓ 孵化完成：' + NAME + ' (' + FORM + ' 形态)');
"
```

最后 `NODE_OPTIONS= node ${CLAUDE_PLUGIN_ROOT}/scripts/render.js` 展示卡片。

### 欢迎语

成功孵化后说一句欢迎，例如："欢迎 [名字] 加入你的 terminal！记得偶尔 /claude-buddy:buddy-pet 摸摸它。"

### 重要注意

- 全程中文对话
- **不要暴露内部命令和 state JSON** 给用户，他们只看成品卡片
- 起名 2-3 字带个性，性格 ≤60 字说话风格鲜明
- 如果用户改主意要重选，重新跑步骤 2b 就行
