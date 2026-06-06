const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    switch (action) {
      case 'addCheckin':
        return await addCheckin(OPENID, data);
      case 'getCheckins':
        return await getCheckins(OPENID);
      case 'getCheckinByDate':
        return await getCheckinByDate(OPENID, data);
      case 'getStats':
        return await getStats(OPENID);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (error) {
    console.error('checkin 云函数错误:', error);
    return { success: false, error: error.message };
  }
};

// 添加打卡记录
async function addCheckin(openid, checkinData) {
  // 检查今日是否已打卡
  const today = checkinData.date;
  const { data: existing } = await db.collection('checkins')
    .where({ _openid: openid, date: today })
    .get();

  if (existing.length > 0) {
    // 更新已有记录
    await db.collection('checkins').doc(existing[0]._id).update({
      data: {
        ...checkinData,
        updatedAt: db.serverDate(),
      }
    });
    return { success: true, data: { _id: existing[0]._id } };
  }

  // 添加新记录
  const result = await db.collection('checkins').add({
    data: {
      _openid: openid,
      ...checkinData,
      createdAt: db.serverDate(),
    }
  });
  return { success: true, data: result };
}

// 获取所有打卡记录
async function getCheckins(openid) {
  const { data } = await db.collection('checkins')
    .where({ _openid: openid })
    .orderBy('date', 'asc')
    .get();
  return { success: true, data };
}

// 获取指定日期打卡
async function getCheckinByDate(openid, { date }) {
  const { data } = await db.collection('checkins')
    .where({ _openid: openid, date })
    .get();
  return { success: true, data: data[0] || null };
}

// 获取统计数据
async function getStats(openid) {
  const { data: checkins } = await db.collection('checkins')
    .where({ _openid: openid })
    .get();

  const totalCheckins = checkins.length;
  const totalDuration = checkins.reduce((sum, c) => sum + (c.duration || 0), 0);
  const totalCalories = checkins.reduce((sum, c) => sum + (c.caloriesBurned || 0), 0);

  // 运动类型分布
  const sportMap = {};
  checkins.forEach(c => {
    sportMap[c.sportType] = (sportMap[c.sportType] || 0) + 1;
  });

  // 连击计算
  const streak = calculateStreak(checkins);

  return {
    success: true,
    data: {
      totalCheckins,
      totalDuration,
      totalCalories,
      sportStats: sportMap,
      streak,
      checkins,
    }
  };
}

// 计算连击天数
function calculateStreak(checkins) {
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
}
