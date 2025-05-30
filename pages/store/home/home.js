// pages/store/home/home.js
import request from '../../../utils/request.js'; // 确保路径正确

// !!! 非常重要：你需要将这个占位符替换为后端图片资源的真实基础URL !!!
// 例如: 'https://your-image-server.com' 或 'https://222.186.168.45:8080' (如果图片和API在同一服务下)
const IMAGE_BASE_URL =  'https://222.186.168.45:8080'; // <--- 修改这里！

Page({
  data: {
    categories: [
      { id: 'all', name: '推荐' },
      { id: 'books', name: '手语图书' },
      { id: 'stationery', name: '创意文具' },
      { id: 'lifestyle', name: '生活周边' },
    ],
    currentCategoryId: 'all',
    currentCategoryTitle: '热门推荐',

    products: [],

    pointsExchangeItems: [],
    allPointsItemsMock: [
        { id: 'point001', name: '平台定制贴纸', pointsRequired: 50, imageUrl: '/assets/images/product-sticker-placeholder.png' }, // 给积分商品也加上占位图
        { id: 'point002', name: '志愿者荣誉徽章', pointsRequired: 200, imageUrl: '/assets/images/badge-placeholder.png' }
    ],

    isLoadingProducts: false,
    isLoadingPointsItems: false,

    currentPage: 1,
    pageSize: 10,
    hasMoreProducts: true,
  },

  onLoad: function (options) {
    this.updateCurrentCategoryTitle();
    this.loadProducts(true);
    this.loadPointsExchangeItems();
  },

  updateCurrentCategoryTitle: function() {
    let title = '商品列表';
    if (this.data.currentCategoryId === 'all') {
      title = '热门推荐';
    } else {
      const currentCategory = this.data.categories.find(c => c.id === this.data.currentCategoryId);
      if (currentCategory) {
        title = currentCategory.name;
      }
    }
    this.setData({ currentCategoryTitle: title });
  },

  loadProducts: function(isRefresh = false) {
    if (this.data.isLoadingProducts || (!isRefresh && !this.data.hasMoreProducts)) {
      if (!isRefresh && !this.data.hasMoreProducts) console.log("No more products to load for category:", this.data.currentCategoryId);
      return;
    }

    this.setData({ isLoadingProducts: true });
    if (isRefresh) {
      this.setData({ products: [], currentPage: 1, hasMoreProducts: true });
      wx.showLoading({ title: '加载中...' });
    } else {
      wx.showLoading({ title: '加载更多...' });
    }

    let requestParams = {
      page: this.data.currentPage.toString(),
      pagesize: this.data.pageSize.toString()
    };

    if (this.data.currentCategoryId !== 'all') {
      requestParams.type = this.data.currentCategoryId;
    }

    console.log("Requesting products from /shop/page with params:", requestParams);

    request({
      url: '/shop/page',
      method: 'GET',
      data: requestParams,
      expectDirectData: true // 告诉 request.js 这个接口直接返回业务数据
    })
    .then(directApiResponseData => {
      console.log('API /shop/page Response (direct data):', directApiResponseData);

      const newRawProducts = (directApiResponseData && Array.isArray(directApiResponseData.records)) ? directApiResponseData.records : [];
      const totalCount = (directApiResponseData && directApiResponseData.total !== undefined) ? directApiResponseData.total : 0;

      if (!Array.isArray(newRawProducts)) {
          console.error("API /shop/page 返回的 records 不是一个数组:", newRawProducts);
          this.setData({ products: isRefresh ? [] : this.data.products, hasMoreProducts: false });
          return;
      }

      const formattedProducts = newRawProducts.map(item => {
        let completeImageUrl = '/assets/images/product-placeholder-small.png'; // 默认占位图
        if (item.img) {
          if (item.img.startsWith('http://') || item.img.startsWith('https://')) {
            completeImageUrl = item.img; // API已返回完整URL
          } else {
            // 拼接基础URL和相对路径
            // 确保 IMAGE_BASE_URL 不以 / 结尾，且 item.img 不以 / 开头，或者处理好拼接
            let imagePath = item.img;
            if (IMAGE_BASE_URL.endsWith('/') && imagePath.startsWith('/')) {
                imagePath = imagePath.substring(1); //移除 item.img 开头的 /
            } else if (!IMAGE_BASE_URL.endsWith('/') && !imagePath.startsWith('/')) {
                 if (imagePath) { // 只有当imagePath不为空时才加斜杠
                    imagePath = '/' + imagePath;
                 }
            }
            completeImageUrl = IMAGE_BASE_URL + imagePath;
          }
        }

        return {
          id: item.id,
          name: item.name,
          imageUrl: completeImageUrl,
          price: item.price,
          priceFormatted: `¥ ${parseFloat(item.price || 0).toFixed(2)}`,
          type: item.type,
          stock: item.stock,
          pointsPrice: item.points_price || null // 假设API可能会有 points_price
        };
      });

      const updatedProducts = isRefresh ? formattedProducts : this.data.products.concat(formattedProducts);

      this.setData({
        products: updatedProducts,
        currentPage: this.data.currentPage + 1,
        hasMoreProducts: updatedProducts.length < totalCount,
      });
    })
    .catch(err => {
      console.error('API获取商品列表失败:', err);
      this.setData({ products: isRefresh ? [] : this.data.products, hasMoreProducts: false });
    })
    .finally(() => {
      this.setData({ isLoadingProducts: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    });
  },

  loadPointsExchangeItems: function() {
    this.setData({ isLoadingPointsItems: true });
    // 这里仍然使用模拟数据，如果积分兑换项也来自API，则按类似loadProducts的方式修改
    setTimeout(() => {
      // 给积分商品也加上完整的imageUrl (如果需要从服务器获取)
      const formattedPointsItems = this.data.allPointsItemsMock.map(item => {
          let completeImageUrl = '/assets/images/point-item-placeholder.png'; // 默认占位
          if (item.imageUrl && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://'))) {
              completeImageUrl = item.imageUrl;
          } else if (item.imageUrl) {
              // 假设积分商品的图片路径也需要拼接 IMAGE_BASE_URL
              let imagePath = item.imageUrl;
              if (IMAGE_BASE_URL.endsWith('/') && imagePath.startsWith('/')) {
                  imagePath = imagePath.substring(1);
              } else if (!IMAGE_BASE_URL.endsWith('/') && !imagePath.startsWith('/')) {
                  if (imagePath) imagePath = '/' + imagePath;
              }
              completeImageUrl = IMAGE_BASE_URL + imagePath;
          }
          return {...item, imageUrl: completeImageUrl};
      });
      this.setData({ pointsExchangeItems: formattedPointsItems, isLoadingPointsItems: false });
    }, 300);
  },

  onCategoryTap: function(event) {
    const categoryId = event.currentTarget.dataset.id;
    this.setData({ currentCategoryId: categoryId }, () => {
      this.updateCurrentCategoryTitle();
      this.loadProducts(true);
    });
  },

  onSearchConfirm: function(event) {
    const keyword = event.detail.value;
    console.log('Search confirmed:', keyword);
    wx.navigateTo({
        url: `/pages/store/searchResult/searchResult?keyword=${keyword}`
    });
  },

  navigateToProductDetail: function(event) {
    const productId = event.currentTarget.dataset.id;
    wx.navigateTo({
        url: `/pages/store/productDetails/productDetails?id=${productId}`
    });
  },

  navigateToCart: function() {
    wx.navigateTo({
        url: '/pages/store/cart/cart'
    });
  },

  exchangeWithPoints: function(event) {
    const itemId = event.currentTarget.dataset.id;
    const item = this.data.pointsExchangeItems.find(i => i.id === itemId);
    if (!item) return;
    wx.showModal({
        title: '积分兑换',
        content: `确定使用 ${item.pointsRequired} 积分兑换 "${item.name}" 吗？`,
        success: (res) => {
            if (res.confirm) {
                console.log('User confirmed exchange for item:', itemId);
                wx.showToast({ title: '兑换成功 (模拟)', icon: 'success' });
            }
        }
    });
  },

  onPullDownRefresh: function() {
    this.updateCurrentCategoryTitle();
    this.loadProducts(true);
    this.loadPointsExchangeItems();
    // wx.stopPullDownRefresh() 在 finally 中
  },

  onReachBottom: function() {
    this.loadProducts(false);
  }
});