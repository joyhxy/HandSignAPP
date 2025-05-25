// pages/profile/myActivities/myActivities.js
Page({
  data: {
      ongoingActivities: [],
      completedActivities: [],
      historicalActivities: [],
      isLoading: true
  },

  onLoad: function (options) {
      this.fetchMyActivities();
  },
  onShow: function() {
      // 每次进入页面都可能需要刷新活动状态，比如签到后
      // this.fetchMyActivities();
  },

  fetchMyActivities: function() {
      this.setData({ isLoading: true });
      wx.showLoading({ title: '加载中...' });

      // --- 模拟API请求 ---
      setTimeout(() => {
          const mockData = {
              ongoing: [
                  {
                      id: 'ongoing001',
                      title: '社区手语角辅导',
                      location: '阳光社区',
                      dateTime: '今天 14:00 开始',
                      statusText: '进行中',
                      checkInButtonText: 'GPS签到 (距离 50m)',
                      cannotCheckIn: false, // 是否可以签到
                      checkInHint: '请在活动现场附近进行签到'
                  }
              ],
              completed: [
                  {
                      id: 'completed001',
                      title: '听障人士观影活动协助',
                      location: '市文化馆',
                      dateTime: '08-15 已结束',
                      statusText: '已完成',
                      feedbackHint: '完成反馈可获得额外积分奖励'
                  }
              ],
              historical: [
                  { id: 'hist001', title: '手语文化沙龙', date: '2023-07-10', points: 15 },
                  { id: 'hist002', title: '线上手语角', date: '2023-06-22', points: 10 }
              ]
          };
          this.setData({
              ongoingActivities: mockData.ongoing,
              completedActivities: mockData.completed,
              historicalActivities: mockData.historical,
              isLoading: false
          });
          wx.hideLoading();
      }, 1000);
      // TODO: 真实API请求
  },

  checkIn: function(event) {
      const activityId = event.currentTarget.dataset.id;
      // TODO: 实现GPS签到逻辑
      // 1. 获取用户地理位置 wx.getLocation
      // 2. 判断是否在活动范围内
      // 3. 调用API进行签到
      wx.showToast({
          title: `尝试为活动 ${activityId} 签到`,
          icon: 'none'
      });
      // 模拟签到成功后按钮状态变化
      const index = this.data.ongoingActivities.findIndex(a => a.id === activityId);
      if (index > -1) {
          this.setData({
              [`ongoingActivities[${index}].checkInButtonText`]: '已签到',
              [`ongoingActivities[${index}].cannotCheckIn`]: true,
              [`ongoingActivities[${index}].checkInHint`]: '签到成功！'
          });
      }
  },

  fillFeedback: function(event) {
      const activityId = event.currentTarget.dataset.id;
      // TODO: 跳转到反馈问卷页面，或弹出反馈模态框
      wx.navigateTo({
          url: `/pages/volunteer/activityFeedback/activityFeedback?id=${activityId}` // 假设的反馈页
      });
  },
  onPullDownRefresh: function() {
      this.fetchMyActivities();
      wx.stopPullDownRefresh();
  }
});