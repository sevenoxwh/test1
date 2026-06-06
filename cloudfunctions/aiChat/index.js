// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init();

// 读取所有环境变量用于调试
console.log('[aiChat] 所有环境变量 keys:', Object.keys(process.env));
console.log('[aiChat] AI_API_KEY:', process.env.AI_API_KEY ? '存在' : '不存在');

// 火山方舟 API 配置
// 云开发环境变量通过 process.env 读取
const API_KEY = process.env.AI_API_KEY || '';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

console.log('[aiChat] API_KEY 是否存在:', !!API_KEY);
console.log('[aiChat] API_KEY 长度:', API_KEY.length);

exports.main = async (event, context) => {
  const { messages } = event;

  if (!messages || !Array.isArray(messages)) {
    return { error: '消息格式错误' };
  }

  try {
    // 如果未配置 API Key，返回模拟数据
    if (!API_KEY) {
      console.log('[aiChat] API_KEY 为空，返回提示信息');
      return {
        content: 'FitCoach 正在学习中...\n\n目前云函数尚未配置 AI API Key，请联系开发者配置。\n\n以上建议仅供参考，请根据自身情况调整，必要时咨询专业教练或医生。',
      };
    }

    const response = await new Promise((resolve, reject) => {
      const https = require('https');
      const url = new URL(API_URL);
      
      const postData = JSON.stringify({
        model: 'ep-20250606212535-4f4lq', // 使用默认模型，如需更换请修改
        messages: [
          { role: 'system', content: '你是一位专业的健身教练，擅长解答运动、健身、饮食、减脂、增肌等相关问题。回答要简洁实用，适合微信聊天场景。' },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error('解析响应失败: ' + data));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(postData);
      req.end();
    });

    if (response.choices && response.choices[0]) {
      return {
        content: response.choices[0].message.content,
      };
    } else if (response.error) {
      throw new Error(response.error.message || 'API 返回错误');
    } else {
      throw new Error('AI API 返回异常');
    }
  } catch (error) {
    console.error('AI 调用失败:', error);
    return {
      content: '抱歉，FitCoach 暂时无法回答，请稍后再试。\n\n以上建议仅供参考，请根据自身情况调整，必要时咨询专业教练或医生。',
      error: error.message,
    };
  }
};
