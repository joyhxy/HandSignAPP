// pages/profile/leaderboard/leaderboard.js
Page({
  data: {
      leaderboardTypes: [
          { id: 'points', name: '积分榜', unit: '分' },
          { id: 'studyTime', name: '学习时长榜', unit: '小时' },
          { id: 'volunteerService', name: '志愿服务榜', unit: '次' } // 或 '小时'
      ],
      currentBoardType: 'points', // 默认显示积分榜
      currentBoardUnit: '分', // 当前榜单的单位
      currentUserRank: null, // { rank, name, avatarUrl, score, scoreFormatted }
      leaderboardData: [], // { userId, rank, name, avatarUrl, score, scoreFormatted, isCurrentUser }
      isLoading: false
  },

  onLoad: function (options) {
      this.loadLeaderboard();
  },

  onBoardTypeTap: function(event) {
      const boardId = event.currentTarget.dataset.id;
      const selectedBoard = this.data.leaderboardTypes.find(b => b.id === boardId);
      if (selectedBoard && this.data.currentBoardType !== boardId) {
          this.setData({
              currentBoardType: boardId,
              currentBoardUnit: selectedBoard.unit,
              leaderboardData: [], // 清空旧数据
              currentUserRank: null // 清空当前用户排名
          });
          this.loadLeaderboard();
      }
  },

  loadLeaderboard: function() {
      this.setData({ isLoading: true });
      wx.showLoading({ title: '加载中...' });

      // --- 模拟API请求 ---
      setTimeout(() => {
          const type = this.data.currentBoardType;
          let mockRankData = [];
          let mockCurrentUser = null;
          const currentUserIdFromApp = "user123_self"; // 假设这是当前登录用户的ID

          if (type === 'points') {
              mockRankData = [
                  { userId: 'user001', rank: 1, name: '学习标兵王', avatarUrl: null, score: 3580 },
                  { userId: 'user002', name: '爱心大使李', avatarUrl: '/assets/images/avatar_placeholder.png', score: 3120 },
                  { userId: 'user003', name: '手语翻译家赵', avatarUrl: null, score: 2950 },
                  { userId: 'user004', name: '志愿者小张', avatarUrl: null, score: 2800 },
                  { userId: currentUserIdFromApp, rank: 15, name: '手语小能手', avatarUrl: '/assets/images/avatar_placeholder.png', score: 1250 }, // 当前用户
                  { userId: 'user005', name: '默默学习者', avatarUrl: null, score: 2650 },
              ].sort((a,b) => b.score - a.score).map((item, index) => ({...item, rank: index + 1, isCurrentUser: item.userId === currentUserIdFromApp }));
              mockCurrentUser = mockRankData.find(u => u.isCurrentUser);
          } else if (type === 'studyTime') {
              mockRankData = [
                  { userId: 'user001', name: '学海无涯张', avatarUrl: null, score: 150.5 },
                  { userId: currentUserIdFromApp, name: '手语小能手', avatarUrl: '/assets/images/avatar_placeholder.png', score: 80.2 },
                  { userId: 'user003', name: '挑灯夜读李', avatarUrl: null, score: 120.0 },
              ].sort((a,b) => b.score - a.score).map((item, index) => ({...item, rank: index + 1, isCurrentUser: item.userId === currentUserIdFromApp }));
              mockCurrentUser = mockRankData.find(u => u.isCurrentUser);
          } else { // volunteerService
               mockRankData = [
                  { userId: currentUserIdFromApp, name: '手语小能手', avatarUrl: '/assets/images/avatar_placeholder.png', score: 5 },
                  { userId: 'user002', name: '奉献之星王', avatarUrl: null, score: 12 },
              ].sort((a,b) => b.score - a.score).map((item, index) => ({...item, rank: index + 1, isCurrentUser: item.userId === currentUserIdFromApp }));
              mockCurrentUser = mockRankData.find(u => u.isCurrentUser);
          }

          // 格式化分数 (如果需要)
          mockRankData.forEach(item => {
              if (type === 'studyTime') item.scoreFormatted = parseFloat(item.score).toFixed(1);
              else item.scoreFormatted = parseInt(item.score);
          });
          if(mockCurrentUser) {
              if (type === 'studyTime') mockCurrentUser.scoreFormatted = parseFloat(mockCurrentUser.score).toFixed(1);
              else mockCurrentUser.scoreFormatted = parseInt(mockCurrentUser.score);
          }


          this.setData({
              leaderboardData: mockRankData,
              currentUserRank: mockCurrentUser,
              isLoading: false
          });
          wx.hideLoading();
          wx.stopPullDownRefresh();
      }, 1000);
      // TODO: 真实API请求，API应支持按类型获取排行榜数据，并包含当前用户的排名信息
  },
  onPullDownRefresh: function() {
      this.loadLeaderboard();
  }
});