# 更新记录

## v0.8.0 · 2026-04-21 — LLM 吐槽缓冲（让伙伴真会说话）

旧版每次 Stop 都可能同步调 claude -p（8s 延迟），为了体验只给 30% 概率发声。新架构：**批量预生成 + 后台补充 + 缓冲即取**。

### 工作原理

```
Stop hook 触发
  └─ 30% 想说话
      └─ 缓冲里拿最匹配当前心情的一条（0ms）
          └─ 缓冲 <3 条？后台 detached 进程调 claude -p 批量生成 5 条
              └─ 都失败？走预设备用池
```

**一次 claude -p 生成 5 条**，用上之后才再调；单轮对话从不阻塞。

### 新增文件

- `lib/quip-buffer.js` — 缓冲的数据结构 + 过期逻辑（24h TTL）
- `scripts/refill-quips.js` — 独立后台进程，批量生成
- `scripts/voice.js` + `/buddy-voice` — 调试命令看缓冲状态和 quip 来源

### 丰富的 LLM 上下文

批量生成的 prompt 现在带上：
- 当前心情 + emoji（8 种情绪之一）
- 等级 / 进化阶段 / 亲密度
- 主特长属性
- `/buddy-teach` 教过的事实（最近 5 条）
- 当前场景（error / success / tired / lonely / hungry / ...）
- 已解锁的隐藏角色数

### 调试手段

`/claude-buddy:buddy-voice` 随时看：
- 当前心情
- 缓冲里还有几条、各 mood 是啥
- 最新一条 quip 的来源（buffer / claude_sync / timeEgg / fallback / evolve / levelup）
- 提示怎么开 BUDDY_DEBUG=1 排查

## v0.7.0 · 2026-04-21 — 代码评审 + 心情体感 + 主动问候 + 技能树

### `/buddy-review` 代码评审
读当前 git diff（默认 HEAD、`--staged` 或 `HEAD~N`），让伙伴以自己性格评改动：变量名/结构/细节。不是严肃 code review，是朋友视角。

### 心情系统（动态情绪）
`lib/mood.js` 从 state 推断 8 种情绪：**幸福/开心/专注/累/烦躁/想你/想摸摸/亢奋**。影响：
- 卡片 Lv 行末加 emoji 状态
- statusline 显示心情 emoji
- 默认 quip 池跟心情走（烦躁时吐槽变苦、幸福时变亲昵）

### 主动问候（SessionStart hook）
每日首次打开 Claude Code 时，伙伴主动发问：按心情选问题（"昨天那 bug 搞定了吗"、"今天打算写啥"、"你去哪了啊"）。每天首次登录还送 +2 XP +1 ♥。

### `/buddy-skill` 技能树
每升 1 级送 1 技能点，可以分配到 5 属性（调试力/耐心值/混沌值/智慧点/毒舌度），上限 100。`reset` 一键重置。伙伴属性终于能靠主人陪伴**逆天改命**，不再只看命定骨骼。

## v0.6.0 · 2026-04-21 — 第二批隐藏角色 + 记忆 + 季节皮肤

### 新增角色（+5 只）
- 🐢 **河童** Kappa — 写日记 3 次解锁
- 🔥 **凤凰** Phoenix — buddy 退休后重新孵化解锁（浴火重生）
- 🐕 **刻耳柏洛斯** Cerberus — 在 3 个不同项目切换解锁
- 🐍 **九头蛇** Hydra — 连续 3 轮 debug 越修越多解锁
- ✨ **九尾狐仙** 九尾 — 妲己解锁后 30 天修成（神秘）

### 季节/节日皮肤
按本地日期自动在 sprite 顶上叠装饰行：春节 / 元宵 / 愚人节 / 劳动节 / 端午 / 情人节 / 中秋 / 国庆 / 万圣夜 / 圣诞 / 跨年

### LLM 深度
- `/buddy-teach "事实"` 教伙伴记住关于你的事实，最多 10 条
- chat.js 的 prompt 注入：**亲密度级别**（决定语气亲疏）、**记忆**、**最近情绪**
- bond < 20 拘谨、20-50 友善、50-80 亲近、80+ 可撒娇

### 图鉴详情页
`/buddy-dex --detail <名字>` — 单只角色的大图 sprite + 神话 lore + 解锁条件 + 进度

### 终端快速呼唤
`bash scripts/setup-alias.sh` 一键写入 `.zshrc` 的 `bd`/`buddy`/`bdpet`/`bdcard` 别名，无需打开 Claude Code 也能随时互动。

## v0.5.0 · 2026-04-21 — 生命循环 + 每日任务

让 buddy 有真正的**开始和结束**。

- **`/buddy-retire`** Lv 99 满级退休机制：荣休仪式 + 存档
- **`/buddy-graveyard`** 墓地纪念册，永久留档所有退休伙伴
- **`/buddy-daily`** 每日 3 个随机任务（每天按日期+userId 种子稳定），全清 +50 XP +5 ♥
- **进化全屏庆祝横幅**：Lv 5 成年 / Lv 15 进化态首次触发时整屏 ASCII 庆祝，一次性
- **成就从 6 个扩到 12 个**：加 `commit 百人队长`、`末日幸存者`、`月光陪伴`、`修行者 Lv 10`、`成年礼`、`收集家`
- 退休后主角色清零但 `unlocks` 保留——隐藏角色收集可以跨代传承

## v0.4.0 · 2026-04-21 — Deep LLM 集成

让伙伴真正"会说话"——不再只是预设吐槽。

- **`/buddy-chat`** 跟伙伴直接对话，保留最近 6 轮上下文，主 Claude 闪身
- **`/buddy-advice`** 传说级智慧建议（Lv 10+ 或 epic/legendary 稀有度解锁）
- **`/buddy-card`** 生成可分享的 ASCII 名片（sprite + 属性 + 成就 + 隐藏角色）
- **`/buddy-roast`** 读 git log 最近 7 天 commit，让伙伴基于真实内容 roast 或夸奖
- `state.chatHistory` 字段持久化对话上下文

## v0.3.3 · 2026-04-21 — 时间彩蛋 + Konami 密语

- 时间触发：凌晨 2-4 点、周末、愚人节、圣诞节、墨墨 hatch-day 周年
- 深夜访问累计（烛龙解锁路径）
- 7 条 Konami 密语彩蛋：`芝麻开门` / `hello there` / `i love you` / `小墨万岁` 等
- Debug 关键词检测（UserPromptSubmit hook），`bug/fix/修/调试` 自动加 counter
- `/buddy-rename` 命令，累计改名 9 次解锁妲己

## v0.3.2 · 2026-04-21 — PreToolUse + 成就 + 隐藏角色

- PreToolUse hook 侦测 Bash 里的 `git commit` / `rm -rf`，累计 counter
- 6 个基础成就（初遇 / 七日 / 百摸 / 十 commit / 末日目击 / 首次升级）
- 隐藏角色触发引擎，首批 5 只神话角色：
  - 🥟 饕餮（摸 50 次）
  - 🐦‍⬛ 精卫（见 50 次 debug）
  - 🐲 应龙（见 100 次 commit）
  - 🌑 烛龙（深夜访问 3 次）
  - 🦊 妲己（改名 9 次，神秘触发）
- `/buddy-hint` 命令给最接近解锁的线索

## v0.3.1 · 2026-04-20 — 成长系统

- 等级 Lv 1-99（`10 * n^1.5` XP 曲线）
- 亲密度 ♥ 0-100
- 进化两档：Lv 5 + ♥ 30 → 成年；Lv 15 + ♥ 80 → 进化态
- 卡片显示 XP 进度条、亲密度、陪伴天数、累计 commit/debug/摸摸次数
- `/buddy` 首次运行加入 starter 选择流

## v0.3.0-alpha · 2026-04-20 — 角色注册表 + 图鉴

- 统一 `lib/characters.js` 注册表，18 物种带 emoji + 中文名 + 池分组
- `/buddy-dex` 图鉴命令，按池分组展示解锁状态
- `/buddy-swap` 切换形态，主灵魂不变只换外壳
- statusline 支持 emoji / ascii / both 三种风格
- preview-sprite.js 工具校验 ASCII 对齐

## v0.2.1 · 2026-04-19 — 鲁棒性与观察器改进

- 所有 node 调用前加 `NODE_OPTIONS=` 保护，免疫用户全局 NODE_OPTIONS 污染（openclaw 等）
- observer 递归自调用守卫（BUDDY_OBSERVER_DISABLE）
- state 文件原子写（tmp + rename），防半截 JSON
- observer 接入 `claude -p`，基于伙伴 personality 生成中文吐槽

## v0.1.0 · 2026-04-19 — 首次发布

基于 [泄露源码](https://github.com/anthropics/claude-code/tree/main/src/buddy) 的 Claude Code 愚人节 `/buddy` 彩蛋复刻。

- 确定性骨骼系统（userId 哈希投骰出稀有度/物种/属性）
- 18 种 ASCII 精灵（鸭/龙/猫/猫头鹰/章鱼...）
- 5 档稀有度（common / uncommon / rare / epic / legendary）+ 1% shiny
- 4 个命令：`/buddy` · `/buddy-pet` · `/buddy-mute` · `/buddy-diary`
- statusline 常驻底栏
- Stop hook 每轮对话 30% 概率吐槽
