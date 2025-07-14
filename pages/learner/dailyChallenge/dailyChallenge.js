// pages/learner/dailyChallenge/dailyChallenge.js
import request from '../../../utils/request.js';
const app = getApp();


Page({
  data: {
    // currentChallengeIndex: 0, // 不再需要，用 currentProgress 判断
    challengeData: { // 当前显示的题目数据
        id: null,
        name: '',
        mediaUrl: '',
        mediaType: 'image',
        description: '',
        options: [],
    },
    selectedOptionIndex: null,

    currentProgress: 0, // 当前已完成的题目数量 (0-4，显示时+1)
    totalChallenges: 5, // 总共5道题

    isLoading: true,
    canRespond: false,
    userAnswers: [] // 存储用户对每道题的回答 { questionId, selectedOptionIndex, isCorrect }
  },

  onLoad: function (options) {
    console.log("DailyChallenge Page: onLoad triggered");

    // --- ***** 强制设置模拟登录状态 (仅为调试此页面) ***** ---
    if (!app.globalData.isLoggedIn || !app.globalData.userInfo || !app.globalData.userInfo.id) {
        console.warn("DAILY_CHALLENGE_ONLOAD: Forcing mock login state for testing purposes!");
        const mockUserInfoForChallenge = {
            id: 1, // 使用你之前确定的测试用户ID
            name: "每日挑战测试员",
            avatarUrl: "/assets/images/avatar_placeholder.png",
            points: 500,
            level: "LV.Test",
            volunteerTitle: "挑战者",
            // 根据需要添加其他字段
        };
        const mockTokenForChallenge = "MOCK_CHALLENGE_TOKEN";

        app.globalData.userInfo = mockUserInfoForChallenge;
        app.globalData.isLoggedIn = true;
        app.globalData.token = mockTokenForChallenge;

        // (可选) 你也可以在这里也 wx.setStorageSync 一下，但不那么关键，因为我们主要关注当前会话
        // wx.setStorageSync('userInfo', mockUserInfoForChallenge);
        // wx.setStorageSync('userToken', mockTokenForChallenge);
    }
    console.log("DAILY_CHALLENGE_ONLOAD: app.globalData at start (after potential mock):", JSON.stringify(app.globalData));
    // --- ***** 模拟登录状态设置结束 ***** ---
    this.loadNextChallengeQuestion(); // 加载第一道题
  },

  loadNextChallengeQuestion: function() {
    if (this.data.currentProgress >= this.data.totalChallenges) {
      this.finishAllChallenges();
      return;
    }
    const questionNumberForDisplay = this.data.currentProgress + 1;
    console.log("DailyChallenge Page: loadNextChallengeQuestion called for question #", questionNumberForDisplay);
    this.setData({ isLoading: true, selectedOptionIndex: null, canRespond: false, currentProgressDisplay: questionNumberForDisplay });
    wx.showLoading({ title: `加载第 ${questionNumberForDisplay} 题...` });

    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    if (!currentUserId) { /* ... (之前的未登录处理逻辑) ... */ return; }

    request({
      url: '/learn/daytest',
      method: 'GET',
      data: { userid: currentUserId.toString() }
      // **确认 /learn/daytest 是否需要 expectDirectData: true**
      // 从你的日志看 "Full Response Object: {id:2, name:"谢谢", ...}"
      // 这表明 request.js 可能已经正确地提取了业务数据对象，或者你为它设置了 expectDirectData
      // 我们先假设 request.js 返回的是那个包含 id, name, img... 的对象
      // 如果它返回的是 {code, msg, data:{业务对象}}，则下面取值要从 apiResponse.data 开始
    })
    .then(apiResponse => { // apiResponse 是业务数据对象 {id, name, img, video, description, s1, s2, s3}
      console.log("DailyChallenge Page: API /learn/daytest success. Full Response Object:", JSON.stringify(apiResponse));
      wx.hideLoading();

      if (apiResponse && apiResponse.id !== undefined && apiResponse.name) {
        const correctAnswerName = apiResponse.name;
        const optionsText = [
          correctAnswerName,
          apiResponse.s1,
          apiResponse.s2,
          apiResponse.s3
        ].filter(opt => typeof opt === 'string' && opt.trim() !== '');

        if (optionsText.length < 2) { /* ... (选项不足处理) ... */ return; }

        const shuffledOptions = this.shuffleArray([...optionsText]);
        const correctIndexInShuffled = shuffledOptions.findIndex(opt => opt === correctAnswerName);
        const formattedOptions = shuffledOptions.map((text, index) => ({
          label: String.fromCharCode(65 + index), text: text, isCorrect: index === correctIndexInShuffled
        }));

        let imageUrl = null;
        let videoUrl = null;

        if (apiResponse.img && apiResponse.img.startsWith('http')) {
            imageUrl = apiResponse.img;
        }
        if (apiResponse.video && apiResponse.video.startsWith('http')) {
            videoUrl = apiResponse.video;
        }

        this.setData({
          challengeData: {
            id: apiResponse.id,
            name: correctAnswerName,
            imageUrl: imageUrl, // 保存图片URL
            videoUrl: videoUrl, // 保存视频URL
            description: apiResponse.description,
            options: formattedOptions,
          },
          isLoading: false,
          canRespond: true,
          showAnswer: false, // **重置答案显示状态**
          currentProgressDisplay: this.data.currentProgress + 1
        });
      } else {
        // 这个分支通常是 request.js 内部判断 code!=1 或者 res.data 无效时 reject 后，由 catch 处理
        // 但如果 request.js resolve 了一个不符合预期的 apiResponse (比如 code!=1 但 resolve 了)
        console.error("DailyChallenge Page: API /learn/daytest did not return valid data structure or code was not 1. Received:", apiResponse);
        this.setData({ isLoading: false, canRespond: true });
        const errorMsgToShow = (apiResponse && apiResponse.msg) ? apiResponse.msg : '加载每日挑战题目失败';
        wx.showToast({ title: errorMsgToShow, icon: 'none', duration: 2500 });
      }
    })
    .catch(err => {
      console.error("DailyChallenge Page: API /learn/daytest request failed. Error:", err);
      wx.hideLoading();
      this.setData({ isLoading: false, canRespond: true });
      // request.js 应该已经处理了 Toast
    });
  },
  // --- API加载结束 ---
  /*
  buildMediaUrl: function(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // 确保 MEDIA_BASE_URL 和 path 之间的斜杠正确
    let baseUrl = MEDIA_BASE_URL;
    if (baseUrl.endsWith('/') && path.startsWith('/')) {
        path = path.substring(1);
    } else if (!baseUrl.endsWith('/') && !path.startsWith('/')) {
        if (path) path = '/' + path; // 只有当path不为空时才加斜杠
    }
    return baseUrl + path;
  },
  */
  shuffleArray: function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  selectOption: function(event) {
    if (!this.data.canRespond) return;
    const index = event.currentTarget.dataset.index;
    this.setData({ selectedOptionIndex: index });
  },

  confirmAnswer: function() {
    if (this.data.selectedOptionIndex === null || !this.data.canRespond) {
      if (this.data.selectedOptionIndex === null) wx.showToast({ title: '请选择一个答案', icon: 'none' });
      return;
    }
    this.setData({
        canRespond: false, // 确认后暂时不能再操作
        showAnswer: true   // **核心修改：显示答案高亮**
    });

    const selectedOpt = this.data.challengeData.options[this.data.selectedOptionIndex];
    const isCorrect = selectedOpt.isCorrect;
    const currentQuestionId = this.data.challengeData.id;

    if (isCorrect) {
      // **答对后，不再只用 Toast，而是用 Modal 给出更丰富的反馈**
      this.incrementCorrectAnswerCount(); // 先调用API记录
      setTimeout(() => {
        wx.showModal({
          title: '回答正确！🎉',
          content: `太棒了，手势 "${this.data.challengeData.name}" 的含义就是这个！`,
          confirmText: '下一题',
          showCancel: false, // 不给用户取消的机会，直接进入下一题
          success: (res) => {
            if (res.confirm) {
              this.setData({ currentProgress: this.data.currentProgress + 1 });
              this.loadNextChallengeQuestion();
            }
          }
        });
      }, 800); // 延迟800ms让用户看到高亮效果

    } else { // 回答错误
      if (currentQuestionId) {
        this.addQuestionToWrongSet(currentQuestionId); // 调用API加入错题本
      }
      setTimeout(() => {
        const correctAnswerText = this.data.challengeData.name;
        const correctAnswerLabel = this.data.challengeData.options.find(opt=>opt.isCorrect)?.label || '';
        wx.showModal({
          title: '回答错误',
          content: `正确答案是 ${correctAnswerLabel ? `${correctAnswerLabel}. ` : ''}"${correctAnswerText}"。`,
          confirmText: '下一题',
          cancelText: '查看解析', // 提供查看详情的选项
          showCancel: true,
          success: (res) => {
            if (res.confirm) { // 用户点击“下一题”
              this.setData({ currentProgress: this.data.currentProgress + 1 });
              this.loadNextChallengeQuestion();
            } else if (res.cancel) { // 用户点击“查看解析”
              wx.navigateTo({
                url: `/pages/learner/gestureDetails/gestureDetails?id=${currentQuestionId}`,
                // 从详情页返回后，会自动回到当前题目，用户可以选择再看一次或直接点下一题（如果流程设计如此）
                // 为了简化，我们让用户看完解析后，也自动进入下一题
                complete: () => {
                    this.setData({ currentProgress: this.data.currentProgress + 1 });
                    this.loadNextChallengeQuestion();
                }
              });
            }
          }
        });
      }, 800);
    }
  },
   // --- **核心：加入错题集的方法** ---
   addQuestionToWrongSet: function(questionId) {
    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    if (!currentUserId || !app.globalData.isLoggedIn) {
      console.warn("DailyChallenge: User not logged in, cannot add question to wrong set.");
      return;
    }

    const questionIdParam = questionId.toString();
    const userIdParam = currentUserId.toString();

    console.log(`DailyChallenge: Attempting to add question ID ${questionIdParam} to wrong set for user ID ${userIdParam} via POST /learn/wrong`);

    request({
      url: `/learn/wrong?id=${questionIdParam}&userid=${userIdParam}`, // **Query参数 id 和 userid**
      method: 'POST',
      data: {} // Body 为空
      // **接口响应是 {code, msg, data}, 不需要 expectDirectData**
    })
    .then(response => { // response 是 data 部分 (null 或 {})
      console.log('DailyChallenge: API /learn/wrong success response:', response);
      // 根据文档，code=1时，data为null。所以这里可能什么都不用做，或者给一个轻提示
      // wx.showToast({ title: '已记录到错题本', icon: 'none', duration: 1000 });
    })
    .catch(err => {
      console.error('DailyChallenge: API /learn/wrong FAILED or code=0:', err);
      // **处理“已加入错题集”的特殊情况**
      // err 对象应该是 {msg: "已加入错题集", code: 0, rawResponse: {...}}
      if (err && err.msg === "已加入错题集") {
        console.log("Question was already in the wrong set.");
        // 这种情况是正常的，可以不向用户显示错误
      } else {
        // 其他真正的错误
        console.error("Failed to add question to wrong set for a different reason:", err);
        // 可以考虑给一个非阻塞的提示
        // wx.showToast({ title: '添加到错题本失败', icon: 'none' });
      }
    });
  },

  finishAllChallenges: function() {
    console.log("All 5 challenges finished. User Answers:", this.data.userAnswers);
    let correctCount = 0;
    this.data.userAnswers.forEach(ans => { if(ans.isCorrect) correctCount++; });

    app.globalData.dailyChallengeUserAnswers = this.data.userAnswers;
    app.globalData.dailyChallengeSummary = { total: this.data.totalChallenges, correct: correctCount };

    wx.showModal({
        title: '挑战完成！',
        content: `您已完成今日的 ${this.data.totalChallenges} 道挑战，答对了 ${correctCount} 道。`,
        confirmText: "查看手势学习", // 例如
        cancelText: "返回",
        showCancel: true,
        success: (res) => {
            if (res.confirm) {
                wx.switchTab({ url: '/pages/learner/home/home' }); // 去学习首页
            } else { // 用户点了取消或关闭
                wx.navigateBack(); // 返回上一页
            }
        },
        // 重置，以便用户从其他入口再次进入时是新的挑战（如果设计如此）
        // complete: () => {
        //     this.setData({ currentProgress: 0, userAnswers: [] });
        // }
    });
  },
  addQuestionToWrongSet: function(questionId) {
    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    if (!currentUserId || !app.globalData.isLoggedIn) {
      console.warn("DailyChallenge: User not logged in, cannot add question to wrong set.");
      return;
    }

    const questionIdParam = questionId.toString();
    const userIdParam = currentUserId.toString();

    console.log(`DailyChallenge: Adding question ID ${questionIdParam} to wrong set for user ID ${userIdParam} via POST /learn/wrong`);

    // **为了处理特殊的响应，我们让 request.js 返回整个 res.data**
    // **这需要 request.js 支持一个选项，或者我们在 .catch 里处理**
    // **更简单的做法是，如果 request.js 遵循 resolve(res.data.data) 的规则，
    // 那么成功时 `.then` 的回调参数就是 null，我们直接处理即可。**

    request({
      url: `/learn/wrong?id=${questionIdParam}&userid=${userIdParam}`,
      method: 'POST',
      data: {}
    })
    .then(responseFromDataField => { // responseFromDataField 是 res.data.data 的值, 即 null
      console.log('DailyChallenge: API /learn/wrong success. The "data" part of response is:', responseFromDataField);
      // **既然 code:1 已经由 request.js 判断过了，这里就代表操作成功了**
      // 我们不需要再判断 response.code
      wx.showToast({ title: '已加入错题本', icon: 'success', duration: 1500 });
    })
    .catch(err => {
      console.error('DailyChallenge: API /learn/wrong FAILED or biz code=0:', err);
      // **处理“已加入错题集”的特殊情况**
      // err 对象应该是 {msg: "已加入错题集", code: 0, rawResponse: {...}}
      if (err && err.msg === "已加入错题集") {
        console.log("Question was already in the wrong set.");
        wx.showToast({ title: '已在错题本中', icon: 'none', duration: 1500 });
      } else {
        // 其他真正的错误
        console.error("Failed to add question to wrong set for a different reason:", err);
        wx.showToast({ title: err.msg || '加入错题本失败', icon: 'none' });
      }
    });
  },

    // --- ***** 重点修改这个函数 ***** ---
    incrementCorrectAnswerCount: function() {
      const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
      const currentQuestionId = this.data.challengeData.id; // **确保 this.data.challengeData.id 有当前题目的ID**
  
      if (!currentUserId || !app.globalData.isLoggedIn) {
        console.warn("DailyChallenge: User not logged in. Cannot increment correct answer count.");
        return;
      }
      if (!currentQuestionId) {
        console.warn("DailyChallenge: currentQuestionId is missing. Cannot increment correct answer count.");
        return;
      }
  
      // API文档 Query 参数：id (题目id), user (用户id)
      // 类型都是 integer，但作为Query参数，字符串通常更安全，后端可转换
      const questionIdParam = currentQuestionId.toString();
      const userIdParam = currentUserId.toString();
  
      // **核心修改：将 Query 参数 user 修改为 userid**
    console.log(`DailyChallenge: Calling API POST /user/addtisum with Query Params: id=${questionIdParam}, userid=${userIdParam}`); // 日志也同步修改
  
      request({
        url: `/user/addtisum?id=${questionIdParam}&userid=${userIdParam}`, // <--- **修改这里**
      method: 'POST',
      // data: {}, // Body 为空
      })
      .then(response => { // response 是API返回的data部分 (通常是null或{})
        console.log('DailyChallenge: API /user/addtisum success:', response);
        // 后端已计数，前端通常不需要做特别处理，除非API返回了新的用户总答对数
        // if (app.globalData.userInfo && response && response.newTotalCorrect !== undefined) {
        //    app.globalData.userInfo.totalCorrectAnswers = response.newTotalCorrect;
        // }
      })
      .catch(err => {
        console.error('DailyChallenge: API /user/addtisum FAILED:', err);
        // 这个接口的失败不应阻塞用户体验，可以只在后台记录错误
        // wx.showToast({ title: '同步答题进度失败', icon: 'none' });
      });
    },
  // --- ***** 函数修改结束 ***** ---


  showHint: function() {
    const hintText = this.data.challengeData.description
                     ? `提示：${this.data.challengeData.description.substring(0, 50)}...` // 增加提示字数
                     : '暂无提示，加油哦！';
    wx.showModal({
        title: '提示',
        content: hintText,
        showCancel: false
    });
  }
});