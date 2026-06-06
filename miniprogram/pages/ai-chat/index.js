const cloudApi = require('../../utils/cloudApi');

const QUICK_TAGS = [
  { label: '减脂建议', query: '根据我的情况，给我一些减脂建议' },
  { label: '增肌食谱', query: '推荐一份适合我的增肌食谱' },
  { label: '动作纠正', query: '深蹲时膝盖内扣怎么纠正' },
  { label: '今日训练', query: '我今天应该练什么' },
  { label: '热量计算', query: '帮我计算一下今日消耗' },
];

const SYSTEM_PROMPT = `你是一位专业的健身教练和营养师，名叫 FitCoach。你的职责是为用户提供科学、安全、个性化的健身和饮食建议。

规则：
1. 回答必须基于科学健身知识，避免伪科学。
2. 禁止提供医疗诊断、药物建议或极端节食方案。
3. 每次回答末尾必须添加免责声明："以上建议仅供参考，请根据自身情况调整，必要时咨询专业教练或医生。"
4. 如果用户问题超出健身/饮食范围，礼貌地引导回相关话题。
5. 回答风格：简洁专业、鼓励性、给出具体可执行的建议。`;

Page({
  data: {
    messages: [],
    inputMessage: '',
    isThinking: false,
    scrollToView: '',
    quickTags: QUICK_TAGS,
  },

  async onLoad() {
    await this.loadHistory();
  },

  async loadHistory() {
    try {
      const history = await cloudApi.getAiChatHistory();
      this.setData({ messages: history || [] });
      this.scrollToBottom();
    } catch (err) {
      console.error('[AI聊天] 加载历史失败:', err);
      this.setData({ messages: [] });
    }
  },

  onInputChange(e) {
    this.setData({ inputMessage: e.detail.value });
  },

  sendQuickMessage(e) {
    const query = e.currentTarget.dataset.query;
    this.setData({ inputMessage: query });
    this.sendMessage();
  },

  async sendMessage() {
    const content = this.data.inputMessage.trim();
    if (!content || this.data.isThinking) return;

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content,
      contentType: 'text',
    };
    const messages = [...this.data.messages, userMessage];

    try {
      await cloudApi.addAiChatMessage(userMessage);
    } catch (err) {
      console.error('[AI聊天] 保存用户消息失败:', err);
    }

    this.setData({
      messages,
      inputMessage: '',
      isThinking: true,
    });
    this.scrollToBottom();

    // 调用 AI
    this.callAI(content, messages);
  },

  async callAI(userContent, allMessages) {
    try {
      // 构建用户数据上下文
      const userData = await this.buildUserContext();

      // 构建请求消息
      const recentMessages = allMessages.slice(-10);
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n' + userData },
        ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      // 调用云函数（后端中转）
      const { result } = await wx.cloud.callFunction({
        name: 'aiChat',
        data: {
          messages: apiMessages,
        },
      });

      if (result && result.content) {
        const aiMessage = {
          role: 'assistant',
          content: result.content,
          contentType: 'text',
          metadata: {
            referencedData: this.detectReferencedData(userContent),
          },
        };
        const messages = [...this.data.messages, aiMessage];
        try {
          await cloudApi.addAiChatMessage(aiMessage);
        } catch (err) {
          console.error('[AI聊天] 保存AI消息失败:', err);
        }
        this.setData({ messages, isThinking: false });
        this.scrollToBottom();
      } else {
        throw new Error('AI 返回为空');
      }
    } catch (error) {
      console.error('AI 调用失败:', error);
      // 降级：使用本地模拟回复
      const fallbackMessage = this.getFallbackReply(userContent);
      const aiMessage = {
        role: 'assistant',
        content: fallbackMessage,
        contentType: 'text',
      };
      const messages = [...this.data.messages, aiMessage];
      try {
        await cloudApi.addAiChatMessage(aiMessage);
      } catch (err) {
        console.error('[AI聊天] 保存降级消息失败:', err);
      }
      this.setData({ messages, isThinking: false });
      this.scrollToBottom();
    }
  },

  async buildUserContext() {
    try {
      const user = await cloudApi.getUser() || {};
      const weightRecords = await cloudApi.getWeightRecords() || [];
      const checkins = await cloudApi.getCheckins() || [];

      let context = '[用户数据]';
      if (weightRecords.length > 0) {
        context += ` 最近体重: ${weightRecords[0].weight}kg`;
      }
      if (user.targetWeight) {
        context += `, 目标: ${user.targetWeight}kg`;
      }
      if (checkins.length > 0) {
        const recent = checkins.slice(-3);
        context += `, 最近打卡: ${recent.map(c => `${c.sportType} ${c.duration}min (${c.date})`).join(', ')}`;
      }
      return context;
    } catch (err) {
      return '[用户数据] 暂无数据';
    }
  },

  detectReferencedData(content) {
    if (content.includes('体重') || content.includes('减脂') || content.includes('增重')) return 'weight';
    if (content.includes('打卡') || content.includes('训练') || content.includes('运动')) return 'checkin';
    if (content.includes('目标')) return 'goal';
    return null;
  },

  getFallbackReply(content) {
    const replies = [
      '很好的问题！建议你可以从基础动作开始，逐步增加强度。记得热身和拉伸哦。\n\n以上建议仅供参考，请根据自身情况调整，必要时咨询专业教练或医生。',
      '根据你的情况，我建议每周安排 3-4 次训练，每次 30-45 分钟，有氧和力量结合。\n\n以上建议仅供参考，请根据自身情况调整，必要时咨询专业教练或医生。',
      '饮食方面建议控制精制碳水摄入，增加蛋白质比例，多吃蔬菜和优质脂肪。\n\n以上建议仅供参考，请根据自身情况调整，必要时咨询专业教练或医生。',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  },

  scrollToBottom() {
    const index = this.data.messages.length - 1;
    if (index >= 0) {
      this.setData({ scrollToView: `msg-${index}` });
    }
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },
});
