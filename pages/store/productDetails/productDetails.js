// pages/store/productDetails/productDetails.js
import request from '../../../utils/request.js'; // 确保路径正确

// !!! 同样，你需要一个正确的图片基础 URL !!!
const IMAGE_BASE_URL = 'https://222.186.168.45:8080'; // <--- 替换为真实的图片基础URL

Page({
  data: {
    productId: null,
    product: { // 初始化商品数据结构
        name: '加载中...',
        imageUrl: null,
        shortDescription: '商品描述加载中...',
        price: 0,
        priceFormatted: '¥ 0.00',
        pointsPrice: null,
        tags: [],
        fullDescription: '',
        detailImages: [],
        stock: 0, // 添加库存字段
        type: '',   // 添加类型字段
        id: null    // 商品ID
    },
    reviews: [ /* ... 模拟评价数据保持不变 ... */ ],
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
      url: '/shop/id', // **接口路径**
      method: 'GET',
      data: { id: id }, // **Query参数 id**
      // 这个接口的响应，根据文档示例，直接是业务数据，没有外层 code, msg, data 包裹
      // 但文档的 "Body" 定义部分又画了 code, msg, data。这是一个矛盾点！
      // 我们先假设它也遵循 {code, msg, data} 结构，如果不是，再调整 request.js 或这里的调用。
      // 如果它不遵循标准结构，需要像 /shop/page 那样传递 expectDirectData: true
      // expectDirectData: true, // <--- 如果后端直接返回商品对象作为 res.data
    })
    .then(apiProductData => { // **假设 request.js 成功时返回的是 API 响应的 data.data 部分**
                             // **或者如果 expectDirectData:true, 则 apiProductData 就是商品对象**
      console.log(`API /shop/id Response (data.data or direct data):`, apiProductData);

      if (apiProductData && apiProductData.id !== undefined) { // 检查是否有商品数据
        // --- 图片 URL 拼接 ---
        let completeImageUrl = '/assets/images/product-detail-placeholder.png'; // 默认占位
        if (apiProductData.img) {
          if (apiProductData.img.startsWith('http://') || apiProductData.img.startsWith('https://')) {
            completeImageUrl = apiProductData.img;
          } else {
            let imagePath = apiProductData.img;
            if (IMAGE_BASE_URL.endsWith('/') && imagePath.startsWith('/')) {
                imagePath = imagePath.substring(1);
            } else if (!IMAGE_BASE_URL.endsWith('/') && !imagePath.startsWith('/')) {
                 if (imagePath) imagePath = '/' + imagePath;
            }
            completeImageUrl = IMAGE_BASE_URL + imagePath;
          }
        }

        // --- 价格格式化 ---
        const priceFormatted = `¥ ${parseFloat(apiProductData.price || 0).toFixed(2)}`;

        // --- 更新 product 数据 ---
        // **字段名严格按照 API 响应示例中的字段名**
        this.setData({
          'product.id': apiProductData.id,
          'product.name': apiProductData.name || '商品名称',
          'product.imageUrl': completeImageUrl,
          'product.price': apiProductData.price || 0,
          'product.priceFormatted': priceFormatted,
          'product.type': apiProductData.type || '', // API示例是 "服装" (string)
          'product.stock': apiProductData.stock !== undefined ? apiProductData.stock : 0,
          isLoading: false
        });
      } else {
        console.warn("fetchProductDetails: API返回的商品数据为空或格式不正确", apiProductData);
        this.setData({ isLoading: false, errorMessage: '无法加载商品详情' });
        wx.showToast({ title: '商品信息获取失败', icon: 'none' });
      }
    })
    .catch(err => {
      console.error('API获取商品详情失败:', err);
      this.setData({ isLoading: false, errorMessage: err.msg || '加载商品详情失败' });
      // request.js 应该已经弹了 Toast
    })
    .finally(() => { // finally 不管promise成功或失败都会执行
        // wx.hideLoading(); // 如果 request.js 内部没有 finally 来 hideLoading，则在这里加
    });
  },

  updateCartItemCount: function() {
      setTimeout(()=> this.setData({ cartItemCount: Math.floor(Math.random() * 5) }), 500);
  },

  navigateToCartFromDetails: function() {
      wx.navigateTo({ url: '/pages/store/cart/cart' });
  },

  addToCart: function() {
      wx.showToast({ title: '已加入购物车', icon: 'success' });
      this.setData({ cartItemCount: this.data.cartItemCount + 1});
  },

  buyNow: function() {
      if (!this.data.productId) {
          wx.showToast({ title: '商品信息错误', icon: 'none' });
          return;
      }
      wx.showModal({
          title: '模拟购买',
          content: `是否立即购买/兑换 "${this.data.product.name}"？`,
          success: (res) => {
              if (res.confirm) {
                   wx.navigateTo({ url: `/pages/store/checkout/checkout?productId=${this.data.productId}&type=buyNow`});
              }
          }
      });
  },

  navigateToAllReviews: function() {
      if (!this.data.productId) {
          wx.showToast({ title: '商品信息错误', icon: 'none' });
          return;
      }
      wx.navigateTo({ url: `/pages/store/reviews/reviews?productId=${this.data.productId}`});
  }
});