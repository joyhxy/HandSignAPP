// pages/store/home/home.js
Page({
  data: {
      categories: [
          { id: 'recommend', name: '推荐' },
          { id: 'books', name: '手语图书' },
          { id: 'stationery', name: '创意文具' },
          { id: 'lifestyle', name: '生活周边' },
          { id: 'points', name: '积分兑换' }
      ],
      currentCategoryId: 'recommend',
      hotProducts: [],
      pointsExchangeItems: [],
      isLoadingProducts: false,
      isLoadingPointsItems: false,
      // 模拟所有商品数据，实际应从API获取
      allProductsMock: [
          { id: 'prod001', name: '手语元素笔记本 (超长名称看看溢出效果如何)', imageUrl: '/assets/images/product-notebook.png', price: 29.9, pointsPrice: 300, category: 'stationery' },
          { id: 'prod002', name: '"爱"手语马克杯', imageUrl: '/assets/images/product-mug.png', price: 35.0, pointsPrice: 350, category: 'lifestyle' },
          { id: 'prod003', name: '手语字母T恤', imageUrl: '/assets/images/product-tshirt.png', price: 89.0, pointsPrice: 890, category: 'lifestyle' },
          { id: 'prod004', name: '手语入门教程 (图书)', imageUrl: '/assets/images/product-book.png', price: 45.0, pointsPrice: 450, category: 'books' },
      ],
      allPointsItemsMock: [
          { id: 'point001', name: '平台定制贴纸', pointsRequired: 50 },
          { id: 'point002', name: '志愿者荣誉徽章', pointsRequired: 200 }
      ]
  },

  onLoad: function (options) {
      this.loadHotProducts();
      this.loadPointsExchangeItems();
  },

  loadHotProducts: function() {
      this.setData({ isLoadingProducts: true });
      // 模拟API和分类筛选
      setTimeout(() => {
          let productsToShow = this.data.allProductsMock;
          if (this.data.currentCategoryId !== 'recommend' && this.data.currentCategoryId !== 'points') {
              productsToShow = this.data.allProductsMock.filter(p => p.category === this.data.currentCategoryId);
          } else if (this.data.currentCategoryId === 'points') {
              productsToShow = []; // 积分兑换不在这里显示，或者你可以有专门的积分可兑换的“商品”
          }
          this.setData({ hotProducts: productsToShow, isLoadingProducts: false });
      }, 300);
  },

  loadPointsExchangeItems: function() {
      this.setData({ isLoadingPointsItems: true });
      setTimeout(() => {
          this.setData({ pointsExchangeItems: this.data.allPointsItemsMock, isLoadingPointsItems: false });
      }, 300);
  },

  onCategoryTap: function(event) {
      const categoryId = event.currentTarget.dataset.id;
      this.setData({ currentCategoryId: categoryId });
      if (categoryId === 'points') {
          this.setData({ hotProducts: [] }); // 清空普通商品区
          // 积分兑换专区的数据已通过 loadPointsExchangeItems 加载
      } else {
          this.loadHotProducts(); // 根据新分类加载商品
      }
  },

  onSearchConfirm: function(event) {
      const keyword = event.detail.value;
      console.log('Search confirmed:', keyword);
      // TODO: 跳转到搜索结果页或在此页筛选
      wx.navigateTo({
          url: `/pages/store/searchResult/searchResult?keyword=${keyword}` // 假设的搜索结果页
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
      // TODO: 实现积分兑换逻辑 (检查积分、调用API等)
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
      this.loadHotProducts();
      this.loadPointsExchangeItems();
      setTimeout(()=> wx.stopPullDownRefresh(), 500);
  }
});