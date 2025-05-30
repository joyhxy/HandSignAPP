// app.js
// 如果你的 request.js 是通过 ES6模块导出的，可以在这里引入，但不推荐在 app.js 直接使用 request 发起非关键请求
// import request from './utils/request.js'; // 假设路径

App({
  onLaunch(options) {
    console.log('App Launch options:', options);
    const token = wx.getStorageSync('userToken');
    const storedUserInfo = wx.getStorageSync('userInfo');

    if (token && storedUserInfo && storedUserInfo.id !== undefined && storedUserInfo.id !== null) { // **更严格的id检查**
      this.globalData.token = token;
      this.globalData.userInfo = storedUserInfo;
      this.globalData.isLoggedIn = true;
      console.log('App.onLaunch: Restored login state from cache. UserID:', storedUserInfo.id);
    } else {
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
      this.globalData.token = null;
      console.log('App.onLaunch: No valid cached login state found or userInfo.id is missing.');
    }
    console.log('App.onLaunch - Final globalData state:', JSON.stringify(this.globalData));
    console.log('APP_ONLAUNCH_END: Final globalData state:', JSON.stringify(this.globalData)); // **日志2**
  },
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    token: null,
    apiBaseUrl: 'https://222.186.168.45:8080',
    imageBaseUrl: 'https://222.186.168.45:8080',
    // 之前讨论过的其他全局数据，根据需要保留或移除
    dailyChallengeUserAnswers: [],
    dailyChallengeSummary: null,
    mockUserCertificationStatus: { status: 0, remark: '' }, // 用于模拟认证状态
    
    // 你可以添加更多全局共享的数据
    //例如：
    // systemInfo: null, // 系统信息
    // defaultPageSize: 10, // 列表分页的默认数量
  },

  // (可选) 一个全局方法示例：用于刷新用户信息（例如登录后、编辑资料后调用）
  // 你需要确保 request.js 可以在 app.js 中被正确引入和使用，或者将 request 调用放在 Page 的 JS 中
  // 暂时注释掉，因为直接在 app.js 中调用封装的 request 可能导致循环依赖或时机问题
  /*
  async fetchAndSetGlobalUserInfo(userIdToFetch) {
    // 引入 request 的方式可能需要调整，避免循环依赖
    // const request = require('./utils/request.js').default; // CommonJS方式，或确保ES6模块正确解析
    // 或者，更推荐的是，这个函数应该被页面的JS调用，页面JS负责引入request

    const userId = userIdToFetch || (this.globalData.userInfo ? this.globalData.userInfo.id : null);
    if (!userId || !this.globalData.token) { // 需要用户ID和Token
      console.warn("fetchAndSetGlobalUserInfo: Missing userId or token.");
      return Promise.reject("Missing userId or token");
    }

    console.log("App.js: Attempting to refresh global user info for ID:", userId);
    // return request({ // 假设 request 是一个返回 Promise 的函数
    //     url: '/user/info', // 你的获取用户信息的API路径
    //     method: 'GET',
    //     data: { id: userId }
    //     // header 中应该会自动带上 Token (由 request.js 处理)
    //   })
    //   .then(newUserInfo => {
    //     if (newUserInfo && newUserInfo.id) {
    //       this.globalData.userInfo = { // 确保映射正确
    //           id: newUserInfo.id,
    //           name: newUserInfo.nickname || "用户",
    //           avatarUrl: newUserInfo.avatar || "/assets/images/avatar_placeholder.png",
    //           points: newUserInfo.points !== undefined ? newUserInfo.points : 0,
    //           level: newUserInfo.level || "",
    //           volunteerTitle: newUserInfo.volunteer_title || "",
    //           signInDays: newUserInfo.sign_in_days || 0,
    //           // **根据 /user/info 返回的真实认证状态字段更新**
    //           leader_certification_status_code: newUserInfo.leader_status_code_from_api, // 假设API字段
    //           leader_certification_remark: newUserInfo.leader_remark_from_api,
    //           phone_for_form_prefill: newUserInfo.phone_number_from_api // 假设API字段
    //       };
    //       this.globalData.isLoggedIn = true; // 既然能获取到信息，肯定是登录了
    //       wx.setStorageSync('userInfo', this.globalData.userInfo); // 更新缓存
    //       console.log("App.js: Global user info refreshed and cached:", this.globalData.userInfo);
    //       return this.globalData.userInfo; // 返回更新后的用户信息
    //     } else {
    //       console.warn("App.js: fetchAndSetGlobalUserInfo - API returned invalid user data.");
    //       return Promise.reject("Invalid user data from API");
    //     }
    //   })
    //   .catch(err => {
    //     console.error("App.js: Failed to refresh global user info:", err);
    //     // 可以在这里处理token失效的情况，比如清除本地token并引导重新登录
    //     if (err.statusCode === 401 || (err.code && err.code === YOUR_TOKEN_EXPIRED_CODE)) { // 假设有特定的token失效码
    //         this.clearLoginStateAndGoToLogin();
    //     }
    //     return Promise.reject(err);
    //   });
    return Promise.resolve(this.globalData.userInfo); // 临时返回，避免报错
  },

  clearLoginStateAndGoToLogin: function() {
      console.log("App.js: Clearing login state and redirecting to login page.");
      wx.removeStorageSync('userToken');
      wx.removeStorageSync('userInfo');
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
      this.globalData.token = null;
      wx.reLaunch({ url: '/pages/auth/login/login' }); // 强制重新启动到登录页
  }
  */
 
});