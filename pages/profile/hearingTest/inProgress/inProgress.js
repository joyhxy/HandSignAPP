// pages/profile/hearingTest/inProgress/inProgress.js
const app = getApp(); // 如果需要全局存储测试结果

Page({
    data: {
        testSequence: [ // 模拟测试序列
            { ear: '左耳', frequency: 1000, volume: 0.5, duration: 1000 }, // volume 0-1, duration ms
            { ear: '左耳', frequency: 2000, volume: 0.4, duration: 1000 },
            { ear: '左耳', frequency: 500,  volume: 0.6, duration: 1000 },
            { ear: '右耳', frequency: 1000, volume: 0.5, duration: 1000 },
            { ear: '右耳', frequency: 4000, volume: 0.3, duration: 1000 },
            // ... 更多测试点，UI稿中是 10 个
        ],
        currentTestIndex: 0,
        currentTestNumber: 1,
        totalTests: 0, // 会在onLoad中设置

        currentEar: '',
        currentFrequency: 0,
        isPlayingSound: false, // 是否正在“播放”声音（模拟状态）
        canRespond: false, // 用户是否可以点击按钮

        results: [] // 存储每次测试的结果 { ear, frequency, volume, heard: true/false }
    },

    // innerAudioContext: null, // 用于实际播放声音

    onLoad: function (options) {
        this.setData({
            totalTests: this.data.testSequence.length
        });
        // this.innerAudioContext = wx.createInnerAudioContext();
        // this.innerAudioContext.onEnded(() => {
        //     console.log('Audio ended');
        //     this.setData({ isPlayingSound: false, canRespond: true });
        // });
        // this.innerAudioContext.onError((res) => {
        //     console.error('Audio error:', res.errMsg, res.errCode);
        //     wx.showToast({ title: '声音播放失败', icon: 'none' });
        //     this.setData({ isPlayingSound: false, canRespond: true }); // 允许用户继续
        // });

        this.startNextTest();
    },

    onUnload: function() {
        // if (this.innerAudioContext) {
        //     this.innerAudioContext.destroy();
        // }
    },

    startNextTest: function() {
        if (this.data.currentTestIndex >= this.data.testSequence.length) {
            this.finishTest();
            return;
        }

        const currentTest = this.data.testSequence[this.data.currentTestIndex];
        this.setData({
            currentEar: currentTest.ear,
            currentFrequency: currentTest.frequency,
            currentTestNumber: this.data.currentTestIndex + 1,
            isPlayingSound: true, // 开始模拟播放
            canRespond: false    // 播放期间不允许响应
        });

        console.log(`Playing sound: ${currentTest.ear}, ${currentTest.frequency}Hz, Vol:${currentTest.volume}`);

        // --- 模拟声音播放 ---
        // 实际播放声音：
        // this.innerAudioContext.src = this.generateSoundFileUrl(currentTest.frequency, currentTest.volume); // 你需要有声音文件或实时生成
        // this.innerAudioContext.volume = currentTest.volume;
        // this.innerAudioContext.play();
        // 真实场景下，播放结束后在 onEnded 回调中设置 isPlayingSound: false, canRespond: true

        // 模拟播放完成
        setTimeout(() => {
            this.setData({
                isPlayingSound: false, // 模拟播放结束
                canRespond: true     // 现在可以响应了
            });
            console.log('Mock sound finished playing.');
        }, currentTest.duration || 1500); // 模拟声音持续时间
    },

    recordResponse: function(heard) {
        if (!this.data.canRespond) return; // 防止重复点击

        const currentTest = this.data.testSequence[this.data.currentTestIndex];
        const newResult = {
            ear: currentTest.ear,
            frequency: currentTest.frequency,
            volume: currentTest.volume,
            heard: heard
        };
        this.setData({
            results: [...this.data.results, newResult],
            currentTestIndex: this.data.currentTestIndex + 1,
            canRespond: false // 重置响应状态，准备下一轮
        });
        this.startNextTest();
    },

    userHeardSound: function() {
        this.recordResponse(true);
    },

    userDidNotHearSound: function() {
        this.recordResponse(false);
    },

    finishTest: function() {
        console.log('Test finished. Results:', this.data.results);
        // 将结果存储到全局或传递到结果页面
        app.globalData.hearingTestResults = this.data.results; // 假设app.js中有globalData

        wx.redirectTo({ // 用redirectTo，测试完成后不应返回测试中页面
            url: '/pages/profile/hearingTest/results/results'
        });
    }
});