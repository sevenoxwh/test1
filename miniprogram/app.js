// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true,
      });
    }

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;

    // 初始化云数据库数据
    this.initCloudData();
  },

  async initCloudData() {
    try {
      // 初始化全局运动标签
      const { result: tagsResult } = await wx.cloud.callFunction({
        name: 'dbHelper',
        data: { action: 'initSportTags' }
      });
      if (tagsResult && tagsResult.success) {
        console.log('[云开发] 运动标签初始化完成');
      }

      // 初始化食谱库
      const { result: recipesResult } = await wx.cloud.callFunction({
        name: 'dbHelper',
        data: { action: 'initRecipes' }
      });
      if (recipesResult && recipesResult.success) {
        console.log('[云开发] 食谱库初始化完成');
      }
    } catch (err) {
      console.error('[云开发] 初始化数据失败:', err);
    }
  },

  getDefaultRecipes() {
    return [
      {
        name: '香煎鸡胸肉配藜麦',
        category: '增肌',
        imageUrl: '',
        ingredients: ['鸡胸肉 200g', '藜麦 100g', '西兰花 100g', '橄榄油 10g'],
        calories: 450,
        steps: ['鸡胸肉用盐和黑胡椒腌制15分钟', '藜麦煮熟备用', '平底锅热油煎鸡胸肉至两面金黄', '西兰花焯水，摆盘即可'],
        tips: '鸡胸肉不要煎太久，保持嫩滑口感'
      },
      {
        name: '牛油果虾仁沙拉',
        category: '减脂',
        imageUrl: '',
        ingredients: ['虾仁 150g', '牛油果 半个', '生菜 100g', '柠檬汁 适量'],
        calories: 320,
        steps: ['虾仁煮熟过凉水', '牛油果切块', '生菜洗净撕小块', '混合所有食材，淋上柠檬汁'],
        tips: '柠檬汁可以防止牛油果氧化变色'
      },
      {
        name: '全麦牛肉三明治',
        category: '维持',
        imageUrl: '',
        ingredients: ['全麦面包 2片', '牛肉片 100g', '番茄 2片', '生菜 2片'],
        calories: 380,
        steps: ['全麦面包稍微烤一下', '依次铺上生菜、番茄、牛肉片', '盖上另一片面包，对切即可'],
        tips: '可以加少许芥末酱增加风味'
      },
    ];
  },

  globalData: {
    systemInfo: null,
    statusBarHeight: 0,
    userInfo: null,
  }
});
