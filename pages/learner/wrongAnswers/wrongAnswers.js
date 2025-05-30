// pages/learner/wrongAnswers/wrongAnswers.js
import request from '../../../utils/request.js';
const app = getApp();
const MEDIA_BASE_URL = 'https://222.186.168.45:8080'; // 媒体基础URL

Page({
  data: {
    wrongAnswerItems: [], // 存储错题列表
    isLoading: false,
    firstLoad: true,
    currentPage: 1,
    pageSize: 10, // 或根据API默认
    hasMoreData: true,
    currentUserId: null
  },

  onLoad: function (options) {
    // 确保用户已登录才能查看错题本
    if (app.globalData.isLoggedIn && app.globalData.userInfo && app.globalData.userInfo.id) {
      this.setData({ currentUserId: app.globalData.userInfo.id });
      this.loadWrongAnswers(true);
    } else {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能查看您的错题回顾。',
        confirmText: '去登录',
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login/login' });
          } else { // 用户点了关闭或取消（如果showCancel为true）
            wx.navigateBack(); // 返回上一页
          }
        }
      });
    }
  },

  loadWrongAnswers: function (isRefresh = false) {
    if (!this.data.currentUserId) {
        console.warn("WrongAnswersPage: No currentUserId, cannot load wrong answers.");
        if (isRefresh) wx.stopPullDownRefresh();
        return;
    }
    if (this.data.isLoading || (!isRefresh && !this.data.hasMoreData)) {
        if (!isRefresh && !this.data.hasMoreData) console.log("WrongAnswersPage: No more wrong answers.");
        if (isRefresh) wx.stopPullDownRefresh();
        return;
    }

    this.setData({ isLoading: true });
    if (isRefresh) {
      this.setData({ wrongAnswerItems: [], currentPage: 1, hasMoreData: true, firstLoad: true });
      wx.showLoading({ title: '加载错题...' });
    } else {
      this.setData({ firstLoad: false });
      wx.showLoading({ title: '加载更多...' });
    }

    request({
      url: '/learn/wrongpage',
      method: 'GET',
      data: {
        id: this.data.currentUserId.toString(), // **用户ID**
        page: this.data.currentPage.toString(),
        pagesize: this.data.pageSize.toString()
      },
      expectDirectData: true // **假设响应是 {total, records}**
    })
    .then(directApiResponseData => {
      console.log('API /learn/wrongpage Response (direct data):', JSON.stringify(directApiResponseData));

      const newRawItems = (directApiResponseData && Array.isArray(directApiResponseData.records)) ? directApiResponseData.records : [];
      const totalCount = (directApiResponseData && directApiResponseData.total !== undefined) ? parseInt(directApiResponseData.total, 10) : 0;

      if (!Array.isArray(newRawItems)) {
         console.warn("/learn/wrongpage 返回的 records 不是一个有效的数组:", newRawItems);
         this.setData({ wrongAnswerItems: isRefresh ? [] : this.data.wrongAnswerItems, hasMoreData: false });
         return;
      }

      const formattedItems = newRawItems.map(item => {
        let completeImageUrl = '/assets/images/gesture-placeholder.png';
        const imagePathFromApi = item.img; // **根据 Example，图片字段是 img**
        if (imagePathFromApi && typeof imagePathFromApi === 'string' && imagePathFromApi.trim() !== "") {
          if (imagePathFromApi.startsWith('http')) {
            completeImageUrl = imagePathFromApi;
          } else if (imagePathFromApi.includes('/') && imagePathFromApi.includes('.')) {
            let imagePath = imagePathFromApi.trim();
            if (MEDIA_BASE_URL.endsWith('/') && imagePath.startsWith('/')) imagePath = imagePath.substring(1);
            else if (!MEDIA_BASE_URL.endsWith('/') && !imagePath.startsWith('/')) {
                if(imagePath) imagePath = '/' + imagePath;
            }
            completeImageUrl = MEDIA_BASE_URL + imagePath;
          } else {
            console.warn(`Wrong Answer ID ${item.id}: Invalid image path from API (img: "${imagePathFromApi}"), using placeholder.`);
          }
        }
        return {
          id: item.id,          // API: id (手势ID)
          name: item.name,        // API: name
          imageUrl: completeImageUrl,
          video: item.video,      // API: video (来自Example)
          description: item.description // API: description (来自Example)
          // 你可以添加一个字段，比如 'isWrongSetItem': true，用于WXML中区分样式或操作
        };
      });

      const updatedItems = isRefresh ? formattedItems : this.data.wrongAnswerItems.concat(formattedItems);
      this.setData({
        wrongAnswerItems: updatedItems,
        currentPage: this.data.currentPage + 1,
        hasMoreData: updatedItems.length < totalCount,
      });
    })
    .catch(err => {
      console.error('加载错题列表失败:', err);
      this.setData({ wrongAnswerItems: isRefresh ? [] : this.data.wrongAnswerItems, hasMoreData: false });
    })
    .finally(() => {
      this.setData({ isLoading: false, firstLoad: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    });
  },

  navigateToGestureDetail: function(event) { // 点击错题项跳转到手势详情
    const gestureId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/learner/gestureDetails/gestureDetails?id=${gestureId}`
    });
  },
  // 也可以添加从错题本移除的功能，调用之前定义的 /learn/wrong (DELETE) 接口

  onPullDownRefresh: function() {
    if (this.data.currentUserId) this.loadWrongAnswers(true);
    else wx.stopPullDownRefresh();
  },
  onReachBottom: function() {
    if (this.data.currentUserId) this.loadWrongAnswers(false);
  },
   // --- 新增：确认是否移除错题 ---
   confirmRemoveWrongItem: function(event) {
    const questionId = event.currentTarget.dataset.id;
    const questionName = event.currentTarget.dataset.name || '该题目';

    wx.showModal({
      title: '移除错题',
      content: `确定要从错题本中移除 "${questionName}" 吗？`,
      confirmText: "确认移除",
      confirmColor: "#e64340", // 红色，表示警告操作
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          this.removeWrongItemFromApi(questionId);
        }
      }
    });
  },

  // --- 新增：调用API移除错题 ---
  removeWrongItemFromApi: function(questionId) {
    const currentUserId = this.data.currentUserId; // onLoad时已设置
    if (!currentUserId) {
      wx.showToast({ title: '用户未登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '移除中...' });

    request({
      url: `/learn/delete?id=${questionId}&userid=${currentUserId}`, // **Query 参数**
      method: 'DELETE', // **方法是 DELETE**
      // data: {}, // DELETE 请求通常没有 Body，或者为空对象
    })
    .then(response => { // response 是 API 返回的 data 部分 (null 或 {})
      console.log('API /learn/delete success:', response);
      wx.hideLoading();
      wx.showToast({ title: '已从错题本移除', icon: 'success' });

      // 从前端列表中移除该错题
      const updatedItems = this.data.wrongAnswerItems.filter(item => item.id !== questionId);
      this.setData({ wrongAnswerItems: updatedItems });

      // 如果移除后列表为空，可以考虑刷新整个列表或显示空状态
      if (updatedItems.length === 0) {
        // this.loadWrongAnswers(true); // 或者只是简单更新UI
        this.setData({hasMoreData: false}); // 如果是最后一项被删除
      }
    })
    .catch(err => {
      wx.hideLoading();
      console.error('API /learn/delete FAILED:', err);
      wx.showToast({ title: err.msg || '移除失败，请重试', icon: 'none' });
    });
  }
});