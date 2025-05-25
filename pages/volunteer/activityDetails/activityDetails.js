// pages/volunteer/activityDetails/activityDetails.js
Page({
  data: {
      activityId: null,
      activity: { // 初始化活动数据结构
          title: '加载中...',
          imageUrl: null, // '/assets/images/activity-placeholder.png'
          time: '',
          location: '',
          recruitCount: 0,
          registeredCount: 0,
          description: '',
          requirements: [], // 例如: ["掌握基础日常手语", "有耐心"]
          pointsRequired: 0, // 报名所需积分
          // status: 'recruiting' // 'recruiting', 'full', 'ended'
      },
      formData: {
          name: '',
          phone: '',
          experience: ''
      },
      isLoading: true, // 页面加载状态
      isSubmitting: false // 表单提交状态
  },

  onLoad: function (options) {
      if (options.id) {
          this.setData({ activityId: options.id });
          this.fetchActivityDetails(options.id);
      } else {
          wx.showToast({ title: '活动ID缺失', icon: 'none' });
          this.setData({ isLoading: false });
          //考虑返回上一页或显示错误信息
      }
  },

  fetchActivityDetails: function(id) {
      this.setData({ isLoading: true });
      wx.showLoading({ title: '加载中...' });

      // --- 模拟API请求 ---
      setTimeout(() => {
          const mockActivity = {
              id: id,
              title: '社区手语角辅导 (模拟)',
              imageUrl: '/assets/images/activity-placeholder-community.png', // 准备一个活动占位图
              time: '本周六 14:00 - 16:00',
              location: '阳光社区活动中心二楼',
              recruitCount: 5,
              registeredCount: 2,
              description: '本次活动旨在为社区对学习手语感兴趣的居民提供一个入门和交流的平台。志愿者需要协助组织签到，分发材料，并与参与者进行简单的手语互动，鼓励他们开口。这是一个很好的实践机会！',
              requirements: [
                  "掌握基础日常手语，能进行简单对话",
                  "有耐心，善于沟通和引导",
                  "有志愿服务热情，乐于助人",
                  "年满18周岁"
              ],
              pointsRequired: 10,
              status: 'recruiting'
          };

          // 模拟找不到或活动已结束等情况
          if (id === 'ended_activity') {
              mockActivity.title = '已结束的活动 (模拟)';
              mockActivity.status = 'ended';
              mockActivity.registeredCount = mockActivity.recruitCount;
          }

          this.setData({
              activity: mockActivity,
              isLoading: false
          });
          wx.hideLoading();
      }, 1000);

      // --- 真实API (后续替换) ---
      /*
      const { request } = require('../../../utils/request');
      request({ url: `/volunteer/activity/${id}` })
          .then(res => {
              if (res.code === 1 && res.data) {
                  this.setData({ activity: res.data, isLoading: false });
              } else {
                  this.setData({ isLoading: false });
                  wx.showToast({ title: res.msg || '加载活动详情失败', icon: 'none' });
              }
          })
          .catch(err => {
              this.setData({ isLoading: false });
              wx.showToast({ title: '网络错误', icon: 'none' });
          })
          .finally(() => { wx.hideLoading(); });
      */
  },

  // 表单输入处理 (如果不用 model:value)
  // handleNameInput: function(e) { this.setData({'formData.name': e.detail.value}); },
  // handlePhoneInput: function(e) { this.setData({'formData.phone': e.detail.value}); },
  // handleExperienceInput: function(e) { this.setData({'formData.experience': e.detail.value}); },

  submitSignup: function() {
      if (this.data.isSubmitting) return;

      const { name, phone } = this.data.formData;
      if (!name.trim()) {
          wx.showToast({ title: '请输入姓名', icon: 'none' });
          return;
      }
      if (!phone.trim() || !/^1[3-9]\d{9}$/.test(phone.trim())) {
          wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
          return;
      }

      // 检查活动状态，是否可报名等 (示例)
      if (this.data.activity.status !== 'recruiting' || this.data.activity.registeredCount >= this.data.activity.recruitCount) {
          wx.showToast({ title: '当前活动无法报名', icon: 'none' });
          return;
      }

      this.setData({ isSubmitting: true });
      wx.showLoading({ title: '报名提交中...' });

      // --- 模拟API提交 ---
      setTimeout(() => {
          console.log('Submitting signup data:', this.data.formData, 'for activityId:', this.data.activityId);
          wx.hideLoading();
          this.setData({ isSubmitting: false });

          // 模拟成功
          wx.showToast({ title: '报名成功！', icon: 'success' });
          // 更新已报名人数 (仅为前端模拟，真实数据应来自后端)
          this.setData({
              'activity.registeredCount': this.data.activity.registeredCount + 1
          });
          // 报名成功后可以跳转到“我的活动”页面或给出其他指引
          // setTimeout(() => { wx.navigateTo({ url: '/pages/profile/myActivities/myActivities'}); }, 1500);
      }, 1500);

      // --- 真实API提交 (后续替换) ---
      /*
      const { request } = require('../../../utils/request');
      request({
          url: `/volunteer/activity/${this.data.activityId}/signup`,
          method: 'POST',
          data: this.data.formData
      }).then(res => {
          if (res.code === 1) {
              wx.showToast({ title: '报名成功！', icon: 'success' });
              // 刷新活动数据或直接更新UI
              this.fetchActivityDetails(this.data.activityId); // 重新获取详情以更新报名人数等
              // 跳转等
          } else {
              wx.showToast({ title: res.msg || '报名失败', icon: 'none' });
          }
      }).catch(err => {
          wx.showToast({ title: '网络错误，报名失败', icon: 'none' });
      }).finally(() => {
          this.setData({ isSubmitting: false });
          wx.hideLoading();
      });
      */
  }
});