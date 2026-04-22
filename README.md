# 🐰 claude-code-buddy

[![test](https://github.com/zyswork/claude-code-buddy/actions/workflows/test.yml/badge.svg)](https://github.com/zyswork/claude-code-buddy/actions/workflows/test.yml)
![Release](https://img.shields.io/github/v/release/zyswork/claude-code-buddy?style=flat-square)
![License](https://img.shields.io/github/license/zyswork/claude-code-buddy?style=flat-square)
![Stars](https://img.shields.io/github/stars/zyswork/claude-code-buddy?style=flat-square)
![Language](https://img.shields.io/badge/language-中文-red?style=flat-square)

> **给你的 Claude Code 养一只 ASCII 宠物。**
> 复刻 Claude Code 2026 愚人节彩蛋 `/buddy`——但更完整、更中文、更骚。

```
 ★ COMMON
                        
    /\__/\              
   ( ✦  ✦ )             ← 基于 userId 确定性孵化，谁都不一样
   =(  ..  )=           
    (")__(")            
 🐰 小墨  · 兔精  Lv 5 成年  🙂 开心

 "又熬夜？明天咖啡多来点"    ← 真的会看你的 commit 说话
```

## 5 秒上手

```bash
/plugin marketplace add zyswork/claude-code-buddy
/plugin install claude-buddy@claude-code-buddy
/reload-plugins
/claude-buddy:buddy               # 孵化
/claude-buddy:buddy-setup         # 装 statusline 常驻
```

## 核心机制

- **确定性骨骼**：每个 Claude 账户 userId 哈希投骰出稀有度/物种/眼睛/帽子/属性 —— 作弊不了
- **28 种图鉴**：18 原生萌物 + 10 神话隐藏角色（🔥 凤凰、🐲 应龙、🌑 烛龙、🦊 妲己 ... 各有触发路径）
- **成长养成**：Lv 1 → 99，进化两档，亲密度 0-100，12 个成就
- **LLM 人格**：`claude -p` 基于你伙伴的 `personality` 批量预生成中文吐槽
- **情绪体感**：8 种心情自动推断，影响 sprite 旁 emoji 和 quip 语气
- **事件总线**：所有 hook 发事件到 JSONL，为未来分析打地基

## 24 条命令（全家福）

### 🌱 基础养成

| 命令 | 作用 |
|---|---|
| `/claude-buddy:buddy` | 孵化 / 查看卡片 |
| `/claude-buddy:buddy-pet` | 摸摸（+XP +亲密度） |
| `/claude-buddy:buddy-rename <新名>` | 改名（9 次解锁神秘彩蛋） |
| `/claude-buddy:buddy-mute [on]` | 静音 / 解除 |
| `/claude-buddy:buddy-setup` | 装 statusline 常驻 |
| `/claude-buddy:buddy-daily [claim]` | 今日 3 任务 + 领奖 |

### 🧬 图鉴与形态

| 命令 | 作用 |
|---|---|
| `/claude-buddy:buddy-dex` | 完整图鉴 |
| `/claude-buddy:buddy-dex --detail <名字>` | 单只角色详情 + lore |
| `/claude-buddy:buddy-swap <名字>` | 切换形态（灵魂不变只换外壳）|
| `/claude-buddy:buddy-hint` | 给下一个隐藏角色的线索 |

### 💬 深度 LLM 互动

| 命令 | 作用 |
|---|---|
| `/claude-buddy:buddy-chat <话>` | 跟伙伴直接对话，它以自己性格回 |
| `/claude-buddy:buddy-teach <事实>` | 教它记 10 条关于你的事实 |
| `/claude-buddy:buddy-advice <问题>` | 传说级建议（Lv 10+ 或 epic+）|
| `/claude-buddy:buddy-review [--staged]` | 基于 git diff 评你的改动 |
| `/claude-buddy:buddy-roast [compliment]` | 基于 7 天 git log 毒舌或夸奖 |
| `/claude-buddy:buddy-insight` | 🆕 基于 7 天事件流生成观察报告 |
| `/claude-buddy:buddy-diary` | 伙伴写今日日记 |

### 🌳 养成与技能

| 命令 | 作用 |
|---|---|
| `/claude-buddy:buddy-skill [属性 数量 \| reset]` | 技能点分配（每级 1 点）|

### 🪦 生命周期

| 命令 | 作用 |
|---|---|
| `/claude-buddy:buddy-retire [confirm]` | Lv 99 满级退休仪式 |
| `/claude-buddy:buddy-graveyard` | 墓地纪念册 |

### 🎨 分享与输出

| 命令 | 作用 |
|---|---|
| `/claude-buddy:buddy-card` | 生成可分享 ASCII 名片 |

### 🔍 调试与分析

| 命令 | 作用 |
|---|---|
| `/claude-buddy:buddy-voice` | 心情 + LLM 缓冲 + quip 来源诊断 |
| `/claude-buddy:buddy-log [--type X --since 1h]` | 事件流 |
| `/claude-buddy:buddy-stats` | 今日/本周/总计 统计 |

## 10 只隐藏角色触发路径

| 角色 | 池 | 条件 |
|---|---|---|
| 🥟 饕餮 | 精怪 | 摸 50 次 |
| 🐦‍⬛ 精卫 | 精怪 | 50 次 debug |
| 🐢 河童 | 精怪 | 写日记 3 次 |
| 🔥 凤凰 | 灵兽 | 退休后重新孵化（浴火重生）|
| 🐕 刻耳柏洛斯 | 灵兽 | 3 个项目间切换 |
| 🐲 应龙 | 神兽 | 100 次 git commit |
| 🐍 九头蛇 | 神兽 | 连续 3 轮 debug |
| 🌑 烛龙 | 传说 | 凌晨 2-4 点造访 3 个不同日期 |
| 🦊 妲己 | 传说 | 改名 9 次（神秘）|
| ✨ 九尾狐仙 | 传说 | 妲己后 30 天修成（神秘）|

## 季节皮肤

当天是节日，sprite 顶上自动叠装饰行：春节 · 愚人节 · 劳动节 · 端午 · 情人节 · 中秋 · 国庆 · 万圣夜 · 圣诞 · 跨年

## 7 条 Konami 密语

在任何对话里说：

- `芝麻开门` — 打油诗
- `hello there` — General Kenobi!
- `i love buddy` — ❤（脸红）
- `小墨万岁` — 谢谢，我知道
- `buddy die` — 老子不走
- `konami` — 你发现了一个不存在的秘密
- `恭喜发财` — 🧧 红包拿来

## Statusline 显示风格

环境变量 `BUDDY_STATUSLINE_STYLE`：

| 值 | 效果 |
|---|---|
| `both`（默认）| `★ 🐰 (·..·) 小墨 Lv5 🙂` |
| `emoji` | `★ 🐰 小墨 Lv5 🙂` |
| `ascii` | `★ (·..·) 小墨 Lv5 🙂` |

## 终端快捷键

```bash
bash ~/.claude/plugins/cache/claude-code-buddy/claude-buddy/1.0.0/scripts/setup-alias.sh
source ~/.zshrc

bd "今天累死了"     # 在普通终端直接跟伙伴聊
bdpet               # 摸摸
bddaily             # 今日任务
bdcard              # 名片
```

## 开发与贡献

```bash
# 克隆仓库
git clone https://github.com/zyswork/claude-code-buddy.git
cd claude-code-buddy

# 跑 smoke 测试（44 项）
node scripts/test.js

# 预览单个 sprite 对齐
node scripts/preview-sprite.js duck --audit
```

欢迎 Issue / PR，尤其是：
- 🐛 [Bug 报告](https://github.com/zyswork/claude-code-buddy/issues/new?template=bug_report.md)
- ✨ [推荐新角色](https://github.com/zyswork/claude-code-buddy/issues/new?template=character_suggestion.md)（带 ASCII sprite 大加分）
- 🔮 [密语/彩蛋提议](https://github.com/zyswork/claude-code-buddy/issues/new?template=konami_easter_egg.md)
- 💡 [功能请求](https://github.com/zyswork/claude-code-buddy/issues/new?template=feature_request.md)

## 数据位置

| 文件 | 作用 |
|---|---|
| `~/.claude/buddy-state.json` | 灵魂、亲密度、XP、解锁、形态 |
| `~/.claude/buddy-events.jsonl` | 所有事件审计日志（5MB 轮转）|
| `~/.claude.json` 的 `oauthAccount.accountUuid` | userId 来源（骨骼从这里算）|

## 技术栈

- 纯 Node.js（无 npm 依赖）—— 只靠 `child_process` + `fs`
- Claude Code 插件系统（hooks + commands + marketplace）
- `claude -p` 子进程调用用户当前登录的 Claude Code 通道（走你原来的订阅/代理）

## License

MIT · Copyright (c) 2026 zhangyongshun

---

> 📜 [CHANGELOG](./CHANGELOG.md) — 从 v0.1 到 v1.0 的完整演进（10 个版本、44 个 smoke 测试、24 条命令、28 角色）
