const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    days: [],
    streak: { current: 0, longest: 0 },
    monthCheckinCount: 0,
    todayCheckin: false,
    aiFabX: 9999,
    aiFabY: 200,
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
    });
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      await this.generateCalendar();
      await this.loadStreak();
      await this.checkTodayCheckin();
    } catch (err) {
      console.error('[首页] 加载数据失败:', err);
    }
  },

  async generateCalendar() {
    const { currentYear, currentMonth } = this.data;
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const checkins = await cloudApi.getCheckins() || [];
    const checkinDates = new Set(checkins.map(c => c.date));

    const today = new Date().toISOString().split('T')[0];
    const days = [];

    // 上月填充
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 2, day).toISOString().split('T')[0];
      days.push({ day, date, isCurrentMonth: false, hasCheckin: checkinDates.has(date) });
    }

    // 当月
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(currentYear, currentMonth - 1, i).toISOString().split('T')[0];
      days.push({
        day: i,
        date,
        isCurrentMonth: true,
        isToday: date === today,
        hasCheckin: checkinDates.has(date),
      });
    }

    // 下月填充
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(currentYear, currentMonth, i).toISOString().split('T')[0];
      days.push({ day: i, date, isCurrentMonth: false, hasCheckin: checkinDates.has(date) });
    }

    // 计算本月打卡次数
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const monthCheckinCount = checkins.filter(c => c.date.startsWith(monthPrefix)).length;

    this.setData({ days, monthCheckinCount });
  },

  async loadStreak() {
    try {
      const stats = await cloudApi.getStats();
      this.setData({ streak: stats.streak || { current: 0, longest: 0 } });
    } catch (err) {
      this.setData({ streak: { current: 0, longest: 0 } });
    }
  },

  async checkTodayCheckin() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const checkin = await cloudApi.getCheckinByDate(today);
      this.setData({ todayCheckin: !!checkin });
    } catch (err) {
      this.setData({ todayCheckin: false });
    }
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    this.setData({ currentYear, currentMonth });
    this.loadData();
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    this.setData({ currentYear, currentMonth });
    this.loadData();
  },

  goToCheckin() {
    if (this.data.todayCheckin) {
      wx.showToast({ title: '今日已打卡', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/checkin/index' });
  },

  goToAiChat() {
    wx.navigateTo({ url: '/pages/ai-chat/index' });
  },

  goToStats() {
    wx.navigateTo({ url: '/pages/stats/index' });
  },

  goToProfile() {
    wx.switchTab({ url: '/pages/profile/index' });
  },

  onAiFabMove(e) {
    const { x, y } = e.detail;
    this.setData({ aiFabX: x, aiFabY: y });
  },
});
