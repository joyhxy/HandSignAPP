// pages/profile/editProfile/editProfile.js
import request from '../../../utils/request.js'; // 确保路径正确
const app = getApp();
const IMAGE_BASE_URL = 'https://222.186.168.45:8080'; // !!! 务必替换为真实的图片基础URL !!!

Page({
  data: {
    userInfo: null, // 从 app.globalData.userInfo 初始化
    avatarUrl_local: '', // 本地选择的新头像临时路径，用于预览
    currentNickname_form: '', // 表单中绑定的昵称，从 userInfo.name 初始化
    
    isSaving: false,          // 防止重复提交的标志
    hasNicknameChanged: false, // 标记昵称是否有实际变动
    hasAvatarChanged: false,   // 标记头像是否已选择新的本地图片
    originalAvatarUrl: ''    // 存储页面加载时的原始头像URL，用于比较是否更改
  },

  onLoad: function (options) {
    this.loadUserProfile();
  },

  onShow: function() {
    // 每次显示时，如果全局用户信息有更新（比如其他页面改了），可以同步到当前页
    // 但编辑页通常在 onLoad 时加载一次，修改后保存才更新全局
    if (app.globalData.isLoggedIn && app.globalData.userInfo) {
        if (!this.data.userInfo || // 首次加载
            this.data.userInfo.name !== app.globalData.userInfo.name ||
            this.data.userInfo.avatarUrl !== app.globalData.userInfo.avatarUrl) {
            
            // 如果表单没有被用户主动修改过，才用全局的去覆盖
            if (!this.data.hasNicknameChanged && !this.data.hasAvatarChanged) {
                this.setData({
                    userInfo: JSON.parse(JSON.stringify(app.globalData.userInfo)), // 深拷贝
                    currentNickname_form: app.globalData.userInfo.name || '',
                    avatarUrl_local: app.globalData.userInfo.avatarUrl || '',
                    originalAvatarUrl: app.globalData.userInfo.avatarUrl || ''
                });
            }
        }
    }
  },

  loadUserProfile: function() {
    if (app.globalData.isLoggedIn && app.globalData.userInfo) {
      // 使用深拷贝，避免直接修改全局对象对其他页面的影响，直到保存成功
      const currentUserInfo = JSON.parse(JSON.stringify(app.globalData.userInfo));
      this.setData({
        userInfo: currentUserInfo,
        currentNickname_form: currentUserInfo.name || '',
        avatarUrl_local: currentUserInfo.avatarUrl || '',
        originalAvatarUrl: currentUserInfo.avatarUrl || '', // 存储原始头像URL
        hasNicknameChanged: false,
        hasAvatarChanged: false
      });
    } else {
      wx.showModal({
        title: '提示',
        content: '请先登录才能编辑资料。',
        showCancel: false,
        confirmText: '去登录',
        success: () => wx.navigateTo({ url: '/pages/auth/login/login' })
      });
    }
  },

  // --- 头像修改 ---
  chooseAvatar: function(e) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          this.setData({
            avatarUrl_local: tempFilePath,
            hasAvatarChanged: tempFilePath !== this.data.originalAvatarUrl // 比较选择的与原始的是否不同
          });
        }
      },
      fail: (err) => {
        if (err.errMsg !== "chooseMedia:fail cancel") { // 用户主动取消则不提示
            wx.showToast({ title: '选择头像失败', icon: 'none' });
        }
        console.log("选择头像操作:", err);
      }
    });
  },

  uploadAvatarApi: function(filePath) { // filePath 是 wx.chooseMedia 返回的临时路径
    return new Promise((resolve, reject) => {
      const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
      const token = wx.getStorageSync('userToken'); // 获取Token，如果上传接口需要

      if (!currentUserId) {
        const errMsg = '用户ID丢失，请重新登录后操作';
        wx.showToast({ title: errMsg, icon: 'none' });
        reject({ msg: errMsg });
        return;
      }
      if (!filePath) {
        const errMsg = '未选择有效的图片文件';
        wx.showToast({ title: errMsg, icon: 'none' });
        reject({ msg: errMsg });
        return;
      }

      // 根据 OpenAPI 文档，id 是 Query 参数
      const uploadUrl = `${IMAGE_BASE_URL}/user/img?id=${currentUserId.toString()}`;

      console.log(`Attempting to upload avatar to: ${uploadUrl}`);
      console.log(`Local file path: ${filePath}`);

      wx.uploadFile({
        url: uploadUrl, // **上传的目标URL，已包含Query参数 id**
        filePath: filePath, // **要上传的本地文件路径**
        name: 'file',   // **核心：后端期望接收文件的表单字段名。你需要和timing确认这个名字！**
                        // 例如，如果后端用 @RequestParam("avatar") MultipartFile avatar，那么这里应该是 'avatar'
        header: {
          // **根据后端要求设置请求头，例如 Token**
          // 'Authorization': `Bearer ${token}`, // 如果需要认证
          // 'Content-Type': 'multipart/form-data' // wx.uploadFile 会自动设置
        },
        formData: { // 如果除了文件，还需要传递其他普通的文本表单字段
          // 'anotherParam': 'someValue'
          // 根据 OpenAPI，没有其他 body 参数，id 已在 Query 中
        },
        success: (uploadRes) => {
          console.log("wx.uploadFile success, raw server response:", uploadRes);
          if (uploadRes.statusCode === 200) {
            try {
              const responseData = JSON.parse(uploadRes.data); // 后端返回的应该是JSON字符串
              console.log("Parsed server response from avatar upload:", responseData);

              if (responseData.code === 1) { // 业务成功
                // **与后端确认：成功后，responseData.data 中新头像URL的字段名是什么？**
                // 假设是 responseData.data.avatar_url 或 responseData.data (如果data直接是url字符串)
                const newImageUrlFromServer = (responseData.data && responseData.data.avatar_url) ||
                                            (responseData.data && typeof responseData.data === 'string' && responseData.data.startsWith('http') ? responseData.data : null) ||
                                            (responseData.data && responseData.data.img); // 也兼容一下 img 字段

                if (newImageUrlFromServer && typeof newImageUrlFromServer === 'string') {
                  console.log("头像上传业务成功，后端返回新图片路径/URL:", newImageUrlFromServer);
                  // 判断返回的是完整URL还是相对路径
                  if (newImageUrlFromServer.startsWith('http://') || newImageUrlFromServer.startsWith('https://')) {
                    resolve(newImageUrlFromServer);
                  } else {
                    // 如果是相对路径，拼接 IMAGE_BASE_URL (但通常上传接口会返回完整URL)
                    let imagePath = newImageUrlFromServer;
                    if (IMAGE_BASE_URL.endsWith('/') && imagePath.startsWith('/')) imagePath = imagePath.substring(1);
                    else if (!IMAGE_BASE_URL.endsWith('/') && !imagePath.startsWith('/')) { if(imagePath) imagePath = '/' + imagePath; }
                    resolve(IMAGE_BASE_URL + imagePath);
                  }
                } else {
                  // 虽然 code=1，但没有有效的图片URL返回
                  console.warn("头像上传业务成功，但响应中未包含有效的新头像URL:", responseData.data);
                  // 这种情况下，可能需要前端再次调用获取用户信息的接口来得到最新头像
                  // 或者，如果上传接口就是不返回新URL，前端可以用本地预览（但不准确）
                  // 为了安全，如果没拿到URL，最好是reject或提示用户刷新
                  reject({ msg: '头像已上传，但未能获取新头像地址' });
                }
              } else { // 业务失败 (code === 0 或其他)
                reject({ msg: responseData.msg || '头像保存失败 (后端业务逻辑)', code: responseData.code, raw: responseData });
              }
            } catch (e) { // JSON 解析失败
              console.error("头像上传响应JSON解析错误:", e, "Raw data from server:", uploadRes.data);
              reject({ msg: '服务器响应数据格式错误' });
            }
          } else { // HTTP 状态码非 200
            reject({ msg: `头像上传失败，服务器状态: ${uploadRes.statusCode}`, statusCode: uploadRes.statusCode, raw: uploadRes });
          }
        },
        fail: (err) => { // wx.uploadFile 本身调用失败 (网络等原因)
          console.error("wx.uploadFile API调用失败:", err);
          reject({ msg: err.errMsg || '头像上传网络请求失败', errorDetail: err });
        },
        complete: () => {
            // wx.hideLoading(); // 通常在 saveProfileChanges 中统一处理
        }
      });
    });
  },


  // --- 昵称修改 ---
  onNicknameInputChange: function(e) {
    const newNickname = e.detail.value;
    this.setData({
      currentNickname_form: newNickname,
      hasNicknameChanged: newNickname.trim() !== (this.data.userInfo ? (this.data.userInfo.name || '') : '')
    });
  },

  updateNicknameApi: function(newNickname) {
    return new Promise((resolve, reject) => {
      const currentUserId = app.globalData.userInfo ? app.globalData.userInfo.id : null;
      if (!currentUserId) {
        reject({ msg: "用户未登录" }); return;
      }
      const trimmedNickname = newNickname.trim(); // 已在 saveProfileChanges 中校验过非空

      console.log(`Calling API POST /user/name with Query: id=${currentUserId}, username=${trimmedNickname}`);
      request({
        url: `/user/name?id=${currentUserId.toString()}&username=${encodeURIComponent(trimmedNickname)}`,
        method: 'POST',
        data: {}, // Body为空，参数在Query中
      })
      .then(response => {
        console.log('昵称修改API成功响应 (data part):', response); // 期望为 null 或 {}
        resolve(true);
      })
      .catch(err => {
        console.error('昵称修改API失败:', err);
        reject(err);
      });
    });
  },

  // --- 保存所有修改 ---
  saveProfileChanges: async function() {
    if (this.data.isSaving) return;

    const newNicknameTrimmed = this.data.currentNickname_form.trim();
    if (!newNicknameTrimmed) {
        wx.showToast({ title: '昵称不能为空', icon: 'none' });
        return;
    }

    // 检查是否有实际变动
    const actualAvatarChanged = this.data.hasAvatarChanged && this.data.avatarUrl_local && this.data.avatarUrl_local !== this.data.originalAvatarUrl;
    const actualNicknameChanged = this.data.hasNicknameChanged && newNicknameTrimmed !== (this.data.userInfo ? this.data.userInfo.name : '');

    if (!actualAvatarChanged && !actualNicknameChanged) {
        wx.showToast({ title: '信息未做更改', icon: 'none' });
        return;
    }

    this.setData({ isSaving: true });
    wx.showLoading({ title: '正在保存...' });

    let finalAvatarUrlToUpdate = app.globalData.userInfo ? app.globalData.userInfo.avatarUrl : ''; // 默认为旧头像

    try {
      if (actualAvatarChanged) {
        console.log("尝试上传新头像:", this.data.avatarUrl_local);
        finalAvatarUrlToUpdate = await this.uploadAvatarApi(this.data.avatarUrl_local);
        console.log("头像上传成功，后端返回的新URL:", finalAvatarUrlToUpdate);
      }

      if (actualNicknameChanged) {
        console.log("尝试更新昵称为:", newNicknameTrimmed);
        await this.updateNicknameApi(newNicknameTrimmed);
        console.log("昵称更新API调用成功");
      }

      // 所有操作成功后，更新全局和本地数据
      if (app.globalData.userInfo) {
        const updatedUserInfo = {
          ...app.globalData.userInfo, // 展开旧信息
          name: actualNicknameChanged ? newNicknameTrimmed : app.globalData.userInfo.name,
          avatarUrl: actualAvatarChanged ? finalAvatarUrlToUpdate : app.globalData.userInfo.avatarUrl
        };
        app.globalData.userInfo = updatedUserInfo; // 更新全局
        wx.setStorageSync('userInfo', updatedUserInfo); // 更新缓存
        this.setData({ // 更新当前页面的显示
          userInfo: updatedUserInfo,
          currentNickname_form: updatedUserInfo.name,
          avatarUrl_local: updatedUserInfo.avatarUrl, // 更新预览为已确认的URL
          originalAvatarUrl: updatedUserInfo.avatarUrl, // 更新原始URL，以便下次比较
          hasNicknameChanged: false, // 重置更改标记
          hasAvatarChanged: false   // 重置更改标记
        });
        wx.hideLoading();
        this.setData({ isSaving: false });
        wx.showToast({ title: '资料保存成功!', icon: 'success' });
        // 可以考虑延时返回，让用户看到Toast
        setTimeout(() => { wx.navigateBack(); }, 1500);
      } else {
        wx.hideLoading();
        this.setData({ isSaving: false });
        wx.showToast({ title: '保存成功，但全局信息可能未及时更新', icon: 'none' });
      }

    } catch (error) { // 捕获 uploadAvatarApi 或 updateNicknameApi 的 reject
      wx.hideLoading();
      this.setData({ isSaving: false });
      console.error("保存个人资料过程中发生错误:", error);
      const errorMsgToShow = (error && error.msg) ? error.msg : '保存失败，请稍后再试';
      if(errorMsgToShow !== '用户取消选择' && errorMsgToShow !== '未登录或用户ID丢失') {
        wx.showToast({ title: errorMsgToShow, icon: 'none', duration: 2500 });
      }
    }
  }
});