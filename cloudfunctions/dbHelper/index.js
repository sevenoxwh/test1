const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();
const _ = db.command;

// 默认运动标签
const DEFAULT_SPORT_TAGS = [
  { name: '有氧', met: 7.0, isCustom: false },
  { name: '力量', met: 5.0, isCustom: false },
  { name: '拉伸', met: 2.5, isCustom: false },
  { name: '游泳', met: 8.0, isCustom: false },
  { name: '瑜伽', met: 2.5, isCustom: false },
  { name: '骑行', met: 7.5, isCustom: false },
];

// 默认食谱
const DEFAULT_RECIPES = [
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

exports.main = async (event, context) => {
  const { action } = event;

  try {
    switch (action) {
      case 'initSportTags':
        return await initSportTags();
      case 'initRecipes':
        return await initRecipes();
      case 'getSportTags':
        return await getSportTags();
      case 'addSportTag':
        return await addSportTag(event.data);
      case 'getRecipes':
        return await getRecipes(event.data);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (error) {
    console.error('dbHelper 错误:', error);
    return { success: false, error: error.message };
  }
};

// 初始化运动标签
async function initSportTags() {
  const count = await db.collection('sportTags').count();
  if (count.total === 0) {
    for (const tag of DEFAULT_SPORT_TAGS) {
      await db.collection('sportTags').add({ data: tag });
    }
  }
  return { success: true };
}

// 初始化食谱
async function initRecipes() {
  const count = await db.collection('recipes').count();
  if (count.total === 0) {
    for (const recipe of DEFAULT_RECIPES) {
      await db.collection('recipes').add({ data: recipe });
    }
  }
  return { success: true };
}

// 获取运动标签
async function getSportTags() {
  const { data } = await db.collection('sportTags').get();
  return { success: true, data };
}

// 添加自定义运动标签
async function addSportTag(tagData) {
  const result = await db.collection('sportTags').add({
    data: {
      ...tagData,
      isCustom: true,
      createdAt: db.serverDate(),
    }
  });
  return { success: true, data: result };
}

// 获取食谱
async function getRecipes({ category } = {}) {
  let query = db.collection('recipes');
  if (category) {
    query = query.where({ category });
  }
  const { data } = await query.get();
  return { success: true, data };
}
