// pages/learner/home/home.js
import * as echarts from '../../../components/ec-canvas/echarts'; // 引入ECharts主模块

// 全局保存图表实例，以便后续更新
let chartInstance = null;

function initChart(canvas, width, height, dpr, dataPoints) {
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

Page({ // <--- 唯一的 Page({...}) 开始
    data: {
        userName: '学习者',
        dashboardData: {
            checkInStreak: 0,
            weeklyStudyHours: 0,
            dailyStudyDataPoints: [],
            recommendedChallenge: null // 初始化为 null，API获取后填充
        },
        errorMessage: '',
        ec: { // ECharts 相关配置移到这里
            lazyLoad: true
        }
    },

    onLoad: function (options) {
        // const app = getApp();
        // if (app.globalData.userInfo && app.globalData.userInfo.nickName) {
        //     this.setData({ userName: app.globalData.userInfo.nickName });
        // }
        this.fetchDashboardData();
    },

    onReady: function() {
        this.chartComponent = this.selectComponent('#learn-progress-chart');
        // console.log('Chart component instance onReady:', this.chartComponent);
    },

    onShow: function() {
        // 每次页面显示时，可以考虑是否需要刷新数据
        // this.fetchDashboardData();
    },

    fetchDashboardData: function () {
        wx.showLoading({ title: '加载中...' });
        this.setData({ errorMessage: '' });

        setTimeout(() => {
            const mockData = {
                // code: 1, // 模拟数据中 code 可以省略
                // msg: "操作成功",
                // data: { // 直接将 data 内容作为 mockData 主体
                    checkInStreak: 5,
                    weeklyStudyHours: 3.5, // 与UI稿一致
                    dailyStudyDataPoints: [
                        { day: "周一", dayShort: "一", value: 1.5 },
                        { day: "周二", dayShort: "二", value: 0.5 },
                        { day: "周三", dayShort: "三", value: 1.0 },
                        { day: "周四", dayShort: "四", value: 2.0 },
                        { day: "周五", dayShort: "五", value: 0.8 },
                        { day: "周六", dayShort: "六", value: 1.2 },
                        { day: "周日", dayShort: "日", value: 0.0 }
                    ],
                    recommendedChallenge: {
                        id: "rec001",
                        title: "谢谢",
                        description: "你似乎对日常用语掌握得不错，试试这个吧！"
                    }
                // }
            };

            // if (mockData.data) { // 直接使用 mockData
                this.setData({
                    'dashboardData.checkInStreak': mockData.checkInStreak,
                    'dashboardData.weeklyStudyHours': mockData.weeklyStudyHours,
                    'dashboardData.dailyStudyDataPoints': mockData.dailyStudyDataPoints,
                    'dashboardData.recommendedChallenge': mockData.recommendedChallenge,
                }, () => { // setData 的回调函数中执行图表初始化
                    if (this.chartComponent) {
                        this.initAndSetChartData(mockData.dailyStudyDataPoints);
                    } else {
                        // 如果组件还没准备好，可以考虑加个延时重试，或者确保 onReady 之后才执行
                        console.warn('Chart component not ready when trying to init from fetchDashboardData.');
                    }
                });
            // } else {
            //     this.setData({
            //         errorMessage: mockData.msg || '加载学习数据失败'
            //     });
            // }
            wx.hideLoading();
        }, 1000);
    },

    initAndSetChartData: function(dataPoints) {
        if (!this.chartComponent) {
            console.error('Chart component instance is not ready for initAndSetChartData.');
            // 尝试再次获取，以防 onReady 晚于 fetchDashboardData 的 setData 回调
            this.chartComponent = this.selectComponent('#learn-progress-chart');
            if (!this.chartComponent) return;
        }
        this.chartComponent.init((canvas, width, height, dpr) => {
            return initChart(canvas, width, height, dpr, dataPoints);
        });
    },

    // --- 事件处理函数 ---
    navigateToDailyChallenge: function() {
        console.log("Attempting to navigate to Daily Challenge");
        wx.navigateTo({
            url: '/pages/learner/dailyChallenge/dailyChallenge', // <--- **确保这个路径正确，并且页面已在app.json注册**
            success: function(res) {
                console.log("Navigation to Daily Challenge success:", res);
            },
            fail: function(err) {
                console.error("Navigation to Daily Challenge fail:", err);
            }
        });
    },

    navigateToEncyclopedia: function() {
      console.log("Navigating to Encyclopedia List Page");
      wx.navigateTo({
          url: '/pages/learner/encyclopedia/encyclopedia', // <--- 修改为手势百科列表页的路径
          success: function(res) {
              console.log("Navigation to Encyclopedia List SUCCESS");
          },
          fail: function(err) {
              console.error("Navigation to Encyclopedia List FAIL:", err);
          }
      });
  },
    navigateToErrorReview: function() {
        wx.navigateTo({
            url: '/pages/learner/wrongAnswers/wrongAnswers'
        });
    },

    navigateToForum: function() {
      wx.navigateTo({
          url: '/pages/forum/list/list' // 假设论坛列表页的路径
      });
  },

    practiceRecommendedChallenge: function(event) {
      const challengeId = this.data.dashboardData.recommendedChallenge ? this.data.dashboardData.recommendedChallenge.id : null;
      if (challengeId) {
          // 这里的 challengeId 可能不是直接的手势ID，而是挑战题目的ID
          // 如果推荐挑战直接对应一个手势，并且 challengeId 就是手势ID，那么可以这样跳转：
          // wx.navigateTo({
          //    url: `/pages/learner/gestureDetails/gestureDetails?id=${challengeId}`
          // });
          // 否则，还是先跳到占位符或专门的练习页面
          wx.navigateTo({
              url: `/pages/common/placeholder/placeholder?title=练习推荐挑战&id=${challengeId}`
          });
      } else {
          console.warn("Recommended challenge ID is not available.");
      }
  },

    onPullDownRefresh: function () {
        this.fetchDashboardData();
        setTimeout(() => { wx.stopPullDownRefresh(); }, 500);
    }
}); // <--- 唯一的 Page({...}) 结束