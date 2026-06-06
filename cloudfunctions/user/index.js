const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    switch (action) {
      case 'getUser':
        return await getUser(OPENID);
      case 'updateUser':
        return await updateUser(OPENID, data);
      case 'getWeightRecords':
        return await getWeightRecords(OPENID);
      case 'addWeightRecord':
        return await addWeightRecord(OPENID, data);
      case 'deleteWeightRecord':
        return await deleteWeightRecord(OPENID, data);
      case 'getAiChatHistory':
        return await getAiChatHistory(OPENID);
      case 'addAiChatMessage':
        return await addAiChatMessage(OPENID, data);
      case 'clearAiChatHistory':
        return await clearAiChatHistory(OPENID);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (error) {
    console.error('user 云函数错误:', error);
    return { success: false, error: error.message };
  }
};

// 获取用户信息
async function getUser(openid) {
  const { data } = await db.collection('users').where({ _openid: openid }).get();
  if (data.length > 0) {
    return { success: true, data: data[0] };
  }
  return { success: true, data: null };
}

// 更新用户信息
async function updateUser(openid, userData) {
  const { data } = await db.collection('users').where({ _openid: openid }).get();
  if (data.length > 0) {
    await db.collection('users').doc(data[0]._id).update({
      data: {
        ...userData,
        updatedAt: db.serverDate(),
      }
    });
  } else {
    await db.collection('users').add({
      data: {
        _openid: openid,
        ...userData,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
      }
    });
  }
  return { success: true };
}

// 获取体重记录
async function getWeightRecords(openid) {
  const { data } = await db.collection('weightRecords')
    .where({ _openid: openid })
    .orderBy('recordDate', 'desc')
    .get();
  return { success: true, data };
}

// 添加体重记录
async function addWeightRecord(openid, record) {
  const result = await db.collection('weightRecords').add({
    data: {
      _openid: openid,
      ...record,
      createdAt: db.serverDate(),
    }
  });
  return { success: true, data: result };
}

// 删除体重记录
async function deleteWeightRecord(openid, { recordDate }) {
  const { data } = await db.collection('weightRecords')
    .where({ _openid: openid, recordDate })
    .get();
  if (data.length > 0) {
    await db.collection('weightRecords').doc(data[0]._id).remove();
  }
  return { success: true };
}

// 获取AI对话历史
async function getAiChatHistory(openid) {
  const { data } = await db.collection('aiChatHistory')
    .where({ _openid: openid })
    .orderBy('timestamp', 'asc')
    .get();
  return { success: true, data };
}

// 添加AI对话消息
async function addAiChatMessage(openid, message) {
  const result = await db.collection('aiChatHistory').add({
    data: {
      _openid: openid,
      ...message,
      timestamp: Date.now(),
    }
  });
  // 只保留最近50条
  const { data } = await db.collection('aiChatHistory')
    .where({ _openid: openid })
    .orderBy('timestamp', 'desc')
    .get();
  if (data.length > 50) {
    const toDelete = data.slice(50);
    for (const item of toDelete) {
      await db.collection('aiChatHistory').doc(item._id).remove();
    }
  }
  return { success: true, data: result };
}

// 清空AI对话历史
async function clearAiChatHistory(openid) {
  const { data } = await db.collection('aiChatHistory')
    .where({ _openid: openid })
    .get();
  for (const item of data) {
    await db.collection('aiChatHistory').doc(item._id).remove();
  }
  return { success: true };
}
