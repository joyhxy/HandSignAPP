// pages/profile/user-growth/user-growth.js
import request from '../../../utils/request.js'; // 确保request.js的相对路径正确

Page({
  data: {
    // 初始化数据，WXML会先使用这些数据渲染，避免undefined错误
    userInfo: {
      name: "加载中...",
      level: "",
      volunteerTitle: "",
      points: 0,
      avatarUrl: "/assets/images/avatar_placeholder.png", // 默认头像
      // 更多字段可以根据API文档 user/info 来补充默认值
      // id: null,
      // username: '',
    },
    tasks: [],    // 任务列表，初始为空
    badges: [],   // 勋章列表，初始为空
    commonFunctions: [ // 常用功能通常是静态的，或者很少变动
      { id: 'fn001', name: "我的订单", icon: null, page: "/pages/profile/order-list/order-list" }, // 修改为实际页面路径
      { id: 'fn002', name: "积分明细", icon: null, page: "/pages/profile/points-detail/points-detail" }, // 修改为实际页面路径
      { id: 'fn003', name: "在线听力测试", icon: "/assets/svgs/icon-headphones.svg", page: "/pages/profile/hearingTest/instructions/instructions" },
      { id: 'fn004', name: "排行榜", icon: null, page: "/pages/profile/leaderboard/leaderboard" }, // 修改为实际页面路径
      { id: 'fn005', name: "设置", icon: null, page: "/pages/profile/settings/settings" }, // 修改为实际页面路径
    ]
  },

  onLoad: function (options) {
    console.log("user-growth.js onLoad: 页面加载");
    // 优先加载模拟数据进行UI开发和测试
    this.loadMockData();

    // 当准备好对接真实API时，再启用这些调用
    // this.fetchUserProfile();
    // this.fetchUserTasks();
    // this.fetchUserBadges();
  },

  onShow: function() {
    // 每次页面显示时，如果需要，可以刷新TabBar的选中状态
    // 这通常用于自定义TabBar，原生TabBar不需要手动设置selected
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3 // 假设“我的”是第4个tab (索引3)
      })
    }
  },

  // --- 模拟数据加载 ---
  loadMockData: function() {
    console.log("--- 开始执行 loadMockData ---"); // <--- 添加这个日志

    // 1. 模拟用户信息 (对应 API文档的 /user/info)
    const mockUserInfoFromApi = {
      // 字段名严格按照API文档中 /user/info 成功响应的 "data" 部分
      id: 'mockUser123',
      username: 'mock_test_user',
      nickname: "手语爱好者小明",
      avatar: "/assets/images/avatar_placeholder.png", // 可以用一个在线图片测试
      points: 2580,
      // 假设API还会返回这些 (如果API文档有，就加上)
      level: "LV.12",
      volunteer_title: "四星志愿者",
      sign_in_days: 30 // 连续签到天数
    };
    console.log("模拟的用户信息 (mockUserInfoFromApi):", mockUserInfoFromApi); // <--- 添加这个日志
    this.setData({
      'userInfo.name': mockUserInfoFromApi.nickname,
      'userInfo.avatarUrl': mockUserInfoFromApi.avatar,
      'userInfo.points': mockUserInfoFromApi.points,
      'userInfo.level': mockUserInfoFromApi.level,
      'userInfo.volunteerTitle': mockUserInfoFromApi.volunteer_title,
      // 如果还有其他字段在userInfo中，也从mockUserInfoFromApi获取并设置
    });

    console.log("setData userInfo 完成. 当前 userInfo:", this.data.userInfo); // <--- 添加这个日志

    // 2. 模拟任务列表 (假设API文档有一个 /user/tasks 返回任务列表)
    // 假设后端返回的原始任务数据结构 (ITEMS是数组)
    const mockTasksFromApi = {
      ITEMS: [
        { task_id: 't001', task_name: "完成每日手语词汇学习", current_progress: 1, target_progress: 1, status_code: 2, reward: 15 }, // status_code: 2-已完成
        { task_id: 't002', task_name: "参与一次手语角志愿活动", current_progress: 0, target_progress: 1, status_code: 0, reward: 100 }, // status_code: 0-待领取/去做
        { task_id: 't003', task_name: "观看5个手语教学视频", current_progress: 2, target_progress: 5, status_code: 1, reward: 25 } // status_code: 1-进行中
      ]
    };
    // 将API数据格式化为WXML中期望的格式
    const formattedTasks = (mockTasksFromApi.ITEMS || []).map(apiTask => {
      let statusText = "进行中";
      if (apiTask.status_code === 2) statusText = "completed"; // 与WXML中判断一致
      else if (apiTask.status_code === 0) statusText = "pending";

      return {
        id: apiTask.task_id,
        name: apiTask.task_name,
        current: apiTask.current_progress,
        target: apiTask.target_progress,
        status: statusText, // 'completed', 'pending', 'in_progress' 等WXML中使用的状态
        progress: apiTask.target_progress > 0 ? (apiTask.current_progress / apiTask.target_progress) * 100 : 0
      };
    });
    this.setData({
      tasks: formattedTasks
    });

    // 3. 模拟勋章列表 (假设API文档有一个 /user/badges)
    const mockBadgesFromApi = {
      ITEMS: [
        { badge_id: 'b001', badge_name: "新手上路", icon_url: "/assets/svgs/icon-learn.svg", is_acquired: true },
        { badge_id: 'b002', badge_name: "首次志愿", icon_url: "/assets/svgs/icon-volunteer-alt.svg", is_acquired: true },
        { badge_id: 'b003', badge_name: "打卡达人", icon_url: "/assets/svgs/icon-check.svg", is_acquired: true },
        { badge_id: 'b004', badge_name: "积分能手", icon_url: "/assets/svgs/icon-star.svg", is_acquired: false },
        { badge_id: 'b005', badge_name: "手语翻译家", icon_url: "/assets/svgs/icon-trophy.svg", is_acquired: false },
        { badge_id: 'b006', badge_name: "商城达人", icon_url: "/assets/svgs/icon-store.svg", is_acquired: false },
      ]
    };
    const formattedBadges = (mockBadgesFromApi.ITEMS || []).map(apiBadge => ({
      id: apiBadge.badge_id,
      name: apiBadge.badge_name,
      icon: apiBadge.icon_url,
      acquired: apiBadge.is_acquired
    }));
    this.setData({
      badges: formattedBadges
    });

    console.log("模拟数据加载完成. 当前data:", this.data);
  },

  

  // --- API 调用函数框架 (真实请求暂时注释) ---
  fetchUserProfile: function() {
    console.log("尝试调用 fetchUserProfile API");
    /*
    request({
      url: '/user/info', // 参照API文档
      method: 'GET'
    })
    .then(userData => { // userData 是 request.js resolve 出来的 data 部分
      if (userData) {
        console.log('API返回的用户信息:', userData);
        this.setData({
          'userInfo.name': userData.nickname || this.data.userInfo.name,
          'userInfo.avatarUrl': userData.avatar || this.data.userInfo.avatarUrl,
          'userInfo.points': userData.points !== undefined ? userData.points : this.data.userInfo.points,
          'userInfo.level': userData.level || this.data.userInfo.level,
          'userInfo.volunteerTitle': userData.volunteer_title || this.data.userInfo.volunteerTitle,
        });
      }
    })
    .catch(err => {
      console.error('API获取用户信息失败:', err);
      // wx.showToast({ title: err.msg || '用户信息加载失败', icon: 'none' });
    });
    */
  },

  fetchUserTasks: function() {
    console.log("尝试调用 fetchUserTasks API");
    /*
    // 假设API是 /user/tasks?status=all (你需要查阅API文档确认)
    request({
      url: '/user/tasks', // 参照API文档，可能需要参数如 /user/tasks?type=all
      method: 'GET'
    })
    .then(tasksData => { // tasksData 可能是 ITEMS 数组 (request.js 已处理 ITEMS)
      if (tasksData && Array.isArray(tasksData)) {
        const formattedTasks = tasksData.map(apiTask => {
          // ... (与 mockTasksFromApi 的格式化逻辑类似)
          // 确保字段名与API文档一致
          let statusText = "进行中";
          if (apiTask.status_code === 2) statusText = "completed";
          else if (apiTask.status_code === 0) statusText = "pending";

          return {
            id: apiTask.task_id,
            name: apiTask.task_name,
            current: apiTask.current_progress,
            target: apiTask.target_progress,
            status: statusText,
            progress: apiTask.target_progress > 0 ? (apiTask.current_progress / apiTask.target_progress) * 100 : 0
          };
        });
        this.setData({ tasks: formattedTasks });
      }
    })
    .catch(err => {
      console.error('API获取任务列表失败:', err);
    });
    */
  },

  fetchUserBadges: function() {
    console.log("尝试调用 fetchUserBadges API");
    /*
    request({
      url: '/user/badges', // 参照API文档
      method: 'GET'
    })
    .then(badgesData => { // badgesData 可能是 ITEMS 数组
      if (badgesData && Array.isArray(badgesData)) {
        const formattedBadges = badgesData.map(apiBadge => ({
          // ... (与 mockBadgesFromApi 的格式化逻辑类似)
          id: apiBadge.badge_id,
          name: apiBadge.badge_name,
          icon: apiBadge.icon_url,
          acquired: apiBadge.is_acquired
        }));
        this.setData({ badges: formattedBadges });
      }
    })
    .catch(err => {
      console.error('API获取勋章列表失败:', err);
    });
    */
  },

  // --- 事件处理函数 ---
  viewAllTasks: function() {
    wx.navigateTo({
      url: '/pages/profile/task-list/task-list', // 修改为实际页面路径
       fail: () => { wx.showToast({ title: '页面未开放', icon: 'none'})}
    });
  },

  viewAllBadges: function() {
    wx.navigateTo({
      url: '/pages/profile/badge-wall/badge-wall', // 修改为实际页面路径
       fail: () => { wx.showToast({ title: '页面未开放', icon: 'none'})}
    });
  },

  handleFunctionTap: function(e) {
    const pagePath = e.currentTarget.dataset.page;
    const funcName = e.currentTarget.dataset.funcname;
    if (pagePath) {
      wx.navigateTo({
        url: pagePath,
        fail: (err) => {
          console.error("Navigate failed:", pagePath, err);
          wx.showToast({ title: '页面暂未开放', icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: `功能 "${funcName}" 暂未开放`, icon: 'none'});
    }
  },

  goToTask: function(e) { // 示例：处理 “去做任务” 按钮
    const taskId = e.currentTarget.dataset.taskid; // WXML中需要给按钮加上 data-taskid="{{item.id}}"
    console.log("点击了任务按钮，任务ID:", taskId);
    // 根据任务ID跳转到对应页面或执行操作
    wx.showToast({ title: `处理任务: ${taskId}`, icon: 'none' });
  }
})
