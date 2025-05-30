// pages/profile/user-growth/user-growth.js
import request from '../../../utils/request.js';
const app = getApp();

Page({
  data: {
    userInfo: {
      name: "加载中...", // 初始状态
      level: "LV.0",
      volunteerTitle: "志愿者",
      points: 0,
      avatarUrl: "/assets/images/avatar_placeholder.png",
      id: null, // 将由登录或硬编码的测试ID填充（用于任务接口）
      username: '',
      sign_in_days: 0
    },
    tasks: [], // 将从 /user/task 获取
    badges: [], // 将使用模拟数据
    commonFunctions: [
      { id: 'fn001', name: "我的订单", icon: '/assets/svgs/icon-store.svg', page: "/pages/profile/myOrders/myOrders" },
      { id: 'fn002', name: "积分明细", icon: '/assets/svgs/icon-star.svg', page: "/pages/profile/pointsDetails/pointsDetails" },
      { id: 'fn003', name: "在线听力测试", icon: "/assets/svgs/icon-headphones.svg", page: "/pages/profile/hearingTest/instructions/instructions" },
      { id: 'fn004', name: "排行榜", icon: '/assets/svgs/icon-trophy.svg', page: "/pages/profile/leaderboard/leaderboard" },
      { id: 'fn005', name: "设置", icon: null, page: "/pages/profile/settings/settings" },
    ],
    isLoading: true, // 整体页面加载状态
    isLoadingTasks: false // 单独为任务设置加载状态
  },

  onLoad: function (options) {
    console.log("user-growth.js onLoad: 页面加载");
    this.setData({ isLoading: true, isLoadingTasks: true });

    // ---- 硬编码一个测试用户ID，仅用于需要它的接口 (如 /user/task) ----
    const TEST_USER_ID_FOR_API = 1;
    // 假设登录后，用户的真实ID会被存到 this.data.userInfo.id
    // 目前由于没有登录，我们先在data中给userInfo.id赋一个初始值，如果API需要
    // 但 /user/task 明确需要 id 参数，所以直接传递
    // this.setData({ 'userInfo.id': TEST_USER_ID_FOR_API }); // 如果其他地方也需要这个ID

    // 加载模拟的用户信息和勋章数据
    this.loadMockProfileData(TEST_USER_ID_FOR_API); // 传递ID以便模拟的用户信息能对应上

    // 调用真实的任务接口
    this.fetchUserTasks(TEST_USER_ID_FOR_API)
      .finally(() => {
        // 假设所有初始数据加载（模拟+真实）完成后，设置整体加载状态
        // 注意：如果 loadMockProfileData 内部有异步，需要更复杂的 Promise 处理
        // 为了简单，我们假设 loadMockProfileData 是同步的或很快完成
        this.setData({ isLoading: false });
        console.log("user-growth.js onLoad: 初始数据获取流程完成 (部分模拟, 部分API)");
      });
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    // 如果任务列表需要在每次显示时刷新，可以在这里调用
    // if (this.data.userInfo.id && !this.data.isLoadingTasks) {
    //   this.fetchUserTasks(this.data.userInfo.id);
    // }
  },

  // --- 新增：加载模拟的用户信息和勋章数据 ---
  loadMockProfileData: function(userIdForMock) {
    console.log("[loadMockProfileData] 开始加载模拟的用户信息和勋章");

    // 1. 模拟用户信息 (字段名尽量与 Apifox 中 /user/info 的 data 响应体一致)
    const mockUserInfo = {
      id: userIdForMock, // 使用传入的ID，保持一致性
      username: `mock_user_${userIdForMock}`,
      nickname: "手语爱好者 (模拟)",
      avatar: "/assets/images/avatar_placeholder.png",
      points: 1888,
      level: "LV.8 (模拟)",
      volunteer_title: "热心志愿者 (模拟)",
      sign_in_days: 25
    };
    this.setData({ userInfo: mockUserInfo });
    console.log("[loadMockProfileData] 模拟用户信息已设置:", this.data.userInfo);

    // 2. 模拟勋章列表 (字段名尽量与 Apifox 中 /user/badges 的 data 响应体一致)
    const mockBadges = [
      { id: 'b001', name: "新手上路 (模拟)", icon_url: "/assets/svgs/icon-learn.svg", is_acquired: true },
      { id: 'b002', name: "首次志愿 (模拟)", icon_url: "/assets/svgs/icon-volunteer-alt.svg", is_acquired: true },
      { id: 'b003', name: "打卡达人 (模拟)", icon_url: "/assets/svgs/icon-check.svg", is_acquired: true },
      { id: 'b004', name: "积分能手 (模拟)", icon_url: "/assets/svgs/icon-star.svg", is_acquired: false },
    ];
    // 格式化为 WXML 期望的结构
    const formattedBadges = mockBadges.map(apiBadge => ({
      id: apiBadge.id,
      name: apiBadge.name,
      icon: apiBadge.icon_url,
      acquired: apiBadge.is_acquired === true
    }));
    this.setData({ badges: formattedBadges });
    console.log("[loadMockProfileData] 模拟勋章列表已设置:", this.data.badges);
  },
  // --- 模拟数据加载结束 ---


  // --- 真实API调用：只保留 fetchUserTasks ---
  fetchUserTasks: function(userId) {
    console.log(`[fetchUserTasks] 开始调用 API (GET /user/task) for user ID: ${userId}`);
    this.setData({ isLoadingTasks: true }); // tasks: [] 已在 loadMockProfileData 或 data 中初始化

    return request({ // 返回Promise
      url: '/user/task',
      method: 'GET',
      data: { id: userId }
    })
    .then(apiTaskArray => {
      console.log('[fetchUserTasks] API /user/task 成功返回的业务数据 (apiTaskArray):', apiTaskArray);
      if (Array.isArray(apiTaskArray)) {
        const formattedTasks = apiTaskArray.map(apiTask => {
          let statusText = "进行中";
          let statusCodeForFrontend = 1;
          if (apiTask.status_code === 2) { statusText = "已完成"; statusCodeForFrontend = 2; }
          else if (apiTask.status_code === 0) { statusText = "待处理"; statusCodeForFrontend = 0; }

          const progressPercent = (apiTask.max > 0 && apiTask.did !== undefined) // 使用 did 和 max
                                ? Math.round((apiTask.did / apiTask.max) * 100)
                                : 0;
          return {
            id: apiTask.id,
            name: apiTask.name,
            current: apiTask.did || 0, // 使用 did
            target: apiTask.max || 0,  // 使用 max
            status: statusText,
            status_code_frontend: statusCodeForFrontend,
            progress: progressPercent + '%',
            progressRaw: progressPercent,
          };
        });
        console.log('[fetchUserTasks] 格式化后的任务列表 (formattedTasks):', formattedTasks);
        this.setData({ tasks: formattedTasks });
      } else {
        console.warn('[fetchUserTasks] API /user/task 返回的业务数据 (data字段) 不是一个数组:', apiTaskArray);
        this.setData({ tasks: [] }); // 清空或用之前的模拟数据
      }
    })
    .catch(err => {
      console.error(`[fetchUserTasks] API /user/task 获取失败 for user ID ${userId}:`, err);
      // 可以考虑在这里加载一次模拟任务数据作为降级
      // this.loadMockTasksForFallback();
      this.setData({ tasks: [] });
    })
    .finally(() => {
      this.setData({ isLoadingTasks: false });
      console.log('[fetchUserTasks] API 调用完成');
    });
  },

  // --- 移除了 fetchUserProfile 和 fetchUserBadges ---

  // --- 事件处理函数 (保持不变) ---
  viewAllTasks: function() { wx.navigateTo({ url: '/pages/profile/taskList/taskList', fail: () => wx.showToast({title:'功能建设中'})}); },
  viewAllBadges: function() {
    wx.navigateTo({
        url: '/pages/profile/badgeWall/badgeWall', // 修改为实际页面路径
        fail: () => { wx.showToast({ title: '页面未开放', icon: 'none'})}
    });
},
  handleFunctionTap: function(e) {
    const pagePath = e.currentTarget.dataset.page;
    const funcName = e.currentTarget.dataset.funcname; // WXML中需要设置 data-funcname="{{funcItem.name}}"
    if (pagePath) {
      wx.navigateTo({
        url: pagePath,
        fail: (err) => {
          console.error(`Navigate failed to ${pagePath}:`, err);
          wx.showToast({ title: `页面 "${funcName}" 建设中`, icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: `功能 "${funcName}" 配置错误`, icon: 'none'});
    }
  },
  goToTask: function(e) {
    const taskId = e.currentTarget.dataset.taskid;
    console.log("点击了任务按钮，任务ID:", taskId);
    wx.showToast({ title: `处理任务: ${taskId} (功能建设中)`, icon: 'none' });
  },
});