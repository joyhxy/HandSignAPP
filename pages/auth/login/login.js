// pages/auth/login/login.js
import request from '../../../utils/request.js';
const app = getApp(); // 可以保留在这里，但方法内部使用时再次获取更保险

Page({
  data: {
    hasAgreedPrivacy: false,
    isLoggingIn: false,
  },

  // onLoad 函数保持不变，它处理已登录用户的跳转逻辑，是合理的。
  onLoad: function (options) {
    const app = getApp();
    console.log("Login page onLoad. app.globalData.isLoggedIn:", app.globalData.isLoggedIn);

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

  // onAgreementChange 函数保持不变
  onAgreementChange: function(e) {
    this.setData({
      hasAgreedPrivacy: e.detail.value.includes('agreed')
    });
  },

  /**
   * --- 核心修改 ---
   * 将原来的登录逻辑包裹在 wx.getUserProfile 中。
   * 这样可以确保登录流程是由用户点击按钮后，在弹出的授权框中点击“允许”之后才开始的。
   * 这完全符合微信的审核规范。
   */
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
    
    // 调用 wx.getUserProfile 来触发一个明确的授权弹窗
    wx.getUserProfile({
      desc: '用于登录和完善账户信息', // 这个描述会显示在弹窗上
      success: (profileRes) => {
        // 用户点击了“允许”
        console.log('User granted profile access:', profileRes.userInfo);
        this.setData({ isLoggingIn: true });
        wx.showLoading({ title: '登录中...' });

        // --- 以下是你原来的登录逻辑，现在放在授权成功的回调里 ---
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              console.log('wx.login success, got code:', loginRes.code);
              
              request({
                url: `/user/login?code=${loginRes.code}`,
                method: 'POST',
                data: { code: loginRes.code }
              })
              .then(loginResponseData => {
                wx.hideLoading();
                this.setData({ isLoggingIn: false });
                console.log('Backend /user/login response (data part):', loginResponseData);

                if (loginResponseData && loginResponseData.id !== undefined) {
                  const userInfo = {
                    id: loginResponseData.id,
                    name: loginResponseData.name,
                    // 注意：这里使用后端返回的头像，而不是 wx.getUserProfile 的头像，以保持数据一致性
                    avatarUrl: loginResponseData.image,
                    points: loginResponseData.points || 0,
                    level: loginResponseData.level || '',
                    volunteerTitle: loginResponseData.volunteer_title || '',
                  };
                  
                  const tokenFromApi = loginResponseData.token || null;
                  app.loginSuccess(tokenFromApi, userInfo);

                  wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });
                  
                  setTimeout(() => {
                    this.redirectToTargetPage();
                  }, 1500);

                } else {
                  console.error("Login failed: API response data format is incorrect or missing 'id'.", loginResponseData);
                  wx.showToast({ title: (loginResponseData && loginResponseData.msg) || '登录信息解析失败', icon: 'none' });
                }
              })
              .catch(err => {
                wx.hideLoading();
                this.setData({ isLoggingIn: false });
                console.error('Backend /user/login request failed:', err);
              });
            } else {
              wx.hideLoading();
              this.setData({ isLoggingIn: false });
              console.error('wx.login failed to get code:', loginRes.errMsg);
              wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            this.setData({ isLoggingIn: false });
            console.error('wx.login API call failed:', err);
            wx.showToast({ title: '微信登录调用失败', icon: 'none' });
          }
        });
        // --- 原有登录逻辑结束 ---
      },
      fail: (err) => {
        // 用户点击了“拒绝”或关闭了弹窗
        console.log('User denied profile access:', err);
        wx.showToast({
          title: '您已取消登录授权',
          icon: 'none'
        });
      }
    });
  },

  // redirectToTargetPage 函数保持不变
  redirectToTargetPage: function() {
    const pages = getCurrentPages();
    if (pages.length > 1 && pages[pages.length - 2].route !== this.route) {
        wx.navigateBack({ delta: 1 });
    } else {
        wx.switchTab({ url: '/pages/learner/home/home' });
    }
  },
  enterAsGuest: function() {
    console.log("User chose to enter as a guest.");
    // 使用 switchTab 跳转到你的首页 tab
    // **确保 '/pages/learner/home/home' 是你在 app.json 中配置的第一个 tab 页面**
    wx.switchTab({
      url: '/pages/learner/home/home',
      fail: (err) => {
        console.error("Failed to switchTab to home page:", err);
        // 如果失败，可以给一个提示
        wx.showToast({
          title: '无法进入首页',
          icon: 'error'
        })
      }
    });
  },

  // navigateTo... 函数保持不变
  navigateToUserAgreement: function() {
    wx.navigateTo({ url: '/pages/common/webView/webView?type=userAgreement' });
  },
  navigateToPrivacyPolicy: function() {
    wx.navigateTo({ url: '/pages/common/webView/webView?type=privacyPolicy' });
  }
});