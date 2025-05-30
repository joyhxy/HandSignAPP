// pages/volunteer/publishActivity/publishActivity.js
import request from '../../../utils/request.js';
const app = getApp();

// !!! 你需要将这个替换为后端图片/媒体资源的真实基础URL (如果图片不是直接上传到 /find/new 接口) !!!
// 如果 /find/new 接口本身处理图片上传并返回完整URL，则此变量可能仅用于本地占位符的显示前缀（如果需要）
const IMAGE_BASE_URL = 'https://222.186.168.45:8080';

Page({
  data: {
    // 表单的实际数据，用于提交给API
    formData: {
      name: '',
      type: '',       // 活动类型名称 (例如: "社区服务")
      starttime: '',  // 最终提交给API的 "YYYY-MM-DD HH:MM:SS"
      endtime: '',    // 最终提交给API的 "YYYY-MM-DD HH:MM:SS"
      location: '',
      longitude: null,
      latitude: null,
      max: null,        // 最大人数 (API期望integer)
      description: '',
      // 图片字段 (img, signimg, qrimg) 的值将根据后端要求处理
      // 可能是上传后得到的URL，或者是需要随表单一起提交的文件标识
    },
    // 用于WXML中 picker 和 input 的绑定及显示
    formDisplay: {
        activityTypeIndex: 0, // 对应 activityTypes 数组的索引, 0是“请选择”
        startDate: '',      // "YYYY-MM-DD"
        startTime: '',      // "HH:MM"
        endDate: '',        // "YYYY-MM-DD"
        endTime: '',        // "HH:MM"
        startDateFormatted: '选择开始日期', // "YYYY年MM月DD日" 或提示
        endDateFormatted: '选择结束日期',
        startTimeFormatted: '选择开始时间', // 直接用 HH:MM 或提示
        endTimeFormatted: '选择结束时间'
    },
    activityTypes: [
      { id: 'placeholder', name: '请选择活动类型' }, // 占位选项
      { id: 'type_community', name: '社区服务' },
      { id: 'type_translation', name: '手语翻译' },
      { id: 'type_culture', name: '文化宣传' },
      { id: 'type_online', name: '线上活动' },
      { id: 'type_other', name: '其他类型' }
    ],
    minDate: '', // 日期选择器的最小可选日期

    tempImagePaths: { // 存储用户选择的本地临时图片路径
      mainImg: '',    // 活动主图
      signInQr: '',   // 签到二维码
      feedbackQr: ''  // 反馈问卷二维码
    },
    isSubmitting: false,
    isUserLeader: true, // **重要：这个值应从 checkUserAuthorization 更新**
                        // 为了能进入页面测试，暂时设为true，你需要实现真实的权限检查
  },

  onLoad: function (options) {
    console.log("PublishActivity Page: onLoad");
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    this.setData({ minDate: `${year}-${month}-${day}` });

    this.checkUserAuthorization();
  },

  onShow: function() {
    // 可以在这里再次检查用户权限，以防在其他地方权限状态改变
    // this.checkUserAuthorization();
  },

  checkUserAuthorization: function() {
    const userInfo = app.globalData.userInfo;
    const isLoggedIn = app.globalData.isLoggedIn;

    if (!isLoggedIn || !userInfo || !userInfo.id) {
      wx.showModal({
        title: '请先登录', content: '登录后才能发布活动。', confirmText: '去登录', showCancel: false,
        success: (res) => { if (res.confirm) { wx.navigateTo({ url: '/pages/auth/login/login' }); } }
      });
      // 如果未登录，应该阻止后续操作，可以考虑直接返回或禁用整个表单
      // this.setData({ isUserLeader: false }); // 明确设置无权限
      return;
    }

    // **你需要实现真实的负责人状态检查逻辑**
    // 1. 优先从 app.globalData.userInfo 中获取 (如果登录或/user/info已返回该状态)
    //    const isLeaderFromGlobal = (userInfo.is_leader === true || userInfo.leader_certification_status === 2);
    // 2. 或者，调用 /user/isprove 接口获取
    // request({ url: '/user/isprove', data: { id: userInfo.id.toString() } }).then(status => { ... });

    // 为测试方便，暂时假设用户是负责人，你应该替换为真实逻辑
    const isLeader = true; // **<<< 替换为真实的负责人状态判断**
    console.log("PublishActivity: User Leader Status (mocked/to-be-implemented):", isLeader);
    if (!isLeader) {
        // wx.showModal({...引导去认证或返回...});
        // this.setData({ isUserLeader: false });
    } else {
        this.setData({ isUserLeader: true });
    }
  },

  // --- 表单输入处理 ---
  handleInputChange: function(e) {
    const field = e.currentTarget.dataset.field; // 'name', 'location', 'max', 'description'
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  onActivityTypeChange: function(e) {
    const index = parseInt(e.detail.value, 10);
    if (this.data.activityTypes[index] && index !== 0) { // 不处理"请选择"这个占位选项
        this.setData({
          'formDisplay.activityTypeIndex': index,
          'formData.type': this.data.activityTypes[index].name
        });
    } else if (index === 0) {
         this.setData({
          'formDisplay.activityTypeIndex': 0,
          'formData.type': ''
        });
    }
  },

  onDateChange: function(e) {
    const field = e.currentTarget.dataset.field; // 'startDate' or 'endDate'
    const value = e.detail.value; // "YYYY-MM-DD"
    this.setData({
      [`formDisplay.${field}`]: value, // **直接更新 formDisplay 中的日期**
    });
    this.combineDateTime(); // 每次日期或时间变化都重新组合
  },


  onTimeChange: function(e) {
    const field = e.currentTarget.dataset.field; // 'startTime' or 'endTime'
    const value = e.detail.value; // "HH:MM"
    this.setData({
      [`formDisplay.${field}`]: value, // **直接更新 formDisplay 中的时间**
    });
    this.combineDateTime();
  },

  combineDateTime: function() {
    // 从 formDisplay 中获取用户选择的日期和时间
    const { startDate, startTime, endDate, endTime } = this.data.formDisplay;
    let finalStartDateTime = '';
    let finalEndDateTime = '';

    if (startDate && startTime) {
      finalStartDateTime = `${startDate} ${startTime}:00`;
    }
    if (endDate && endTime) {
      finalEndDateTime = `${endDate} ${endTime}:00`;
    }
    // 将组合好的完整时间戳更新到 formData 中，用于API提交
    this.setData({
        'formData.starttime': finalStartDateTime,
        'formData.endtime': finalEndDateTime
    });
    console.log("Updated formData.starttime:", this.data.formData.starttime);
    console.log("Updated formData.endtime:", this.data.formData.endtime);
  },

  chooseLocationFromMap: function() {
    wx.chooseLocation({
      success: (res) => {
        console.log("Selected location:", res);
        this.setData({
          'formData.location': res.name || res.address,
          'formData.longitude': res.longitude,
          'formData.latitude': res.latitude
        });
      },
      fail: (err) => { if(err.errMsg !== "chooseLocation:fail cancel") wx.showToast({title:'选择位置失败', icon:'none'}); }
    });
  },

  // --- 图片上传处理 ---
  chooseImage: function(e) {
    const imageType = e.currentTarget.dataset.type;
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
            this.setData({ [`tempImagePaths.${imageType}`]: res.tempFiles[0].tempFilePath });
        }
      },
      fail: (err) => { if (err.errMsg !== "chooseMedia:fail cancel") wx.showToast({title: '选择图片失败', icon:'none'}); }
    });
  },

  deleteImage: function(e) {
    const imageType = e.currentTarget.dataset.type;
    this.setData({ [`tempImagePaths.${imageType}`]: '' });
  },

  // --- 表单提交 ---
  onFormSubmit: async function(e) {
    if (this.data.isSubmitting) return;

    // **0. 权限检查 (如果 checkUserAuthorization 中没有直接返回或禁用页面)**
    if (!this.data.isUserLeader) {
        wx.showModal({ title: '权限不足', content: '您不是认证负责人，无法发布。请前往认证。', confirmText:"去认证", success:(res)=>{if(res.confirm) wx.navigateTo({url:'/pages/profile/certification/certification'})}});
        return;
    }

    // 1. 表单校验
    const { name, type, starttime, endtime, location, max, description } = this.data.formData;
    if (!name || !name.trim()) { wx.showToast({title:'请输入活动名称', icon:'none'}); return; }
    if (!type) { wx.showToast({title:'请选择活动类型', icon:'none'}); return; }
    if (!starttime) { wx.showToast({title:'请选择开始日期和时间', icon:'none'}); return; }
    if (!endtime) { wx.showToast({title:'请选择结束日期和时间', icon:'none'}); return; }
    if (new Date(starttime.replace(/-/g, '/')) >= new Date(endtime.replace(/-/g, '/'))) {
        wx.showToast({title:'结束时间必须晚于开始时间', icon:'none'}); return;
    }
    if (!location || !location.trim()) { wx.showToast({title:'请输入或选择活动地点', icon:'none'}); return; }
    if (!max || parseInt(max, 10) <= 0) { wx.showToast({title:'请输入有效的最大参与人数', icon:'none'}); return; }
    if (!description || description.trim().length < 20) { wx.showToast({title:'活动描述至少需要20个字', icon:'none'}); return; }
    if (!this.data.tempImagePaths.mainImg) { wx.showToast({title:'请上传活动主图', icon:'none'}); return; }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '正在发布...' });

    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    if (!currentUserId) { // 理论上 checkUserAuthorization 已处理
      wx.hideLoading(); this.setData({isSubmitting: false});
      wx.showToast({title:'用户状态异常，请重新登录', icon:'none'});
      return;
    }

    // **核心：构造 wx.uploadFile 的参数**
    let formFieldsForUpload = {
        // **以下字段名和值需要严格对照 API 文档 /find/new 的 Request Body**
        name: name,
        type: type,
        starttime: starttime,
        endtime: endtime,
        location: location,
        x: (this.data.formData.longitude || 0).toString(),
        y: (this.data.formData.latitude || 0).toString(),
        max: (parseInt(max, 10) || 0).toString(),
        description: description,
        join: "0", // 新活动，已参与人数为0
        // **id**: 创建新活动时，不应由前端传递。请与后端确认。如果必须传，值是什么？
        // id: "0", // 或其他后端能识别为“创建”的值
        // **01JW3PY20S8XPHA9T5NBBYAE11**: 这个字段必须与后端确认其真实名称和值！
        // "some_backend_field_name": "some_value_for_that_field"
    };

    // 准备上传主图
    const mainImageFilePath = this.data.tempImagePaths.mainImg;
    // **与后端确认：活动主图在 multipart/form-data 中的文件字段名是什么？**
    const mainImageFieldName = 'img'; // 根据 API requestBody.properties.img，假设是 'img'

    // (可选) 处理其他图片，如果后端 /find/new 接口支持一次接收多个文件字段
    // if (this.data.tempImagePaths.signInQr) {
    //   // 你需要一个方式将 signInQr 文件也加入到 uploadFile 的文件列表或 formData
    //   // wx.uploadFile 一次只能指定一个 filePath 和 name，所以传多个独立文件需要后端支持
    //   // 或者，你需要先将所有图片上传到某个地方获取URL，再将URL传给 /find/new
    //   formFieldsForUpload.signimg_temp_path = this.data.tempImagePaths.signInQr; // 只是示例
    // }
    // if (this.data.tempImagePaths.feedbackQr) {
    //   formFieldsForUpload.qrimg_temp_path = this.data.tempImagePaths.feedbackQr;
    // }

    console.log("Submitting activity. UserID (Query Param):", currentUserId.toString());
    console.log("Form Fields for Upload (formData in wx.uploadFile):", formFieldsForUpload);
    console.log("Main Image Path:", mainImageFilePath, "as field:", mainImageFieldName);

    wx.uploadFile({
        url: `${IMAGE_BASE_URL}/find/new?userid=${currentUserId.toString()}`, // Query参数userid
        filePath: mainImageFilePath,
        name: mainImageFieldName, // **后端接收主图文件的字段名**
        formData: formFieldsForUpload, // 其他文本参数
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('userToken')}`,
        },
        success: (uploadRes) => {
            console.log("发布活动 API 原始响应:", uploadRes);
            if (uploadRes.statusCode === 200) {
                try {
                    const resData = JSON.parse(uploadRes.data);
                    console.log("发布活动 API 解析后响应:", resData);
                    if (resData.code === 1) { // 假设后端遵循 code:1 为成功
                        wx.showToast({ title: '活动发布成功！', icon: 'success', duration: 2000 });
                        this.resetForm();
                        setTimeout(()=> {
                             wx.navigateBack({delta: 1}); // 返回上一页
                        }, 2000);
                    } else {
                        wx.showModal({title:'发布失败', content: resData.msg || '请检查填写信息或稍后再试。', showCancel:false});
                    }
                } catch (e) {
                    console.error("解析发布活动响应失败:", e, "原始数据:", uploadRes.data);
                    wx.showModal({title:'发布失败', content: '服务器响应异常，请稍后重试。', showCancel:false});
                }
            } else {
                wx.showModal({title:'发布失败', content: `服务器错误，状态码：${uploadRes.statusCode}`, showCancel:false});
            }
        },
        fail: (err) => {
            console.error("发布活动 API 请求失败:", err);
            wx.showModal({title:'发布失败', content: '网络请求失败，请检查网络后重试。', showCancel:false});
        },
        complete: () => {
            wx.hideLoading();
            this.setData({ isSubmitting: false });
        }
    });
  },

  resetForm: function() { // 辅助函数：重置表单和图片
    this.setData({
        formData: { name: '', type: '', startDate: '', startTime: '', endDate: '', endTime: '', starttime: '', endtime: '', location: '', longitude: null, latitude: null, max: null, description: '' },
        formDisplay: { activityTypeIndex: 0, startDateFormatted: '选择开始日期', startTimeFormatted: '选择开始时间', endDateFormatted: '选择结束日期', endTimeFormatted: '选择结束时间' },
        tempImagePaths: { mainImg: '', signInQr: '', feedbackQr: '' }
    });
  }
});