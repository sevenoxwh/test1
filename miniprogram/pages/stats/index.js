const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    totalCheckins: 0,
    totalDuration: 0,
    totalCalories: 0,
    sportStats: [],
    weekDays: [],
  },

  onShow() {
    this.loadStats();
  },

  async loadStats() {
    try {
      const stats = await cloudApi.getStats();
      const checkins = stats.checkins || [];

      // 总览数据
      const totalCheckins = stats.totalCheckins || 0;
      const totalDuration = stats.totalDuration || 0;
      const totalCalories = stats.totalCalories || 0;

      // 运动类型分布
      const sportMap = stats.sportStats || {};
      const maxCount = Math.max(...Object.values(sportMap), 1);
      const sportStats = Object.entries(sportMap)
        .map(([sport, count]) => ({
          sport,
          count,
          percent: Math.round((count / maxCount) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      // 最近7天
      const weekDays = [];
      const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
      const today = new Date();
      const checkinDates = new Set(checkins.map(c => c.date));

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 86400000);
        const dateStr = d.toISOString().split('T')[0];
        weekDays.push({
          date: dateStr,
          dayName: dayNames[d.getDay()],
          checked: checkinDates.has(dateStr),
        });
      }

      this.setData({
        totalCheckins,
        totalDuration,
        totalCalories,
        sportStats,
        weekDays,
      });
    } catch (err) {
      console.error('[统计页] 加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
});
