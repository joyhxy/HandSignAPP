// pages/volunteer/publishActivity/publishActivity.js
import request from '../../../utils/request.js';
const app = getApp();

// !!! 确保这个 IMAGE_BASE_URL 正确，用于拼接从上传接口返回的相对路径 (如果需要) !!!
const IMAGE_BASE_URL = 'https://222.186.168.45:8080';

Page({
  data: {
    formData: {
      name: '',
      type: '', // 活动类型名称
      // 为了简化日期时间选择，我们直接用字符串输入，或者你可以使用更复杂的日期时间picker组件
      // 这里我们先假设用户会输入 YYYY-MM-DD HH:MM 格式，或通过更复杂的picker得到这种格式
      starttime: '', // 例如 "2025-06-10 14:00" (后端需要能解析这个，或约定固定格式)
      endtime: '',   // 例如 "2025-06-10 16:00"
      location: '',
      longitude: null,
      latitude: null,
      max: null, // 最大人数
      description: '',
      // 图片字段将存储上传后得到的URL或ID
      img: '',       // 活动主图
      signimg: '',   // 签到二维码
      qrimg: ''      // 反馈二维码
    },
    activityTypes: [ // 示例活动类型
      { id: 'type1', name: '社区服务' }, { id: 'type2', name: '手语翻译' },
      { id: 'type3', name: '文化宣传' }, { id: 'type4', name: '线上活动' },
      { id: 'type5', name: '其他' }
    ],
    activityTypeIndex: null,

    tempImagePaths: { // 存储用户选择的本地临时图片路径
      mainImg: '',      // 对应 formData.img
      signInQr: '',     // 对应 formData.signimg
      feedbackQr: ''    // 对应 formData.qrimg
    },
    isSubmitting: false,
  },

  onLoad: function (options) {
    // 检查用户是否是认证负责人，如果不是，不允许进入或提示
    // this.checkUserRole(); // 这个逻辑需要你根据实际情况实现
    if (!app.globalData.isLoggedIn || !app.globalData.userInfo || !app.globalData.userInfo.id /* 或 !app.globalData.userInfo.isLeader */) {
        wx.showModal({
            title: '权限不足',
            content: '您需要登录并认证为负责人才能发布活动。',
            confirmText: '去登录/认证',
            showCancel: true,
            cancelText: '返回',
            success: (res) => {
                if (res.confirm) {
                    // 可以先引导去登录，登录后再判断是否需要去认证页
                    wx.navigateTo({ url: '/pages/auth/login/login' });
                } else {
                    wx.navigateBack();
                }
            }
        });
    }
  },

  handleInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  onActivityTypeChange: function(e) {
    const index = parseInt(e.detail.value, 10);
    this.setData({
      activityTypeIndex: index,
      'formData.type': this.data.activityTypes[index] ? this.data.activityTypes[index].name : ''
    });
  },

  // --- 简化的时间输入，实际项目中建议使用日期时间选择器 ---
  // 假设 formData.starttime 和 formData.endtime 是通过 input 输入的 YYYY-MM-DD HH:MM 字符串
  // 或者，如果你用了我之前提供的 date 和 time 分开的 picker，确保它们能正确更新 formData.starttime 和 formData.endtime

// publishActivity.js - chooseLocationFromMap
chooseLocationFromMap: function() {
  wx.getSetting({
      success: (res) => {
          if (!res.authSetting['scope.userLocation']) {
              wx.authorize({
                  scope: 'scope.userLocation',
                  success: () => { this.actuallyChooseLocation(); }, // 已授权或用户同意
                  fail: () => { wx.showToast({ title: '您拒绝了位置授权', icon: 'none' }); }
              });
          } else {
              this.actuallyChooseLocation(); // 已授权
          }
      },
      fail: () => {
          wx.showToast({ title: '获取授权设置失败', icon: 'none'});
      }
  });
},

actuallyChooseLocation: function() { // 实际调用 wx.chooseLocation
  wx.chooseLocation({
    success: (res) => {
      console.log("wx.chooseLocation success:", res);
      // **核心修改：只要有经纬度，就认为选择成功了**
      if (res.longitude !== undefined && res.latitude !== undefined) {
          let locationName = res.name || res.address; // 优先用 name，其次用 address
          if (!locationName) { // 如果 name 和 address 都为空
              locationName = `自定义位置 (纬:${res.latitude.toFixed(4)},经:${res.longitude.toFixed(4)})`; // 给一个默认名称
              wx.showToast({ title: '未获取到地点名称，已使用坐标', icon: 'none', duration: 2000 });
          }
          this.setData({
            'formData.location': locationName,
            'formData.longitude': res.longitude,
            'formData.latitude': res.latitude
          });
          console.log("Location data set to formData:", this.data.formData);
      } else {
          // 这种情况很少见，chooseLocation成功但没有经纬度
          wx.showToast({ title: '选择位置失败，未返回有效坐标', icon: 'none' });
      }
    },
    fail: (err) => {
      if (err.errMsg === "chooseLocation:fail cancel") {
        console.log("用户取消选择位置");
      } else if (err.errMsg && err.errMsg.includes("auth deny")) {
        console.log("用户拒绝授权地理位置");
        wx.showModal({
          title: '授权提示',
          content: '您已拒绝位置授权，无法选择地点。请在小程序设置中开启位置权限后重试。',
          confirmText: '去设置',
          showCancel: true,
          cancelText: '知道了',
          success: (modalRes) => {
              if (modalRes.confirm) {
                  wx.openSetting(); // 打开设置页让用户自己开启
              }
          }
        });
      }
       else {
        wx.showToast({title:'选择位置失败，请重试', icon:'none'});
        console.error("wx.chooseLocation fail:", err);
      }
    }
  });
},
  chooseImage: function(e) {
    const imageTypeKey = e.currentTarget.dataset.type; // 'mainImg', 'signInQr', 'feedbackQr'
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          this.setData({
            [`tempImagePaths.${imageTypeKey}`]: res.tempFiles[0].tempFilePath
          });
        }
      }
    });
  },

  deleteImage: function(e) {
    const imageTypeKey = e.currentTarget.dataset.type;
    this.setData({ [`tempImagePaths.${imageTypeKey}`]: '' });
  },

    // --- 图片上传辅助函数，调用 POST /find.upload ---
    _uploadActivityFile: function(filePath, assetTypeForLog) {
      return new Promise((resolve, reject) => {
        if (!filePath) { resolve(null); return; }
        const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
        // ... (userId 检查) ...
  
        const uploadUrl = `${IMAGE_BASE_URL}/find/upload`; // 上传接口本身还是需要基础URL
        // ... (构造 queryParamsString，如果 /find.upload 需要)
        let queryParamsString = ""; // 假设 /find.upload 不需要 Query 参数 (除了可能通过formData)
        // 如果需要，例如：
        // if (currentUserId) queryParamsString = `?uploaderId=${currentUserId.toString()}`;
        // if (assetTypeForLog) queryParamsString += `${queryParamsString ? '&' : '?'}usageType=${assetTypeForLog}`;
  
  
        console.log(`Uploading [${assetTypeForLog}]: ${filePath} to ${uploadUrl}${queryParamsString}`);
        wx.uploadFile({
          url: uploadUrl + queryParamsString,
          filePath: filePath,
          name: 'file',
          // header: { /* ... */ },
          formData: { /* ... 如果上传接口需要在formData中传递额外参数 ... */ },
          success: (res) => {
            console.log(`[${assetTypeForLog}] wx.uploadFile success, raw server response:`, res);
            if (res.statusCode === 200) {
              try {
                const responseData = JSON.parse(res.data);
                console.log(`[${assetTypeForLog}] Parsed server response:`, responseData);
  
                // **根据日志，responseData.data 直接就是图片URL字符串**
                if (responseData.code === 1 && responseData.data && typeof responseData.data === 'string' && responseData.data.startsWith('https://')) {
                  const imageUrlFromServer = responseData.data; // 直接获取 URL
                  console.log(`[${assetTypeForLog}] Upload successful, server URL:`, imageUrlFromServer);
                  resolve(imageUrlFromServer); // **直接 resolve 这个完整的 URL**
                } else {
                  reject({ msg: `[${assetTypeForLog}] 文件服务器保存失败: ${responseData.msg || '未返回有效URL'}`, code: responseData.code });
                }
              } catch (e) {
                reject({ msg: `[${assetTypeForLog}] 文件响应解析错误`, rawData: res.data });
              }
            } else {
              reject({ msg: `[${assetTypeForLog}] 文件上传HTTP ${res.statusCode}`, statusCode: res.statusCode, rawData: res.data });
            }
          },
          fail: (err) => { /* ... */ }
        });
      });
    },

    onFormSubmit: async function() { // 移除参数 e，因为我们直接从 this.data.formData 获取
      if (this.data.isSubmitting) {
        console.log("Form is already submitting.");
        return;
      }
  
      // 1. 表单校验
      const fd = this.data.formData;
      let validationErrorMsg = "";
      if (!fd.name || !fd.name.trim()) validationErrorMsg = "请输入活动名称";
      else if (!fd.type) validationErrorMsg = "请选择活动类型";
      else if (!fd.starttime || !fd.endtime) validationErrorMsg = "请选择完整的活动起止时间";
      else if (new Date(fd.starttime.replace(/-/g, '/')) >= new Date(fd.endtime.replace(/-/g, '/'))) validationErrorMsg = "结束时间必须晚于开始时间";
      else if (!fd.location || !fd.location.trim()) validationErrorMsg = "请选择或输入活动地点"; // location现在可能只是坐标描述
    else if (fd.longitude === null || fd.latitude === null) validationErrorMsg = "请从地图选择有效位置以获取坐标"; // **确保经纬度也有值**
      else if (!fd.max || parseInt(fd.max, 10) <= 0) validationErrorMsg = "请输入有效的最大参与人数";
      else if (!fd.description || fd.description.trim().length < 10) validationErrorMsg = "活动描述至少10个字";
      else if (!this.data.tempImagePaths.mainImg) validationErrorMsg = "请上传活动主图";
  
      if (validationErrorMsg) {
        wx.showToast({ title: validationErrorMsg, icon: 'none' });
        return;
      }
  
      this.setData({ isSubmitting: true });
      wx.showLoading({ title: '正在处理...' }); // **统一的 Loading 开始**
  
      const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
      if (!currentUserId || !app.globalData.isLoggedIn) {
        wx.showModal({
          title: '提示', content: '请先登录才能发布活动', confirmText: '去登录', showCancel: false,
          success: (res) => { if (res.confirm) wx.navigateTo({ url: '/pages/auth/login/login' }); }
        });
        this.setData({ isSubmitting: false }); // 在 return 前重置状态
        wx.hideLoading();                   // 在 return 前关闭 loading
        return;
      }
  
      let serverMainImgPath = '';
      let serverSignInQrPath = '';
      let serverFeedbackQrPath = '';
  
      try {
        // 2. 上传图片
        console.log("Attempting to upload main image...");
        serverMainImgPath = await this._uploadActivityFile(this.data.tempImagePaths.mainImg, 'activity_cover');
        if (!serverMainImgPath) { // 如果 _uploadActivityFile 在未选择文件时 resolve(null)，但主图是必需的
          // 如果 this.data.tempImagePaths.mainImg 在前面已校验过必填，这里 serverMainImgPath 不应该是 null
          // 除非 _uploadActivityFile 在其他情况下也可能 resolve(null)
          throw { msg: "活动主图未能成功获取服务器路径，请重试" };
        }
        console.log("Main image uploaded, server path:", serverMainImgPath);
  
        if (this.data.tempImagePaths.signInQr) {
          console.log("Attempting to upload sign-in QR image...");
          serverSignInQrPath = await this._uploadActivityFile(this.data.tempImagePaths.signInQr, 'activity_signin_qr');
          console.log("Sign-in QR uploaded, server path:", serverSignInQrPath);
        }
        if (this.data.tempImagePaths.feedbackQr) {
          console.log("Attempting to upload feedback QR image...");
          serverFeedbackQrPath = await this._uploadActivityFile(this.data.tempImagePaths.feedbackQr, 'activity_feedback_qr');
          console.log("Feedback QR uploaded, server path:", serverFeedbackQrPath);
        }
  
        // 3. 构造 /find/new 的 JSON Request Body
        // **与后端确认所有字段的必需性、类型和确切名称**
        const requestBodyPayload = {
          // id: ???, // **创建时不应由前端传，与后端确认**
          name: fd.name.trim(),
          type: fd.type,
          starttime: fd.starttime, // 确保是 "YYYY-MM-DD HH:MM:SS"
          endtime: fd.endtime,
          location: fd.location.trim(),
          x: parseInt(parseFloat(fd.longitude) || 0), // API 文档是 integer
          y: parseInt(parseFloat(fd.latitude) || 0),   // API 文档是 integer
          max: parseInt(fd.max, 10),
          join: 0, // API 文档要求传，新活动为0
          description: fd.description.trim(),
          img: serverMainImgPath,          // 字符串路径
          signimg: serverSignInQrPath || "", // 字符串路径，如果可选且未上传则为空
          qrimg: serverFeedbackQrPath || "",   // 字符串路径，如果可选且未上传则为空
          creatuser: parseInt(currentUserId, 10) // API 文档是 integer
          // "01JW3PY20S8XPHA9T5NBBYAE11": "YOUR_VALUE_FOR_THIS_REQUIRED_FIELD" // **与后端确认这个必需字段**
        };
  
        // 如果API不允许可选图片字段传空字符串，而是需要完全移除该字段
        if (requestBodyPayload.signimg === "") delete requestBodyPayload.signimg;
        if (requestBodyPayload.qrimg === "") delete requestBodyPayload.qrimg;
  
        console.log("Submitting activity data to POST /find/new. Request Body:", JSON.stringify(requestBodyPayload));
  
        // 4. 调用 /find/new 接口
        const response = await request({
          url: `/find/new`, // Query 参数 userid 已移到 body 的 creatuser
          method: 'POST',
          data: requestBodyPayload,
        });
  
        console.log('API /find/new success. Response data part:', response); // 期望为 null 或 {}
        // wx.hideLoading(); // 由 finally 处理
        // this.setData({ isSubmitting: false }); // 由 finally 处理
        wx.showModal({
            title: '发布成功',
            content: '活动已成功发布！您可以在活动列表或“我的活动”中查看。',
            showCancel: false,
            confirmText: '好的',
            success: () => {
                this.setData({ // 清空表单的逻辑
                    formData: { name: '', type: '', startDate: '', startTime: '', endDate: '', endTime: '', starttime:'', endtime:'', location: '', longitude: null, latitude: null, max: null, description: '', img: '', signimg: '', qrimg: '' },
                    activityTypeIndex: null,
                    tempImagePaths: { mainImg: '', signInQr: '', feedbackQr: '' }
                });
                // 跳转到活动列表并尝试让列表刷新 (或直接返回上一页)
                wx.navigateBack({ delta: 1 });
            }
        });
  
      } catch (error) { // 捕获 _uploadActivityFile 的 reject 或 request /find/new 的 reject
        // wx.hideLoading(); // 由 finally 处理
        // this.setData({ isSubmitting: false }); // 由 finally 处理
        console.error("发布活动过程中发生错误:", error);
        const errorMsgToShow = (error && error.msg) ? error.msg : '活动发布操作失败，请重试';
        if (errorMsgToShow && typeof errorMsgToShow === 'string' && !errorMsgToShow.includes("cancel")) { // 避免显示用户取消操作的提示
            wx.showModal({ title: '发布操作失败', content: errorMsgToShow, showCancel: false, confirmText: '知道了' });
        } else if (errorMsgToShow) {
            console.log("User cancelled or non-critical error during publish:", errorMsgToShow);
        }
      } finally {
          this.setData({ isSubmitting: false });
          wx.hideLoading(); // **确保在所有路径结束时都关闭 loading**
      }
    }, // onFormSubmit 方法结束,
   // --- ***** 新增/确保这些方法存在 ***** ---
   onDateChange: function(e) {
    const field = e.currentTarget.dataset.field; // "startDate" or "endDate"
    const value = e.detail.value; // "YYYY-MM-DD"
    console.log(`${field} changed to:`, value);
    this.setData({
      [`formData.${field}`]: value,
      // 你可以在WXML中直接显示 formData.startDate，或者在这里格式化一个用于显示的字段
      // [`formDataForDisplay.${field}Formatted`]: value.replace(/-/g, '年', 1).replace('-', '月') + '日'
    });
    this.combineDateTime(); // 选择日期后，重新组合完整的开始/结束时间
  },

  onTimeChange: function(e) {
    const field = e.currentTarget.dataset.field; // "startTime" or "endTime"
    const value = e.detail.value; // "HH:MM"
    console.log(`${field} changed to:`, value);
    this.setData({
      [`formData.${field}`]: value
      // [`formDataForDisplay.${field}`]: value // WXML可以直接显示 formData.startTime
    });
    this.combineDateTime(); // 选择时间后，重新组合完整的开始/结束时间
  },

  combineDateTime: function() {
    const { startDate, startTime, endDate, endTime } = this.data.formData;
    let finalStarttime = '';
    let finalEndtime = '';

    if (startDate && startTime) {
      finalStarttime = `${startDate} ${startTime}:00`; // 组合成 YYYY-MM-DD HH:MM:SS
    }
    if (endDate && endTime) {
      finalEndtime = `${endDate} ${endTime}:00`; // 组合成 YYYY-MM-DD HH:MM:SS
    }
    this.setData({
      'formData.starttime': finalStarttime, // 这个是最终要传给API的字段
      'formData.endtime': finalEndtime     // 这个是最终要传给API的字段
    });
    console.log("Combined starttime:", finalStarttime, "Combined endtime:", finalEndtime);
  }
  // --- ***** 方法新增结束 ***** ---
});