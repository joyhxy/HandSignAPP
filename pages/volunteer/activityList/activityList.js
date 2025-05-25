// pages/volunteer/activityList/activityList.js
Page({
  data: {
      filterTags: [
          { id: 'all', name: '全部' },
          { id: 'community', name: '社区服务' },
          { id: 'translation', name: '手语翻译' },
          { id: 'culture', name: '文化宣传' },
          { id: 'online', name: '线上活动' }
      ],
      currentFilterTagId: 'all', // 默认选中“全部”
      activities: [], // 活动列表
      allActivitiesMock: [ // 模拟所有活动数据
          {
              id: 'act001',
              title: '社区手语角辅导',
              imageUrl: '/assets/images/activity-placeholder-1.png', // 替换为真实或占位图
              location: '阳光社区',
              dateTime: '本周六 14:00',
              tags: ['社区服务', '招募中'],
              description: '为社区居民提供基础手语教学，需要有耐心和基本手语能力。活动旨在推广手语文化，促进社区融合。欢迎有志之士加入！',
              status: '招募中'
          },
          {
              id: 'act002',
              title: '听障人士观影活动协助',
              imageUrl: '/assets/images/activity-placeholder-2.png',
              location: '市文化馆',
              dateTime: '08-15 18:00',
              tags: ['手语翻译', '名额已满'],
              description: '协助现场引导，并为需要帮助的听障朋友提供简单的手语沟通，确保他们有良好的观影体验。',
              status: '名额已满'
          },
           {
              id: 'act003',
              title: '线上手语知识分享会',
              imageUrl: null, // 无图示例
              location: '线上直播',
              dateTime: '08-20 20:00',
              tags: ['线上活动', '招募中'],
              description: '邀请资深手语老师进行线上分享，内容包括手语入门、聋人文化等。适合初学者参与。',
              status: '招募中' // 用于主列表
          }
      ],
      recommendedActivities: [ // 模拟推荐活动
           {
              id: 'act003_rec', // ID不同，避免key冲突
              title: '线上手语知识分享会 (推荐)',
              imageUrl: '/assets/images/activity-placeholder-3.png',
              location: '线上直播',
              dateTime: '08-20 20:00',
              tags: ['线上活动'],
              description: '...', // 推荐卡片描述可以省略或简化
              status: '推荐报名' // 用于推荐列表的按钮文字
          }
      ],
      isLoading: false,
      errorMessage: ''
  },

  onLoad: function (options) {
      // TODO: API获取筛选标签 (如果标签是动态的)
      this.loadActivities();
      // TODO: API获取推荐活动 (如果推荐是独立的)
  },

  loadActivities: function() {
      this.setData({ isLoading: true, errorMessage: '' });
      wx.showLoading({ title: '加载中...' });

      // --- 模拟API请求和筛选 ---
      setTimeout(() => {
          let filteredActivities = this.data.allActivitiesMock;
          if (this.data.currentFilterTagId !== 'all') {
              // 简单模拟按第一个标签筛选 (实际应根据后端API的筛选能力)
              // 例如，如果 filterTagId 是 'community'，我们筛选 tags 数组中包含 '社区服务' 的活动
              const currentTagName = this.data.filterTags.find(t => t.id === this.data.currentFilterTagId)?.name;
              if (currentTagName) {
                  filteredActivities = this.data.allActivitiesMock.filter(activity =>
                      activity.tags && activity.tags.includes(currentTagName)
                  );
              }
          }
          this.setData({
              activities: filteredActivities,
              isLoading: false
          });
          wx.hideLoading();
          wx.stopPullDownRefresh();
      }, 500);
  },

  onFilterTagTap: function(event) {
      const tagId = event.currentTarget.dataset.id;
      if (this.data.currentFilterTagId !== tagId) {
          this.setData({
              currentFilterTagId: tagId
          });
          this.loadActivities(); // 根据新的筛选条件重新加载活动
      }
  },

  navigateToActivityDetail: function(event) {
    const activityId = event.currentTarget.dataset.id;
    console.log("Attempting to navigate to Activity Details. ID:", activityId);
    if (!activityId) {
        console.error("Activity ID is undefined. Check data-id in WXML.");
        return;
    }
    wx.navigateTo({
        url: `/pages/volunteer/activityDetails/activityDetails?id=${activityId}`, // <--- **修改这里，确保是 "activityDetails"**
        success: function(res) {
            console.log("Navigation to Activity Details SUCCESS:", res);
        },
        fail: function(err) {
            console.error("Navigation to Activity Details FAIL:", err);
        }
    });
},

  navigateToSearch: function() {
      wx.navigateTo({
          url: '/pages/common/search/search?type=activity' // 假设的通用搜索页
      });
  },

  navigateToMyActivities: function() {
    wx.navigateTo({
        url: '/pages/profile/myActivities/myActivities' // "我的活动"页面路径保持不变
    });
},
  
  doNothing: function() {
      // 用于 catchtap 阻止冒泡，同时不执行任何操作
  },

  onPullDownRefresh: function () {
      this.loadActivities();
      // wx.stopPullDownRefresh() 在 loadActivities 的 setTimeout 回调中调用
  }
});