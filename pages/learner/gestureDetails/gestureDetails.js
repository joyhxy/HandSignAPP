// pages/learner/gestureDetails/gestureDetails.js
Page({
  data: {
      gestureId: null,
      gesture: { // 初始化手势数据结构
          name: '加载中...',
          translation: '',
          mediaUrl: null, // 视频或图片URL
          mediaType: 'image', // 'image' or 'video'
          tags: [],
          description: '',
          descriptionSteps: [], // 例如: ["1. xxx", "2. yyy"]
          usageExamples: [],
          dialogueExample: null, // { title: '情景对话：', lines: [{actor: 'A', text: '[你好] (手势)'}, ...] }
          confusingGestures: [
              // { name: '不客气', mediaUrl: null, description: '注意区分“不客气”的手势...' }
          ]
      },
      isLoading: true,
      errorMessage: ''
  },

  onLoad: function (options) {
      if (options.id) {
          this.setData({ gestureId: options.id });
          this.fetchGestureDetails(options.id);
      } else {
          this.setData({ errorMessage: '未找到手势信息', isLoading: false });
          wx.showToast({ title: '参数错误', icon: 'none' });
      }
  },

  fetchGestureDetails: function(id) {
      this.setData({ isLoading: true, errorMessage: '' });
      wx.showLoading({ title: '加载中...' });

      // --- 模拟API请求 ---
      setTimeout(() => {
          const mockGestureData = { // 模拟单个手势的详细数据
              id: id,
              name: '谢谢',
              translation: 'Thank You',
              mediaUrl: '/assets/images/placeholder-gesture-thankyou.png', // 替换为真实或更好的占位图
              mediaType: 'image',
              tags: ['日常用语', '礼貌'],
              description: "这是一个详细的手势描述，通常会包含多个步骤来解释如何做出这个手势。",
              descriptionSteps: [
                  "1. 右手弯曲，手指并拢，掌心向左下方。",
                  "2. 手臂自然前伸，同时微微点头示意。",
                  "3. 注意面带微笑，表达真诚的感谢。"
              ],
              usageExamples: [
                  "收到礼物时，向对方做出 [谢谢] 的手势。",
                  "别人帮助你后，表达感谢时使用。"
              ],
              dialogueExample: {
                  title: '情景对话：',
                  lines: [
                      { actor: 'A', text: '[你好] (手势)' },
                      { actor: 'B', text: '[你好] (手势)，这个送给你。' },
                      { actor: 'A', text: '[谢谢] (手势)' }
                  ]
              },
              confusingGestures: [
                  {
                      name: '不客气',
                      mediaUrl: '/assets/images/placeholder-gesture-youarewelcome-small.png', // 替换
                      mediaType: 'image',
                      description: '注意区分“不客气”的手势，动作方向和幅度不同。这个手势通常是双手掌心向上，向前轻推。'
                  },
                  {
                      name: '请',
                      mediaUrl: null, // 无图占位
                      mediaType: 'image',
                      description: '“请”的手势与“谢谢”在某些文化中可能相似，需注意区分。'
                  }
              ]
          };

          // 模拟一个找不到的情况
          if (id === "notfound") {
               this.setData({
                  gesture: {},
                  isLoading: false,
                  errorMessage: '手势信息不存在'
              });
              wx.hideLoading();
              return;
          }


          this.setData({
              gesture: mockGestureData,
              isLoading: false
          });
          wx.hideLoading();
      }, 1000);

      // --- 真实API请求 (后续替换) ---
      /*
      const { request } = require('../../../utils/request');
      request({
          url: `/learn/gesture/${id}`, // 假设的API路径
          method: 'GET'
      }).then(res => {
          if (res.code === 1 && res.data) {
              // 可能需要处理 description 为 steps
              if (res.data.description && typeof res.data.description === 'string') {
                  res.data.descriptionSteps = res.data.description.split('\n').map((step, i) => `${i+1}. ${step.trim()}`).filter(s => s.length > 3);
              }
              this.setData({ gesture: res.data, isLoading: false });
          } else {
              this.setData({ errorMessage: res.msg || '加载手势详情失败', isLoading: false });
          }
      }).catch(err => {
          this.setData({ errorMessage: '网络错误', isLoading: false });
      }).finally(() => {
          wx.hideLoading();
      });
      */
  },

  addToPractice: function() {
      // TODO: 实现加入练习的逻辑 (例如，调用API，更新本地状态等)
      wx.showToast({
          title: `已将 "${this.data.gesture.name}" 加入练习`,
          icon: 'none'
      });
  },

  markAsMastered: function() {
      // TODO: 实现标记为已掌握的逻辑
      wx.showToast({
          title: `已将 "${this.data.gesture.name}" 标记为掌握`,
          icon: 'success'
      });
      // 可能需要更新按钮状态或导航离开
  },

  // 图片加载错误处理 (可选)
  onMediaError: function(e) {
      console.error('媒体加载失败', e.detail.errMsg);
      // 可以尝试设置一个默认的错误图片
      // if (e.currentTarget.dataset.type === 'main') {
      //     this.setData({'gesture.mediaUrl': '/assets/images/load-error.png'});
      // }
  }
});