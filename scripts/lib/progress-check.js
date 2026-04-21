// 统一的进度检查：每次 state 变化后可以 fire-and-forget 调一次
// 扫描成就 + 隐藏角色解锁，把新解锁的写回 state，并把通知 quip 放到 state.quip

const { checkAll: checkAchievements, getAchievement } = require('./achievements.js');
const { checkAll: checkUnlocks } = require('./unlocks.js');
const { getCharacter } = require('./characters.js');

// state 引用会被直接修改；调用方需要在最后调 writeState
function runChecks(state) {
  const notifications = [];

  // 成就
  const newAch = checkAchievements(state);
  for (const id of newAch) {
    state.achievements.push(id);
    const a = getAchievement(id);
    if (a) notifications.push(`🏆 解锁成就：${a.name}`);
  }

  // 隐藏角色
  const newUnlocks = checkUnlocks(state);
  for (const id of newUnlocks) {
    state.unlocks.push(id);
    const c = getCharacter(id);
    if (c) notifications.push(`✨ 发现 ${c.emoji} ${c.nameCn}！`);
  }

  // 如果有新通知，把最重要的一条塞进 quip（优先解锁 > 成就）
  if (notifications.length > 0) {
    state.quip = notifications[notifications.length - 1];
    state.quipAt = Date.now();
  }

  return { newAchievements: newAch, newUnlocks, notifications };
}

module.exports = { runChecks };
