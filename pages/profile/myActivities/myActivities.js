// pages/profile/myActivities/myActivities.js
import request from '../../../utils/request.js';
const app = getApp();

Page({
  data: {
    ongoingActivities: [],
    completedActivities: [], // 用于显示“已结束但可能需要反馈”的活动
    historicalActivities: [], // (暂时可能无法明确区分)
    isLoading: true,
    //userId: 1
  },

  onLoad: function (options) {
    console.log("[myActivities.js] onLoad: 页面加载");

    const testUserIdToUse = 1; // **明确定义要使用的测试用户ID**

    this.setData({ userId: testUserIdToUse }); // 可选：将测试ID存到data中，如果其他地方需要
    this.fetchMyActivities(testUserIdToUse); // **将测试ID直接传递给 fetchMyActivities**
  },

  // onShow: function() { ... } // 可选的刷新逻辑

  fetchMyActivities: function(userIdToFetch) { // **函数接收一个参数作为要请求的用户ID**
    if (!userIdToFetch) { // 检查传入的ID是否有效
        console.error("[fetchMyActivities] 调用时 userIdToFetch 无效或未提供。");
        this.setData({ isLoading: false });
        wx.showToast({ title: '用户ID参数错误', icon: 'none' });
        return; // 提前返回，不发起请求
    }
    console.log(`[fetchMyActivities] 开始调用 API (GET /user/my) for user ID: ${userIdToFetch}`);
    this.setData({ isLoading: true, ongoingActivities: [], completedActivities: [], historicalActivities: [] });
    wx.showLoading({ title: '加载我的活动...' });

    request({
      url: '/user/my',
      method: 'GET',
      data: {
        id: userIdToFetch // **确保这里使用的是传入的 userIdToFetch**
      }
    })
    .then(apiActivityArray => {
      // ... (之前的 .then 数据处理逻辑保持不变)
      console.log('[fetchMyActivities] API /user/my 成功返回的业务数据:', apiActivityArray);
      if (Array.isArray(apiActivityArray)) {
        // ... (分类和格式化逻辑) ...
        const ongoing = [];
        const completedOrNeedsFeedback = [];
        apiActivityArray.forEach(apiActivity => {
            let statusText = "进行中";
            let activityType = 'ongoing';
            if (apiActivity.qring && apiActivity.qring.length > 0) {
                statusText = "待反馈";
                activityType = 'completed_feedback';
            } else if (apiActivity.signing && apiActivity.signing.length > 0 && apiActivity.join < apiActivity.max) {
                statusText = "进行中 (可签到)";
                activityType = 'ongoing';
            }
            const formattedActivity = { /* ... */ }; // 确保这里字段映射正确
            if (activityType === 'ongoing') ongoing.push(formattedActivity);
            else if (activityType === 'completed_feedback') completedOrNeedsFeedback.push(formattedActivity);
        });
        this.setData({ ongoingActivities: ongoing, completedActivities: completedOrNeedsFeedback });

      } else {
        console.warn("[fetchMyActivities] API /user/my 返回的业务数据 (data字段) 不是预期的数组:", apiActivityArray);
        this.setData({ ongoingActivities: [], completedActivities: [] });
      }
    })
    .catch(err => {
      console.error(`[fetchMyActivities] API /user/my 获取失败 for user ID ${userIdToFetch}:`, err);
      this.setData({ ongoingActivities: [], completedActivities: [] });
    })
    .finally(() => {
      this.setData({ isLoading: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
      console.log('[fetchMyActivities] API 调用完成');
    });
  },
  checkIn: function(event) {
    const activityId = event.currentTarget.dataset.id;
    const activity = this.data.ongoingActivities.find(act => act.id === activityId);
    if (activity && activity.checkInImageUrl) {
      // 如果 signing 是二维码图片URL，则可以预览让用户扫码
      wx.previewImage({
        urls: [activity.checkInImageUrl],
        current: activity.checkInImageUrl,
        success: () => {
          // 这里可以假设用户已扫码（虽然无法真正验证），然后更新UI或调用签到API
          wx.showToast({ title: '请扫描二维码完成签到', icon: 'none' });
          // 真实场景：后端应有接口验证签到，或签到二维码本身带有时效性和用户信息
        }
      });
    } else {
      wx.showToast({ title: '当前活动无法通过此方式签到', icon: 'none' });
    }
  },

  fillFeedback: function(event) {
    const activityId = event.currentTarget.dataset.id;
    const activity = this.data.completedActivities.find(act => act.id === activityId);
    if (activity && activity.feedbackUrl) {
      // 如果 qring 是一个网页链接，可能需要用 web-view 打开，或提示用户复制链接
      // 如果 qring 是小程序内部路径，则 wx.navigateTo
      // 假设它是一个外部链接
      wx.setClipboardData({
        data: activity.feedbackUrl,
        success: () => {
          wx.showModal({
            title: '反馈问卷',
            content: `问卷链接已复制，请在浏览器中打开填写：${activity.feedbackUrl}`,
            showCancel: false,
            confirmText: '知道了'
          });
        }
      });
    } else {
      wx.showToast({ title: '暂无反馈问卷', icon: 'none' });
    }
  },

  onPullDownRefresh: function() {
    const userId = this.data.userId || 1; // 从data获取，或用默认测试ID
    if (userId) {
        this.fetchMyActivities(userId);
    } else {
        wx.stopPullDownRefresh();
        console.error("[myActivities.js] onPullDownRefresh: userId 未定义");
    }
  }
});