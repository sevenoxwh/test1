const cloudApi = require('../../utils/cloudApi');

const QUOTES = [
  '今天的汗水，是明天的线条。',
  '坚持不是每天都做，而是做了就不放弃。',
  '你的身体记得每一次努力。',
  '自律即自由。',
  '每一滴汗水都不会白流。',
];

Page({
  data: {
    canvasWidth: 300,
    canvasHeight: 480,
    tempImagePath: '',
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    const width = Math.min(sys.windowWidth - 64, 375);
    const height = width * 1.6;
    this.setData({ canvasWidth: width, canvasHeight: height });
    this.drawPoster();
  },

  async drawPoster() {
    const { canvasWidth, canvasHeight } = this.data;
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;

        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr);

        try {
          const user = await cloudApi.getUser() || {};
          const stats = await cloudApi.getStats();
          const streak = stats.streak || { current: 0 };
          const today = new Date().toISOString().split('T')[0];
          const checkin = await cloudApi.getCheckinByDate(today);
          const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

          // 背景
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          // 顶部装饰条
          ctx.fillStyle = '#111827';
          ctx.fillRect(0, 0, canvasWidth, 8);

          // 标题
          ctx.fillStyle = '#111827';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('FitCheck 打卡', canvasWidth / 2, 50);

          // 用户信息
          ctx.fillStyle = '#6B7280';
          ctx.font = '14px sans-serif';
          ctx.fillText(user.nickName || '健身达人', canvasWidth / 2, 80);

          // 连击天数
          ctx.fillStyle = '#111827';
          ctx.font = 'bold 72px sans-serif';
          ctx.fillText(`${streak.current}`, canvasWidth / 2, 160);
          ctx.fillStyle = '#6B7280';
          ctx.font = '16px sans-serif';
          ctx.fillText('连续打卡天数', canvasWidth / 2, 190);

          // 分割线
          ctx.strokeStyle = '#E5E7EB';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(40, 210);
          ctx.lineTo(canvasWidth - 40, 210);
          ctx.stroke();

          // 今日打卡信息
          if (checkin) {
            ctx.fillStyle = '#111827';
            ctx.font = '18px sans-serif';
            ctx.fillText(`今日运动：${checkin.sportType}`, canvasWidth / 2, 250);
            ctx.fillStyle = '#6B7280';
            ctx.font = '14px sans-serif';
            ctx.fillText(`时长：${checkin.duration} 分钟`, canvasWidth / 2, 280);
            ctx.fillText(`消耗：${checkin.caloriesBurned} 千卡`, canvasWidth / 2, 305);
          } else {
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '16px sans-serif';
            ctx.fillText('今日尚未打卡', canvasWidth / 2, 280);
          }

          // 激励文案
          ctx.fillStyle = '#111827';
          ctx.font = 'italic 14px sans-serif';
          const maxWidth = canvasWidth - 80;
          this.wrapText(ctx, `"${quote}"`, canvasWidth / 2, 360, maxWidth, 20);

          // 底部小程序码提示
          ctx.fillStyle = '#9CA3AF';
          ctx.font = '12px sans-serif';
          ctx.fillText('扫码加入 FitCheck 一起打卡', canvasWidth / 2, canvasHeight - 40);

          // 导出图片
          wx.canvasToTempFilePath({
            canvas,
            success: (res) => {
              this.setData({ tempImagePath: res.tempFilePath });
            },
            fail: (err) => {
              console.error('海报生成失败:', err);
            }
          });
        } catch (err) {
          console.error('[海报页] 绘制失败:', err);
        }
      });
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, y);
        line = words[i];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  },

  savePoster() {
    const { tempImagePath } = this.data;
    if (!tempImagePath) {
      wx.showToast({ title: '海报生成中，请稍候', icon: 'none' });
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: tempImagePath,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '需要授权',
            content: '请允许保存图片到相册',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      }
    });
  },

  sharePoster() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },
});
