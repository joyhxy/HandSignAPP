// pages/profile/hearingTest/results/results.js
const app = getApp();

Page({
    data: {
        testResults: [], // 从上一页获取的原始结果
        summary: {
            totalTests: 0,
            heardCount: 0,
            leftEar: { heardCount: 0, totalCount: 0, statusText: '', statusClass: '' },
            rightEar: { heardCount: 0, totalCount: 0, statusText: '', statusClass: '' },
            overallAssessment: '评估中...',
            exampleFinding: '' // 例如：您可能在较高频率的声音识别上略有困难。
        },
        // detailedResultsByFrequency: [] // 如果要显示更详细的每个频率的结果
    },

    onLoad: function (options) {
        const results = app.globalData.hearingTestResults || [];
        // const results = wx.getStorageSync('hearingTestResults'); // 另一种传递方式
        if (results.length === 0) {
            // wx.showToast({ title: '无测试结果数据', icon: 'none' });
            // 模拟一点数据以供展示
            results.push({ear: "左耳", frequency: 1000, volume: 0.5, heard: true});
            results.push({ear: "左耳", frequency: 2000, volume: 0.4, heard: true});
            results.push({ear: "左耳", frequency: 500,  volume: 0.6, heard: false});
            results.push({ear: "右耳", frequency: 1000, volume: 0.5, heard: true});
            results.push({ear: "右耳", frequency: 4000, volume: 0.3, heard: true});
        }
        this.setData({ testResults: results });
        this.processResults(results);
    },

    processResults: function(results) {
        let totalTests = results.length;
        let heardCount = 0;
        let leftHeard = 0, leftTotal = 0;
        let rightHeard = 0, rightTotal = 0;

        results.forEach(res => {
            if (res.heard) {
                heardCount++;
            }
            if (res.ear === '左耳') {
                leftTotal++;
                if (res.heard) leftHeard++;
            } else if (res.ear === '右耳') {
                rightTotal++;
                if (res.heard) rightHeard++;
            }
        });

        const getStatus = (heard, total) => {
            if (total === 0) return { text: '未测试', class: ''};
            const ratio = heard / total;
            if (ratio >= 0.8) return { text: '良好', class: 'status-good' };
            if (ratio >= 0.5) return { text: '一般', class: 'status-fair' };
            return { text: '需关注', class: 'status-poor' };
        };

        const leftStatus = getStatus(leftHeard, leftTotal);
        const rightStatus = getStatus(rightHeard, rightTotal);

        let overallAssessment = '基本正常';
        if ( (leftTotal > 0 && leftHeard/leftTotal < 0.6) || (rightTotal > 0 && rightHeard/rightTotal < 0.6) ){
            overallAssessment = '建议咨询专业人士';
        } else if ((leftTotal > 0 && leftHeard/leftTotal < 0.8) || (rightTotal > 0 && rightHeard/rightTotal < 0.8)){
             overallAssessment = '部分频率可能识别略弱';
        }
        
        let exampleFinding = '';
        const highFreqNotHeard = results.find(r => r.frequency >= 4000 && !r.heard);
        if(highFreqNotHeard){
            exampleFinding = '例如：您可能在较高频率的声音识别上略有困难。';
        }


        this.setData({
            'summary.totalTests': totalTests,
            'summary.heardCount': heardCount,
            'summary.leftEar': { heardCount: leftHeard, totalCount: leftTotal, statusText: leftStatus.text, statusClass: leftStatus.class },
            'summary.rightEar': { heardCount: rightHeard, totalCount: rightTotal, statusText: rightStatus.text, statusClass: rightStatus.class },
            'summary.overallAssessment': overallAssessment,
            'summary.exampleFinding': exampleFinding
        });

        // TODO: 处理 detailedResultsByFrequency
    },

    retest: function() {
        // 清理之前的测试结果（如果需要）
        // app.globalData.hearingTestResults = [];
        wx.redirectTo({ // 用redirectTo，避免返回到结果页
            url: '/pages/profile/hearingTest/instructions/instructions'
        });
    },

    completeTest: function() {
        // 可以将测试结果保存到用户档案等
        // wx.removeStorageSync('hearingTestResults'); // 清理本次结果
        // app.globalData.hearingTestResults = [];
        wx.navigateBack({ // 返回到上一页，通常是“我的”页面或测试入口页
            delta: 2 // 假设是从 instructions -> inProgress -> results, 返回2级
                   // 如果不确定层级，可以考虑用 wx.switchTab 或 wx.reLaunch 到一个已知页面
        });
        // 如果想直接返回到 Profile 主页 (user-growth)
        // wx.switchTab({ url: '/pages/profile/user-growth/user-growth'});
    }
});