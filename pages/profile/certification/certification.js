// pages/profile/certification/certification.js
import request from '../../../utils/request.js';
const app = getApp();

Page({
  data: {
    formData: {
      phone: '',
      identity: ''
    },
    isSubmitting: false,
    isLoadingStatus: true,
    isUserLoggedIn: false,
    canSubmitForm: false,

    userCertificationInfo: {
        statusNumber: 0,
        statusText: '',
        statusClass: 'status-unverified',
        remark: ''
    }
  },

  onLoad: function (options) {
    console.log("CertificationPage: onLoad");
    // 状态更新主要依赖 onShow，确保每次进入都获取最新状态
  },

  onShow: function() {
    console.log("CertificationPage: onShow");
    const isLoggedIn = app.globalData.isLoggedIn === true;
    const userInfo = app.globalData.userInfo;
    this.setData({ isUserLoggedIn: isLoggedIn });

    if (isLoggedIn && userInfo && userInfo.id) {
      // 如果已登录，并且有用户ID，则获取认证状态
      this.fetchUserCertificationStatus(userInfo.id);
      // 预填手机号 (如果之前有缓存或全局信息)
      if (!this.data.formData.phone && userInfo.phone_for_form_prefill) {
          this.setData({ 'formData.phone': userInfo.phone_for_form_prefill});
      }
    } else {
      // 未登录状态处理
      this.setData({
        isLoadingStatus: false,
        canSubmitForm: false,
        'userCertificationInfo.statusText': '请先登录以进行认证',
        'userCertificationInfo.statusClass': 'login-required',
        'userCertificationInfo.remark': '登录后即可提交您的认证信息。'
      });
    }
  },

  fetchUserCertificationStatus: function(userId) {
    this.setData({ isLoadingStatus: true });
    // wx.showLoading({ title: '查询状态...' }); // request.js 会处理

    request({
        url: '/user/isprove',
        method: 'GET',
        data: { id: userId.toString() } // API文档示例id是字符串
    })
    .then(apiStatusCode => {
        console.log('API /user/isprove Response (data.data should be 0 or 1):', apiStatusCode);
        if (apiStatusCode !== undefined && (parseInt(apiStatusCode, 10) === 0 || parseInt(apiStatusCode, 10) === 1)) {
            this.updateCertificationDisplay(parseInt(apiStatusCode, 10));
        } else {
            console.warn("/user/isprove 返回的data不是预期的0或1:", apiStatusCode);
            this.updateCertificationDisplay(0, '认证状态获取异常，请稍后重试');
        }
    })
    .catch(err => {
        console.error("获取用户认证状态失败:", err);
        this.updateCertificationDisplay(0, '获取认证状态失败，请检查网络');
    })
    .finally(() => {
        this.setData({ isLoadingStatus: false });
    });
  },

  updateCertificationDisplay: function(statusCode, customRemark = '') {
    let statusText = '';
    let statusClass = '';
    let canSubmit = false;
    let remarkToDisplay = customRemark;
    const parsedStatusCode = parseInt(statusCode, 10);

    if (parsedStatusCode === 1) { // 已认证
        statusText = '已认证';
        statusClass = 'status-approved';
        canSubmit = false;
        remarkToDisplay = remarkToDisplay || '您已通过负责人认证。';
    } else { // 0 或其他 (未认证或获取状态失败)
        statusText = '未认证';
        statusClass = 'status-unverified';
        canSubmit = true;
        if (!remarkToDisplay && parsedStatusCode === 0) { // 明确是未认证状态
            remarkToDisplay = '提交认证信息以获取负责人权限。';
        }
    }
    this.setData({
      'userCertificationInfo.statusNumber': parsedStatusCode,
      'userCertificationInfo.statusText': statusText,
      'userCertificationInfo.statusClass': statusClass,
      'userCertificationInfo.remark': remarkToDisplay,
      canSubmitForm: canSubmit,
    });
  },

  handleFormDataInput: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // ***** 新增/确保这个方法存在 *****
  goToLogin: function() {
    console.log("CertificationPage: goToLogin method called, navigating to login page.");
    wx.navigateTo({
      url: '/pages/auth/login/login', // 确保登录页面路径正确
      fail: (err) => {
        console.error("Failed to navigate to login page from certification:", err);
        wx.showToast({ title: '无法打开登录页', icon: 'none' });
      }
    });
  },
  // ***** goToLogin 方法结束 *****

  submitCertification: function() {
    if (this.data.isSubmitting || !this.data.canSubmitForm) {
        if(!this.data.canSubmitForm) {
             wx.showToast({title: `当前状态：${this.data.userCertificationInfo.statusText}`, icon: 'none'});
        }
        return;
    }

    const { phone, identity } = this.data.formData;
    const trimmedPhone = phone.trim();
    const trimmedIdentity = identity.trim().toUpperCase();

    if (!trimmedPhone || !/^1[3-9]\d{9}$/.test(trimmedPhone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return;
    }
    if (!trimmedIdentity || !/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(trimmedIdentity)) {
      wx.showToast({ title: '请输入正确的身份证号', icon: 'none' }); return;
    }

    // 从 onShow 更新的 isUserLoggedIn 和 全局的 userInfo.id 判断
    if (!this.data.isUserLoggedIn || !app.globalData.userInfo || !app.globalData.userInfo.id) {
        console.log("submitCertification: User not logged in, calling goToLogin.");
        this.goToLogin(); // 如果提交时发现未登录，也调用 goToLogin
        return;
    }
    const currentUserId = app.globalData.userInfo.id;

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '提交认证中...' });

    request({
      url: '/user/prove',
      method: 'GET',
      data: {
        id: currentUserId.toString(),
        phone: trimmedPhone,
        identity: trimmedIdentity
      }
    })
    .then(response => {
      console.log('API /user/prove Response (data part):', response);
      wx.showModal({
          title: '提交成功',
          content: '您的认证信息已提交，平台将尽快审核。',
          showCancel: false,
          confirmText: '好的',
          success: () => {
              this.fetchUserCertificationStatus(currentUserId); // 提交成功后刷新状态
          }
      });
    })
    .catch(err => {
      console.error('认证信息提交失败:', err);
      wx.showModal({
          title: '提交失败',
          content: err.msg || '遇到一些问题，请稍后再试。',
          showCancel: false,
          confirmText: '知道了'
      });
    })
    .finally(() => {
      this.setData({ isSubmitting: false });
      // wx.hideLoading() 由 request.js 处理
    });
  }
});