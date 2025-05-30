const BASE_URL = 'https://222.186.168.45:8080'; // <--- 修改为这个 HTTPS 地址

const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({ // 可以在这里统一处理加载提示
      title: options.loadingTitle || '加载中...',
      mask: true // 防止穿透
    });

    wx.request({
      url: BASE_URL + options.url, // 拼接基础URL和接口路径
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': options.contentType || 'application/json', // 默认json
        // 'Authorization': wx.getStorageSync('token') || '', // 示例：如果需要token，从缓存读取
        ...(options.header || {}) // 允许传入额外的header
      },
      success: (res) => {
        console.log(`API Success RAW RESPONSE [${options.url}]:`, res); // <--- 打印完整响应
        // 根据后端返回的 code 判断成功或失败
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查是否期望直接的业务数据
          if (options.expectDirectData) { // 新增一个选项参数
            resolve(res.data); // 直接返回 res.data
          } else {
            // 否则，按标准 {code, msg, data} 处理
            if (res.data && res.data.code === 1) {
              resolve(res.data.data);
            } else {
              const errorMsg = res.data ? (res.data.msg || '操作失败，响应格式非预期(无code)') : '服务器响应为空或格式错误';
              wx.showToast({ title: errorMsg, icon: 'none', duration: 2000 });
              reject({ msg: errorMsg, code: res.data ? res.data.code : undefined, rawResponse: res });
            }
          }
        } else {
          // HTTP 状态码失败
          const errorMsg = `请求失败，状态码：${res.statusCode}`;
          wx.showToast({ title: errorMsg, icon: 'none', duration: 2000 });
          reject({ msg: errorMsg, statusCode: res.statusCode, raw: res });
        }
      },
      fail: (err) => {
        console.error(`API Fail [${options.url}]:`, err);
        const errorMsg = err.errMsg || '网络请求失败，请检查网络连接';
        wx.showToast({ title: errorMsg, icon: 'none', duration: 2000 });
        reject({ msg: errorMsg, errorDetail: err });
      },
      complete: () => {
        wx.hideLoading(); // 无论成功失败都关闭加载提示
        if (options.complete && typeof options.complete === 'function') {
          options.complete();
        }
      }
    });
  });
};

export default request; // 或者 module.exports = request; 取决于你的项目配置