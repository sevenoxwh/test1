const storage = require('../../utils/storage');

Page({
  data: {
    user: {},
  },

  onShow() {
    const user = storage.getUser();
    this.setData({ user });
  },

  editTargetWeight() {
    wx.showModal({
      title: '设置目标体重',
      editable: true,
      placeholderText: '请输入目标体重（kg）',
      success: (res) => {
        if (res.confirm && res.content) {
          const weight = parseFloat(res.content);
          if (weight > 0) {
            storage.setUser({ targetWeight: weight });
            this.setData({ user: storage.getUser() });
            wx.showToast({ title: '设置成功', icon: 'success' });
          }
        }
      },
    });
  },

  onReminderChange(e) {
    const time = e.detail.value;
    storage.setUser({ reminderTime: time });
    this.setData({ user: storage.getUser() });
    wx.showToast({ title: '设置成功', icon: 'success' });

    // 引导订阅消息
    wx.requestSubscribeMessage({
      tmplIds: [''], // 填入实际的模板 ID
      success: (res) => {
        console.log('订阅结果:', res);
      },
    });
  },

  clearAllData() {
    wx.showModal({
      title: '确认清除',
      content: '这将清除所有打卡记录、体重记录和对话历史，此操作不可恢复。',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          const openid = wx.getStorageSync('openid') || 'temp_user';
          wx.removeStorageSync(`${openid}_checkins`);
          wx.removeStorageSync(`${openid}_weightRecords`);
          wx.removeStorageSync(`${openid}_aiChatHistory`);
          wx.removeStorageSync(`${openid}_user`);
          this.setData({ user: {} });
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      },
    });
  },

  showPrivacy() {
    wx.showModal({
      title: '隐私协议',
      content: 'FitCheck 尊重并保护您的个人隐私。我们仅收集必要的健身数据（体重、打卡记录等），所有数据存储于本地或您授权的云服务中，不会分享给第三方。',
      showCancel: false,
    });
  },
});
