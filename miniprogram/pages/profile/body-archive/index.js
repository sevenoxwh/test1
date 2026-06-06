const cloudApi = require('../../../utils/cloudApi');

Page({
  data: {
    height: '',
    age: '',
    genderIndex: 0,
    genderOptions: ['男', '女'],
    weightRecords: [],
    newWeight: '',
    newBodyFat: '',
    showModal: false,
    showTargetModal: false,
    inputWeight: '',
    targetWeightInput: '',
    chartRange: 7,
    bmi: null,
    initialWeight: '',
    currentWeight: '',
    targetWeight: '',
  },

  async onLoad() {
    await this.loadData();
  },

  async onShow() {
    await this.loadData();
  },

  async loadData() {
    try {
      const user = await cloudApi.getUser() || {};
      const records = await cloudApi.getWeightRecords() || [];
      
      // 计算体重统计
      const weights = records.map(r => r.weight).filter(w => w);
      const initialWeight = weights.length > 0 ? weights[weights.length - 1] : '';
      const currentWeight = weights.length > 0 ? weights[0] : '';
      
      // 设置性别索引
      let genderIndex = 0;
      if (user.gender === '女') genderIndex = 1;
      
      this.setData({
        height: user.height || '',
        age: user.age || '',
        genderIndex,
        weightRecords: records,
        initialWeight,
        currentWeight,
        targetWeight: user.targetWeight || '',
      });
      
      this.calculateBMI(user.height, currentWeight);
    } catch (err) {
      console.error('[身体档案] 加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  calculateBMI(height, weight) {
    if (!height || !weight) {
      this.setData({ bmi: null });
      return;
    }
    const heightInM = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    const bmiValue = (weightInKg / (heightInM * heightInM)).toFixed(1);
    
    let status = '正常';
    if (bmiValue < 18.5) status = '偏瘦';
    else if (bmiValue < 24) status = '正常';
    else if (bmiValue < 28) status = '偏胖';
    else status = '肥胖';
    
    this.setData({
      bmi: { value: bmiValue, status }
    });
  },

  async onHeightBlur(e) {
    try {
      const height = e.detail.value;
      this.setData({ height });
      await cloudApi.updateUser({ height });
      this.calculateBMI(height, this.data.currentWeight);
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      console.error('[身体档案] 保存身高失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async onAgeBlur(e) {
    try {
      const age = e.detail.value;
      this.setData({ age });
      await cloudApi.updateUser({ age });
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      console.error('[身体档案] 保存年龄失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async onGenderChange(e) {
    try {
      const genderIndex = parseInt(e.detail.value);
      const gender = this.data.genderOptions[genderIndex];
      this.setData({ genderIndex });
      await cloudApi.updateUser({ gender });
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      console.error('[身体档案] 保存性别失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 目标体重弹窗
  showTargetWeightModal() {
    this.setData({ 
      showTargetModal: true, 
      targetWeightInput: this.data.targetWeight || '' 
    });
  },

  hideTargetWeightModal() {
    this.setData({ showTargetModal: false });
  },

  onTargetWeightInput(e) {
    this.setData({ targetWeightInput: e.detail.value });
  },

  async saveTargetWeight() {
    const { targetWeightInput } = this.data;
    if (!targetWeightInput) {
      wx.showToast({ title: '请输入目标体重', icon: 'none' });
      return;
    }

    try {
      const targetWeight = parseFloat(targetWeightInput);
      await cloudApi.updateUser({ targetWeight });
      this.setData({ 
        showTargetModal: false, 
        targetWeight: targetWeight.toString() 
      });
      wx.showToast({ title: '目标体重已设置', icon: 'success' });
    } catch (err) {
      console.error('[身体档案] 保存目标体重失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  onNewWeightInput(e) {
    this.setData({ newWeight: e.detail.value });
  },

  onNewBodyFatInput(e) {
    this.setData({ newBodyFat: e.detail.value });
  },

  showRecordModal() {
    this.setData({ showModal: true, inputWeight: '' });
  },

  hideRecordModal() {
    this.setData({ showModal: false });
  },

  preventBubble() {
    // 阻止冒泡
  },

  onWeightInput(e) {
    this.setData({ inputWeight: e.detail.value });
  },

  async saveWeight() {
    const { inputWeight } = this.data;
    if (!inputWeight) {
      wx.showToast({ title: '请输入体重', icon: 'none' });
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await cloudApi.addWeightRecord({
        weight: parseFloat(inputWeight),
        recordDate: today,
      });
      this.setData({ showModal: false, inputWeight: '' });
      await this.loadData();
      wx.showToast({ title: '记录成功', icon: 'success' });
    } catch (err) {
      console.error('[身体档案] 添加体重记录失败:', err);
      wx.showToast({ title: '记录失败', icon: 'none' });
    }
  },

  async deleteWeightRecord(e) {
    const { recordDate } = e.currentTarget.dataset;
    try {
      await cloudApi.deleteWeightRecord(recordDate);
      await this.loadData();
      wx.showToast({ title: '已删除', icon: 'success' });
    } catch (err) {
      console.error('[身体档案] 删除记录失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  switchRange(e) {
    const range = parseInt(e.currentTarget.dataset.range);
    this.setData({ chartRange: range });
  },
});
