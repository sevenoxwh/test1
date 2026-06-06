const storage = require('../../../utils/storage');

Page({
  data: {
    recipe: {},
    isLiked: false,
    isFavorited: false,
  },

  onLoad(options) {
    const name = decodeURIComponent(options.name);
    const recipes = storage.getRecipes();
    const recipe = recipes.find(r => r.name === name) || {};
    this.setData({ recipe });
    this.loadInteractionStatus(name);
  },

  loadInteractionStatus(recipeName) {
    const likedRecipes = wx.getStorageSync('likedRecipes') || [];
    const favoriteRecipes = wx.getStorageSync('favoriteRecipes') || [];
    this.setData({
      isLiked: likedRecipes.includes(recipeName),
      isFavorited: favoriteRecipes.includes(recipeName),
    });
  },

  toggleLike() {
    const { recipe, isLiked } = this.data;
    let likedRecipes = wx.getStorageSync('likedRecipes') || [];
    if (isLiked) {
      likedRecipes = likedRecipes.filter(name => name !== recipe.name);
    } else {
      likedRecipes.push(recipe.name);
    }
    wx.setStorageSync('likedRecipes', likedRecipes);
    this.setData({ isLiked: !isLiked });
    wx.showToast({ title: isLiked ? '取消点赞' : '已点赞', icon: 'none' });
  },

  toggleFavorite() {
    const { recipe, isFavorited } = this.data;
    let favoriteRecipes = wx.getStorageSync('favoriteRecipes') || [];
    if (isFavorited) {
      favoriteRecipes = favoriteRecipes.filter(name => name !== recipe.name);
    } else {
      favoriteRecipes.push(recipe.name);
    }
    wx.setStorageSync('favoriteRecipes', favoriteRecipes);
    this.setData({ isFavorited: !isFavorited });
    wx.showToast({ title: isFavorited ? '取消收藏' : '已收藏', icon: 'none' });
  },
});
