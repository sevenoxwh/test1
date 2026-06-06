const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    userInfo: {},
  },

  async onShow() {
    try {
      const user = await cloudApi.getUser() || {};
      this.setData({ userInfo: user });
    } catch (err) {
      console.error('[个人中心] 加载失败:', err);
      this.setData({ userInfo: {} });
    }
  },

  goToBodyArchive() {
    wx.navigateTo({ url: '/pages/profile/body-archive/index' });
  },

  goToAiChat() {
    wx.navigateTo({ url: '/pages/ai-chat/index' });
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/index' });
  },

  goToEditProfile() {
    wx.navigateTo({ url: '/pages/profile/edit-profile/index' });
  },

  goToStats() {
    wx.navigateTo({ url: '/pages/stats/index' });
  },

  goToPoster() {
    wx.navigateTo({ url: '/pages/poster/index' });
  },
});
