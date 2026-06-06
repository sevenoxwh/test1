/**
 * 本地存储封装工具
 * 所有数据以 openid 为前缀隔离
 */

const STORAGE_KEYS = {
  USER: 'user',
  CHECKINS: 'checkins',
  WEIGHT_RECORDS: 'weightRecords',
  AI_CHAT_HISTORY: 'aiChatHistory',
  SPORT_TAGS: 'global_sportTags',
  RECIPES: 'global_recipes',
};

function getOpenId() {
  // MVP 阶段使用固定标识，后续接入微信登录后替换为真实 openid
  return wx.getStorageSync('openid') || 'temp_user';
}

function getKey(key) {
  const openid = getOpenId();
  return `${openid}_${key}`;
}

module.exports = {
  // 用户配置
  getUser() {
    return wx.getStorageSync(getKey(STORAGE_KEYS.USER)) || {};
  },

  setUser(user) {
    const existing = module.exports.getUser();
    wx.setStorageSync(getKey(STORAGE_KEYS.USER), {
      ...existing,
      ...user,
      updatedAt: Date.now(),
    });
  },

  // 打卡记录
  getCheckins() {
    return wx.getStorageSync(getKey(STORAGE_KEYS.CHECKINS)) || [];
  },

  addCheckin(checkin) {
    const checkins = this.getCheckins();
    checkins.push({
      ...checkin,
      createdAt: Date.now(),
    });
    wx.setStorageSync(getKey(STORAGE_KEYS.CHECKINS), checkins);
    return checkins;
  },

  getCheckinByDate(date) {
    const checkins = this.getCheckins();
    return checkins.find(c => c.date === date);
  },

  // 体重记录
  getWeightRecords() {
    return wx.getStorageSync(getKey(STORAGE_KEYS.WEIGHT_RECORDS)) || [];
  },

  addWeightRecord(record) {
    const records = this.getWeightRecords();
    records.push({
      ...record,
      createdAt: Date.now(),
    });
    // 按日期倒序
    records.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));
    wx.setStorageSync(getKey(STORAGE_KEYS.WEIGHT_RECORDS), records);
    return records;
  },

  deleteWeightRecord(recordDate) {
    const records = this.getWeightRecords();
    const filtered = records.filter(r => r.recordDate !== recordDate);
    wx.setStorageSync(getKey(STORAGE_KEYS.WEIGHT_RECORDS), filtered);
    return filtered;
  },

  // 运动标签
  getSportTags() {
    return wx.getStorageSync(STORAGE_KEYS.SPORT_TAGS) || [];
  },

  setSportTags(tags) {
    wx.setStorageSync(STORAGE_KEYS.SPORT_TAGS, tags);
  },

  // 食谱
  getRecipes() {
    return wx.getStorageSync(STORAGE_KEYS.RECIPES) || [];
  },

  getRecipesByCategory(category) {
    const recipes = this.getRecipes();
    return recipes.filter(r => r.category === category);
  },

  // AI 对话历史
  getAiChatHistory() {
    return wx.getStorageSync(getKey(STORAGE_KEYS.AI_CHAT_HISTORY)) || [];
  },

  addAiChatMessage(message) {
    const history = this.getAiChatHistory();
    history.push({
      ...message,
      timestamp: Date.now(),
    });
    // 只保留最近 50 条
    if (history.length > 50) {
      history.shift();
    }
    wx.setStorageSync(getKey(STORAGE_KEYS.AI_CHAT_HISTORY), history);
    return history;
  },

  clearAiChatHistory() {
    wx.setStorageSync(getKey(STORAGE_KEYS.AI_CHAT_HISTORY), []);
  },

  // 连击计算
  calculateStreak() {
    const checkins = this.getCheckins();
    if (checkins.length === 0) return { current: 0, longest: 0 };

    const dates = [...new Set(checkins.map(c => c.date))].sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 计算当前连击
    if (dates.includes(today) || dates.includes(yesterday)) {
      currentStreak = 1;
      for (let i = dates.length - 1; i > 0; i--) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i - 1]);
        const diff = (curr - prev) / 86400000;
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // 计算最长连击
    tempStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const curr = new Date(dates[i]);
      const prev = new Date(dates[i - 1]);
      const diff = (curr - prev) / 86400000;
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  },

  // 卡路里计算
  calculateCalories(sportType, durationMinutes) {
    const tags = this.getSportTags();
    const tag = tags.find(t => t.name === sportType);
    const met = tag ? tag.met : 5.0;

    const user = this.getUser();
    const weight = user.weight || 65;

    const hours = durationMinutes / 60;
    return Math.round(met * weight * hours);
  },
};
