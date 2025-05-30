// pages/learner/encyclopedia/encyclopedia.js
import request from '../../../utils/request.js';
const IMAGE_BASE_URL = 'https://222.186.168.45:8080'; // 确保这个URL是正确的

Page({
  data: {
    gestures: [],
    isLoading: false,
    firstLoad: true,
    currentPage: 1,
    pageSize: 10,
    hasMoreData: true,
  },
  onLoad: function (options) {
    this.loadGestures(true);
  },
  loadGestures: function (isRefresh = false) {
    if (this.data.isLoading || (!isRefresh && !this.data.hasMoreData)) {
        if (!isRefresh && !this.data.hasMoreData) console.log("Encyclopedia: No more gestures to load.");
        return;
    }

    this.setData({ isLoading: true });
    if (isRefresh) {
      this.setData({ gestures: [], currentPage: 1, hasMoreData: true, firstLoad: true });
      wx.showLoading({ title: '加载中...' });
    } else {
      wx.showLoading({ title: '加载更多...' });
    }

    request({
      url: '/learn/page',
      method: 'GET',
      data: {
        page: this.data.currentPage.toString(),
        pagesize: this.data.pageSize.toString()
      },
      expectDirectData: true // <--- **关键修改：添加这个选项**
    })
    .then(directApiResponseData => { // directApiResponseData 现在是后端直接返回的业务数据对象
      console.log('API /learn/page Response (direct data):', directApiResponseData);

      // **根据 Apifox 文档中 /learn/page 的 "成功响应示例" 来解析**
      // 示例是: { "total": 7, "records": [ { id, name, img, video, description }, ... ] }
      // 注意：文档的 Schema 定义是 data: { ITEMS: { id, name, image }, total: "..." }
      // 我们优先相信文档中的 **示例**，因为它更可能接近实际返回。
      // 如果后端是按 Schema 定义返回的，这里的解析逻辑就需要调整。

      const newRawGestures = (directApiResponseData && Array.isArray(directApiResponseData.records))
                             ? directApiResponseData.records
                             : ((directApiResponseData && directApiResponseData.data && Array.isArray(directApiResponseData.data.ITEMS)) // 兼容 Schema 定义
                                ? directApiResponseData.data.ITEMS
                                : []);

      // total 的来源也需要根据实际情况判断 (是顶层的 total 还是 data.total)
      const totalCount = (directApiResponseData && directApiResponseData.total !== undefined)
                         ? parseInt(directApiResponseData.total, 10)
                         : ((directApiResponseData && directApiResponseData.data && directApiResponseData.data.total !== undefined)
                            ? parseInt(directApiResponseData.data.total, 10)
                            : 0);


      if (!Array.isArray(newRawGestures) && newRawGestures.length === 0 && directApiResponseData.total === undefined && !(directApiResponseData.data && directApiResponseData.data.ITEMS)) {
        console.warn("/learn/page 返回的数据格式完全不符合预期:", directApiResponseData);
        this.setData({ gestures: isRefresh ? [] : this.data.gestures, hasMoreData: false, firstLoad: false });
        return;
      }


      const formattedGestures = newRawGestures.map(item => {
        let completeImageUrl = '/assets/images/gesture-placeholder.png';
        // **根据示例，图片字段是 img；根据Schema，可能是 image。优先用示例的 img。**
        const imagePathFromApi = item.img || item.image;
        if (imagePathFromApi) {
          if (imagePathFromApi.startsWith('http')) {
            completeImageUrl = imagePathFromApi;
          } else {
            let imagePath = imagePathFromApi;
            if (IMAGE_BASE_URL.endsWith('/') && imagePath.startsWith('/')) imagePath = imagePath.substring(1);
            else if (!IMAGE_BASE_URL.endsWith('/') && !imagePath.startsWith('/')) {
                if(imagePath) imagePath = '/' + imagePath;
            }
            completeImageUrl = IMAGE_BASE_URL + imagePath;
          }
        }
        return {
          id: item.id,
          name: item.name,
          imageUrl: completeImageUrl,
          // video: item.video, // 如果列表也返回视频 (示例有)
          // description: item.description // 如果列表也返回描述 (示例有)
        };
      });

      const updatedGestures = isRefresh ? formattedGestures : this.data.gestures.concat(formattedGestures);
      this.setData({
        gestures: updatedGestures,
        currentPage: this.data.currentPage + 1,
        hasMoreData: updatedGestures.length < totalCount,
        firstLoad: false // 数据加载成功或尝试加载后，不再是首次加载状态
      });
    })
    .catch(err => {
      console.error('加载手势列表失败 (encyclopedia.js catch):', err);
      this.setData({ firstLoad: false, gestures: isRefresh ? [] : this.data.gestures, hasMoreData: false });
    })
    .finally(() => {
      this.setData({ isLoading: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    });
  },
  onPullDownRefresh: function() { this.loadGestures(true); },
  onReachBottom: function() { this.loadGestures(false); },
  
  navigateToGestureDetail: function(event) {
    const gestureId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/learner/gestureDetails/gestureDetails?id=${gestureId}`
    });
  }
});