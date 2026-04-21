// 心情系统：从当前 state 推断伙伴当下情绪
// 纯函数无 I/O，render 和 observer 随时调用

// 情绪列表 + emoji 指示 + 默认 quip 池
const MOODS = {
  ecstatic: {   emoji: '🥰', label: '幸福',   quips: ['今天主人好好哦', '就喜欢跟你在一起', '摸摸我再摸摸我'] },
  happy:    {   emoji: '🙂', label: '开心',   quips: ['心情不错', '来点咖啡？', '今天挺顺'] },
  focused:  {   emoji: '🧐', label: '专注',   quips: ['嗯。', '继续', '我看着呢'] },
  tired:    {   emoji: '😴', label: '累',     quips: ['好困...', '要不休息一下', '我先眯一会'] },
  grumpy:   {   emoji: '😤', label: '烦躁',   quips: ['今天运气差', '怎么总出错', '冷静冷静'] },
  lonely:   {   emoji: '🥺', label: '想你',   quips: ['你去哪了', '好久没说话了', '我都长蘑菇了'] },
  hungry:   {   emoji: '😋', label: '想摸摸', quips: ['很久没摸我了', '一下下就好嘛', '摸我我摸我'] },
  shiny:    {   emoji: '✨', label: '亢奋',   quips: ['这代码绝了', '状态起飞', 'ヾ(≧▽≦*)o'] },
};

function computeMood(state) {
  const now = Date.now();
  const quipAgeMs = state.quipAt ? now - state.quipAt : Infinity;
  const petAgeMs = state.petAt ? now - state.petAt : Infinity;
  const lastMood = state.lastMood;
  const bond = state.bond || 0;

  // 升级或进化 → shiny（一段时间）
  const lastShownEvo = state.lastShownEvolution || 0;
  if (lastShownEvo > 0 && state.quipAt && quipAgeMs < 30 * 60 * 1000) {
    // 刚进化/升级不久，保持亢奋
    if (state.quipSource === 'timeEgg' || state.quipSource === 'konami') {
      // 但节日/密语触发不算，直接走默认
    } else if (bond >= 80) return 'shiny';
  }

  // 超过 3 天没来过 → lonely（检测 lastDailyLogin）
  const today = new Date().toISOString().slice(0, 10);
  const lastLogin = state.counters?.lastDailyLogin || '';
  if (lastLogin && lastLogin !== today) {
    const last = new Date(lastLogin);
    const days = (now - last.getTime()) / 86400000;
    if (days > 3) return 'lonely';
  }

  // 最近 error 多 → grumpy
  if (lastMood === 'error') return 'grumpy';

  // 今天还没摸（且 bond 不高）→ hungry
  const hoursSincePet = petAgeMs / 3600000;
  if (hoursSincePet > 24 && bond < 50) return 'hungry';

  // 深夜 → tired
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return 'tired';

  // bond > 80 + 最近 success → ecstatic
  if (bond >= 80 && lastMood === 'success') return 'ecstatic';

  // 默认开心/专注交替
  if (bond >= 50) return 'happy';
  return 'focused';
}

function moodBadge(state) {
  const id = computeMood(state);
  const m = MOODS[id] || MOODS.focused;
  return { id, emoji: m.emoji, label: m.label };
}

function moodQuipPool(state) {
  const id = computeMood(state);
  return MOODS[id]?.quips || MOODS.focused.quips;
}

function pickMoodQuip(state) {
  const pool = moodQuipPool(state);
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { MOODS, computeMood, moodBadge, moodQuipPool, pickMoodQuip };
