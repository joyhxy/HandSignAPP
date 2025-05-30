// pages/learner/dailyChallenge/dailyChallenge.js
import request from '../../../utils/request.js';
const app = getApp();
const MEDIA_BASE_URL = 'https://222.186.168.45:8080'; // 确保媒体基础URL正确

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
    console.log("DailyChallenge Page: loadNextChallengeQuestion called for question #", this.data.currentProgress + 1);
    this.setData({ isLoading: true, selectedOptionIndex: null, canRespond: false });
    wx.showLoading({ title: '加载题目...' });

    request({
      url: '/learn/daytest',
      method: 'GET'
      // **移除 expectDirectData: true，因为响应是标准的 {code, msg, data: {题目对象}}**
    })
    .then(questionDataFromApi => { // **questionDataFromApi 现在是 API 响应的 data.data 部分，即 {id, name, img, ...}**
      console.log("DailyChallenge Page: API /learn/daytest success. Question Data:", JSON.stringify(questionDataFromApi));
      wx.hideLoading();

      // **现在直接使用 questionDataFromApi 来获取字段**
      if (questionDataFromApi && questionDataFromApi.id !== undefined) { // 检查核心字段 id 是否存在
        const correctAnswerName = questionDataFromApi.name;
        const optionsText = [
          correctAnswerName,
          questionDataFromApi.s1,
          questionDataFromApi.s2,
          questionDataFromApi.s3
        ].filter(opt => typeof opt === 'string' && opt.trim() !== '');

        if (optionsText.length < 2) {
            console.error("DailyChallenge Page: Not enough valid options from API.", questionDataFromApi);
            this.setData({ isLoading: false, canRespond: true });
            wx.showModal({title:'题目加载错误', content:'题目选项不足，请稍后重试或联系客服。', showCancel:false});
            return;
        }

        const shuffledOptions = this.shuffleArray([...optionsText]);
        const correctIndexInShuffled = shuffledOptions.findIndex(opt => opt === correctAnswerName);

        const formattedOptions = shuffledOptions.map((text, index) => ({
          label: String.fromCharCode(65 + index), text: text, isCorrect: index === correctIndexInShuffled
        }));

        let mediaUrl = '';
        let mediaType = 'image';
        // **字段名根据 API 响应示例是 img, video, description (注意不是 descript)**
        if (questionDataFromApi.video && questionDataFromApi.video.trim() !== "") {
            mediaType = 'video';
            mediaUrl = this.buildMediaUrl(questionDataFromApi.video);
        } else if (questionDataFromApi.img && questionDataFromApi.img.trim() !== "") { // API 示例是 img
            mediaType = 'image';
            mediaUrl = this.buildMediaUrl(questionDataFromApi.img);
        } else {
            mediaUrl = '/assets/images/gesture-placeholder-large.png';
        }

        this.setData({
          challengeData: {
            id: questionDataFromApi.id,
            name: correctAnswerName,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            description: questionDataFromApi.description, // API 示例是 description
            options: formattedOptions,
          },
          isLoading: false,
          canRespond: true,
          currentProgressDisplay: this.data.currentProgress + 1
        });
      } else {
        console.error("DailyChallenge Page: API /learn/daytest did not return valid question data in 'data' field or missing ID. Received:", questionDataFromApi);
        this.setData({ isLoading: false, canRespond: true });
        // request.js 内部如果解析到 res.data.code !== 1 应该已经弹了 toast
        // 如果 questionDataFromApi 是 null/undefined (因为 res.data.data 不存在)
        wx.showToast({ title: '加载每日挑战题目失败', icon: 'none', duration: 2500 });
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
    this.setData({ canRespond: false });

    const currentQuestionId = this.data.challengeData.id; // 当前题目ID
    const selectedOpt = this.data.challengeData.options[this.data.selectedOptionIndex];
    const correct = selectedOpt.isCorrect;

    const userAnswer = {
        questionId: currentQuestionId,
        selectedOptionText: selectedOpt.text,
        isCorrect: correct,
        correctAnswerText: this.data.challengeData.name // 正确答案的文本
    };
    this.data.userAnswers.push(userAnswer);
    // this.setData({ userAnswers: this.data.userAnswers }); // 如果需要WXML响应

    if (correct) {
      wx.showToast({ title: '回答正确!', icon: 'success', duration: 1000 });
      this.incrementCorrectAnswerCount();
    } else {
      wx.showToast({ title: '回答错误', icon: 'error', duration: 1000 });
      // **回答错误后，调用API将题目加入错题集**
      if (currentQuestionId) { // 确保有题目ID
        this.addQuestionToWrongSet(currentQuestionId); // <--- 新增调用
      }
    }

    setTimeout(() => {
        // 增加已完成题目计数
        this.setData({ currentProgress: this.data.currentProgress + 1 });
        this.loadNextChallengeQuestion(); // 加载下一题或结束
    }, 1200);
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
// --- ***** 严格按照文档修改这个函数 ***** ---
addQuestionToWrongSet: function(questionId) {
  const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;

  // 依然需要登录和用户ID检查
  if (!currentUserId || !app.globalData.isLoggedIn) {
    console.warn("DailyChallenge: User not logged in or no user ID. Cannot add question to wrong set.");
    return;
  }

  // API文档中 id 和 userid 都是 integer schema, 但 example 是 string/integer 混合
  // Query 参数通常传递字符串更安全，后端进行类型转换
  const questionIdStr = questionId.toString();
  const userIdStr = currentUserId.toString();

  console.log(`DailyChallenge: Adding question ID ${questionIdStr} to wrong set for user ID ${userIdStr} via POST /learn/wrong`);

  request({
    url: `/learn/wrong?id=${questionIdStr}&userid=${userIdStr}`, // **将参数直接拼接到URL的Query String中**
    method: 'POST',                                          // **方法是POST**
    // data: {}, // **Request Body 为空对象，或不传递 data 属性，取决于 request.js 的实现**
                // **如果 request.js 在 method:POST 且 data 未定义时会发送一个空body或合适的Content-Type，则可以不传 data**
                // **为保险起见，可以传一个空对象 data: {}**
    // 此接口响应是 {code, msg, data:null/object}，不需要 expectDirectData: true
  })
  .then(response => { // response 现在是 {code, msg, data}
    console.log('DailyChallenge: API /learn/wrong response:', response);
    if (response.code === 1) {
        wx.showToast({ title: '已加入错题本', icon: 'success' });
    } else if (response.code === 0 && response.msg === "已加入错题集") {
        wx.showToast({ title: '已在错题本中', icon: 'none' });
    } else if (response.msg) { // 其他 code=0 但有 msg 的情况
        wx.showToast({ title: response.msg, icon: 'none' });
    }
})
  .catch(err => { // err 是 request.js reject 出来的 {msg, code, rawResponse}
    console.error('DailyChallenge: API /learn/wrong FAILED:', err);
    if (err && err.rawResponse && err.rawResponse.data && err.rawResponse.data.msg === "已加入错题集") {
      // 如果 request.js 在 code=0 时 reject，但我们想把 "已加入错题集" 当作一种提示
      console.log("Question already in wrong set (caught as error).");
      wx.showToast({ title: '已在错题本中', icon: 'none', duration: 1500 });
    } else {
      wx.showToast({ title: err.msg || '加入错题本失败', icon: 'none', duration: 1500 });
    }
  });
},
// --- ***** 函数修改结束 ***** ---


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
  
      console.log(`DailyChallenge: Calling API POST /user/addtisum with Query Params: id=${questionIdParam}, user=${userIdParam}`);
  
      request({
        url: `/user/addtisum?id=${questionIdParam}&user=${userIdParam}`, // **修正参数拼接**
        method: 'POST',
        // data: {}, // POST请求体为空或不传，因为参数在Query中
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
                     ? `提示：${this.data.challengeData.description.substring(0, 30)}...` // 增加提示字数
                     : '暂无提示，加油哦！';
    wx.showModal({
        title: '提示',
        content: hintText,
        showCancel: false
    });
  }
});