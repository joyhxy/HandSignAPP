// pages/learner/gestureDetails/gestureDetails.js
import request from '../../../utils/request.js';
const app = getApp();

// MEDIA_BASE_URL 不再需要，因为 API 直接返回完整 URL

Page({
  data: {
    gestureId: null,
    gesture: {
        id: null,
        name: '加载中...',
        mediaUrl: null,    // 最终用于WXML的完整URL
        mediaType: 'none', // 'none', 'image', or 'video'
        descriptionSteps: [],
        // ... 其他预留字段
    },
    isLoading: true,
    errorMessage: ''
  },


  onLoad: function (options) {
    console.log("gestureDetails.js onLoad, options:", options);
    if (options.id) {
      this.setData({ gestureId: options.id });
      this.fetchGestureDetails(options.id);
    } else {
      this.setData({ isLoading: false, errorMessage: '手势ID缺失' });
      wx.showToast({ title: '参数错误', icon: 'none', duration: 2000 });
      setTimeout(() => wx.navigateBack(), 2000); // 2秒后自动返回
    }
  },

  fetchGestureDetails: function(id) {
    this.setData({ isLoading: true, errorMessage: '' });
    wx.showLoading({ title: '加载详情...' });

    request({
      url: '/learn/id',
      method: 'GET',
      data: { id: id }
    })
    .then(apiGestureData => {
      if (apiGestureData && apiGestureData.id !== undefined) {
        
        let finalMediaUrl = null;
        let finalMediaType = 'none';

        const videoUrlFromApi = apiGestureData.video;
        const imageUrlFromApi = apiGestureData.img;

        if (videoUrlFromApi && typeof videoUrlFromApi === 'string' && videoUrlFromApi.startsWith('http')) {
            finalMediaType = 'video';
            finalMediaUrl = videoUrlFromApi;
        } else if (imageUrlFromApi && typeof imageUrlFromApi === 'string' && imageUrlFromApi.startsWith('http')) {
            finalMediaType = 'image';
            finalMediaUrl = imageUrlFromApi;
        } else {
            finalMediaType = 'none';
            finalMediaUrl = '/assets/images/media-placeholder-icon.png';
        }

        // **在这里调用 this.formatDescription**
        const descriptionSteps = this.formatDescription(apiGestureData.description); // **错误发生在这里**

        this.setData({
          'gesture.id': apiGestureData.id,
          'gesture.name': apiGestureData.name || '手势名称',
          'gesture.translation': apiGestureData.translation || '',
          'gesture.videoUrl': finalMediaType === 'video' ? finalMediaUrl : null, // 确保不用的类型URL为null
          'gesture.imageUrl': finalMediaType === 'image' ? finalMediaUrl : null,
          'gesture.mediaType': finalMediaType, // mediaType 仍然需要，用于WXML条件渲染
          'gesture.descriptionSteps': descriptionSteps,
          isLoading: false
        });
      } else { /* ... */ }
    })
    .catch(err => {
        console.error('API获取手势详情失败:', err);
        this.setData({ isLoading: false, errorMessage: err.msg || '加载手势详情失败' });
    })
    .finally(() => { wx.hideLoading(); });
  },
  
  // --- ***** 确保这个方法存在于 Page({...}) 内部 ***** ---
  formatDescription: function(desc) {
      if (!desc || typeof desc !== 'string' || desc.trim() === '') {
          return ['暂无描述。']; // 如果描述为空，返回一个提示
      }
      // 将描述按换行符或常见列表符号分割成步骤
      let steps = desc.split(/[\n;；•●-]/).map(s => s.trim()).filter(Boolean);
      // 如果分割后没有产生多个步骤（例如，是一整段话），就直接返回这段话
      if (steps.length <= 1 && desc.trim().length > 0) {
          return [desc.trim()];
      }
      // 为没有序号的步骤智能添加序号
      return steps.map((step, i) => {
          return /^\d+\.\s*/.test(step) ? step : `${i + 1}. ${step}`;
      });
  },
  // --- ***** 方法结束 ***** ---

  onMediaError: function(e) {
    console.error('Media loading failed, event detail:', e.detail);
    const errorType = e.currentTarget.dataset.mediatype;
    if (errorType === 'video') { this.setData({ 'gesture.videoUrl': null }); }
    else if (errorType === 'image') { this.setData({ 'gesture.imageUrl': null }); }
    wx.showToast({ title: `${errorType === 'video' ? '视频' : '图片'}加载失败`, icon: 'none' });
  },
  
  buildMediaUrl: function(path) {
    if (!path || typeof path !== 'string' || path.trim() === "") return '';
    if (path.startsWith('http')) return path; // 已经是完整 URL
    // 简单过滤掉可能是ID的无效路径
    if (!path.includes('/') && !path.includes('.') && path.length < 5) {
        console.warn(`buildMediaUrl: Invalid path format "${path}", returning placeholder.`);
        return '/assets/images/media-load-failed.png'; // 返回加载失败占位图
    }
    let baseUrl = MEDIA_BASE_URL;
    let imagePath = path.trim();
    if (baseUrl.endsWith('/') && imagePath.startsWith('/')) {
        imagePath = imagePath.substring(1);
    } else if (!baseUrl.endsWith('/') && !imagePath.startsWith('/')) {
        if (imagePath) imagePath = '/' + imagePath;
    }
    return baseUrl + imagePath;
  },

  // --- 事件处理函数 ---
  addToPractice: function() {
    if (!this.data.gesture || !this.data.gesture.id) return;
    wx.showToast({
        title: `已将 "${this.data.gesture.name}" 加入练习`,
        icon: 'none'
    });
    // TODO: 调用API -> POST /learn/add-to-practice?gestureId=...
  },

  markAsMastered: function() {
    if (!this.data.gesture || !this.data.gesture.id) return;
    wx.showToast({
        title: `已将 "${this.data.gesture.name}" 标记为掌握`,
        icon: 'success'
    });
    // TODO: 调用API -> POST /learn/mark-as-mastered?gestureId=...
  },

  onMediaError: function(e) {
    console.error('Media loading failed:', e.detail.errMsg);
    this.setData({
      'gesture.mediaUrl': '/assets/images/media-load-failed.png', // 媒体加载失败时显示一个固定的错误图
      'gesture.mediaType': 'image' // 强制以图片形式显示错误占位图
    });
  },

  onPullDownRefresh: function() {
    if (this.data.gestureId) {
        this.fetchGestureDetails(this.data.gestureId).finally(() => {
            wx.stopPullDownRefresh();
        });
    } else {
        wx.stopPullDownRefresh();
    }
  }
});