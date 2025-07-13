// pages/store/home/home.js
import request from '../../../utils/request.js';
const IMAGE_BASE_URL = 'https://222.186.168.45:8080'; // 确保这个是正确的图片服务器基础URL

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

    products: [], // 商城首页展示的商品列表
    pointsExchangeItems: [], // 积分兑换项 (暂时用模拟数据)
    allPointsItemsMock: [
        { id: 'point001', name: '平台定制贴纸', pointsRequired: 50 },
        { id: 'point002', name: '志愿者荣誉徽章', pointsRequired: 200 }
    ],

    isLoadingProducts: false,
    isLoadingPointsItems: false,

    // 搜索相关
    searchKeyword: '',

    // 分页相关
    currentPage: 1,
    pageSize: 10,
    hasMoreProducts: true,
  },

  onLoad: function (options) {
    this.updateCurrentCategoryTitle(); // 初始化标题
    this.loadProducts(true); // 首次加载，重置所有
    this.loadPointsExchangeItems();
  },

  // 更新板块标题
  updateCurrentCategoryTitle: function() {
    let title = '商品列表';
    const currentCategory = this.data.categories.find(c => c.id === this.data.currentCategoryId);
    if (currentCategory) {
        title = currentCategory.name;
        // 特殊处理“推荐”分类的标题
        if (this.data.currentCategoryId === 'all') {
            title = '热门推荐';
        }
    }
    this.setData({ currentCategoryTitle: title });
  },


  // --- 核心：商品加载函数 ---
  loadProducts: function(isRefresh = false, searchParams = {}) {
    if (this.data.isLoadingProducts || (!isRefresh && !this.data.hasMoreProducts)) {
      if (!isRefresh && !this.data.hasMoreProducts) console.log("No more products to load.");
      return;
    }

    this.setData({ isLoadingProducts: true });
    const pageToLoad = isRefresh ? 1 : this.data.currentPage;
    if (isRefresh) {
      this.setData({ products: [], hasMoreProducts: true });
      wx.showLoading({ title: '加载中...' });
    } else {
      wx.showLoading({ title: '加载更多...' });
    }

    let requestParams = {
      page: pageToLoad.toString(),
      pagesize: this.data.pageSize.toString()
    };

 // --- **核心修改在这里** ---
    // **直接使用 searchParams 中的值（如果存在），否则回退到 this.data**
    const keywordToUse = searchParams.keyword !== undefined ? searchParams.keyword.trim() : (this.data.searchKeyword ? this.data.searchKeyword.trim() : '');
    const categoryToUse = searchParams.categoryId !== undefined ? searchParams.categoryId : this.data.currentCategoryId;

    // 添加分类筛选参数 (如果不是 'all')
    if (categoryToUse !== 'all') {
      const selectedTag = this.data.categories.find(c => c.id === categoryToUse);
      if (selectedTag) {
        requestParams.type = selectedTag.name; // 假设用分类名称字符串筛选
      }
    }

    // 添加关键词搜索参数 (如果关键词不为空)
    if (keywordToUse) {
      // **与后端确认：用于商品名模糊搜索的 Query 参数名**
      requestParams.name = keywordToUse; // 假设用 name 参数搜索
    }
    // --- **修改结束** ---


    console.log("Requesting products from /shop/page with params:", requestParams);

    request({
      url: '/shop/page',
      method: 'GET',
      data: requestParams,
      expectDirectData: true
    })
    .then(directApiResponseData => {
      console.log('API /shop/page Response (direct data):', directApiResponseData);
      const newRawProducts = (directApiResponseData && Array.isArray(directApiResponseData.records)) ? directApiResponseData.records : [];
      const totalCount = (directApiResponseData && directApiResponseData.total !== undefined) ? parseInt(directApiResponseData.total, 10) : 0;
      
      const formattedProducts = newRawProducts.map(item => {
        let completeImageUrl = '/assets/images/product-placeholder-small.png';
        if (item.img && typeof item.img === 'string' && item.img.includes('/')) {
            const imagePath = item.img.trim();
            completeImageUrl = imagePath.startsWith('http') ? imagePath : IMAGE_BASE_URL + (imagePath.startsWith('/') ? '' : '/') + imagePath;
        } else {
            console.warn(`Invalid image path for product ${item.id}: "${item.img}", using placeholder.`);
        }
        return {
          id: item.id,
          name: item.name,
          imageUrl: completeImageUrl,
          price: item.price,
          priceFormatted: `¥ ${parseFloat(item.price || 0).toFixed(2)}`,
          // ...其他需要前端处理的字段
        };
      });

      const updatedProducts = isRefresh ? formattedProducts : this.data.products.concat(formattedProducts);
      this.setData({
        products: updatedProducts,
        currentPage: pageToLoad + 1,
        hasMoreProducts: updatedProducts.length < totalCount,
      });
    })
    .catch(err => {
      console.error('API获取商品列表失败:', err);
      this.setData({ hasMoreProducts: false });
    })
    .finally(() => {
      this.setData({ isLoadingProducts: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    });
  },

  // 积分兑换项加载（保持模拟）
  loadPointsExchangeItems: function() {
    this.setData({ isLoadingPointsItems: true });
    setTimeout(() => {
      this.setData({ pointsExchangeItems: this.data.allPointsItemsMock, isLoadingPointsItems: false });
    }, 500);
  },


  // --- 事件处理函数 ---
  onSearchInput: function(event) {
    this.setData({ searchKeyword: event.detail.value });
  },

  onSearchConfirm: function(event) {
    const keyword = event.detail.value.trim();
    console.log('Search confirmed with keyword:', keyword);
    // 更新 data，以便输入框显示最终的搜索词
    this.setData({
      searchKeyword: keyword,
      currentCategoryId: 'all'
    }, () => { // **将操作放在 setData 的回调中，确保状态已更新**
        this.updateCurrentCategoryTitle();
        // **直接将关键词作为参数传递给 loadProducts**
        this.loadProducts(true, { keyword: keyword, categoryId: 'all' });
    });
  },

  onCategoryTap: function(event) {
    const categoryId = event.currentTarget.dataset.id;
    this.setData({
      currentCategoryId: categoryId,
      searchKeyword: '' // 切换分类时，清空搜索框内容
    }, () => {
      this.updateCurrentCategoryTitle();
      // 传递分类ID作为参数
      this.loadProducts(true, { categoryId: categoryId, keyword: '' });
    });
  },

  navigateToProductDetail: function(event) {
    const productId = event.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/store/productDetails/productDetails?id=${productId}` });
  },

  navigateToCart: function() {
    wx.navigateTo({ url: '/pages/store/cart/cart' });
  },

  exchangeWithPoints: function(event) {
    const itemId = event.currentTarget.dataset.id;
    const item = this.data.pointsExchangeItems.find(i => i.id === itemId);
    if (!item) return;
    wx.showModal({ /* ... */ });
  },

  onPullDownRefresh: function() {
    console.log("Pull down to refresh triggered. Resetting filters.");
    // 下拉刷新时，重置所有筛选条件
    this.setData({
        searchKeyword: '',
        currentCategoryId: 'all'
    }, () => {
        this.updateCurrentCategoryTitle();
        this.loadProducts(true, { categoryId: 'all', keyword: '' });
        this.loadPointsExchangeItems(); // 也刷新积分兑换项
    });
  },

  onReachBottom: function() {
    console.log("Reach bottom triggered. Loading more products...");
    // 上拉加载更多时，使用 this.data 中已有的筛选条件，不传 searchParams
    this.loadProducts(false);
  }
});