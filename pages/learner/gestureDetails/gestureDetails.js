// pages/learner/gestureDetails/gestureDetails.js
import request from '../../../utils/request.js';
const MEDIA_BASE_URL = 'https://222.186.168.45:8080'; // 确保这是正确的媒体基础URL

Page({
  data: {
    gestureId: null,
    gesture: { // 初始化手势数据结构
        name: '加载中...',
        translation: '', // 接口文档没提供，先空着
        mediaUrl: null,
        mediaType: 'image',
        tags: [], // 接口文档没提供，先空着
        description: '', // 将对应 API 的 descript
        descriptionSteps: [],
        usageExamples: [], // 接口文档没提供
        dialogueExample: null, // 接口文档没提供
        confusingGestures: [], // 接口文档没提供
        // 根据API文档 schema
        id: null,
        image: null, // 原始 image 路径
        video: null, // 原始 video 路径
    },
    isLoading: true,
    errorMessage: ''
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ gestureId: options.id });
      this.fetchGestureDetails(options.id);
    } else {
      this.setData({ isLoading: false, errorMessage: '手势ID缺失' });
      wx.showToast({ title: '参数错误', icon: 'none' });
    }
  },

  fetchGestureDetails: function(id) {
    this.setData({ isLoading: true, errorMessage: '' });
    wx.showLoading({ title: '加载中...' });

    request({
      url: '/learn/id', // 接口路径
      method: 'GET',
      data: { id: id } // Query参数 id
      // 假设此接口遵循 {code, msg, data} 结构，所以不传 expectDirectData
    })
    .then(apiGestureData => { // apiGestureData 是 API 响应的 data.data 部分 (即手势对象)
      console.log(`API /learn/id Response (data.data part):`, apiGestureData);

      if (apiGestureData && apiGestureData.id !== undefined) {
        let mediaUrl = '';
        let mediaType = 'image';
        // 根据Schema，字段是 video 和 image
        if (apiGestureData.video && apiGestureData.video.trim() !== "") {
            mediaType = 'video';
            mediaUrl = this.buildMediaUrl(apiGestureData.video);
        } else if (apiGestureData.image && apiGestureData.image.trim() !== "") {
            mediaType = 'image';
            mediaUrl = this.buildMediaUrl(apiGestureData.image);
        } else {
            mediaUrl = '/assets/images/gesture-placeholder-large.png'; // 准备一个详情页用的大占位图
        }

        // 手势描述，API字段是 descript
        const descriptionFromApi = apiGestureData.descript || '';
        const descriptionSteps = descriptionFromApi.split('\n').map((step, i) => {
            const trimmedStep = step.trim();
            // 简单判断是否已经有序号，避免重复添加 "1. 1. xxx"
            if (trimmedStep && !/^\d+\.\s*/.test(trimmedStep)) {
                return `${i + 1}. ${trimmedStep}`;
            }
            return trimmedStep;
        }).filter(s => s.length > 0);


        this.setData({
          'gesture.id': apiGestureData.id,
          'gesture.name': apiGestureData.name || '手势名称',
          'gesture.mediaUrl': mediaUrl,
          'gesture.mediaType': mediaType,
          'gesture.description': descriptionFromApi, // 保存原始描述
          'gesture.descriptionSteps': descriptionSteps,
          'gesture.image': apiGestureData.image, // 保存原始API路径
          'gesture.video': apiGestureData.video, // 保存原始API路径
          // --- 以下字段，如果 /learn/id 接口文档中没有定义，则会是空或默认值 ---
          // 'gesture.translation': apiGestureData.translation || '',
          // 'gesture.tags': apiGestureData.tags_array || [],
          // 'gesture.usageExamples': apiGestureData.usage_examples_array || [],
          // 'gesture.confusingGestures': apiGestureData.confusing_gestures_array || [],
          isLoading: false
        });
      } else {
        console.warn("fetchGestureDetails: API返回的手势数据为空或格式不正确", apiGestureData);
        this.setData({ isLoading: false, errorMessage: (apiGestureData && apiGestureData.msg) || '无法加载手势详情' });
        // wx.showToast({ title: '手势信息获取失败', icon: 'none' });
      }
    })
    .catch(err => {
      console.error('API获取手势详情失败:', err);
      this.setData({ isLoading: false, errorMessage: err.msg || '加载手势详情失败' });
    })
    .finally(() => {
        // wx.hideLoading() 在 request.js 的 complete 中处理
    });
  },

  buildMediaUrl: function(path) { // 复用这个辅助函数
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    let baseUrl = MEDIA_BASE_URL;
    if (baseUrl.endsWith('/') && path.startsWith('/')) {
        path = path.substring(1);
    } else if (!baseUrl.endsWith('/') && !path.startsWith('/')) {
        if (path) path = '/' + path;
    }
    return baseUrl + path;
  },

  addToPractice: function() {
      // TODO: 实现加入练习的逻辑 (例如，调用API，更新本地状态等)
      wx.showToast({
          title: `已将 "${this.data.gesture.name}" 加入练习`,
          icon: 'none'
      });
  },

  markAsMastered: function() {
      // TODO: 实现标记为已掌握的逻辑
      wx.showToast({
          title: `已将 "${this.data.gesture.name}" 标记为掌握`,
          icon: 'success'
      });
      // 可能需要更新按钮状态或导航离开
  },

  // 图片加载错误处理 (可选)
  onMediaError: function(e) {
      console.error('媒体加载失败', e.detail.errMsg);
      // 可以尝试设置一个默认的错误图片
      // if (e.currentTarget.dataset.type === 'main') {
      //     this.setData({'gesture.mediaUrl': '/assets/images/load-error.png'});
      // }
  }
});