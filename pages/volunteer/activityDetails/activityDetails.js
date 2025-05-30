// pages/volunteer/activityDetails/activityDetails.js
import request from '../../../utils/request.js'; // 确保路径正确
const app = getApp(); // 如果需要用到全局数据，比如用户信息判断是否已报名等

// !!! 你需要将这个替换为后端图片/媒体资源的真实基础URL !!!
const IMAGE_BASE_URL = 'https://222.186.168.45:8080'; // 例如

Page({
  data: {
    activityId: null,
    activity: {
        title: '加载中...',
        imageUrl: null,
        time: '',
        location: '',
        recruitCount: 0,
        registeredCount: 0,
        description: '活动详情加载中...',
        requirements: [
            "掌握基础日常手语",
            "有耐心，善于沟通",
            "有志愿服务热情"
        ],
        pointsRequired: 0,
        status: 'loading',
        type: '',
        signImgUrl: null,
        feedbackQrImgUrl: null,
        coordinates: { x: null, y: null },
    },
    formData: {
        name: '',
        phone: '',
        experience: ''
    },
    isLoading: true,
    isSubmitting: false,
    errorMessage: ''
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ activityId: options.id });
      this.fetchActivityDetails(options.id);
    } else {
      this.setData({ isLoading: false, errorMessage: '活动ID缺失' });
      wx.showToast({ title: '活动ID缺失', icon: 'none', duration: 2000 });
      // setTimeout(() => { wx.navigateBack(); }, 2000); // 可以考虑自动返回
    }
  },

  fetchActivityDetails: function(id) {
    this.setData({ isLoading: true, errorMessage: '' });
    wx.showLoading({ title: '加载活动详情...' });

    request({
      url: '/find/id',
      method: 'GET',
      data: { id: id }
    })
    .then(apiResponseDataArray => {
      console.log(`API /find/id Response (data part - should be an array):`, apiResponseDataArray);
      if (Array.isArray(apiResponseDataArray) && apiResponseDataArray.length > 0) {
        const activityDataFromApi = apiResponseDataArray[0];
        let completeImageUrl = '/assets/images/activity-placeholder-community.png';
        const imagePathFromApi = activityDataFromApi.img;
        if (imagePathFromApi && typeof imagePathFromApi === 'string') {
          if (imagePathFromApi.startsWith('http')) {
            completeImageUrl = imagePathFromApi;
          } else if (imagePathFromApi.length > 5 && imagePathFromApi.includes('.')) {
            completeImageUrl = this.buildMediaUrl(imagePathFromApi);
          } else {
            console.warn(`Invalid image path from API (img: "${imagePathFromApi}"), using placeholder.`);
          }
        }
        const signImgUrl = this.buildMediaUrl(activityDataFromApi.signimg);
        const feedbackQrImgUrl = this.buildMediaUrl(activityDataFromApi.qrimg);
        let timeRange = '时间待定';
        if (activityDataFromApi.starttime && activityDataFromApi.endtime) {
            timeRange = `${this.formatDateTime(activityDataFromApi.starttime)} - ${this.formatDateTime(activityDataFromApi.endtime, true)}`;
        } else if (activityDataFromApi.starttime) {
            timeRange = `${this.formatDateTime(activityDataFromApi.starttime)} 开始`;
        }
        let currentStatus = 'recruiting';
        if (activityDataFromApi.join !== undefined && activityDataFromApi.max !== undefined) {
            if (activityDataFromApi.join >= activityDataFromApi.max) {
                currentStatus = 'full';
            }
        }
        let requirementsArray = this.data.activity.requirements;
        if (activityDataFromApi.description) {
            const reqMatch = activityDataFromApi.description.match(/志愿者要求[:：\s]*([\s\S]*)/i);
            if (reqMatch && reqMatch[1]) {
                requirementsArray = reqMatch[1].split(/[\n;；•●-]/).map(r => r.trim()).filter(r => r.length > 1);
                if (requirementsArray.length === 0 && reqMatch[1].trim().length > 1) requirementsArray = [reqMatch[1].trim()];
            }
        }
        this.setData({
          activity: {
            ...this.data.activity,
            id: activityDataFromApi.id,
            title: activityDataFromApi.name || '活动名称获取失败',
            imageUrl: completeImageUrl,
            time: timeRange,
            location: activityDataFromApi.location || '地点待定',
            recruitCount: activityDataFromApi.max || 0,
            registeredCount: activityDataFromApi.join || 0,
            description: activityDataFromApi.description === "1" || activityDataFromApi.description === "22" ? "这是一个活动的详细描述，请关注活动内容和参与方式。" : (activityDataFromApi.description || '暂无活动描述。'),
            type: activityDataFromApi.type || '未知类型',
            signImgUrl: signImgUrl,
            feedbackQrImgUrl: feedbackQrImgUrl,
            coordinates: { x: activityDataFromApi.x, y: activityDataFromApi.y },
            status: currentStatus,
            requirements: requirementsArray.length > 0 ? requirementsArray : this.data.activity.requirements,
          },
          isLoading: false
        });
      } else {
        console.warn("fetchActivityDetails: API返回的数据不是预期的数组或数组为空:", apiResponseDataArray);
        this.setData({ isLoading: false, errorMessage: (apiResponseDataArray && apiResponseDataArray.msg) || '无法加载活动详情，请稍后重试' });
      }
    })
    .catch(err => {
      console.error('API获取活动详情失败:', err);
      this.setData({ isLoading: false, errorMessage: err.msg || '网络错误，加载活动详情失败' });
    })
    .finally(() => {
        wx.hideLoading();
    });
  },

  buildMediaUrl: function(path) {
    if (!path || typeof path !== 'string' || path.trim() === "") return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (!path.includes('/') && path.length < 5 && !isNaN(parseInt(path))) {
        console.warn(`buildMediaUrl: Detected potentially invalid short path: "${path}", returning empty. Please check API response.`);
        return '/assets/images/image-load-failed-placeholder.png'; // 返回一个明确的加载失败图
    }
    let baseUrl = IMAGE_BASE_URL;
    let imagePath = path.trim();
    if (baseUrl.endsWith('/') && imagePath.startsWith('/')) {
        imagePath = imagePath.substring(1);
    } else if (!baseUrl.endsWith('/') && !imagePath.startsWith('/')) {
        if (imagePath) imagePath = '/' + imagePath;
    }
    return baseUrl + imagePath;
  },

  formatDateTime: function(dateTimeStr, isEndTime = false) {
    if (!dateTimeStr || typeof dateTimeStr !== 'string') return '时间待定';
    try {
      const date = new Date(dateTimeStr.replace(/-/g, '/')); // 兼容iOS日期格式
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      if (isEndTime) return `${hours}:${minutes}`; // 结束时间只显示 时:分
      return `${month}月${day}日 ${hours}:${minutes}`; // 开始时间显示 月日 时分
    } catch (e) {
      console.error("Error formatting date time:", dateTimeStr, e);
      // 尝试简单截取
      const parts = dateTimeStr.split(' ');
      if (parts.length > 1) {
          const datePart = parts[0].split('-');
          const timePart = parts[1].split(':');
          if (datePart.length >=3 && timePart.length >=2) {
              if(isEndTime) return `${timePart[0]}:${timePart[1]}`;
              return `${datePart[1]}-${datePart[2]} ${timePart[0]}:${timePart[1]}`;
          }
      }
      return dateTimeStr;
    }
  },

  // --- 报名表单 WXML 如果使用 model:value，则不需要这些 ---
  // handleNameInput: function(e) { this.setData({'formData.name': e.detail.value}); },
  // handlePhoneInput: function(e) { this.setData({'formData.phone': e.detail.value}); },
  // handleExperienceInput: function(e) { this.setData({'formData.experience': e.detail.value}); },

  handleFormDataInput: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
    console.log(`formData.${field} updated to:`, value, "Current formData:", this.data.formData); // 详细日志
  },
  
  submitSignup: function() {
    if (this.data.isSubmitting) return;

    const { name, phone, experience } = this.data.formData; // 从 this.data.formData 中取值
    console.log("Current formData for submission:", this.data.formData); // **检查这里的 formData 是否有值**

    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!phone || !phone.trim() || !/^1[3-9]\d{9}$/.test(phone.trim())) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (this.data.activity.status === 'full') {
        wx.showToast({ title: '该活动名额已满', icon: 'none' });
        return;
    }
    if (this.data.activity.status === 'ended') {
        wx.showToast({ title: '该活动已结束', icon: 'none' });
        return;
    }

    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    if (!currentUserId) {
        wx.showModal({
            title: '提示',
            content: '您尚未登录，请登录后再报名。',
            confirmText: '去登录',
            showCancel: false, // 只提供一个去登录的选项
            success: (res) => {
                if (res.confirm) {
                    wx.navigateTo({ url: '/pages/auth/login/login' });
                }
            }
        });
        return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '报名提交中...' });

    const queryParams = {
      id: this.data.activityId,
      userid: currentUserId
    };
    const requestBody = {
      name: name.trim(),
      phone: phone.trim(),
      experience: experience.trim()
    };

    console.log("Submitting signup to /find/join. Query:", queryParams, "Body:", requestBody);

    request({
      url: `/find/join?id=${queryParams.id}&userid=${queryParams.userid}`,
      method: 'POST',
      data: requestBody,
    })
    .then(apiResponseData => {
      this.setData({ isSubmitting: false }); // 重置提交状态
      wx.hideLoading(); // 关闭 loading

      console.log('API /find/join Response (data part):', apiResponseData);
      // 根据接口文档，成功时 data 为 null 或空对象，主要看 request.js 是否已处理 code=1
      // 假设 request.js 成功时会 resolve(res.data.data) 或 resolve(true) 等

      wx.showModal({
          title: '报名成功',
          content: '您已成功报名该活动！您可以在“我的活动”中查看活动状态和详情。',
          confirmText: '查看我的活动',
          cancelText: '返回列表',
          success: (modalRes) => {
              if (modalRes.confirm) {
                  wx.navigateTo({ url: '/pages/profile/myActivities/myActivities' });
              } else if (modalRes.cancel) {
                  const pages = getCurrentPages();
                  if (pages.length > 1) {
                      let activityListPage = pages.find(p => p.route === 'pages/volunteer/activityList/activityList');
                      if (activityListPage) {
                          wx.navigateBack({ delta: pages.length - 1 - pages.indexOf(activityListPage) });
                      } else {
                          wx.navigateBack({ delta: 1 });
                      }
                  } else {
                      wx.switchTab({ url: '/pages/volunteer/activityList/activityList' });
                  }
              }
          },
          complete: () => {
            // 报名成功后，刷新当前活动详情页的数据是个好主意，可以看到报名人数等变化
            this.fetchActivityDetails(this.data.activityId);
          }
      });
    })
    .catch(err => {
      this.setData({ isSubmitting: false }); // **确保catch中也重置**
      wx.hideLoading(); // **确保catch中也调用**
      console.error('API报名活动失败:', err);
      wx.showModal({
          title: '报名失败',
          content: err.msg || '遇到一些问题，请稍后再试或联系客服。',
          showCancel: false,
          confirmText: '知道了'
      });
    });
  },

  onPullDownRefresh: function() {
    if (this.data.activityId) {
        this.fetchActivityDetails(this.data.activityId);
    }
    // wx.stopPullDownRefresh() 应该在 fetchActivityDetails 的 finally 中调用
    // 为保险起见，如果 fetchActivityDetails 没有立即执行或快速失败，这里加一个
    setTimeout(() => {
        if (this.data.isLoading) { // 如果仍在加载，说明上面的finally还没执行
            wx.stopPullDownRefresh();
        }
    }, 1000); // 延迟确保
  }
});