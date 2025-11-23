// app.js
// 如果你的 request.js 是通过 ES6模块导出的，可以在这里引入，但不推荐在 app.js 直接使用 request 发起非关键请求
// import request from './utils/request.js'; // 假设路径

App({
  onLaunch() {
    console.log("App.onLaunch: 小程序启动");

    // 尝试从本地缓存恢复登录状态 (此逻辑保持不变)
    this.restoreLoginState();

    // ---- 这是一个可选的、用于调试的强制模拟登录块 ---- (保持不变)
    // 如果你想在每次启动时都绕过真实登录，进行快速测试，可以取消下面代码的注释。
    // 在正式测试真实登录流程时，请务必注释掉它。
    /*
    console.warn("APP.JS ONLAUNCH: FORCING MOCK LOGIN FOR TESTING!");
    const mockUserInfoForTesting = {
        id: 1, // 使用你需要的测试用户ID
        name: "全局模拟测试用户",
        avatarUrl: "/assets/images/avatar_placeholder.png",
        points: 2024,
        level: "LV.Master",
        volunteerTitle: "五星志愿者",
        leader_certification_status: 2 // 假设2是已认证负责人
    };
    const mockTokenForTesting = "THIS_IS_A_GLOBAL_MOCK_TOKEN";
    this.loginSuccess(mockTokenForTesting, mockUserInfoForTesting);
    */
    // ---- 模拟登录块结束 ----


    // 获取日志 (小程序模板自带) (保持不变)
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },

  globalData: { // (保持不变)
    userInfo: null,
    isLoggedIn: false,
    token: null, 
    loginReadyCallback: [], 
    apiBaseUrl: 'https://222.186.168.45:8080', 
    needsRefreshForumList: false,
  },

  /**
   * --- 新增 ---
   * 封装一个简洁的全局登录状态检查函数，供所有页面方便地调用。
   * 这符合我们之前讨论的最佳实践。
   * @returns {boolean} true - 已登录, false - 未登录
   */
  checkLogin: function() {
    return this.globalData.isLoggedIn;
  },


  /**
   * 尝试从本地缓存恢复登录状态 (保持不变)
   */
  restoreLoginState: function() {
    const token = wx.getStorageSync('userToken');
    const userInfo = wx.getStorageSync('userInfo');

    if (userInfo && userInfo.id) {
      console.log('App.js - restoreLoginState: Found cached userInfo, restoring login state.', userInfo);
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = userInfo;
      this.globalData.token = token || null;
    } else {
      console.log('App.js - restoreLoginState: No valid cached userInfo found.');
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
      this.globalData.token = null;
    }
  },


  /**
   * 登录成功后调用的全局方法 (保持不变)
   * @param {string} token - 从后端获取的登录凭证
   * @param {object} userInfo - 从后端获取的用户信息
   */
  loginSuccess: function(token, userInfo) {
    console.log("App.js - loginSuccess called with userInfo:", userInfo, "and token:", token);
    
    this.globalData.isLoggedIn = true;
    this.globalData.userInfo = userInfo;
    this.globalData.token = token || null;

    if (token) {
      wx.setStorageSync('userToken', token);
    }
    wx.setStorageSync('userInfo', userInfo);

    if (this.globalData.loginReadyCallback && this.globalData.loginReadyCallback.length > 0) {
      console.log(`App.js - loginSuccess: Executing ${this.globalData.loginReadyCallback.length} login-ready callbacks.`);
      this.globalData.loginReadyCallback.forEach(callback => {
        if (typeof callback === 'function') {
          callback(userInfo);
        }
      });
      this.globalData.loginReadyCallback = [];
    }
  },

  /**
   * 全局退出登录方法 (保持不变)
   */
  logout: function() {
    console.log("App.js - logout: Clearing user session.");
    
    wx.removeStorageSync('userToken');
    wx.removeStorageSync('userInfo');

    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    this.globalData.token = null;

    wx.reLaunch({
      url: '/pages/auth/login/login',
      fail: (err) => {
        console.error("Failed to reLaunch to login page after logout:", err);
        wx.switchTab({
          url: '/pages/learner/home/home'
        });
      }
    });
  }
})