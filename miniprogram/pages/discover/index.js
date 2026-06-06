const cloudApi = require('../../utils/cloudApi');

// 内置常见食物热量表
const FOOD_DATABASE = [
  { name: '米饭', calories: 116, portion: '一碗约150g' },
  { name: '鸡蛋', calories: 144, portion: '一个约50g' },
  { name: '鸡胸肉', calories: 133, portion: '一块约100g' },
  { name: '牛肉', calories: 250, portion: '一块约100g' },
  { name: '苹果', calories: 52, portion: '一个约200g' },
  { name: '香蕉', calories: 89, portion: '一根约120g' },
  { name: '牛奶', calories: 54, portion: '一杯约250ml' },
  { name: '燕麦', calories: 389, portion: '一碗约50g' },
  { name: '西兰花', calories: 34, portion: '一份约100g' },
  { name: '三文鱼', calories: 208, portion: '一块约100g' },
];

Page({
  data: {
    categories: ['增肌', '减脂', '维持'],
    currentCategory: '增肌',
    recipes: [],
    searchKeyword: '',
    searchResults: [],
    searched: false,
  },

  onLoad() {
    this.loadRecipes();
  },

  onShow() {
    this.loadRecipes();
  },

  async loadRecipes() {
    try {
      const { currentCategory } = this.data;
      const recipes = await cloudApi.getRecipes(currentCategory);
      this.setData({ recipes: recipes || [] });
    } catch (err) {
      console.error('[发现页] 加载食谱失败:', err);
      this.setData({ recipes: [] });
    }
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ currentCategory: category });
    this.loadRecipes();
  },

  goToAiChat() {
    wx.navigateTo({ url: '/pages/ai-chat/index' });
  },

  goToRecipeDetail(e) {
    const recipe = e.currentTarget.dataset.recipe;
    wx.navigateTo({
      url: `/pages/discover/recipe-detail/index?name=${encodeURIComponent(recipe.name)}`,
    });
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch() {
    const { searchKeyword } = this.data;
    if (!searchKeyword.trim()) {
      this.setData({ searchResults: [], searched: false });
      return;
    }

    const results = FOOD_DATABASE.filter(food =>
      food.name.includes(searchKeyword.trim())
    );
    this.setData({ searchResults: results, searched: true });
  },
});
