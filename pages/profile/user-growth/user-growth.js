// pages/profile/user-growth/user-growth.js
import request from '../../../utils/request.js';
const app = getApp();
const API_BASE_URL = 'https://222.186.168.45:8080'; // API基础URL

Page({
  data: {
    userInfo: { // 用于UI显示，初始为加载中状态
      id: null,
      name: "加载中...",
      avatarUrl: "/assets/images/avatar_placeholder.png",
      points: '---',
      level: "", // 这两个字段需要确认从哪个API获取
      volunteerTitle: ""
    },
    // 任务列表可以先在前端定义结构
    tasks: [
      { id: 'task_daily_challenge', name: "完成每日挑战", current: 0, target: 1, progress: '0%', status: 'pending' },
      { id: 'task_volunteer_activity', name: "参加一次公益活动", current: 0, target: 5, progress: '0%', status: 'pending' }
    ],
    badges: [],
    commonFunctions: [
      { id: 'fn001', name: "我的订单", icon: '/assets/svgs/icon-store.svg', page: "/pages/profile/myOrders/myOrders" },
      { id: 'fn002', name: "积分明细", icon: '/assets/svgs/icon-star.svg', page: "/pages/profile/pointsDetails/pointsDetails" },
      { id: 'fn003', name: "在线听力测试", icon: '/assets/svgs/icon-headphones.svg', page: "/pages/profile/hearingTest/instructions/instructions" },
      { id: 'fn004', name: "排行榜", icon: '/assets/svgs/icon-trophy.svg', page: "/pages/profile/leaderboard/leaderboard" },
      { id: 'fn005', name: "设置", icon: '/assets/svgs/icon-settings.svg', page: "/pages/profile/settings/settings" }
    ],
    isLoading: true
  },

  onShow: function() {
    console.log("user-growth.js onShow: 页面显示");
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    // 使用“检查-等待-回调”模式来确保在登录后加载数据
    if (app.globalData.isLoggedIn && app.globalData.userInfo) {
      console.log("user-growth.js onShow: User already logged in, loading page data.");
      this.loadPageData();
    } else {
      console.log("user-growth.js onShow: User not logged in, registering loginReadyCallback.");
      // 确保只注册一次回调
      if (!this.loginCallbackAdded) {
        app.globalData.loginReadyCallback.push(() => {
          console.log("user-growth.js: loginReadyCallback triggered, now loading page data.");
          this.loadPageData();
        });
        this.loginCallbackAdded = true;
      }
    }
  },

  onLoad: function (options) {
    console.log("user-growth.js onLoad: 页面加载");
    // 主要逻辑已移至 onShow
  },

  // 统一的数据加载入口
  loadPageData: function() {
    this.setData({ isLoading: true });
    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    if (!currentUserId) {
        console.error("loadPageData called, but currentUserId is missing.");
        this.setData({ isLoading: false });
        // 可以考虑引导去登录
        return;
    }
    console.log(`loadPageData for user ID: ${currentUserId}`);

    // 使用 Promise.allSettled 并行获取所有数据
    Promise.allSettled([
      this.fetchNickname(currentUserId),
      this.fetchAvatar(currentUserId),
      this.fetchPoints(currentUserId),
      this.fetchUserBadges(currentUserId)
    ]).then(results => {
      console.log("user-growth.js: All page data fetches settled.", results);
      this.setData({ isLoading: false });
      wx.stopPullDownRefresh();
    });
  },

  // --- API 调用函数 ---
  fetchNickname: function(userId) {
    console.log(`[fetchNickname] 调用 API GET /user/getname`);
    return request({
      url: '/user/getname',
      method: 'GET',
      data: { id: userId.toString() }
    })
    .then(nickname => {
      if (typeof nickname === 'string') {
        console.log("API返回的昵称:", nickname);
        this.setData({ 'userInfo.name': nickname });
        if (app.globalData.userInfo) app.globalData.userInfo.name = nickname;
      }
    }).catch(err => console.error("fetchNickname failed:", err));
  },

  fetchAvatar: function(userId) {
    // 假设 /user/getimg 直接返回图片流，我们构造URL并在WXML中使用
    const avatarUrl = `${API_BASE_URL}/user/getimg?id=${userId.toString()}`;
    console.log("[fetchAvatar] 构造的头像URL:", avatarUrl);
    this.setData({ 'userInfo.avatarUrl': avatarUrl });
    if (app.globalData.userInfo) app.globalData.userInfo.avatarUrl = avatarUrl;
    return Promise.resolve(); // 返回一个成功的Promise
  },

  fetchPoints: function(userId) {
    // **你需要和timing确认获取积分的真实接口路径**
    // **我假设是 /user/count (来自之前的排行榜接口文档)**
    console.log(`[fetchPoints] 调用 API GET /user/count`);
    return request({
      url: '/user/count',
      method: 'GET',
      data: { id: userId.toString() },
      expectDirectData: true // **假设这个接口也直接返回数字，没有code,msg包裹**
    })
    .then(points => {
      if (points !== undefined && !isNaN(parseInt(points))) {
        const userPoints = parseInt(points);
        console.log("API返回的积分:", userPoints);
        this.setData({ 'userInfo.points': userPoints });
        if (app.globalData.userInfo) app.globalData.userInfo.points = userPoints;
      }
    }).catch(err => {
      console.error("API获取用户积分失败:", err);
      this.setData({ 'userInfo.points': '获取失败' });
    });
  },
  
  fetchUserTasks: function(userId) {
    // 这个接口返回任务列表，但可能不包含最新的进度
    // 我们暂时还是用它来获取任务的定义，而进度可以从 /user/info (如果实现了) 或其他地方更新
    // 如果没有 /user/info，那么任务进度暂时就是写死的
    console.log(`[fetchUserTasks] 调用 API GET /user/task`);
    return request({
      url: '/user/task',
      method: 'GET',
      data: { id: userId.toString() }
    })
    .then(apiTaskArray => {
        // ... (你之前的任务数据格式化逻辑)
        if (Array.isArray(apiTaskArray)) {
            const formattedTasks = apiTaskArray.map(apiTask => {
                // ...
            });
            this.setData({ tasks: formattedTasks });
        }
    }).catch(err => console.error("fetchUserTasks failed:", err));
  },

  fetchUserBadges: function(userId) { /* ... 保持不变 ... */ },

  // --- 事件处理函数 ---
  goToTask: function(e) {
    const taskId = e.currentTarget.dataset.taskid;
    console.log("点击了任务项，任务ID:", taskId);
    // 根据 taskId 跳转到不同页面
    if (taskId === 'task_daily_challenge') {
        wx.navigateTo({ url: '/pages/learner/dailyChallenge/dailyChallenge' });
    } else if (taskId === 'task_volunteer_activity') {
        wx.switchTab({ url: '/pages/volunteer/activityList/activityList' });
    } else {
        wx.showToast({ title: '功能暂未开放', icon: 'none' });
    }
  },

  // --- 事件处理函数 ---
  viewAllTasks: function() {
    wx.navigateTo({ url: '/pages/profile/taskList/taskList', fail: () => wx.showToast({title:'页面建设中', icon:'none'}) });
  },
  viewAllBadges: function() {
    wx.navigateTo({ url: '/pages/profile/badgeWall/badgeWall', fail: () => wx.showToast({title:'页面建设中', icon:'none'}) });
  },
  handleFunctionTap: function(e) {
    const pagePath = e.currentTarget.dataset.page;
    const funcName = e.currentTarget.dataset.funcname;
    if (pagePath) {
      wx.navigateTo({
        url: pagePath,
        fail: (err) => {
          console.error(`Navigate failed to ${pagePath}:`, err);
          wx.showToast({ title: `页面 "${funcName}" 建设中`, icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: `功能配置错误`, icon: 'none'});
    }
  },
  goToTask: function(e) {
    const taskId = e.currentTarget.dataset.taskid;
    console.log("点击了任务按钮，任务ID:", taskId);
    wx.showToast({ title: `处理任务 (ID: ${taskId})`, icon: 'none' });
  },

  onPullDownRefresh: function() {
      console.log("user-growth.js: onPullDownRefresh triggered");
      // 下拉刷新时，也需要确保已登录
      if (app.globalData.isLoggedIn && app.globalData.userInfo) {
          this.loadPageData(); // 重新加载所有页面数据
      } else {
          wx.stopPullDownRefresh(); // 未登录则不执行刷新
      }
  }
});