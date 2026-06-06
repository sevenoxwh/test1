const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    sportTags: [],
    selectedSport: '',
    duration: 30,
    calories: 0,
    photoUrl: '',
    customSport: '',
  },

  async onLoad() {
    try {
      const tags = await cloudApi.getSportTags();
      this.setData({ sportTags: tags || [] });
    } catch (err) {
      console.error('[打卡页] 加载运动标签失败:', err);
      this.setData({ sportTags: [] });
    }
  },

  selectSport(e) {
    const sport = e.currentTarget.dataset.sport;
    this.setData({ selectedSport: sport });
    this.calculateCalories();
  },

  onDurationChanging(e) {
    this.setData({ duration: e.detail.value });
  },

  onDurationChange(e) {
    this.setData({ duration: e.detail.value });
    this.calculateCalories();
  },

  async calculateCalories() {
    const { selectedSport, duration } = this.data;
    if (!selectedSport) return;
    try {
      const user = await cloudApi.getUser() || {};
      const weight = user.weight || 65;
      const calories = cloudApi.calculateCalories(selectedSport, duration, weight);
      this.setData({ calories });
    } catch (err) {
      const calories = cloudApi.calculateCalories(selectedSport, duration, 65);
      this.setData({ calories });
    }
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ photoUrl: res.tempFiles[0].tempFilePath });
      },
    });
  },

  onCustomSportInput(e) {
    this.setData({ customSport: e.detail.value });
  },

  async addCustomSport() {
    const { customSport, sportTags } = this.data;
    const trimmed = customSport.trim();
    if (!trimmed) {
      wx.showToast({ title: '请输入运动类型', icon: 'none' });
      return;
    }
    if (sportTags.some(t => t.name === trimmed)) {
      wx.showToast({ title: '该类型已存在', icon: 'none' });
      return;
    }
    try {
      await cloudApi.addSportTag({ name: trimmed, met: 5.0 });
      const newTags = [...sportTags, { name: trimmed, met: 5.0 }];
      this.setData({
        sportTags: newTags,
        selectedSport: trimmed,
        customSport: '',
      });
      this.calculateCalories();
      wx.showToast({ title: '已添加', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  async onSubmit() {
    const { selectedSport, duration, calories, photoUrl } = this.data;
    if (!selectedSport) {
      wx.showToast({ title: '请选择运动类型', icon: 'none' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const checkin = {
      date: today,
      sportType: selectedSport,
      duration,
      caloriesBurned: calories,
      photoUrl,
    };

    try {
      await cloudApi.addCheckin(checkin);
      wx.showToast({
        title: '打卡成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        },
      });
    } catch (err) {
      wx.showToast({ title: '打卡失败，请重试', icon: 'none' });
    }
  },
});
