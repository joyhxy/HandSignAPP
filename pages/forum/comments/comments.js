// pages/forum/comments/comments.js
import request from '../../../utils/request.js';
const app = getApp();
const IMAGE_BASE_URL = 'https://222.186.168.45:8080';

Page({
  data: {
    postId: null,
    postInfo: null, // 用于显示帖子概要
    comments: [],
    totalComments: 0,
    currentPage: 1,
    pageSize: 15,
    hasMoreComments: true,
    isLoading: false,
    isPullingDown: false,
    firstLoad: true,
    isSubmittingComment: false,
    myCommentText: '',
    isCommentInputEmpty: true, // **新增：专门用于控制按钮禁用状态**
    isSubmittingComment: false,
    currentUserId: null // 新增：存储当前登录用户的ID
  },

  onLoad: function (options) {
    if (options.postId) {
      this.setData({ postId: options.postId });
      // 尝试从上一个页面获取帖子概要信息
      const pages = getCurrentPages();
      const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
      if (prevPage && prevPage.data && Array.isArray(prevPage.data.posts)) {
          const postFromList = prevPage.data.posts.find(p => p.id == options.postId);
          if (postFromList) { this.setData({ postInfo: postFromList, totalComments: postFromList.commentCount || 0 }); }
      }
      this.loadComments(true);
    } else {
      wx.showToast({ title: '帖子ID缺失', icon: 'none' });
      wx.navigateBack();
    }
  },
  onShow: function() {
    // 每次进入页面都更新当前用户ID
    this.setData({
        currentUserId: app.globalData.userInfo ? app.globalData.userInfo.id : null
    });
  },
  loadComments: function(isRefresh = false) {
    if (this.data.isLoading || (!isRefresh && !this.data.hasMoreComments)) {
        if(isRefresh) { wx.stopPullDownRefresh(); this.setData({isPullingDown: false}); }
        return;
    }
    this.setData({ isLoading: true });
    const pageToLoad = isRefresh ? 1 : this.data.currentPage;
    if (isRefresh) { this.setData({ comments: [], hasMoreComments: true }); }
    
    request({
      url: '/talk/compage', // **评论分页查询接口**
      method: 'GET',
      data: {
        id: this.data.postId,
        page: pageToLoad.toString(),
        pagesize: this.data.pageSize.toString(),
        userid: app.globalData.userInfo ? app.globalData.userInfo.id.toString() : ''
      }
      // **假设此接口遵循 {code, msg, data:[...]} 结构**
    })
    .then(apiCommentArray => {
      console.log('API /talk/compage Response:', apiCommentArray);
      if (!Array.isArray(apiCommentArray)) { this.setData({ hasMoreComments: false }); return; }

      const hasMore = apiCommentArray.length === this.data.pageSize;
      const formattedComments = apiCommentArray.map(item => {
        // **你需要和后端确认，API返回的每个评论对象中，是否包含评论者的昵称和头像**
        // **假设已包含 author_name 和 author_avatar**
        return {
          id: item.id,
          content: item.description,
          likeCount: item.zan || 0,
          isLiked: item.iszan || false,
          authorName: item.author_name || `用户${item.creatuser}`, // 后备显示
          authorAvatar: this.buildImageUrl(item.author_avatar) || '/assets/images/avatar_placeholder.png',
          authorId: item.creatuser,
          createTimeFormatted: this.formatTimeAgo(item.creattime)
        };
      });

      const updatedComments = isRefresh ? formattedComments : this.data.comments.concat(formattedComments);
      this.setData({
        comments: updatedComments,
        currentPage: pageToLoad + 1,
        hasMoreComments: hasMore,
        // **总评论数最好由API提供，否则只能显示已加载的数量**
        totalComments: isRefresh ? (apiCommentArray.length > 0 ? (this.data.postInfo ? this.data.postInfo.commentCount : apiCommentArray.length) : 0) : this.data.totalComments
      });
    })
    .catch(err => {
        console.error('加载评论失败:', err);
        this.setData({ hasMoreComments: false });
    })
    .finally(() => {
        this.setData({ isLoading: false, isPullingDown: false, firstLoad: false });
        wx.stopPullDownRefresh();
    });
  },
  // --- 核心：点赞评论的方法 ---
  handleLikeComment: function(event) {
    const commentId = event.currentTarget.dataset.commentid;
    const commentIndex = event.currentTarget.dataset.index;
    const currentComment = this.data.comments[commentIndex];

    if (!currentComment) {
        console.error("handleLikeComment: Cannot find comment with index", commentIndex);
        return;
    }

    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    if (!currentUserId || !app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录才能点赞', icon: 'none' });
      return;
    }

    // **1. 乐观更新 UI**
    const originalLikeStatus = currentComment.isLiked;
    const originalLikeCount = currentComment.likeCount;
    const newLikeStatus = !originalLikeStatus;
    const newLikeCount = newLikeStatus ? originalLikeCount + 1 : originalLikeCount - 1;

    this.setData({
      [`comments[${commentIndex}].isLiked`]: newLikeStatus,
      [`comments[${commentIndex}].likeCount`]: newLikeCount
    });

    // **2. 调用 API**
    request({
      url: `/talk/comzan?id=${commentId.toString()}&userid=${currentUserId.toString()}`,
      method: 'POST',
      data: {}
    })
    .then(response => {
      console.log(`API /talk/comzan for comment ${commentId} success:`, response);
      // 后端请求成功，UI 已经是正确的，无需操作。
      // (可选) 如果后端返回了最新的点赞数，可以在这里校准
      // if (response && response.latest_like_count !== undefined) {
      //   this.setData({ [`comments[${commentIndex}].likeCount`]: response.latest_like_count });
      // }
    })
    .catch(err => {
      console.error(`API /talk/comzan for comment ${commentId} failed:`, err);
      // **3. 请求失败，回滚 UI**
      this.setData({
        [`comments[${commentIndex}].isLiked`]: originalLikeStatus,
        [`comments[${commentIndex}].likeCount`]: originalLikeCount
      });
      // 给出错误提示
      wx.showToast({ title: err.msg || '操作失败，请重试', icon: 'none' });
    });
  },



  onCommentInput: function(e) {
    const inputText = e.detail.value;
    this.setData({
      myCommentText: inputText,
      // **每次输入时，都重新计算按钮是否应该被禁用**
      isCommentInputEmpty: inputText.trim() === ''
    });
    console.log('Comment input changed:', inputText, 'Is empty:', this.data.isCommentInputEmpty);
  },

  submitComment: function() {
    const commentText = this.data.myCommentText.trim();
    if (this.data.isCommentInputEmpty) {
      wx.showToast({ title: '评论内容不能为空', icon: 'none' });
      return;
    }
    if (this.data.isSubmittingComment) return;
    this.setData({ isSubmittingComment: true });
    wx.showLoading({ title: '发送中...' });

    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    if (!currentUserId || !app.globalData.isLoggedIn) { /* ...未登录处理... */ return; }

    request({
      url: `/talk/comment?userid=${currentUserId.toString()}&id=${this.data.postId}&word=${encodeURIComponent(commentText)}`,
      method: 'POST',
      data: {}
    })
    .then(response => {
      wx.hideLoading();
      this.setData({ isSubmittingComment: false, myCommentText: '' });
      wx.showToast({ title: '评论成功！', icon: 'success' });
      // 评论成功后，刷新评论列表
      this.loadComments(true);
      // 通知上一页（论坛列表页）更新评论数
      const pages = getCurrentPages();
      const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
      if (prevPage && prevPage.route === 'pages/forum/list/list') {
          if (typeof prevPage.updatePostCommentCount === 'function') {
            prevPage.updatePostCommentCount(this.data.postId, 1); // 假设 list.js 有这个方法
          } else { // 备选方案
            prevPage.setData({[`posts[${/*...find index...*/'0'}].commentCount`]: prevPage.data.posts[0].commentCount + 1})
          }
      }
    })
    .catch(err => {
      wx.hideLoading();
      this.setData({ isSubmittingComment: false });
      console.error('评论失败:', err);
    });
  },
// --- 核心：删除评论的方法 ---
  handleDeleteComment: function(event) {
    const commentId = event.currentTarget.dataset.commentid;
    const commentIndex = event.currentTarget.dataset.index;
    const currentUserId = this.data.currentUserId;

    if (!currentUserId) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
    }
    // 双重确认，虽然按钮只对作者显示，但方法里再判断一次更安全
    if (this.data.comments[commentIndex].authorId !== currentUserId) {
        wx.showToast({ title: '无权限删除', icon: 'none' });
        return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      confirmColor: '#e64340',
      success: (res) => {
        if (res.confirm) {
          console.log(`User confirmed to delete comment ${commentId}`);
          this.deleteCommentApi(commentId, commentIndex);
        }
      }
    });
  },

  deleteCommentApi: function(commentId, commentIndex) {
    const currentUserId = this.data.currentUserId;
    wx.showLoading({ title: '删除中...' });

    request({
      url: `/talk/deletecom?id=${commentId.toString()}&userid=${currentUserId.toString()}`,
      method: 'POST',
      data: {}
    })
    .then(response => {
      wx.hideLoading();
      wx.showToast({ title: '删除成功', icon: 'success' });
      
      // **从前端列表中移除该评论**
      let currentComments = [...this.data.comments];
      currentComments.splice(commentIndex, 1);
      this.setData({
        comments: currentComments,
        totalComments: this.data.totalComments > 0 ? this.data.totalComments - 1 : 0 // 更新总评论数
      });
      // **(可选) 通知上一页（论坛列表页）更新评论总数**
      const pages = getCurrentPages();
      const forumListPage = pages.find(p => p.route === 'pages/forum/list/list');
      if (forumListPage && typeof forumListPage.updatePostCommentCount === 'function') {
        forumListPage.updatePostCommentCount(this.data.postId, -1); // 假设 list.js 有这个方法来增减评论数
      }

    })
    .catch(err => {
      wx.hideLoading();
      console.error(`删除评论 ${commentId} 失败:`, err);
      wx.showToast({ title: err.msg || '删除失败，请重试', icon: 'none' });
    });
  },

  onPullDownRefresh: function() { this.loadComments(true); },
  onReachBottom: function() { this.loadComments(false); },
  buildImageUrl: function(path) {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http')) return path;
    if (!path.includes('/') || !path.includes('.')) {
      console.warn("buildImageUrl: Invalid path format, returning empty.", path);
      return '';
    }
    let baseUrl = IMAGE_BASE_URL;
    if (baseUrl.endsWith('/') && path.startsWith('/')) path = path.substring(1);
    else if (!baseUrl.endsWith('/') && !path.startsWith('/')) { if(path) path = '/' + path; }
    return baseUrl + path;
  },

  formatTimeAgo: function(dateTimeStr) {
    if (!dateTimeStr) return '刚刚';
    // 更完善的时间格式化逻辑
    const now = new Date();
    const past = new Date(dateTimeStr.replace(/-/g, '/'));
    const diffInSeconds = Math.floor((now - past) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    return dateTimeStr.substring(0, 10); // 超过一周显示日期
  }
});