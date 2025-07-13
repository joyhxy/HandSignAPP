// pages/forum/list/list.js
import request from '../../../utils/request.js';
const app = getApp();
const IMAGE_BASE_URL = 'https://222.186.168.45:8080'; // 假设图片基础路径

Page({
  data: {
    posts: [],
    isLoading: false,
    isPullingDown: false, // 用于控制自定义下拉刷新动画
    // 新增一个字段来判断当前是列表模式还是详情模式
    currentPage: 1,
    pageSize: 10, // 每页加载10条帖子
    hasMoreData: true,
    firstLoad: true,
    currentUserId: null ,
    commentPage: 1,       // 列表页通常只获取第一页评论
    commentPageSize: 2    // 列表页每条帖子下最多显示2条评论预览
  },

  onLoad: function (options) {
    console.log("Forum list page onLoad");
    // 使用“检查-等待-回调”模式确保登录状态就绪
    if (app.globalData.isLoggedIn && app.globalData.userInfo) {
      this.loadPosts(true);
    } else {
      app.globalData.loginReadyCallback.push(() => {
        this.loadPosts(true);
      });
    }
  },

  onLoad: function (options) {
    console.log("Forum list page onLoad");
    // 将主要逻辑移到 onShow，以确保 app.globalData 已就绪
  },

  onShow: function() {
    console.log("Forum list page onShow triggered");
    // **核心：每次页面显示时，都从全局获取并设置当前用户ID**
    const userInfo = app.globalData.userInfo;
    const currentId = userInfo ? userInfo.id : null;
    console.log("onShow: Setting currentUserId to:", currentId, "(type:", typeof currentId, ")");
    this.setData({
      currentUserId: currentId
    });

    // 根据是否需要刷新来决定是否加载帖子
    if (this.data.firstLoad || app.globalData.needsRefreshForumList) {
        console.log("onShow: firstLoad or needsRefresh is true, reloading posts.");
        this.loadPosts(true);
        if (app.globalData.needsRefreshForumList) {
          app.globalData.needsRefreshForumList = false; // 重置标志位
        }
    }
  },


  loadPosts: function (isRefresh = false) {
    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    console.log("loadPosts started. currentUserId:", currentUserId);

    if (!currentUserId && app.globalData.isLoggedIn) {
        console.error("loadPosts: User is logged in but UserID is missing!");
        wx.showToast({ title: '用户信息异常', icon: 'none' });
        return;
    }
    // 如果未登录，onLoad中已经注册了回调，理论上不会执行到这里。
    // 但作为保险，如果用户通过某种方式进入且未登录，直接中止。
    if (!app.globalData.isLoggedIn) {
        console.warn("loadPosts: Aborted because user is not logged in.");
        return;
    }

    if (this.data.isLoading || (!isRefresh && !this.data.hasMoreData)) {
      if (isRefresh) { wx.stopPullDownRefresh(); this.setData({ isPullingDown: false }); }
      if (!isRefresh && !this.data.hasMoreData) console.log("No more posts to load.");
      return;
    }
    
    this.setData({ isLoading: true });
    const pageToLoad = isRefresh ? 1 : this.data.currentPage;
    if (isRefresh) {
      this.setData({ posts: [], hasMoreData: true }); // 重置 posts 和 hasMoreData
      // wx.showLoading({ title: '刷新中...' }); // request.js 会统一处理
    }

    const requestData = {
        page: pageToLoad.toString(),
        pagesize: this.data.pageSize.toString(),
        userid: currentUserId.toString(), // **现在这里应该能确保有值了**
        compage: this.data.commentPage.toString(),       // **新增：评论页数**
        compagesize: this.data.commentPageSize.toString() // **新增：评论每页数量**
    };

    console.log("Final request data object to be sent:", JSON.stringify(requestData));

    request({
      url: '/talk/page',
      method: 'GET',
      data: requestData,
    })
    .then(apiPostArray => {
      console.log('API /talk/page Response (data array):', apiPostArray);

      if (!Array.isArray(apiPostArray)) {
        console.error("/talk/page 返回的data不是一个数组:", apiPostArray);
        this.setData({ hasMoreData: false });
        return;
      }

      // 分页判断：如果返回的数组长度小于请求的页面大小，则认为没有更多了
      const hasMore = apiPostArray.length === this.data.pageSize;

      const formattedPosts = apiPostArray.map(item => {
        const imageList = [];
        if (item.img1) imageList.push(this.buildImageUrl(item.img1));
        if (item.img2) imageList.push(this.buildImageUrl(item.img2));
        if (item.img3) imageList.push(this.buildImageUrl(item.img3));
        const authorId = item.creatuser;
    const currentUserId = this.data.currentUserId;
    const authorIdFromApi = item.creatuser;
        
    // **核心调试日志：打印每次比较的值和类型**
    console.log(
        `Comparing for post ID ${item.id}: ` +
        `item.authorId is ${authorIdFromApi} (type: ${typeof authorIdFromApi}), ` +
        `currentUserId is ${this.data.currentUserId} (type: ${typeof this.data.currentUserId}). ` +
        `Is match (strict ===): ${authorIdFromApi === this.data.currentUserId}, ` +
        `Is match (loose ==): ${authorIdFromApi == this.data.currentUserId}`
    );
        const commentCount = (item.coms && item.coms.length) || 0; // 或者 item.total_comment_count || 0

        // **可以处理一下返回的评论数据，以便在WXML中显示**
        const previewComments = (item.coms || []).map(comment => {
            // **你需要确认评论对象 coms[i] 的确切字段名**
            // 假设有：comment_id, content, creator_name
            return {
                id: comment.id, // 假设是 id
                content: comment.description, // API文档中评论的文字是 description
                authorName: comment.creatuser_name || '评论者' // **需要后端在评论对象中也附带上评论者的昵称**
            }
        });
        return {
          id: item.id,
          authorAvatar: this.buildImageUrl(item.author_avatar) || '/assets/images/avatar_placeholder.png', // 假设API返回 author_avatar
          authorId: item.creatuser, // **核心修改1：将API的creatuser映射到authorId**
          authorName: `用户 ${item.creatuser}`, // **临时方案：显示 "用户" + 用户ID**
          createTimeFormatted: this.formatTimeAgo(item.creattime),
          title: item.name || '无标题',
          contentSummary: item.description || '',
          images: imageList,
          likeCount: item.zan || 0,
          commentCount: (item.coms && item.coms.length) || 0,
          isLikedByCurrentUser: item.iszan || false
        };
      });

      const updatedPosts = isRefresh ? formattedPosts : this.data.posts.concat(formattedPosts);
      this.setData({
        posts: updatedPosts,
        currentPage: pageToLoad + 1,
        hasMoreData: hasMore,
      });
    })
    .catch(err => {
      console.error('加载帖子列表失败:', err);
      this.setData({ hasMoreData: false });
    })
    .finally(() => {
      this.setData({ isLoading: false, isPullingDown: false, firstLoad: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    });
  },

  // --- 核心：删除帖子的方法 ---
  handleDeletePost: function(event) {
    const postId = event.currentTarget.dataset.postid;
    const postIndex = event.currentTarget.dataset.index;
    const currentUserId = this.data.currentUserId;

    if (!currentUserId) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
    }
    // 双重确认，虽然按钮只对作者显示，但方法里再判断一次更安全
    if (this.data.posts[postIndex].authorId !== currentUserId) {
        wx.showToast({ title: '无权限删除', icon: 'none' });
        return;
    }


    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇帖子吗？此操作不可撤销。',
      confirmColor: '#e64340', // 红色确认按钮
      success: (res) => {
        if (res.confirm) {
          console.log(`User confirmed to delete post ${postId}`);
          this.deletePostApi(postId, postIndex);
        }
      }
    });
  },

  deletePostApi: function(postId, postIndex) {
    const currentUserId = this.data.currentUserId;
    wx.showLoading({ title: '删除中...' });

    request({
      url: `/talk/delete?id=${postId.toString()}&userid=${currentUserId.toString()}`,
      method: 'POST',
      data: {}
    })
    .then(response => {
      wx.hideLoading();
      wx.showToast({ title: '删除成功', icon: 'success' });
      
      // **从前端列表中移除该帖子**
      let currentPosts = [...this.data.posts];
      currentPosts.splice(postIndex, 1); // 从指定索引处删除1个元素
      this.setData({
        posts: currentPosts
      });

    })
    .catch(err => {
      wx.hideLoading();
      console.error(`删除帖子 ${postId} 失败:`, err);
      wx.showToast({ title: err.msg || '删除失败，请重试', icon: 'none' });
    });
  },


  // 辅助函数，用于拼接图片URL
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
  },

  onPullDownRefresh: function() {
    console.log("Pull down to refresh triggered");
    if (this.data.isLoading) return;
    this.setData({ isPullingDown: true });
    this.loadPosts(true);
  },

  onReachBottom: function() {
    console.log("Reach bottom triggered");
    this.loadPosts(false);
  },

    // --- 核心：点赞处理方法 ---
    handleLikePost: function(event) {
      const postId = event.currentTarget.dataset.postid;
      const postIndex = event.currentTarget.dataset.index;
      const currentPost = this.data.posts[postIndex];
  
      if (!currentPost) {
          console.error("handleLikePost: Cannot find post with index", postIndex);
          return;
      }
  
      const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
      if (!currentUserId) { // 检查登录
        wx.showToast({ title: '请先登录才能点赞', icon: 'none' });
        return;
      }
  
      // **乐观更新 UI (Optimistic Update)**:
      // 立即在前端修改点赞状态和数量，给用户即时反馈，然后再向后端发请求。
      // 如果后端请求失败，再将状态回滚。
      const originalLikeStatus = currentPost.isLikedByCurrentUser;
      const originalLikeCount = currentPost.likeCount;
      const newLikeStatus = !originalLikeStatus;
      const newLikeCount = newLikeStatus ? originalLikeCount + 1 : originalLikeCount - 1;
  
      this.setData({
        [`posts[${postIndex}].isLikedByCurrentUser`]: newLikeStatus,
        [`posts[${postIndex}].likeCount`]: newLikeCount
      });
  
  
      // **调用 API**
      request({
        url: `/talk/zan?id=${postId.toString()}&userid=${currentUserId.toString()}`,
        method: 'POST',
        // data: {},
      })
      .then(response => {
        console.log(`API /talk/zan for post ${postId} success:`, response);
        // 后端请求成功，前端UI已经是正确的，不需要额外操作。
        // 如果后端返回了最新的点赞总数，可以在这里用它来校准前端的数字。
        // if (response && response.latest_like_count !== undefined) {
        //   this.setData({
        //     [`posts[${postIndex}].likeCount`]: response.latest_like_count
        //   });
        // }
      })
      .catch(err => {
        console.error(`API /talk/zan for post ${postId} failed:`, err);
        // **请求失败，回滚 UI**
        this.setData({
          [`posts[${postIndex}].isLikedByCurrentUser`]: originalLikeStatus,
          [`posts[${postIndex}].likeCount`]: originalLikeCount
        });
        // 给出错误提示
        wx.showToast({ title: err.msg || '点赞失败，请重试', icon: 'none' });
      });
    },

  navigateToPublishPost: function() {
    console.log("Navigate to publish post page");
    wx.navigateTo({
      url: '/pages/forum/publishPost/publishPost'
    });
  },

  navigateToComments: function(event) {
    const postId = event.currentTarget.dataset.postid;
    console.log("Navigate to post comments page, post ID:", postId);
    wx.navigateTo({
      url: `/pages/forum/comments/comments?postId=${postId}` // 跳转到新的评论页
    });
  },
  previewImage: function(event) {
    const { current, images } = event.currentTarget.dataset;
    // 由于模拟数据用的是本地路径，wx.previewImage 可能无法预览
    // 但这个逻辑是对的，对接真实API返回网络图片URL后就能正常工作
    console.log("Previewing image:", current, "in list:", images);
    if (images && images.length > 0) {
      wx.previewImage({
        current: current,
        urls: images
      });
    }
  }
});