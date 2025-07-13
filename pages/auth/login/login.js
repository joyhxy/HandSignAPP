// pages/auth/login/login.js
import request from '../../../utils/request.js';
const app = getApp(); // 可以保留在这里，但方法内部使用时再次获取更保险

Page({
  data: {
    hasAgreedPrivacy: false,
    isLoggingIn: false,
  },

  onLoad: function (options) {
    const app = getApp(); // <--- **在这里获取 app 实例**
    console.log("Login page onLoad. app.globalData.isLoggedIn:", app.globalData.isLoggedIn); // 调试日志

    if (app.globalData.isLoggedIn && options.from !== 'user_logout') {
        console.log("Login page onLoad: User is already logged in, attempting to navigate away.");
        const pages = getCurrentPages();
        if (pages.length > 1 && pages[pages.length - 2].route !== this.route) {
            wx.navigateBack({ delta: 1 });
        } else {
            wx.switchTab({ url: '/pages/learner/home/home' });
        }
    } else {
        console.log("Login page onLoad: User not logged in or forced login, staying on login page.");
    }
  },


  onAgreementChange: function(e) {
    this.setData({
      hasAgreedPrivacy: e.detail.value.includes('agreed')
    });
  },

  handlePrimaryLogin: function() {
    // 确保 app 实例有效
    const app = getApp();
    if (!this.data.hasAgreedPrivacy) {
      wx.showToast({
        title: '请先阅读并同意相关协议',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (this.data.isLoggingIn) return;
    this.setData({ isLoggingIn: true });
    wx.showLoading({ title: '登录中...' });

    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          console.log('wx.login success, got code:', loginRes.code);
          const codeValue = loginRes.code;

          request({
            url: `/user/login?code=${codeValue}`, // 接口路径
            method: 'POST',     // 请求方法
            data: {             // Request Body (JSON)
              code: loginRes.code
            }
            // 响应是标准的 {code, msg, data:{id, image, name}}, 不需要 expectDirectData: true
          })
          .then(loginResponseData => { // loginResponseData 是 API 响应的 data 部分, 即 {id, image, name}
            wx.hideLoading();
            this.setData({ isLoggingIn: false });
            console.log('Backend /user/login response (data part):', loginResponseData);

            if (loginResponseData && loginResponseData.id !== undefined) {
              // --- 登录成功，处理用户信息和登录状态 ---
              console.log("Login successful. Calling app.loginSuccess to update global state and storage.");

              // 构造前端使用的 userInfo 对象，进行字段映射
              // 确保 API 返回的字段名与这里的一致
              const userInfo = {
                id: loginResponseData.id,
                name: loginResponseData.name,
                avatarUrl: loginResponseData.image, // 将API的image映射到前端的avatarUrl
                // 如果 API 还返回了其他字段，也在这里进行映射
                points: loginResponseData.points || 0,
                level: loginResponseData.level || '',
                volunteerTitle: loginResponseData.volunteer_title || '',
                // 例如，如果登录接口也返回了认证状态，一并更新
                // leader_certification_status: loginResponseData.leader_status || 0
              };
              
              // **调用 app.js 中统一的登录成功处理函数**
              // **与后端确认：/user/login 是否返回 token？**
              const tokenFromApi = loginResponseData.token || null;
              app.loginSuccess(tokenFromApi, userInfo);

              wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });
              
              // 延时跳转，让用户看到 Toast
              setTimeout(() => {
                this.redirectToTargetPage();
              }, 1500);

            } else {
              // 后端返回的业务 code 不是 1，或者 data 部分结构不对
              console.error("Login failed: API response data format is incorrect or missing 'id'.", loginResponseData);
              wx.showToast({ title: (loginResponseData && loginResponseData.msg) || '登录信息解析失败', icon: 'none' });
            }
          })
          .catch(err => { // request.js reject 的错误对象
            wx.hideLoading();
            this.setData({ isLoggingIn: false });
            console.error('Backend /user/login request failed:', err);
            // request.js 内部通常已经弹了 Toast，这里可以只记录日志，或者显示一个更通用的提示
            // wx.showToast({ title: err.msg || '登录服务异常，请稍后重试', icon: 'none' });
          });
        } else {
          // wx.login 本身失败
          wx.hideLoading();
          this.setData({ isLoggingIn: false });
          console.error('wx.login failed to get code:', loginRes.errMsg);
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
        }
      },
      fail: (err) => {
        // wx.login API 调用失败
        wx.hideLoading();
        this.setData({ isLoggingIn: false });
        console.error('wx.login API call failed:', err);
        wx.showToast({ title: '微信登录调用失败', icon: 'none' });
      }
    });
  },

  redirectToTargetPage: function() {
    const pages = getCurrentPages();
    // 检查页面栈，如果可以返回上一页，就返回
    if (pages.length > 1 && pages[pages.length - 2].route !== this.route) {
        wx.navigateBack({ delta: 1 });
    } else {
        // 否则，跳转到首页
        wx.switchTab({ url: '/pages/learner/home/home' });
    }
  },

  navigateToUserAgreement: function() {
    wx.navigateTo({ url: '/pages/common/webView/webView?type=userAgreement' }); // 假设有通用webView页显示协议
  },
  navigateToPrivacyPolicy: function() {
    wx.navigateTo({ url: '/pages/common/webView/webView?type=privacyPolicy' });
  }
});