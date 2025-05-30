// pages/profile/leaderboard/leaderboard.js
import request from '../../../utils/request.js';
const app = getApp();
const IMAGE_BASE_URL = 'https://222.186.168.45:8080'; // 确保图片基础路径正确

Page({
  data: {
    leaderboardTypes: [
      { id: 'pointsRank', name: '积分榜', unit: '分', apiUrl: '/user/top/count', scoreField: 'count', processingType: 'directAsInt' },
      { id: 'questionRank', name: '题目排行榜', unit: '题', apiUrl: '/user/top/ti', scoreField: 'task', processingType: 'countCommaSeparated' },
      { id: 'badgeRank', name: '勋章排行榜', unit: '枚', apiUrl: '/user/top/xun', scoreField: 'xun', processingType: 'directAsInt' }
    ],
    currentBoardType: 'pointsRank', // 默认显示积分榜
    currentBoardUnit: '分',
    currentUserRank: null,
    leaderboardData: [],
    isLoading: false,
    topNCount: 10, // 所有榜单都先用这个参数，如果特定榜单用分页，再调整
    // 如果需要分页，取消注释这些
    // currentPage: 1,
    // pageSize: 10,
    // hasMoreData: true
  },

  onLoad: function (options) {
    const defaultBoard = this.data.leaderboardTypes.find(b => b.id === this.data.currentBoardType);
    if (defaultBoard) {
        this.setData({ currentBoardUnit: defaultBoard.unit });
    }
    this.loadLeaderboard(true);
  },

  onBoardTypeTap: function(event) {
    const boardId = event.currentTarget.dataset.id;
    const selectedBoard = this.data.leaderboardTypes.find(b => b.id === boardId);
    if (selectedBoard && this.data.currentBoardType !== boardId) {
      if (!selectedBoard.apiUrl) {
        wx.showToast({ title: `${selectedBoard.name}暂未开放`, icon: 'none' });
        return;
      }
      this.setData({
        currentBoardType: boardId,
        currentBoardUnit: selectedBoard.unit,
        leaderboardData: [],
        currentUserRank: null,
        // currentPage: 1, // 如果使用分页
        // hasMoreData: true,
      });
      this.loadLeaderboard(true);
    }
  },

  loadLeaderboard: function(isRefresh = false) {
    // 对于TopN接口，isRefresh主要是清空列表重新加载
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });
    if (isRefresh) {
        this.setData({ leaderboardData: [] });
    }
    wx.showLoading({ title: '加载中...' });

    const currentBoardConfig = this.data.leaderboardTypes.find(b => b.id === this.data.currentBoardType);
    if (!currentBoardConfig || !currentBoardConfig.apiUrl) {
      console.error("当前榜单类型API URL未配置");
      this.setData({ isLoading: false }); wx.hideLoading(); wx.stopPullDownRefresh();
      return;
    }

    const apiUrl = currentBoardConfig.apiUrl;
    let requestParams = {
        number: this.data.topNCount // 三个接口都使用 number 参数查询前几名
    };
    // 如果某个榜单支持分页，可以在这里根据 currentBoardType 添加 page 和 pagesize
    // if (this.data.currentBoardType === 'somePagedBoard') {
    //   requestParams.page = this.data.currentPage;
    //   requestParams.pagesize = this.data.pageSize;
    //   delete requestParams.number; // 移除 number 参数
    // }

    console.log(`Requesting leaderboard: ${apiUrl}`, requestParams);

    request({
      url: apiUrl,
      method: 'GET',
      data: requestParams,
      expectDirectData: true // **假设这三个接口都直接返回 {total, records} 结构**
    })
    .then(directApiResponseData => {
      console.log(`API Response for ${apiUrl} (direct data):`, JSON.stringify(directApiResponseData));

      const rawUserList = (directApiResponseData && Array.isArray(directApiResponseData.records)) ? directApiResponseData.records : [];
      // const totalCount = (directApiResponseData && directApiResponseData.total !== undefined) ? parseInt(directApiResponseData.total, 10) : 0;
      // 对于TopN，totalCount可能就是返回的列表长度或者API不提供

      if (!Array.isArray(rawUserList)) {
          console.error(`解析 ${apiUrl} 响应失败：期望 records 是一个数组`, rawUserList);
          this.setData({ leaderboardData: [], hasMoreData: false });
          return;
      }

      const formattedItems = rawUserList.map((item, index) => {
        const name = item.username || '匿名用户'; // 所有榜单都用 username
        let avatarUrl = '/assets/images/avatar_placeholder.png';
        if (item.img && typeof item.img === 'string') { // 所有榜单都用 img
            if (item.img.startsWith('http')) avatarUrl = item.img;
            else if (item.img.includes('/') && item.img.includes('.')) {
                let path = item.img;
                if (IMAGE_BASE_URL.endsWith('/') && path.startsWith('/')) path = path.substring(1);
                else if (!IMAGE_BASE_URL.endsWith('/') && !path.startsWith('/')) { if(path) path = '/' + path; }
                avatarUrl = IMAGE_BASE_URL + path;
            } else {
                console.warn(`User ${name} (ID: ${item.id}): Invalid image value "${item.img}", using placeholder.`);
            }
        }

        let scoreValue = 0;
        let scoreFormattedDisplay = "0";
        const scoreField = currentBoardConfig.scoreField;
        const processingType = currentBoardConfig.processingType;
        const rawScoreData = item[scoreField];

        if (processingType === 'countCommaSeparated' && typeof rawScoreData === 'string') {
            scoreValue = rawScoreData.split(',').filter(s => s.trim() !== '').length;
            scoreFormattedDisplay = scoreValue.toString();
        } else if (processingType === 'directAsInt' && typeof rawScoreData !== 'undefined') {
            scoreValue = parseInt(rawScoreData) || 0; // 直接取整
            scoreFormattedDisplay = scoreValue.toString();
        } else if (processingType === 'divideBy60Fixed1' && typeof rawScoreData !== 'undefined') {
            scoreValue = parseFloat(rawScoreData) || 0;
            scoreFormattedDisplay = (scoreValue / 60).toFixed(currentBoardConfig.scoreFixedDigits || 1);
        }
        // 可以为更多 processingType 添加逻辑，或者直接用 item[scoreField] 如果不需要处理

        const userId = item.id; // 所有榜单都用 id 作为 userId

        return {
          userId: userId,
          rank: index + 1, // Top N 列表，直接用索引作为排名
          name: name,
          avatarUrl: avatarUrl,
          score: scoreValue,
          scoreFormatted: scoreFormattedDisplay,
          isCurrentUser: app.globalData.userInfo && userId === app.globalData.userInfo.id
        };
      });

      this.setData({
        leaderboardData: formattedItems,
        hasMoreData: false, // Top N 查询通常没有更多数据
        // currentPage: this.data.currentPage + 1, // 如果使用分页
        // hasMoreData: formattedItems.length > 0 && updatedLeaderboardData.length < totalCount, // 如果使用分页
      });

      // 更新当前用户排名显示
      const currentUserInList = formattedItems.find(u => u.isCurrentUser);
      if (currentUserInList) {
        this.setData({ currentUserRank: currentUserInList });
      } else if (app.globalData.userInfo && app.globalData.userInfo.id) {
        this.setData({
          currentUserRank: {
            rank: '...', name: (app.globalData.userInfo.name || '我') + ' (未在Top'+this.data.topNCount+')',
            avatarUrl: app.globalData.userInfo.avatarUrl || '/assets/images/avatar_placeholder.png',
            scoreFormatted: '-'
          }
        });
      } else {
        this.setData({currentUserRank: null});
      }

    })
    .catch(err => { console.error(`API获取排行榜 (${apiUrl}) 失败:`, err); })
    .finally(() => {
      this.setData({ isLoading: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    });
  },

  onPullDownRefresh: function() {
      this.loadLeaderboard();
  }
});