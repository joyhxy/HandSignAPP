// pages/profile/badgeWall/badgeWall.js
import request from '../../../utils/request.js';
const app = getApp();
const IMAGE_BASE_URL = 'https://222.186.168.45:8080';

Page({
  data: {
    badges: [],
    acquiredCount: 0,
    isLoading: true,
    userId: null // 用于获取指定用户的勋章，默认为当前登录用户
  },
  onLoad: function (options) {
    // 如果从其他用户主页跳转过来，可能会带userId
    const targetUserId = options.userId || (app.globalData.userInfo ? app.globalData.userInfo.id : null);
    if (!targetUserId && !app.globalData.isLoggedIn) {
        wx.showModal({
            title: '提示', content: '请先登录查看勋章墙', showCancel:false,
            success: () => wx.navigateTo({url: '/pages/auth/login/login'})
        });
        this.setData({ isLoading: false });
        return;
    }
    this.setData({userId: targetUserId});
    this.fetchUserBadges(targetUserId);
  },

  fetchUserBadges: function(userIdToFetch) {
    if (!userIdToFetch) {
        console.warn("fetchUserBadges: userIdToFetch is null or undefined.");
        this.setData({ isLoading: false, badges:[], acquiredCount: 0 });
        return;
    }
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载勋章...' });

    request({
      url: '/user/xunzhang',
      method: 'GET',
      data: { id: userIdToFetch }
      // **根据接口文档，此接口应该返回 {code, msg, data:[勋章数组]}**
      // **所以，不需要 expectDirectData: true**
    })
    .then(apiBadgeArray => { // apiBadgeArray 是 API 响应的 data 部分, 即勋章对象数组
      console.log('API /user/xunzhang Response (data array):', apiBadgeArray);

      if (Array.isArray(apiBadgeArray)) {
        let acquiredCount = 0;
        const formattedBadges = apiBadgeArray.map(item => {
          // **字段名映射，优先使用 Example 中的: id, name, img, descript**
          // **假设 API 会返回 is_acquired 字段**
          const isAcquired = item.is_acquired !== undefined ? item.is_acquired : false; // 如果API没返回，默认未获得
          if (isAcquired) {
            acquiredCount++;
          }

          let completeImageUrl = '/assets/images/badge-placeholder.png'; // 准备一个勋章占位图
          const imagePathFromApi = item.img; // Example 是 img
          if (imagePathFromApi && typeof imagePathFromApi === 'string') {
            if (imagePathFromApi.startsWith('http')) {
              completeImageUrl = imagePathFromApi;
            } else if (imagePathFromApi.includes('/') && imagePathFromApi.includes('.')) {
              let imagePath = imagePathFromApi;
              if (IMAGE_BASE_URL.endsWith('/') && imagePath.startsWith('/')) imagePath = imagePath.substring(1);
              else if (!IMAGE_BASE_URL.endsWith('/') && !imagePath.startsWith('/')) {
                  if(imagePath) imagePath = '/' + imagePath;
              }
              completeImageUrl = IMAGE_BASE_URL + imagePath;
            } else {
              console.warn(`Badge ID ${item.id}: Invalid image path from API (img: "${imagePathFromApi}"), using placeholder.`);
            }
          }

          return {
            id: item.id,
            name: item.name || '未知勋章',
            imageUrl: completeImageUrl,
            description: item.descript || '暂无描述', // Example 是 descript
            is_acquired: isAcquired
          };
        });
        this.setData({ badges: formattedBadges, acquiredCount: acquiredCount, isLoading: false });
      } else {
        console.warn("fetchUserBadges: API返回的data部分不是预期的数组:", apiBadgeArray);
        this.setData({ badges: [], acquiredCount: 0, isLoading: false });
      }
    })
    .catch(err => {
      console.error('加载用户勋章失败:', err);
      this.setData({ badges: [], acquiredCount: 0, isLoading: false });
    })
    .finally(() => {
      wx.hideLoading();
      wx.stopPullDownRefresh();
    });
  },

  showBadgeDetail: function(event) {
    const badge = event.currentTarget.dataset.badge;
    if (badge) {
      wx.showModal({
        title: badge.name || '勋章详情',
        content: `${badge.description || '暂无描述'}\n\n状态：${badge.is_acquired ? '已获得' : '未获得'}`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },
  onPullDownRefresh: function() {
    if(this.data.userId) this.fetchUserBadges(this.data.userId);
    else wx.stopPullDownRefresh(); // 如果没有userId，不刷新
  }
});