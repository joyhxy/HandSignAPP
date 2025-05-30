// pages/volunteer/activityList/activityList.js
import request from '../../../utils/request.js';

// !!! 确保这个 IMAGE_BASE_URL 与你商城首页成功加载图片的那个完全一致 !!!
const IMAGE_BASE_URL = 'https://222.186.168.45:8080';

Page({
  data: {
    filterTags: [
      { id: 'all', name: '全部' },
      { id: '社区服务', name: '社区服务' },
      { id: '手语翻译', name: '手语翻译' },
      { id: '文化宣传', name: '文化宣传' },
      { id: '线上活动', name: '线上活动' }
    ],
    currentFilterTagId: 'all',
    activities: [],
    isLoading: false,
    firstLoad: true,
    currentPage: 1,
    pageSize: 10,
    hasMoreData: true,
    isUserLeader: false // **新增：标记用户是否是认证负责人**
  },

  onLoad: function (options) {
    this.loadActivities(true);
  },

  
  loadActivities: function(isRefresh = false) {
    if (this.data.isLoading || (!isRefresh && !this.data.hasMoreData)) {
      if (!isRefresh && !this.data.hasMoreData) console.log("ActivityList: No more activities for filter:", this.data.currentFilterTagId);
      return;
    }

    this.setData({ isLoading: true });
    if (isRefresh) {
      this.setData({ activities: [], currentPage: 1, hasMoreData: true, firstLoad: true });
      wx.showLoading({ title: '加载中...' });
    } else {
      this.setData({ firstLoad: false });
      wx.showLoading({ title: '加载更多...' });
    }

    let requestParams = {
      page: this.data.currentPage.toString(),
      pagesize: this.data.pageSize.toString()
    };

    if (this.data.currentFilterTagId !== 'all') {
      const selectedTag = this.data.filterTags.find(t => t.id === this.data.currentFilterTagId);
      if (selectedTag) {
        requestParams.type = selectedTag.name; // 假设 type 参数接受名称
      }
    }

    console.log("Requesting activities from /find/page with params:", requestParams);

    request({
      url: '/find/page',
      method: 'GET',
      data: requestParams,
      expectDirectData: true // 假设此接口也直接返回业务数据 {total, records}
    })
    .then(directApiResponseData => {
      console.log('API /find/page Response (direct data):', JSON.stringify(directApiResponseData)); // **打印完整的直接响应**

      const newRawActivities = (directApiResponseData && Array.isArray(directApiResponseData.records)) ? directApiResponseData.records : [];
      const totalCount = (directApiResponseData && directApiResponseData.total !== undefined) ? parseInt(directApiResponseData.total, 10) : 0;

      if (!Array.isArray(newRawActivities)) { // 稍微修改判断条件
         console.warn("/find/page 返回的 records 不是一个有效的数组:", newRawActivities);
         this.setData({ activities: isRefresh ? [] : this.data.activities, hasMoreData: false });
         return; // 如果 records 不是数组，后续 map 会报错
      }

      const formattedActivities = newRawActivities.map((item, index) => {
        // **非常重要：打印出每个 item 的 img 字段的原始值**
        console.log(`Processing activity ID ${item.id}, raw item.img: "${item.img}" (type: ${typeof item.img})`);

        let completeImageUrl = '/assets/images/activity-placeholder-1.png'; // 默认本地占位图
        const imagePathFromApi = item.img;

        if (imagePathFromApi && typeof imagePathFromApi === 'string' && imagePathFromApi.trim() !== "") {
          const trimmedPath = imagePathFromApi.trim();
          if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
            completeImageUrl = trimmedPath; // API 已返回完整 URL
          } else if (trimmedPath.includes('/') && trimmedPath.includes('.')) {
            // 看起来像一个相对路径 (包含 / 和 .),尝试拼接
            let imagePath = trimmedPath;
            // 标准化拼接逻辑，与商城首页一致
            if (IMAGE_BASE_URL.endsWith('/') && imagePath.startsWith('/')) {
                imagePath = imagePath.substring(1);
            } else if (!IMAGE_BASE_URL.endsWith('/') && !imagePath.startsWith('/')) {
                if (imagePath) { // 确保 imagePath 非空
                    imagePath = '/' + imagePath;
                }
            }
            completeImageUrl = IMAGE_BASE_URL + imagePath;
            console.log(`Activity ID ${item.id}: Constructed imageUrl: ${completeImageUrl}`);
          } else {
            // 如果 imagePathFromApi 不是完整URL，也不是我们认为的有效相对路径
            console.warn(`Activity ID ${item.id}: Invalid image path format from API (img: "${trimmedPath}"), using default placeholder.`);
          }
        } else {
             console.log(`Activity ID ${item.id}: No image path provided or empty (img: "${imagePathFromApi}"), using default placeholder.`);
        }

        let statusText = '查看详情';
        let displayTags = item.type ? [item.type] : [];
        if (item.join !== undefined && item.max !== undefined) {
            if (item.join >= item.max) {
                statusText = '名额已满'; displayTags.push('名额已满');
            } else {
                displayTags.push('招募中');
            }
        }

        return {
          id: item.id,
          title: item.name,
          imageUrl: completeImageUrl,
          location: item.location,
          dateTime: item.starttime ? item.starttime.substring(0, 16).replace('T', ' ') : '时间待定',
          tags: displayTags,
          description: item.description === "1" || item.description === "22" ? "点击查看活动详情和具体要求。" : (item.description || "暂无描述"),
          statusForButton: statusText,
        };
      });

      const updatedActivities = isRefresh ? formattedActivities : this.data.activities.concat(formattedActivities);
      this.setData({
        activities: updatedActivities,
        currentPage: this.data.currentPage + 1,
        hasMoreData: updatedActivities.length < totalCount,
      });
    })
    .catch(err => {
      console.error('加载活动列表失败 (activityList.js catch):', err);
      this.setData({ activities: isRefresh ? [] : this.data.activities, hasMoreData: false });
    })
    .finally(() => {
      this.setData({ isLoading: false, firstLoad: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    });
  },
   // --- ***** 修改 navigateToPublishActivity 方法 ***** ---
   navigateToPublishActivity: function() {
    const app = getApp(); // 获取最新的全局状态
    const userInfo = app.globalData.userInfo;
    const isLoggedIn = app.globalData.isLoggedIn;

    console.log("Attempting to navigate to Publish Activity. isLoggedIn:", isLoggedIn, "UserInfo:", userInfo);

    if (!isLoggedIn || !userInfo || !userInfo.id) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能进行发布活动等操作。',
        confirmText: '去登录',
        showCancel: true,
        cancelText: '暂不登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login/login' });
          }
        }
      });
      return;
    }

    // **在这里进行负责人认证状态的检查**
    // **你需要和后端确认：/user/isprove 接口是否可以被频繁调用，或者是否有其他方式在全局userInfo中持久化这个状态**
    // **方案1：每次都调用 /user/isprove (确保最新状态，但可能增加API调用)**
    wx.showLoading({title: '检查权限...'});
    request({
        url: '/user/isprove',
        method: 'GET',
        data: { id: userInfo.id.toString() }
    }).then(apiStatusCode => {
        wx.hideLoading();
        if (apiStatusCode === 1) { // 假设 1 代表已认证负责人
            console.log("User is a certified leader. Navigating to publish page.");
            wx.navigateTo({
                url: '/pages/volunteer/publishActivity/publishActivity',
                fail: (err) => { console.error("Failed to navigate to Publish Activity:", err); }
            });
        } else {
            console.log("User is NOT a certified leader. Status code:", apiStatusCode);
            wx.showModal({
                title: '权限不足',
                content: '您还不是认证负责人，无法发布活动。是否前往身份认证？',
                confirmText: '去认证',
                cancelText: '取消',
                success: (res) => {
                    if (res.confirm) {
                        wx.navigateTo({ url: '/pages/profile/certification/certification' });
                    }
                }
            });
        }
    }).catch(err => {
        wx.hideLoading();
        console.error("Failed to check user leader status (/user/isprove):", err);
        wx.showToast({ title: '权限检查失败，请稍后重试', icon: 'none' });
    });

    // **方案2：依赖 app.globalData.userInfo 中已有的认证状态字段 (如果登录或用户信息接口会返回)**
    //    (这个字段名需要你和后端确认，例如 userInfo.is_leader 或 userInfo.leader_certification_status === 2)
    /*
    if (userInfo.is_leader === true || userInfo.leader_certification_status === 2) {
        console.log("User is a certified leader (from globalData). Navigating to publish page.");
        wx.navigateTo({
            url: '/pages/volunteer/publishActivity/publishActivity',
            fail: (err) => { console.error("Failed to navigate to Publish Activity:", err); }
        });
    } else {
        console.log("User is NOT a certified leader (from globalData).");
        wx.showModal({
            title: '权限不足',
            content: '您还不是认证负责人，无法发布活动。是否前往身份认证？',
            confirmText: '去认证',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateTo({ url: '/pages/profile/certification/certification' });
                }
            }
        });
    }
    */
  },
  // --- ***** 方法修改结束 ***** ---



  onFilterTagTap: function(event) {
    const tagId = event.currentTarget.dataset.id;
    // 注意：这里的 tagId 是 filterTags 数组中的 id (例如 "社区服务")
    // 而API的 type 参数也期望是这个值 (根据我们之前的假设)
    if (this.data.currentFilterTagId !== tagId) {
      this.setData({ currentFilterTagId: tagId });
      this.loadActivities(true);
    }
  },

  navigateToActivityDetail: function(event) {
    const activityId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/volunteer/activityDetails/activityDetails?id=${activityId}`
    });
  },

  // 如果 WXML 中按钮用了 catchtap="doNothingAndNavigate"
  doNothingAndNavigate: function(event) {
    // const activityId = event.currentTarget.dataset.id; // 按钮也需要 data-id
    // console.log("Button tapped, navigating for activity:", activityId);
    this.navigateToActivityDetail(event); // 直接调用通用导航方法
  },

  navigateToSearch: function() {
    wx.navigateTo({
      url: '/pages/common/search/search?type=activity' // 假设的通用搜索页
    });
  },

  onPullDownRefresh: function() {
    this.loadActivities(true);
  },

  onReachBottom: function() {
    this.loadActivities(false);
  }
});