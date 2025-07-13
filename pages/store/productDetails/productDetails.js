// pages/store/productDetails/productDetails.js
import request from '../../../utils/request.js';
const app = getApp();

// 确认图片基础URL
const IMAGE_BASE_URL = 'https://222.186.168.45:8080';

Page({
  data: {
    productId: null,
    product: {
        name: '加载中...',
        imageUrl: null,
        shortDescription: '商品描述加载中...',
        price: 0,
        priceFormatted: '¥ 0.00',
        pointsPrice: null,
        tags: [],
        fullDescription: '',
        detailImages: [],
        stock: 0,
        type: '',
        id: null
    },
    reviews: [
        { id: 'rev1', userName: '用户A', avatarUrl: null, comment: '质量很好，设计很有意义！' },
        { id: 'rev2', userName: '学习者B', avatarUrl: '/assets/images/avatar_placeholder.png', comment: '推荐购买。' }
    ],
    cartItemCount: 0,
    isLoading: true,
    errorMessage: ''
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ productId: options.id });
      this.fetchProductDetails(options.id);
      this.updateCartItemCount();
    } else {
      this.setData({ isLoading: false, errorMessage: '商品ID缺失' });
      wx.showToast({ title: '商品ID缺失', icon: 'none' });
    }
  },

  fetchProductDetails: function(id) {
    this.setData({ isLoading: true, errorMessage: '' });
    wx.showLoading({ title: '加载中...' });

    request({
      url: '/shop/id',
      method: 'GET',
      data: { id: id }
    })
    .then(apiProductData => {
      console.log(`API /shop/id Response (data part):`, apiProductData);
      if (apiProductData && apiProductData.id !== undefined) {
        let completeImageUrl = '/assets/images/product-detail-placeholder.png';
        if (apiProductData.img) {
          // ... (图片URL拼接逻辑) ...
          if (apiProductData.img.startsWith('http')) {
            completeImageUrl = apiProductData.img;
          } else {
            let imagePath = apiProductData.img;
            if (IMAGE_BASE_URL.endsWith('/') && imagePath.startsWith('/')) imagePath = imagePath.substring(1);
            else if (!IMAGE_BASE_URL.endsWith('/') && !imagePath.startsWith('/')) { if(imagePath) imagePath = '/' + imagePath; }
            completeImageUrl = IMAGE_BASE_URL + imagePath;
          }
        }
        const priceFormatted = `¥ ${parseFloat(apiProductData.price || 0).toFixed(2)}`;

        // **处理描述字段**
        // **你需要和后端确认，API是否返回了描述字段，以及字段名是什么**
        const shortDescriptionFromApi = apiProductData.short_description || `这是“${apiProductData.name}”的简短描述，更多详情请看下方。`;
        const fullDescriptionFromApi = apiProductData.full_description || `规格：暂无\n特色：暂无`;
        const detailImagesFromApi = apiProductData.detail_images || [];

        this.setData({
          'product.id': apiProductData.id,
          'product.name': apiProductData.name || '商品名称',
          'product.imageUrl': completeImageUrl,
          'product.shortDescription': shortDescriptionFromApi,
          'product.price': apiProductData.price || 0,
          'product.priceFormatted': priceFormatted,
          'product.type': apiProductData.type || '',
          'product.stock': apiProductData.stock !== undefined ? apiProductData.stock : 0,
          'product.fullDescription': fullDescriptionFromApi,
          'product.detailImages': detailImagesFromApi,
          isLoading: false
        });
      } else {
        console.warn("fetchProductDetails: API返回的商品数据为空或格式不正确", apiProductData);
        this.setData({ isLoading: false, errorMessage: '无法加载商品详情' });
      }
    })
    .catch(err => {
      console.error('API获取商品详情失败:', err);
      this.setData({ isLoading: false, errorMessage: err.msg || '加载商品详情失败' });
    })
    .finally(() => {
      wx.hideLoading();
    });
  },

  updateCartItemCount: function() {
    this.setData({ cartItemCount: Math.floor(Math.random() * 5) });
  },

  // --- 事件处理函数 ---
  navigateToCartFromDetails: function() { wx.navigateTo({ url: '/pages/store/cart/cart' }); },
  
  addToCart: function() {
    wx.showToast({ title: '已加入购物车', icon: 'success' });
    this.setData({ cartItemCount: this.data.cartItemCount + 1});
  },

  // ***** 核心修改：buyNow 方法 *****
  buyNow: function() {
    console.log("buyNow button tapped.");
    // 直接提示库存不足，不进行跳转
    wx.showToast({
      title: '库存不足，暂时无法购买',
      icon: 'none',
      duration: 2000
    });
    
    // 以下是之前跳转到结算页的逻辑，现在注释掉
    /*
    if (!this.data.productId) {
        wx.showToast({ title: '商品信息错误', icon: 'none' }); return;
    }
    const currentProductItem = {
        id: this.data.product.id,
        name: this.data.product.name,
        imageUrl: this.data.product.imageUrl,
        price: this.data.product.price,
        quantity: 1
    };
    const itemsJson = JSON.stringify([currentProductItem]);
    wx.navigateTo({
        url: `/pages/store/checkout/checkout?items=${encodeURIComponent(itemsJson)}&from=buyNow`
    });
    */
  },
  // ***** 修改结束 *****

  navigateToAllReviews: function() {
    if (!this.data.productId) return;
    wx.navigateTo({ url: `/pages/store/reviews/reviews?productId=${this.data.productId}`});
  },

  onImageError: function(e) {
    console.error('Image load error on details page:', e.detail.errMsg);
    this.setData({
      'product.imageUrl': '/assets/images/image-load-failed-placeholder.png'
    });
  }
});