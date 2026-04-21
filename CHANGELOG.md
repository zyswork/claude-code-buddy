# 更新记录

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
