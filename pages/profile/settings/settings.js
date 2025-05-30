// pages/profile/settings/settings.js
const app = getApp();

Page({
  data: {
    messageNotification: true, // 模拟消息通知开关状态
    cacheSize: "0 MB", // 模拟缓存大小
    certificationStatusText: '未认证', // 模拟认证状态文字
    certificationStatusClass: 'status-unverified' // 模拟认证状态对应样式class
    // 实际认证状态应从API获取或全局状态读取
  },

  onLoad: function (options) {
    this.loadInitialSettings();
  },
  onShow: function() {
    // 每次进入页面时，可以重新获取认证状态，以防在其他页面认证后状态未更新
    this.loadCertificationStatus();
  },

  loadInitialSettings: function() {
    // 模拟获取缓存大小
    // 在实际应用中，wx.getStorageInfo 可以获取缓存信息，但清理缓存通常是用户感知操作
    const randomCache = (Math.random() * 20).toFixed(1);
    this.setData({ cacheSize: `${randomCache} MB` });

    // 加载认证状态
    this.loadCertificationStatus();
  },

  loadCertificationStatus: function() {
    // TODO: 从 API 或 app.globalData 获取用户真实的认证状态
    // 假设 app.globalData.userInfo.certificationStatus 存在 (0-未认证, 1-审核中, 2-已认证, 3-认证失败)
    const userCertStatus = app.globalData.userInfo ? app.globalData.userInfo.certificationStatus : 0; // 默认未认证
    let statusText = '未认证';
    let statusClass = 'status-unverified';

    switch (userCertStatus) {
      case 1: // 假设 1 代表审核中
        statusText = '审核中';
        statusClass = 'status-pending';
        break;
      case 2: // 假设 2 代表已认证
        statusText = '已认证';
        statusClass = 'status-approved';
        break;
      case 3: // 假设 3 代表认证失败
        statusText = '认证失败';
        statusClass = 'status-rejected';
        break;
      default: // 0 或其他 代表未认证
        statusText = '未认证';
        statusClass = 'status-unverified';
        break;
    }
    this.setData({
      certificationStatusText: statusText,
      certificationStatusClass: statusClass
    });
  },

  onNotificationChange: function(e) {
    this.setData({ messageNotification: e.detail.value });
    // TODO: 调用API更新用户通知设置
    wx.showToast({ title: e.detail.value ? '已开启通知' : '已关闭通知', icon: 'none' });
  },

  clearCache: function() {
    wx.showModal({
      title: '提示',
      content: '确定要清理应用缓存吗？（部分数据可能需要重新加载）',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清理中...' });
          // 小程序没有一个API可以直接“清理所有缓存”给开发者。
          // wx.clearStorageSync() 会清除所有本地存储。需要谨慎使用。
          // 通常“清理缓存”指的是清除图片缓存、请求缓存等，这些是小程序框架自动管理的。
          // 这里我们只模拟一个成功的提示。
          setTimeout(() => {
            wx.hideLoading();
            this.setData({ cacheSize: "0 MB" }); // 模拟清空
            wx.showToast({ title: '缓存已清理', icon: 'success' });
          }, 1000);
        }
      }
    });
  },

  navigateToEditProfile: function() {
    wx.navigateTo({ url: '/pages/profile/editProfile/editProfile', fail:()=>wx.showToast({title:'页面建设中'})}); // 假设的编辑资料页
  },

  navigateToCertification: function() {
    wx.navigateTo({ url: '/pages/profile/certification/certification' });
  },

  navigateToAboutUs: function() {
    wx.navigateTo({ url: '/pages/common/aboutUs/aboutUs', fail:()=>wx.showToast({title:'页面建设中'})});
  },
  navigateToPrivacyPolicySettings: function() {
    wx.navigateTo({ url: '/pages/common/webView/webView?type=privacyPolicy' });
  },
  navigateToUserAgreementSettings: function() {
    wx.navigateTo({ url: '/pages/common/webView/webView?type=userAgreement' });
  },


  logout: function() {
    wx.showModal({
      title: '退出登录',
      content: '您确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          console.log('用户点击确定退出登录');
          wx.removeStorageSync('userToken');
          wx.removeStorageSync('userInfo'); // 清除用户信息缓存
          app.globalData.isLoggedIn = false;
          app.globalData.userInfo = null;
          app.globalData.token = null;

          // 跳转到登录页或首页 (通常是登录页，或一个公共的首页)
          // 如果有tabBar，不能用reLaunch到非tabBar页，如果登录页不是tabBar页
          wx.reLaunch({ // reLaunch 会关闭所有页面，打开到应用内的某个页面
            url: '/pages/auth/login/login' // 确保登录页已在app.json中首页或能独立访问
          });
        }
      }
    });
  }
});