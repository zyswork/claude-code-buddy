# 命令完整参考

claude-code-buddy v1.0 · 24 条命令

> 所有命令都以 `/claude-buddy:` 为前缀（Claude Code 的插件命名空间机制）。

## 🌱 基础养成

### `/claude-buddy:buddy`
**孵化或查看伙伴卡片。**

首次运行：展示"命定角色"→ 让你选"留下"或"换其他 starter"→ 生成灵魂（name + personality）。
之后运行：显示完整卡片（sprite + rarity + Lv/XP/bond + 属性 + 累计数据）。

### `/claude-buddy:buddy-pet`
**摸摸伙伴。**

每次 +1 XP +2 亲密度。累计 50 次解锁饕餮，累计 100 次触发"你是不是太闲了"。

### `/claude-buddy:buddy-rename <新名>`
**给伙伴改名。**

主人改名 9 次会**神秘**解锁妲己——从此 30 天后还能修成九尾狐仙。

### `/claude-buddy:buddy-mute [on]`
**静音伙伴。**

无参数 → 静音；`on` → 恢复说话。静音期间 statusline 不显示 quip。

### `/claude-buddy:buddy-setup`
**一键把 statusline 写进 `~/.claude/settings.json`。**

检测到其他 statusline（如 claude-hud）时会提示手动切换，不强覆盖。

### `/claude-buddy:buddy-daily [claim]`
**今日 3 个随机任务。**

每天按本地日期 + userId 生成稳定任务组合（摸摸 1-3 次、聊天、commit、改名、对话等）。`claim` 领取全清奖励 +50 XP +5 ♥。

---

## 🧬 图鉴与形态

### `/claude-buddy:buddy-dex`
**完整图鉴。**

按池分组展示所有 28 角色。starter 池 18 只永远解锁；spirit/beast/divine/myth 池需要触发条件。未解锁显示 `???`（神秘型）或 `??? + 提示`（明示型）。

### `/claude-buddy:buddy-dex --detail <名字>`
**单只角色详情页。**

参数支持中文名 / id / emoji。已解锁显示大图 sprite + 神话 lore + 属性；未解锁显示解锁条件 + 进度条。

### `/claude-buddy:buddy-swap <名字>`
**切换形态。**

主灵魂（name + personality + stats）不变，只换 sprite 外壳和 emoji。无参数回本体。只能切换已解锁的角色。

### `/claude-buddy:buddy-hint`
**给下一个最接近解锁的隐藏角色线索。**

找到进度最高（0% 也算）的那只，展示：`线索：<进度描述> 40/50 (80%) · 目标：🥟 饕餮`。神秘型（妲己/九尾狐仙）只显示 `???`。

---

## 💬 深度 LLM 互动

所有 LLM 命令都走 `claude -p` 子进程，**流量走你当前 Claude Code 登录通道**（含 openclaw 等代理）。

### `/claude-buddy:buddy-chat <话>`
**跟伙伴直接对话。**

Prompt 包含：personality + 亲密度级别（决定语气亲疏）+ 最近 6 轮对话历史 + 10 条记忆（见 teach）+ 最近情绪。伙伴以自己口吻回一句（≤50 字）。主 Claude 不参与。

### `/claude-buddy:buddy-teach <事实>`
**教伙伴记住关于你的事。**

最多 10 条，超出滚动淘汰。chat / advice / insight 的 prompt 里都会带上这些记忆。`clear` 或 `清空` 一键忘光。

### `/claude-buddy:buddy-advice <问题>`
**传说级智慧建议。**

解锁条件：**Lv 10+** 或 **epic/legendary** 稀有度。基于伙伴稀有度 + 特长属性 + 性格给 ≤150 字的真诚建议（不是客套话）。

### `/claude-buddy:buddy-review [--staged | HEAD~N]`
**基于 git diff 评改动。**

默认看 `git diff HEAD`，`--staged` 看已暂存，`HEAD~3` 看最近 3 个 commit。伙伴评整体观感 + 挑 1-2 处具体细节。不是严肃 code review，是朋友视角。

### `/claude-buddy:buddy-roast [compliment]`
**基于 7 天 git log 毒舌或夸奖。**

默认 roast 模式。加参数 `compliment` 或 `夸` 改夸奖模式。要求基于真实 commit 内容和节奏，不泛泛而谈。

### `/claude-buddy:buddy-insight` 🆕
**本周观察报告（旗舰功能）。**

读 `~/.claude/buddy-events.jsonl` 最近 7 天事件，聚合成摘要（commit 数、debug 数、活跃时段、深夜次数、解锁、成就 ...），让伙伴生成 200-350 字观察报告。结构：**整体观察 / 想说的话 / 建议 / 结尾吐槽**。

### `/claude-buddy:buddy-diary`
**今日日记。**

让伙伴以第一人称写"我今天看主人干了啥"。每次调用 `hiddenProgress.diaryCount++`，写 3 次解锁河童。

---

## 🌳 养成与技能

### `/claude-buddy:buddy-skill [属性中文名 数量 | reset]`
**技能点分配。**

每升 1 级得 1 点，可分配到 5 属性：调试力 / 耐心值 / 混沌值 / 智慧点 / 毒舌度。

- 无参数：列表显示当前分配
- `调试力 3`：投 3 点到调试力
- `毒舌度 -1`：回收 1 点
- `reset`：全部重置

最终属性 = 骨骼基础 + 技能点（上限 100）。

---

## 🪦 生命周期

### `/claude-buddy:buddy-retire [confirm]`
**Lv 99 满级退休仪式。**

无参数 → 显示退休后果 + 需要 `confirm` 确认。
`confirm` → 真退休：伙伴存入墓地，主角色清零。**unlocks 保留**——隐藏角色收集跨代传承。

退休后再次 `/buddy` 会走 starter 选择流孵化新伙伴。有退休记录 + 重新孵化 → 解锁凤凰 🔥（浴火重生）。

### `/claude-buddy:buddy-graveyard`
**墓地纪念册。**

展示所有退休过的伙伴：最终等级 / 亲密度 / 陪伴天数 / commit 数 / 成就数 + 性格摘录。

---

## 🎨 分享与输出

### `/claude-buddy:buddy-card`
**生成可分享 ASCII 名片。**

40 字符宽的漂亮名片，含 sprite + 稀有度 + 等级 + 属性 + 成就 + 隐藏角色 emoji 列。可截图发社交媒体。

---

## 🔍 调试与分析

### `/claude-buddy:buddy-voice`
**LLM 通道诊断。**

显示当前心情 + LLM 缓冲队列（每条 quip 的 mood 和生成时间）+ 最新 quip 的来源标签（buffer/claude_sync/timeEgg/konami/fallback/greeting/levelup/evolve）。

### `/claude-buddy:buddy-log [--type X --since 1h --limit N]`
**事件流查看。**

14 种事件类型。支持按类型过滤、按时间过滤（1h/24h/7d/30d）、限制条数。

示例：
```
/claude-buddy:buddy-log --type bash_commit --since 24h
/claude-buddy:buddy-log --type konami --limit 5
/claude-buddy:buddy-log --since 1h
```

### `/claude-buddy:buddy-stats`
**今日 / 本周 / 总计 事件统计。**

每档展示各事件类型计数 + ASCII 条形图。

---

## Hook 事件

插件注册的 hook 和它们发射的事件：

| Hook 事件 | 触发时机 | 发射的 event type |
|---|---|---|
| `Stop` | 每轮对话结束 | `turn_end` / `levelup` / `evolve` / `night_visit` |
| `PreToolUse` (Bash) | 执行 Bash 工具前 | `bash_commit` / `bash_rm_rf` |
| `UserPromptSubmit` | 用户发消息时 | `debug_keyword` / `konami` |
| `SessionStart` | Claude Code 启动/恢复 | `daily_login` / `greeting` |

直接由命令触发的：
| 命令 | 发射的 event |
|---|---|
| `/buddy-pet` | `pet` + 可能 levelup/evolve |
| `/buddy-rename` | `rename` |
| `/buddy-diary` | 间接触发 `character_unlocked` (河童) |
| 任意导致新解锁的操作 | `achievement_unlocked` / `character_unlocked` |

---

## 环境变量

| 变量 | 作用 |
|---|---|
| `BUDDY_STATUSLINE_STYLE` | `emoji` / `ascii` / `both`（默认 both）|
| `BUDDY_DEBUG` | 设为 1 时 hook 报错会打印到 stderr，方便调试 |
| `BUDDY_OBSERVER_DISABLE` | **内部**递归守卫，外部不要设 |
| `NODE_OPTIONS` | 所有命令前加 `NODE_OPTIONS=` 强制清空，免疫用户全局 node 污染 |
