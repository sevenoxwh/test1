const cloudApi = require('../../../utils/cloudApi');

Page({
  data: {
    userInfo: {},
  },

  async onLoad() {
    try {
      const user = await cloudApi.getUser() || {};
      console.log('[edit-profile] getUser result:', user);
      this.setData({ userInfo: user });
    } catch (err) {
      console.error('[edit-profile] onLoad error:', err);
      wx.showToast({ title: '页面加载失败: ' + err.message, icon: 'none' });
    }
  },

  onNickNameBlur(e) {
    this.setData({ 'userInfo.nickName': e.detail.value });
  },

  onWeightBlur(e) {
    this.setData({ 'userInfo.weight': e.detail.value });
  },

  onTargetWeightBlur(e) {
    this.setData({ 'userInfo.targetWeight': e.detail.value });
  },

  async saveProfile() {
    try {
      const { userInfo } = this.data;
      await cloudApi.updateUser({
        nickName: userInfo.nickName,
        weight: userInfo.weight ? parseFloat(userInfo.weight) : null,
        targetWeight: userInfo.targetWeight ? parseFloat(userInfo.targetWeight) : null,
      });
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (err) {
      console.error('[edit-profile] save error:', err);
      wx.showToast({ title: '保存失败: ' + err.message, icon: 'none' });
    }
  },
});
