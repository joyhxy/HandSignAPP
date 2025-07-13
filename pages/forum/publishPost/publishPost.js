// pages/forum/publishPost/publishPost.js
import request from '../../../utils/request.js';
const app = getApp();
const IMAGE_BASE_URL = 'https://222.186.168.45:8080'; // 如果上传接口返回相对路径，需要用它拼接

Page({
  data: {
    formData: {
      name: '', // 对应API的 name (标题)
      description: '', // 对应API的 description (内容)
    },
    tempImagePaths: [], // 用户选择的本地临时图片路径数组 (最多3张)
    isSubmitting: false,
  },

  onLoad: function (options) {
    // 检查登录状态
    if (!app.globalData.isLoggedIn || !app.globalData.userInfo || !app.globalData.userInfo.id) {
      wx.showModal({
        title: '请先登录', content: '登录后才能发布帖子。',
        confirmText: '去登录', showCancel: false,
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/auth/login/login' });
          } else { wx.navigateBack(); }
        }
      });
    }
  },

  handleInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`formData.${field}`]: e.detail.value });
  },

  chooseImage: function(e) {
    const currentImageCount = this.data.tempImagePaths.length;
    const maxImageCount = 3;
    if (currentImageCount >= maxImageCount) {
      wx.showToast({ title: `最多只能上传${maxImageCount}张图片`, icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: maxImageCount - currentImageCount,
      mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          this.setData({
            tempImagePaths: this.data.tempImagePaths.concat(res.tempFiles.map(file => file.tempFilePath))
          });
        }
      },
      fail: (err) => { if (err.errMsg && err.errMsg.indexOf('cancel') === -1) wx.showToast({ title: '选择图片失败', icon: 'none' }); }
    });
  },

  deleteImage: function(e) {
    const indexToDelete = e.currentTarget.dataset.index;
    const currentPaths = [...this.data.tempImagePaths];
    currentPaths.splice(indexToDelete, 1);
    this.setData({ tempImagePaths: currentPaths });
  },

  // --- 辅助函数：上传单个图片到 /find/upload ---
  _uploadSingleImage: function(filePath, imageIndex) {
    return new Promise((resolve, reject) => {
      if (!filePath) { resolve(null); return; }
      const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
      if (!currentUserId) { reject({ msg: "用户未登录，无法上传" }); return; }

      const uploadUrl = `${IMAGE_BASE_URL}/find/upload`;

      console.log(`[Uploading Post Image #${imageIndex + 1}]: ${filePath} to ${uploadUrl}`);
      wx.uploadFile({
        url: uploadUrl,
        filePath: filePath,
        name: 'file', // timing 确认的文件字段名
        // formData: { 'uploader_id': currentUserId.toString() }, // 如果需要
        success: (res) => {
          console.log(`[Post Image #${imageIndex + 1}] Upload Response:`, res);
          if (res.statusCode === 200) {
            try {
              const resData = JSON.parse(res.data);
              console.log(`[Post Image #${imageIndex + 1}] Parsed server response:`, resData);

              // --- ***** 核心修改在这里 ***** ---
              // **检查业务码是否成功，并且 data 字段是一个非空字符串**
              if (resData.code === 1 && typeof resData.data === 'string' && resData.data.trim() !== '') {
                const serverUrl = resData.data; // data 本身就是 URL
                console.log(`[Post Image #${imageIndex + 1}] Upload Success, server URL:`, serverUrl);
                resolve(serverUrl); // 直接 resolve 这个 URL
              }
              // (可选) 兼容一下如果后端某天改成了 {data: {filepath: "..."}}
              else if (resData.code === 1 && resData.data && typeof resData.data.filepath === 'string') {
                  const serverUrl = resData.data.filepath;
                  console.log(`[Post Image #${imageIndex + 1}] Upload Success (from filepath), server URL:`, serverUrl);
                  resolve(serverUrl);
              }
              else {
                // 虽然业务code=1，但没有有效的图片URL返回
                console.warn(`[Post Image #${imageIndex + 1}] Upload biz success but no valid URL in response.data:`, resData.data);
                reject({ msg: `图片${imageIndex + 1}上传后未获取到有效地址`, code: resData.code });
              }
              // --- ***** 修改结束 ***** ---

            } catch (e) {
              console.error(`[Post Image #${imageIndex + 1}] Response JSON parse error:`, e, "Raw data:", res.data);
              reject({ msg: `图片${imageIndex + 1}响应解析错误` });
            }
          } else {
            reject({ msg: `图片${imageIndex + 1}上传失败 (HTTP ${res.statusCode})` });
          }
        },
        fail: (err) => {
          console.error(`[Post Image #${imageIndex + 1}] wx.uploadFile API call failed:`, err);
          reject({ msg: `图片${imageIndex + 1}上传网络失败`, errorDetail: err });
        }
      });
    });
  },
  // --- 核心：表单提交 ---
  onFormSubmit: async function(e) {
    if (this.data.isSubmitting) return;

    // 1. 表单校验
    const { name, description } = this.data.formData;
    if (!name || !name.trim()) { wx.showToast({title:'请输入帖子标题', icon:'none'}); return; }
    if (!description || !description.trim()) { wx.showToast({title:'请输入帖子内容', icon:'none'}); return; }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '正在发布...' });

    const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    if (!currentUserId || !app.globalData.isLoggedIn) {
        wx.hideLoading(); this.setData({isSubmitting: false});
        wx.showModal({ title: '提示', content: '请先登录', confirmText: '去登录', showCancel:false, success:(res)=>{if(res.confirm)wx.navigateTo({url:'/pages/auth/login/login'});}});
        return;
    }

    try {
      // 2. 上传所有已选择的图片
      let uploadedImageUrls = [];
      if (this.data.tempImagePaths.length > 0) {
          wx.showLoading({ title: '上传图片中...' });
          const uploadPromises = this.data.tempImagePaths.map((path, index) =>
              this._uploadSingleImage(path, index)
          );
          uploadedImageUrls = await Promise.all(uploadPromises);
          console.log("All images uploaded successfully. Server paths:", uploadedImageUrls);
      }

      wx.showLoading({ title: '正在提交内容...' });

      // 3. 构造 /talk/creat 的 JSON Request Body
      const requestBodyPayload = {
        name: name.trim(),
        description: description.trim(),
        creatuser: currentUserId, // API文档字段是 creatuser
        img1: uploadedImageUrls[0] || "",
        img2: uploadedImageUrls[1] || "",
        img3: uploadedImageUrls[2] || ""
      };
      // 如果后端不希望接收空的图片字段，可以清理
      if (!requestBodyPayload.img1) delete requestBodyPayload.img1;
      if (!requestBodyPayload.img2) delete requestBodyPayload.img2;
      if (!requestBodyPayload.img3) delete requestBodyPayload.img3;

      console.log("Submitting post to /talk/creat. Body:", JSON.stringify(requestBodyPayload));

      // 4. 调用 /talk/creat 接口
      const response = await request({
        url: '/talk/creat',
        method: 'POST',
        data: requestBodyPayload,
        // 此接口响应是 {code, msg, data}, 不需要 expectDirectData
      });

      console.log('API /talk/creat success response (data part):', response); // 期望是 null 或 {}
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      wx.showToast({ title: '发布成功！', icon: 'success' });

      setTimeout(() => {
          // 发布成功后，通知论坛列表页刷新
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          if (prevPage && prevPage.route === 'pages/forum/list/list') {
              console.log("Calling previous page (forum list) to refresh...");
              // 设置一个标志位，让 list 页面在 onShow 时刷新
              app.globalData.needsRefreshForumList = true;
          }
          wx.navigateBack();
      }, 1500);

    } catch (error) {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      console.error("发布帖子过程中发生严重错误:", error);
      const errorMsgToShow = (error && error.msg) ? error.msg : '发布失败，请重试';
      wx.showModal({ title: '发布失败', content: errorMsgToShow, showCancel: false, confirmText: '知道了' });
    }
  },
});