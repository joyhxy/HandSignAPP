// pages/auth/login/login.js
import request from '../../../utils/request.js';
// const app = getApp(); // 可以保留在这里，但方法内部使用时再次获取更保险

Page({
  data: {
    hasAgreedPrivacy: false,
    isLoggingIn: false,
  },

  onLoad: function (options) {
    const app = getApp();
    // 检查是否已有有效 token (如果之前模拟登录成功过)
    if (app.globalData.isLoggedIn && options.from !== 'user_logout') {
        console.log("Login page onLoad: User already logged in (from previous mock or real login), navigating back or to home.");
        const pages = getCurrentPages();
        if (pages.length > 1 && pages[pages.length - 2].route !== this.route) {
            wx.navigateBack({ delta: 1 });
        } else {
            wx.switchTab({ url: '/pages/learner/home/home' });
        }
    }
  },

  onAgreementChange: function(e) {
    this.setData({
      hasAgreedPrivacy: e.detail.value.includes('agreed')
    });
  },

  handlePrimaryLogin: function() {
    const app = getApp();
    if (!this.data.hasAgreedPrivacy) {
      wx.showToast({ title: '请先阅读并同意相关协议', icon: 'none', duration: 2000 });
      return;
    }

    if (this.data.isLoggingIn) return;
    this.setData({ isLoggingIn: true });
    wx.showLoading({ title: '登录中 (模拟)...' });


    // --- START: 临时模拟登录成功，并强制用户ID为1 (用于测试其他接口) ---
    // 取消这个代码块的注释以启用模拟登录
    console.warn("LOGIN_PAGE_TESTING: 使用强制模拟登录状态，用户ID将为1。真实登录接口已注释。");
    setTimeout(() => { // 模拟网络延迟
        wx.hideLoading();
        this.setData({ isLoggingIn: false });

        const mockUserInfo = {
            id: 1, // **强制用户ID为1**
            name: "测试用户 (ID 1)", // 你可以自定义昵称
            avatarUrl: "/assets/images/avatar_placeholder.png", // 确保这个图片存在
            points: 1234, // 模拟积分
            level: "LV.Test", // 模拟等级
            volunteerTitle: "模拟志愿者", // 模拟称号
            // 根据你的 app.globalData.userInfo 结构，补充其他必要字段
            // 例如，如果 user-growth.js 中会用到认证状态：
            // leader_certification_status_code: 0, // 0:未认证, 1:审核中, 2:已通过, 3:认证失败
            // leader_certification_remark: "这是模拟的认证备注"
        };
        const mockToken = "MOCK_TOKEN_FOR_USER_ID_1_TESTING_PURPOSE";

        // 更新全局状态和本地缓存
        wx.setStorageSync('userToken', mockToken);
        wx.setStorageSync('userInfo', mockUserInfo);
        app.globalData.token = mockToken;
        app.globalData.userInfo = mockUserInfo;
        app.globalData.isLoggedIn = true;

        wx.showToast({ title: '模拟登录成功 (ID 1)', icon: 'success', duration: 1500 });
        this.redirectToTargetPage();
        // return; // 如果启用了模拟登录，真实登录部分就不会执行
    }, 500); // 模拟0.5秒延迟
    // --- END: 临时模拟登录成功 ---


    // --- 真实的 wx.login 和 request 调用部分 (已注释掉) ---
    /*
    wx.showLoading({ title: '登录中...' }); // 如果不使用上面的模拟块，这里需要 showLoading
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          console.log('wx.login 获取到的 code:', loginRes.code);
          request({
            url: '/user/login',
            method: 'POST',
            data: { code: loginRes.code }
          })
          .then(loginResponseData => {
            wx.hideLoading();
            this.setData({ isLoggingIn: false });
            console.log('后端 /user/login 接口返回 (data 部分):', loginResponseData);
            if (loginResponseData && loginResponseData.id !== undefined) {
              app.globalData.userInfo = {
                id: loginResponseData.id,
                name: loginResponseData.name,
                avatarUrl: loginResponseData.image,
                points: loginResponseData.points || 0,
                level: loginResponseData.level || '',
                volunteerTitle: loginResponseData.volunteer_title || '',
                signInDays: loginResponseData.sign_in_days || 0
              };
              app.globalData.isLoggedIn = true;
              // wx.setStorageSync('userToken', loginResponseData.token); // 如果API返回token
              wx.setStorageSync('userInfo', app.globalData.userInfo);

              wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });
              this.redirectToTargetPage();
            } else {
              wx.showToast({ title: (loginResponseData && loginResponseData.msg) || '登录信息解析失败', icon: 'none' });
            }
          })
          .catch(err => {
            wx.hideLoading();
            this.setData({ isLoggingIn: false });
            console.error('后端 /user/login 接口请求失败:', err);
          });
        } else {
          wx.hideLoading();
          this.setData({ isLoggingIn: false });
          console.error('wx.login 失败！' + loginRes.errMsg);
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isLoggingIn: false });
        console.error('wx.login 调用失败:', err);
        wx.showToast({ title: '微信登录调用失败', icon: 'none' });
      }
    });
    */
    // --- 真实的 wx.login 和 request 调用结束 ---
  },

  redirectToTargetPage: function() {
    const pages = getCurrentPages();
    if (pages.length > 1 && pages[pages.length - 2].route !== this.route) {
        wx.navigateBack({ delta: 1 });
    } else {
        wx.switchTab({ url: '/pages/learner/home/home' }); // 默认跳转到学习首页
    }
  },


  
  redirectToTargetPage: function() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
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