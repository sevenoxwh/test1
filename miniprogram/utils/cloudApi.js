/**
 * 云开发 API 封装工具
 * 替代本地存储，所有数据通过云函数操作数据库
 */

const CLOUD_FUNCTIONS = {
  USER: 'user',
  CHECKIN: 'checkin',
  DB_HELPER: 'dbHelper',
};

// 通用云函数调用
async function callCloudFunction(name, data) {
  try {
    const { result } = await wx.cloud.callFunction({
      name,
      data,
    });
    if (result && result.success) {
      return result.data;
    }
    throw new Error(result ? result.error : '云函数调用失败');
  } catch (error) {
    console.error(`[云函数 ${name}] 调用失败:`, error);
    throw error;
  }
}

module.exports = {
  // ========== 用户相关 ==========
  getUser() {
    return callCloudFunction(CLOUD_FUNCTIONS.USER, { action: 'getUser' });
  },

  updateUser(userData) {
    return callCloudFunction(CLOUD_FUNCTIONS.USER, {
      action: 'updateUser',
      data: userData,
    });
  },

  // ========== 打卡相关 ==========
  getCheckins() {
    return callCloudFunction(CLOUD_FUNCTIONS.CHECKIN, { action: 'getCheckins' });
  },

  addCheckin(checkin) {
    return callCloudFunction(CLOUD_FUNCTIONS.CHECKIN, {
      action: 'addCheckin',
      data: checkin,
    });
  },

  getCheckinByDate(date) {
    return callCloudFunction(CLOUD_FUNCTIONS.CHECKIN, {
      action: 'getCheckinByDate',
      data: { date },
    });
  },

  getStats() {
    return callCloudFunction(CLOUD_FUNCTIONS.CHECKIN, { action: 'getStats' });
  },

  // ========== 体重记录相关 ==========
  getWeightRecords() {
    return callCloudFunction(CLOUD_FUNCTIONS.USER, { action: 'getWeightRecords' });
  },

  addWeightRecord(record) {
    return callCloudFunction(CLOUD_FUNCTIONS.USER, {
      action: 'addWeightRecord',
      data: record,
    });
  },

  deleteWeightRecord(recordDate) {
    return callCloudFunction(CLOUD_FUNCTIONS.USER, {
      action: 'deleteWeightRecord',
      data: { recordDate },
    });
  },

  // ========== 运动标签相关 ==========
  getSportTags() {
    return callCloudFunction(CLOUD_FUNCTIONS.DB_HELPER, { action: 'getSportTags' });
  },

  addSportTag(tag) {
    return callCloudFunction(CLOUD_FUNCTIONS.DB_HELPER, {
      action: 'addSportTag',
      data: tag,
    });
  },

  // ========== 食谱相关 ==========
  getRecipes(category) {
    return callCloudFunction(CLOUD_FUNCTIONS.DB_HELPER, {
      action: 'getRecipes',
      data: { category },
    });
  },

  // ========== AI 对话历史相关 ==========
  getAiChatHistory() {
    return callCloudFunction(CLOUD_FUNCTIONS.USER, { action: 'getAiChatHistory' });
  },

  addAiChatMessage(message) {
    return callCloudFunction(CLOUD_FUNCTIONS.USER, {
      action: 'addAiChatMessage',
      data: message,
    });
  },

  clearAiChatHistory() {
    return callCloudFunction(CLOUD_FUNCTIONS.USER, { action: 'clearAiChatHistory' });
  },

  // ========== 卡路里计算（本地计算，无需云端） ==========
  calculateCalories(sportType, durationMinutes, weightKg) {
    const metTable = {
      '有氧': 7.0,
      '力量': 5.0,
      '拉伸': 2.5,
      '游泳': 8.0,
      '瑜伽': 2.5,
      '骑行': 7.5,
    };
    const met = metTable[sportType] || 5.0;
    const weight = weightKg || 65;
    const hours = durationMinutes / 60;
    return Math.round(met * weight * hours);
  },
};
