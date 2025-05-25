// pages/store/checkout/checkout.js
Page({
  data: {
      selectedAddress: { // 初始化为空或从缓存读取上次选择的地址
          // userName, telNumber, provinceName, cityName, countyName, detailInfo
      },
      orderItems: [], // { id, name, imageUrl, specs, price, priceFormatted, pointsPrice, quantity, type }
      summary: {
          itemsPrice: 0, itemsPriceFormatted: '¥0.00',
          totalPoints: 0, // 商品本身是积分商品的总积分
          shippingFee: 0, shippingFeeFormatted: '¥0.00', // 运费暂为0
          discount: 0, discountFormatted: '¥0.00', // 优惠暂为0
          finalAmount: 0, finalAmountFormatted: '¥0.00', // 最终应付金额
          finalPoints: 0 // 最终应付积分（如果订单包含纯积分商品）
      },
      isSubmitting: false
  },

  onLoad: function (options) {
      // TODO: 从全局状态或上个页面参数获取待结算商品
      // 这里用购物车页的模拟数据代替
      const cartPageModule = require('../cart/cart.js');
      const cartItemsFromPrevPage = cartPageModule.data.mockCartData || [];

      if (cartItemsFromPrevPage.length === 0 && options.productId) { // 从商品详情直接购买
          const storeHomePageModule = require('../home/home.js');
          const product = storeHomePageModule.data.allProductsMock.find(p => p.id === options.productId);
          if (product) {
               cartItemsFromPrevPage.push({...product, quantity: 1, type: product.pointsPrice ? 'points_or_cash' : 'product'});
          }
      }


      const items = cartItemsFromPrevPage.map(item => ({
          ...item,
          priceFormatted: item.type === 'product' || item.type === 'points_or_cash' ? `¥ ${parseFloat(item.price || 0).toFixed(2)}` : ''
      }));
      this.setData({ orderItems: items });
      this.calculateSummary();

      // 尝试获取缓存的地址或默认地址
      const cachedAddress = wx.getStorageSync('selectedAddress');
      if (cachedAddress) {
          this.setData({ selectedAddress: cachedAddress });
      } else {
          // 自动尝试拉起一次地址选择，如果用户之前没选过
          // this.chooseAddress();
      }
  },

  chooseAddress: function() {
      wx.chooseAddress({
          success: (res) => {
              this.setData({
                  selectedAddress: {
                      userName: res.userName,
                      telNumber: res.telNumber,
                      provinceName: res.provinceName,
                      cityName: res.cityName,
                      countyName: res.countyName,
                      detailInfo: res.detailInfo,
                      postalCode: res.postalCode, // 可选
                      nationalCode: res.nationalCode //可选
                  }
              });
              wx.setStorageSync('selectedAddress', this.data.selectedAddress); // 缓存用户选择
          },
          fail: (err) => {
              console.log('用户取消选择地址或授权失败', err);
              if (err.errMsg === "chooseAddress:fail auth deny" || err.errMsg === "chooseAddress:fail:auth deny") {
                  //引导用户去设置页授权
                  wx.showModal({
                      title: '授权提示',
                      content: '需要获取您的地址信息才能继续下单，请前往设置页开启授权。',
                      success: (modalRes) => {
                          if (modalRes.confirm) {
                              wx.openSetting();
                          }
                      }
                  })
              }
          }
      });
  },

  calculateSummary: function() {
      let itemsPrice = 0;
      let totalPoints = 0; // 纯积分商品的总积分
      let finalPayableAmount = 0;
      let finalPayablePoints = 0;

      this.data.orderItems.forEach(item => {
          if (item.type === 'product') {
              itemsPrice += (item.price || 0) * item.quantity;
              finalPayableAmount += (item.price || 0) * item.quantity;
          } else if (item.type === 'points') { // 纯积分兑换商品
              totalPoints += (item.pointsPrice || 0) * item.quantity;
              finalPayablePoints += (item.pointsPrice || 0) * item.quantity;
          } else if (item.type === 'points_or_cash') { // 假设商品详情页过来的可能是现金或积分商品
              // 这里简化处理：默认按现金计算，如果需要复杂的“积分+现金”或“二选一”则需要更复杂的逻辑
              itemsPrice += (item.price || 0) * item.quantity;
              finalPayableAmount += (item.price || 0) * item.quantity;
              // 如果也允许用积分，这里可以加一个选项
          }
      });

      const shippingFee = 0; // 简化：运费为0
      const discount = 0; // 简化：优惠为0

      // finalPayableAmount = itemsPrice + shippingFee - discount; // 已在循环中累加

      this.setData({
          'summary.itemsPrice': itemsPrice,
          'summary.itemsPriceFormatted': `¥ ${itemsPrice.toFixed(2)}`,
          'summary.totalPoints': totalPoints, // 用于显示商品本身的积分价（如果商品列表有这类信息）
          'summary.shippingFee': shippingFee,
          'summary.shippingFeeFormatted': `¥ ${shippingFee.toFixed(2)}`,
          'summary.discount': discount,
          'summary.discountFormatted': `¥ ${discount.toFixed(2)}`,
          'summary.finalAmount': finalPayableAmount,
          'summary.finalAmountFormatted': `¥ ${finalPayableAmount.toFixed(2)}`,
          'summary.finalPoints': finalPayablePoints
      });
  },

  submitOrder: function() {
      if (!this.data.selectedAddress.userName) {
          wx.showToast({ title: '请选择收货地址', icon: 'none' });
          return;
      }
      if (this.data.orderItems.length === 0) {
          wx.showToast({ title: '订单中没有商品', icon: 'none' });
          return;
      }

      this.setData({ isSubmitting: true });
      wx.showLoading({ title: '提交订单中...' });

      // --- 模拟API提交和支付 ---
      setTimeout(() => {
          wx.hideLoading();
          this.setData({ isSubmitting: false });
          console.log('Order submitted:', {
              address: this.data.selectedAddress,
              items: this.data.orderItems,
              summary: this.data.summary
          });

          // 模拟支付成功
          wx.showToast({ title: '支付成功 (模拟)', icon: 'success', duration: 2000 });
          // TODO: 清空购物车或标记已购买商品，跳转到订单成功页或订单列表页
          // wx.removeStorageSync('cartItems'); // 清空模拟的购物车缓存
          setTimeout(() => {
              wx.redirectTo({ // 用redirectTo，不允许返回结算页
                  url: '/pages/profile/myOrders/myOrders?status=success' // 假设的订单成功/列表页
              });
          }, 2000);
      }, 1500);
  }
});