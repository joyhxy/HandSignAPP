// pages/store/productDetails/productDetails.js
Page({
  data: {
      productId: null,
      product: { // 初始化商品数据结构
          name: '加载中...',
          imageUrl: null,
          // galleryImages: [],
          shortDescription: '',
          price: 0,
          priceFormatted: '¥ 0.00', // 确保有初始值
          pointsPrice: null,
          tags: [],
          fullDescription: '',
          detailImages: [],
      },
      reviews: [ // 模拟评价数据
          { id: 'rev1', userName: '用户A', avatarUrl: null, comment: '质量很好，设计很有意义！物流也很快！' },
          { id: 'rev2', userName: '手语学习者B', avatarUrl: '/assets/images/avatar_placeholder.png', comment: '非常喜欢这个笔记本，推荐购买。' }
      ],
      cartItemCount: 0, // 模拟购物车商品数量
      // isFavorite: false,
      isLoading: true,
      errorMessage: '' // 用于显示错误
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

      // --- 模拟API请求 ---
      setTimeout(() => {
          // 尝试从 store/home/home.js 的模拟数据中获取基础信息
          // 注意：这种跨页面直接引用 data 的方式仅适用于模拟，真实项目中应通过API获取独立数据
          let foundProduct = null;
          try {
              // 动态 require 可能在某些严格模式下有问题，但对于模拟数据可以尝试
              // 或者将商城的模拟数据抽成一个公共的JS模块
              const storeHomePageModule = require('../home/home.js');
              if (storeHomePageModule && storeHomePageModule.data && storeHomePageModule.data.allProductsMock) {
                  foundProduct = storeHomePageModule.data.allProductsMock.find(p => p.id === id);
              }
          } catch (e) {
              console.warn("Could not require store/home/home.js for mock data, using fallback.", e);
          }


          if (foundProduct) {
              // 基于找到的商品，补充或覆盖更详细的信息
              foundProduct = {
                  ...foundProduct, // 保留首页已有的信息
                  name: foundProduct.name || '手语元素设计笔记本 (详情)', // 如果首页没名字，用默认
                  imageUrl: foundProduct.imageUrl || '/assets/images/product-notebook-large.png',
                  shortDescription: foundProduct.shortDescription || '记录学习点滴，或是日常笔记，让手语融入生活。采用优质道林纸，书写顺滑。',
                  price: foundProduct.price !== undefined ? foundProduct.price : 29.90,
                  pointsPrice: foundProduct.pointsPrice !== undefined ? foundProduct.pointsPrice : 300,
                  tags: foundProduct.tags || ['创意文具', '新品', '学习必备'],
                  fullDescription: foundProduct.fullDescription || "规格：A5 / 80页 / 道林纸。\n特色：封面采用特殊工艺印制常见手语图案，内页有点阵设计，适合书写与绘画。每一页都承载着对无声世界的理解与尊重。",
                  detailImages: foundProduct.detailImages || [
                      '/assets/images/product-notebook-detail1.png',
                      '/assets/images/product-notebook-detail2.png'
                  ],
              };
          } else { // 如果在首页数据中找不到，或者 require 失败，则使用一个全新的模拟对象
              console.log(`Product with id ${id} not found in home mock, using detailed fallback mock.`);
              foundProduct = {
                  id: id,
                  name: '手语元素设计笔记本 (详情)',
                  imageUrl: '/assets/images/product-notebook-large.png',
                  shortDescription: '记录学习点滴，或是日常笔记，让手语融入生活。采用优质道林纸，书写顺滑。',
                  price: 29.90,
                  pointsPrice: 300,
                  tags: ['创意文具', '新品', '学习必备'],
                  fullDescription: "规格：A5 / 80页 / 道林纸。\n特色：封面采用特殊工艺印制常见手语图案，内页有点阵设计，适合书写与绘画。每一页都承载着对无声世界的理解与尊重。",
                  detailImages: [
                      '/assets/images/product-notebook-detail1.png',
                      '/assets/images/product-notebook-detail2.png'
                  ],
              };
          }

          // --- 价格格式化逻辑 ---
          foundProduct.priceFormatted = `¥ ${parseFloat(foundProduct.price || 0).toFixed(2)}`;

          this.setData({ product: foundProduct, isLoading: false });
          wx.hideLoading();
      }, 1000);
      // TODO: 真实API请求
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