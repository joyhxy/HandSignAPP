// app.js
// 如果你的 request.js 是通过 ES6模块导出的，可以在这里引入，但不推荐在 app.js 直接使用 request 发起非关键请求
// import request from './utils/request.js'; // 假设路径

App({
  onLaunch() {
    console.log("App.onLaunch: 小程序启动");

    // 尝试从本地缓存恢复登录状态
    this.restoreLoginState();

    // ---- 这是一个可选的、用于调试的强制模拟登录块 ----
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


    // 获取日志 (小程序模板自带)
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // wx.login() 不应该放在 onLaunch 中强制执行，
    // 因为用户可能已经有有效的登录态（通过缓存恢复），
    // 应该在需要登录时（例如检查到未登录或token失效）才去调用。
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    token: null, // 用于存储后端返回的身份凭证
    // 回调函数列表，用于处理异步登录
    loginReadyCallback: [],
    // 基础URL，方便所有页面和请求使用
    apiBaseUrl: 'https://222.186.168.45:8080',
    // 是否需要刷新论坛列表 (发布新帖后使用)
    needsRefreshForumList: false,
  },

  /**
   * 尝试从本地缓存恢复登录状态
   */
  restoreLoginState: function() {
    const token = wx.getStorageSync('userToken'); // **根据后端是否返回token来决定**
    const userInfo = wx.getStorageSync('userInfo'); // **核心是恢复userInfo**

    // **如果你的登录流程不依赖token，可以只判断userInfo**
    if (userInfo && userInfo.id) {
      // 假设只要有缓存的用户信息（特别是ID），就认为是已登录状态
      // 后续的API请求会依赖request.js自动携带的token（如果存在）
      // 如果token过期，request.js中应该有处理逻辑，并引导重新登录
      console.log('App.js - restoreLoginState: Found cached userInfo, restoring login state.', userInfo);
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = userInfo;
      this.globalData.token = token || null; // 如果有token也恢复
    } else {
      console.log('App.js - restoreLoginState: No valid cached userInfo found.');
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
      this.globalData.token = null;
    }
  },


  /**
   * 登录成功后调用的全局方法
   * @param {string} token - 从后端获取的登录凭证
   * @param {object} userInfo - 从后端获取的用户信息
   */
  loginSuccess: function(token, userInfo) {
    console.log("App.js - loginSuccess called with userInfo:", userInfo, "and token:", token);
    
    // 更新全局状态
    this.globalData.isLoggedIn = true;
    this.globalData.userInfo = userInfo;
    this.globalData.token = token || null; // 如果登录接口不返回token，这里就是null

    // 将登录凭证和用户信息写入本地缓存
    if (token) {
      wx.setStorageSync('userToken', token);
    }
    wx.setStorageSync('userInfo', userInfo);

    // 检查并执行所有在等待登录的回调函数
    if (this.globalData.loginReadyCallback && this.globalData.loginReadyCallback.length > 0) {
      console.log(`App.js - loginSuccess: Executing ${this.globalData.loginReadyCallback.length} login-ready callbacks.`);
      this.globalData.loginReadyCallback.forEach(callback => {
        if (typeof callback === 'function') {
          callback(userInfo); // 将用户信息传递给回调
        }
      });
      // 清空回调数组，避免重复执行
      this.globalData.loginReadyCallback = [];
    }
  },

  /**
   * 全局退出登录方法
   */
  logout: function() {
    console.log("App.js - logout: Clearing user session.");
    // 清除本地缓存
    wx.removeStorageSync('userToken');
    wx.removeStorageSync('userInfo');
    // 你也可以清除其他与用户相关的缓存
    // wx.clearStorageSync(); // 这个会清除所有缓存，要谨慎使用

    // 重置全局状态
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    this.globalData.token = null;

    // 使用 reLaunch 跳转到登录页，清空所有页面栈
    // 确保登录页已在 app.json 中注册
    wx.reLaunch({
      url: '/pages/auth/login/login',
      fail: (err) => {
        console.error("Failed to reLaunch to login page after logout:", err);
        // 如果失败，尝试跳转到首页
        wx.switchTab({
          url: '/pages/learner/home/home'
        });
      }
    });
  }
})