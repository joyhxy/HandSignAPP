// utils/request.js
// !!! 将此处的 BASE_URL 替换为你的后端API基础地址或Apifox Mock地址 !!!
// !!! 如果暂时完全没有，可以先写一个占位符，例如: 'http://your-api-placeholder.com/api' !!!
const BASE_URL = 'http://mock.api/v1'; // <--- 重要：先用一个模拟/占位地址

const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    const token = wx.getStorageSync('token'); // 假设登录后token存储在本地
    let header = {
      'Content-Type': options.contentType || 'application/json',
      ...options.header
    };

    // !!! 和后端确认Token的真实传递方式，并在此处正确设置 !!!
    // 示例: (你需要根据实际情况选择或修改)
    if (token && options.requireAuth !== false) { // requireAuth默认为true
       header['Authorization'] = 'Bearer ' + token;
       // 或者 header['X-Token'] = token; 等后端约定的方式
    }

    wx.request({
      url: BASE_URL + options.url, // options.url 是接口的具体路径，如 '/user/info'
      method: options.method || 'GET',
      data: options.data || {},
      header: header,
      success: (res) => {
        console.log(`[API Request Success] ${options.url}:`, res);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (res.data && res.data.code === 1) { // code 为 1 表示成功
            if (res.data.data && res.data.data.hasOwnProperty('ITEMS')) {
              resolve(res.data.data.ITEMS);
            } else if (res.data.data !== undefined && res.data.data !== null) { // 确保data存在且不为null
              resolve(res.data.data);
            } else {
              resolve(null); // 成功但无返回数据
            }
          } else if (res.data && res.data.code === 0) { // code 为 0 表示失败
            wx.showToast({ title: res.data.msg || '操作失败', icon: 'none' });
            reject(res.data);
          } else if (res.data && res.data.code === 401) { // 假设401是Token失效 (需与后端确认)
             wx.showToast({ title: res.data.msg || '请先登录', icon: 'none' });
             wx.removeStorageSync('token');
             wx.redirectTo({ url: '/pages/user/login/login' }); // 修改为你的登录页路径
             reject(res.data);
          } else {
            wx.showToast({ title: '服务器响应异常', icon: 'none' });
            reject(res.data || { code: -1, msg: '服务器响应格式错误' });
          }
        } else {
          let errorMsg = `请求错误 ${res.statusCode}`;
          if(res.data && res.data.msg) {
            errorMsg = res.data.msg;
          }
          wx.showToast({ title: errorMsg, icon: 'none' });
          reject(res);
        }
      },
      fail: (err) => {
        console.error(`[API Request Fail] ${options.url}:`, err);
        wx.showToast({ title: '网络连接错误', icon: 'none' });
        reject(err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  });
};

export default request;