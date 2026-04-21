# claude-buddy

![GitHub release](https://img.shields.io/github/v/release/zyswork/claude-code-buddy?style=flat-square)
![License](https://img.shields.io/github/license/zyswork/claude-code-buddy?style=flat-square)
![Stars](https://img.shields.io/github/stars/zyswork/claude-code-buddy?style=flat-square)
![Language](https://img.shields.io/badge/language-Chinese%20%E4%B8%AD%E6%96%87-red?style=flat-square)

> **复刻 Claude Code 2026 愚人节彩蛋 `/buddy` 的插件版**
> 孵化一只专属 ASCII 桌面伙伴——会吐槽、会成长、还有 5 只神话隐藏角色等你发现。

```
  ★ COMMON
  
    /\__/\
   ( ✦  ✦ )
   =(  ..  )=
    (")__(")
  🐰 小墨  · 兔精  Lv 5 成年
  
  "又熬夜？明天咖啡多来点"    ← 它真的会说话
```

## 快速开始

```bash
/plugin marketplace add zyswork/claude-code-buddy
/plugin install claude-buddy@claude-code-buddy
/reload-plugins
/claude-buddy:buddy            # 孵化
/claude-buddy:buddy-setup      # 装 statusline 常驻
```

## 它是什么

一个 **Tier 1 Claude Code 插件**（不改 CLI 源码），基于泄露源码里的骨骼算法复刻——每个 Claude 账户会根据自己的 userId **确定性地**孵化出一只伙伴：稀有度、物种、帽子、眼睛、属性全是算出来的，改不了配置作弊。

孵化后伙伴会：
- 常驻 statusline（`★★★ (·>) 鸭小白`）
- 每轮对话结束后有 30% 概率冒一句中文吐槽（`/claude-buddy:buddy-mute` 可静音）
- 写日记、接受摸摸、陪你一起老

### 支持的物种（18 种）
鸭 · 鹅 · 软体 · 猫 · 龙 · 章鱼 · 猫头鹰 · 企鹅 · 乌龟 · 蜗牛 · 幽灵 · 蝾螈 · 水豚 · 仙人掌 · 机器人 · 兔子 · 蘑菇 · 胖胖

### 稀有度分布
- common 60% · uncommon 25% · rare 10% · epic 4% · **legendary 1%**
- 1% 额外概率会额外 shiny ✨

## 安装

> ⚠️ Claude Code **只认 marketplace 机制**——不能直接把目录扔进 `~/.claude/plugins/`。必须通过 `/plugin marketplace add` 注册。

### 方式 1：GitHub 安装（推荐给别人用）

把 repo 推到 GitHub，然后用户跑：

```bash
# 1. 注册这个 repo 为 marketplace
/plugin marketplace add zyswork/claude-code-buddy

# 2. 安装插件
/plugin install claude-buddy@claude-code-buddy

# 3. 重载（或重启 Claude Code）
/reload-plugins

# 4. 启用 statusline（可选）
/claude-buddy:buddy-setup

# 5. 孵化你的伙伴
/claude-buddy:buddy
```

### 方式 2：本地开发安装（自己测试）

Claude Code 支持本地目录当 marketplace：

```bash
# 从本地路径添加
/plugin marketplace add /Users/zys/Code/ai/claude-buddy

# 然后安装
/plugin install claude-buddy@claude-code-buddy
```

### 方式 3：另一台电脑安装

```bash
# 在目标机器上
git clone https://github.com/zyswork/claude-code-buddy.git ~/code/claude-buddy
# 然后在 Claude Code 里
/plugin marketplace add ~/code/claude-buddy
/plugin install claude-buddy@claude-code-buddy
/reload-plugins
/claude-buddy:buddy-setup
/claude-buddy:buddy
```

### 卸载

```bash
/plugin uninstall claude-buddy@claude-code-buddy
/plugin marketplace remove claude-code-buddy
# statusline 需要手动从 ~/.claude/settings.json 里删掉
```

## 使用

| 命令 | 作用 |
|---|---|
| `/claude-buddy:buddy` | 首次孵化；之后显示伙伴卡片（sprite + 属性） |
| `/claude-buddy:buddy-pet` | 摸摸它，累计次数 |
| `/claude-buddy:buddy-mute` | 让它闭嘴；`/claude-buddy:buddy-mute on` 恢复说话 |
| `/claude-buddy:buddy-diary` | 让它以自己的视角写一篇今日日记 |
| `/claude-buddy:buddy-setup` | 把 statusline 一键写进 settings.json |
| `/claude-buddy:buddy-dex` | 查看图鉴（所有物种和解锁状态） |
| `/claude-buddy:buddy-swap <名字>` | 切换形态（无参数 = 回本体） |
| `/claude-buddy:buddy-hint` | 给一条最接近解锁的线索 |
| `/claude-buddy:buddy-rename <新名>` | 给伙伴改名（累计 9 次有神秘彩蛋） |
| `/claude-buddy:buddy-chat <...>` | 跟伙伴直接对话（它以自己性格回你） |
| `/claude-buddy:buddy-advice <问题>` | 让伙伴给一条真正有用的建议（Lv10+ 或 epic+）|
| `/claude-buddy:buddy-card` | 生成可分享的 ASCII 名片 |
| `/claude-buddy:buddy-roast [compliment]` | 基于你 7 天 git log 让伙伴 roast 或夸奖 |
| `/claude-buddy:buddy-daily [claim]` | 今日 3 个小任务，全部完成 +50 XP |
| `/claude-buddy:buddy-retire [confirm]` | 送 Lv 99 的伙伴退休，存入墓地 |
| `/claude-buddy:buddy-graveyard` | 查看墓地纪念所有退休伙伴 |
| `/claude-buddy:buddy-teach "事实"` | 教伙伴记住一件事（最多 10 条）|
| `/claude-buddy:buddy-dex --detail <名字>` | 单只角色的详情页 |
| `/claude-buddy:buddy-review [--staged \| HEAD~3]` | 让伙伴基于 git diff 评一下你的改动 |
| `/claude-buddy:buddy-skill [属性 数量 \| reset]` | 技能树加点（每级 1 点）|

> 所有 slash command 都用 `插件名:命令名` 的 namespace。这是 Claude Code 的机制，防止多插件命令互撞。

## 成长系统（v0.3.1）

| 事件 | XP | 亲密度 ♥ |
|---|---|---|
| 对话完成一轮 | +1 | — |
| 摸摸 `/buddy-pet` | +1 | +2 |
| git commit（v0.3.2）| +3 | — |
| 修 bug 成功（v0.3.2）| +5 | +1 |
| 目睹 rm -rf（v0.3.2）| +10 | — |

**进化条件**：
- Lv 5 + ♥ 30 → 成年形态
- Lv 15 + ♥ 80 → 进化态

**等级曲线**：Lv n→n+1 需 `10 * n^1.5` XP（Lv 5 → 6 需 112 XP；Lv 10 → 11 需 317）

## Statusline 显示风格

设环境变量 `BUDDY_STATUSLINE_STYLE`：

| 值 | 效果 |
|---|---|
| `both`（默认） | `★ 🐰 (·..·) 墨墨` —— emoji + ASCII 脸 |
| `emoji` | `★ 🐰 墨墨` |
| `ascii` | `★ (·..·) 墨墨` |

## 定制

**改物种池 / 稀有度权重 / 属性维度** → 编辑 `scripts/lib/types.js`，想让 legendary 常见一点、想加"麒麟/貔貅/外卖头盔"都在这里。

**改性格风格** → 编辑 `commands/buddy.md` 的孵化 prompt，参考 `examples/personality-presets.md` 里的东北话/软妹/文言文模板。

**改吐槽频率** → `scripts/observer.js` 顶部 `QUIP_PROBABILITY` 默认 0.3（30%）。

**换盐开新赛季** → `scripts/lib/types.js` 里的 `SALT` 改了，所有人重抽一次（但灵魂名字还在）。

## 文件结构

```
claude-buddy/
├── .claude-plugin/plugin.json  # 插件清单
├── commands/                    # 4 个 slash command
│   ├── buddy.md
│   ├── buddy-pet.md
│   ├── buddy-mute.md
│   └── buddy-diary.md
├── hooks/hooks.json             # Stop hook → observer
├── scripts/
│   ├── lib/
│   │   ├── types.js             # 稀有度/物种/属性常量
│   │   ├── roll.js              # 确定性投骰
│   │   ├── sprites.js           # 18 种 ASCII
│   │   └── state.js             # 灵魂 + 状态持久化
│   ├── render.js                # 打印伙伴卡片
│   ├── statusline.js            # statusline 单行输出
│   └── observer.js              # Stop hook：生成吐槽
└── examples/personality-presets.md
```

## 跟原版的差距

Tier 1 插件只有 statusline 单行精灵，**没有**：
- 输入框旁的 5 行立体 sprite
- 500ms 眨眼/抖动动画
- 浮动圆角气泡
- 彩虹 `/buddy` 启动提示

想要那些要走 Tier 2（monkey-patch Claude Code 的 `cli.js`）。**逻辑、养成、个性、玩法全在**，只是静态化了。

## 数据位置

- 灵魂 + 状态：`~/.claude/buddy-state.json`
- userId 来源：`~/.claude.json` 的 `oauthAccount.accountUuid`
- 骨骼不落盘——每次从 userId 算

## License

MIT
