// pages/store/cart/cart.js
Page({
  data: {
      cartItems: [], // { id, name, imageUrl, specs, price, priceFormatted, pointsPrice, quantity, type: 'product'/'points' }
      totalPrice: 0,
      totalPriceFormatted: '¥ 0.00',
      totalPoints: 0,
      totalItemsCount: 0,
      // 模拟购物车数据，实际应从全局状态管理（如Vuex/Pinia概念，或小程序的globalData/Storage）获取
      mockCartData: [
          { id: 'prod001', name: '手语元素笔记本', imageUrl: '/assets/images/product-notebook.png', specs: '规格：A5', price: 29.9, quantity: 1, type: 'product' },
          { id: 'prod002', name: '"爱"手语马克杯', imageUrl: '/assets/images/product-mug.png', specs: '颜色：白色', price: 35.0, quantity: 1, type: 'product' },
          { id: 'point001', name: '平台定制贴纸 (积分兑换)', imageUrl: '/assets/images/product-sticker.png', specs: '款式：随机', pointsPrice: 50, quantity: 2, type: 'points' }
      ]
  },

  onShow: function () { // 每次进入购物车页面都重新加载和计算
      this.loadCartItems();
  },

  loadCartItems: function() {
      // TODO: 从全局状态或缓存加载购物车数据
      // 这里使用模拟数据
      const items = this.data.mockCartData.map(item => ({
          ...item,
          priceFormatted: item.type === 'product' ? `¥ ${parseFloat(item.price || 0).toFixed(2)}` : ''
      }));
      this.setData({ cartItems: items });
      this.calculateTotals();
  },

  calculateTotals: function() {
      let price = 0;
      let points = 0;
      let count = 0;
      this.data.cartItems.forEach(item => {
          if (item.type === 'product') {
              price += (item.price || 0) * item.quantity;
          } else if (item.type === 'points') {
              points += (item.pointsPrice || 0) * item.quantity;
          }
          count += item.quantity;
      });
      this.setData({
          totalPrice: price,
          totalPriceFormatted: `¥ ${price.toFixed(2)}`,
          totalPoints: points,
          totalItemsCount: count
      });
  },

  decreaseQuantity: function(event) {
      const id = event.currentTarget.dataset.id;
      const itemIndex = this.data.cartItems.findIndex(item => item.id === id);
      if (itemIndex > -1 && this.data.cartItems[itemIndex].quantity > 1) {
          this.setData({
              [`cartItems[${itemIndex}].quantity`]: this.data.cartItems[itemIndex].quantity - 1
          });
          this.calculateTotals();
          // TODO: 更新全局购物车状态
      }
  },

  increaseQuantity: function(event) {
      const id = event.currentTarget.dataset.id;
      const itemIndex = this.data.cartItems.findIndex(item => item.id === id);
      if (itemIndex > -1) {
          // 可以加一个最大数量限制
          this.setData({
              [`cartItems[${itemIndex}].quantity`]: this.data.cartItems[itemIndex].quantity + 1
          });
          this.calculateTotals();
          // TODO: 更新全局购物车状态
      }
  },

  deleteCartItem: function(event) {
      const id = event.currentTarget.dataset.id;
      wx.showModal({
          title: '确认删除',
          content: '确定要从购物车中移除这个商品吗？',
          success: (res) => {
              if (res.confirm) {
                  const updatedItems = this.data.cartItems.filter(item => item.id !== id);
                  this.setData({ cartItems: updatedItems });
                  this.calculateTotals();
                  // TODO: 更新全局购物车状态
                  // 更新模拟数据源，以便下次进入时正确显示
                  this.setData({ mockCartData: updatedItems.map(item => ({...item})) });
              }
          }
      });
  },

  goShopping: function() {
      wx.switchTab({ url: '/pages/store/home/home' }); // 跳转到商城首页
  },

  navigateToCheckout: function() {
      if (this.data.cartItems.length === 0) {
          wx.showToast({ title: '购物车是空的哦', icon: 'none'});
          return;
      }
      // TODO: 跳转到结算页面，可能需要传递购物车商品信息或ID列表
      wx.navigateTo({
          url: '/pages/store/checkout/checkout' // 假设的结算页
      });
  }
});