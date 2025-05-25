// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: { // <--- 确保 globalData 对象存在
    userInfo: null,
    hearingTestResults: null // <--- 初始化 hearingTestResults
    // 你也可以在这里初始化其他全局需要用到的数据
  }
})