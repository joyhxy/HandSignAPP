// pages/learner/dailyChallenge/dailyChallenge.js
Page({
  data: {
      challengeData: { // 当前挑战题目数据
          videoUrl: '', // 或 imageUrl
          options: [
              // { label: 'A', text: '你好' },
              // { label: 'B', text: '谢谢' },
              // { label: 'C', text: '再见' },
              // { label: 'D', text: '不客气' }
          ],
          correctOptionIndex: null // 正确答案的索引
      },
      selectedOptionIndex: null, // 用户当前选择的选项索引
      currentProgress: 1, // 当前是第几题
      totalChallenges: 5, // 总共多少题 (从后端获取或固定)
      // 模拟所有题目数据
      allChallenges: [
          {
              id: 'q1',
              videoUrlPlaceholder: 'path/to/video1_placeholder.png', // 实际应为视频或gif
              options: [{ label: 'A', text: '你好' },{ label: 'B', text: '谢谢' },{ label: 'C', text: '再见' },{ label: 'D', text: '不客气' }],
              correctOptionIndex: 1 // B是正确答案
          },
          {
              id: 'q2',
              videoUrlPlaceholder: 'path/to/video2_placeholder.png',
              options: [{ label: 'A', text: '早上好' },{ label: 'B', text: '晚安' },{ label: 'C', text: '请' },{ label: 'D', text: '对不起' }],
              correctOptionIndex: 0
          },
          // ...更多题目
      ],
      currentChallengeIndex: 0, // 当前题目在 allChallenges 中的索引
      showResult: false, // 是否显示结果
      isCorrect: false // 答案是否正确
  },

  onLoad: function (options) {
      // TODO: 从后端API获取每日挑战题目列表
      // 或者先使用模拟数据
      this.loadChallenge(this.data.currentChallengeIndex);
  },

  loadChallenge: function(index) {
      if (index < this.data.allChallenges.length) {
          const currentQ = this.data.allChallenges[index];
          this.setData({
              challengeData: {
                  videoUrl: currentQ.videoUrlPlaceholder, // 实际场景可能是视频URL
                  options: currentQ.options,
                  correctOptionIndex: currentQ.correctOptionIndex
              },
              selectedOptionIndex: null, // 重置选择
              currentProgress: index + 1,
              showResult: false // 重置结果显示
          });
      } else {
          // 所有题目都完成了
          wx.showToast({ title: '今日挑战已完成!', icon: 'success' });
          // 可以跳转到结果页或返回上一页
          setTimeout(() => { wx.navigateBack(); }, 1500);
      }
  },

  selectOption: function(event) {
      const index = event.currentTarget.dataset.index;
      this.setData({
          selectedOptionIndex: index
      });
  },

  confirmAnswer: function() {
      if (this.data.selectedOptionIndex === null) {
          wx.showToast({ title: '请选择一个答案', icon: 'none' });
          return;
      }
      const correct = this.data.selectedOptionIndex === this.data.challengeData.correctOptionIndex;
      this.setData({
          showResult: true,
          isCorrect: correct
      });

      if (correct) {
          wx.showToast({ title: '回答正确!', icon: 'success', duration: 1000 });
      } else {
          wx.showToast({ title: '回答错误', icon: 'error', duration: 1000 }); // 'error' icon in newer versions
      }

      // 简单的延迟后进入下一题
      setTimeout(() => {
          const nextIndex = this.data.currentChallengeIndex + 1;
          this.setData({ currentChallengeIndex: nextIndex });
          this.loadChallenge(nextIndex);
      }, 1500); // 1.5秒后加载下一题
  },

  showHint: function() {
      // TODO: 实现查看提示逻辑
      // 可能是弹窗显示提示信息，或者消耗积分等
      wx.showModal({
          title: '提示',
          content: '这是一个提示内容。实际提示应与题目相关。',
          showCancel: false
      });
  }
});