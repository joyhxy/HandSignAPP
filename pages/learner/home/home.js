// pages/learner/home/home.js
import * as echarts from '../../../components/ec-canvas/echarts';
const app = getApp(); // 在页面顶部获取 app 实例

// 全局保存图表实例，以便后续更新 (保持不变)
let chartInstance = null;

function initChart(canvas, width, height, dpr, dataPoints) {
    // initChart 函数完整保持不变
    chartInstance = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
    });
    canvas.setChart(chartInstance);
    const xAxisData = dataPoints && dataPoints.length > 0 ? dataPoints.map(p => p.dayShort || p.day || '') : ['一', '二', '三', '四', '五', '六', '日'];
    const seriesData = dataPoints && dataPoints.length > 0 ? dataPoints.map(p => p.value || 0) : [0,0,0,0,0,0,0];
    var option = {
        tooltip: { trigger: 'axis', confine: true },
        grid: { left: '3%', right: '8%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#999999', fontSize: 10 }
        },
        yAxis: {
            type: 'value',
            min: 0,
            splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.08)' } },
            axisLabel: { color: '#999999', fontSize: 10, formatter: '{value}' }
        },
        series: [{
            data: seriesData,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: '#FF8C00' },
            lineStyle: { color: '#FF8C00', width: 2.5 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(255, 140, 0, 0.2)' },
                    { offset: 1, color: 'rgba(255, 140, 0, 0)' }
                ])
            }
        }]
    };
    chartInstance.setOption(option);
    return chartInstance;
}

Page({
    data: {
        // --- 核心修改 ---
        isLoggedIn: false, // 新增一个登录状态的标志
        userName: '学习者', // 默认名字
        dashboardData: {
            checkInStreak: 0,
            weeklyStudyHours: 0,
            dailyStudyDataPoints: [],
            recommendedChallenge: null
        },
        errorMessage: '',
        ec: {
            lazyLoad: true
        }
    },

    onLoad: function (options) {
        // onLoad 中只加载数据，不检查登录
        this.fetchDashboardData();
    },

    onReady: function() {
        // onReady 保持不变
        this.chartComponent = this.selectComponent('#learn-progress-chart');
    },

    onShow: function() {
        // --- 核心修改 ---
        // 每次页面显示时，都检查并更新登录状态，但【不跳转】
        this.checkLoginState();
    },

    /**
     * --- 新增函数 ---
     * 检查并更新页面的登录状态和用户信息
     */
    checkLoginState: function() {
        const isLoggedIn = app.checkLogin(); // 调用我们在 app.js 中添加的函数
        this.setData({
            isLoggedIn: isLoggedIn,
            // 如果已登录，就显示用户的真实昵称，否则显示默认的'学习者'
            userName: isLoggedIn ? app.globalData.userInfo.name : '学习者'
        });

        // 如果你的真实数据依赖登录，可以在这里触发一次数据刷新
        if (isLoggedIn) {
            // this.fetchDashboardData(); // 如果你的真实接口需要登录才能访问，在这里调用
        }
    },

    fetchDashboardData: function () {
        // 这个函数保持不变，继续使用你的模拟数据逻辑
        wx.showLoading({ title: '加载中...' });
        this.setData({ errorMessage: '' });
        setTimeout(() => {
            const mockData = {
                checkInStreak: 5,
                weeklyStudyHours: 3.5,
                dailyStudyDataPoints: [
                    { day: "周一", dayShort: "一", value: 1.5 }, { day: "周二", dayShort: "二", value: 0.5 },
                    { day: "周三", dayShort: "三", value: 1.0 }, { day: "周四", dayShort: "四", value: 2.0 },
                    { day: "周五", dayShort: "五", value: 0.8 }, { day: "周六", dayShort: "六", value: 1.2 },
                    { day: "周日", dayShort: "日", value: 0.0 }
                ],
                recommendedChallenge: {
                    id: "rec001", title: "谢谢", description: "你似乎对日常用语掌握得不错，试试这个吧！"
                }
            };
            this.setData({
                'dashboardData.checkInStreak': mockData.checkInStreak,
                'dashboardData.weeklyStudyHours': mockData.weeklyStudyHours,
                'dashboardData.dailyStudyDataPoints': mockData.dailyStudyDataPoints,
                'dashboardData.recommendedChallenge': mockData.recommendedChallenge,
            }, () => {
                if (this.chartComponent) {
                    this.initAndSetChartData(mockData.dailyStudyDataPoints);
                } else {
                    console.warn('Chart component not ready when trying to init from fetchDashboardData.');
                }
            });
            wx.hideLoading();
        }, 1000);
    },

    initAndSetChartData: function(dataPoints) {
        // 这个函数保持不变
        if (!this.chartComponent) {
            console.error('Chart component instance is not ready for initAndSetChartData.');
            this.chartComponent = this.selectComponent('#learn-progress-chart');
            if (!this.chartComponent) return;
        }
        this.chartComponent.init((canvas, width, height, dpr) => {
            return initChart(canvas, width, height, dpr, dataPoints);
        });
    },

    // --- 事件处理函数修改 ---
    
    /**
     * 封装一个通用的登录检查和跳转逻辑
     * @param {string} targetUrl 需要跳转的目标页面路径
     */
    handleProtectedNavigate: function(targetUrl) {
        if (this.data.isLoggedIn) {
            wx.navigateTo({ url: targetUrl });
        } else {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            setTimeout(() => {
                wx.navigateTo({ url: '/pages/auth/login/login' });
            }, 1000);
        }
    },
    
    // 【每日挑战】需要登录
    navigateToDailyChallenge: function() {
        this.handleProtectedNavigate('/pages/learner/dailyChallenge/dailyChallenge');
    },

    // 【手语百科】可以公开访问，不需要登录
    navigateToEncyclopedia: function() {
        wx.navigateTo({ url: '/pages/learner/encyclopedia/encyclopedia' });
    },

    // 【错题回顾】需要登录
    navigateToErrorReview: function() {
        this.handleProtectedNavigate('/pages/learner/wrongAnswers/wrongAnswers');
    },

    // 【交流社区】浏览可以不登录，但发帖需要。这里只跳转，可以在发帖按钮上再做检查
    navigateToForum: function() {
      wx.navigateTo({ url: '/pages/forum/list/list' });
    },

    // 【推荐挑战】是个性化的，需要登录
    practiceRecommendedChallenge: function(event) {
        if (!this.data.isLoggedIn) {
            this.handleProtectedNavigate(''); // 调用它只为弹出登录提示
            return;
        }
        
        const challengeId = this.data.dashboardData.recommendedChallenge ? this.data.dashboardData.recommendedChallenge.id : null;
        if (challengeId) {
            wx.navigateTo({
                url: `/pages/common/placeholder/placeholder?title=练习推荐挑战&id=${challengeId}`
            });
        } else {
            console.warn("Recommended challenge ID is not available.");
        }
    },

    onPullDownRefresh: function () {
        // 下拉刷新保持不变
        this.fetchDashboardData();
        // 如果需要，登录后刷新用户信息
        if (this.data.isLoggedIn) {
          // this.fetchUserData();
        }
        setTimeout(() => { wx.stopPullDownRefresh(); }, 500);
    }
});