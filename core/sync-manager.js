// Xiaohuhu Work Space — 同步管理器接口骨架
// V1.0.7 — 暂时不连接云端，只建立接口
//
// 未来数据流：
//   local data
//     ↓
//   sync-manager.js
//     ↓
//   Supabase / Firebase

const SyncManager = {

  /** 同步状态 */
  status: 'idle', // 'idle' | 'syncing' | 'error' | 'disabled'

  /** 是否已启用云同步 */
  isEnabled: false,

  /**
   * 初始化同步管理器
   * V1.0.7：占位实现，不连接云端
   * V1.1+: 将从 config 读取云服务配置并初始化连接
   */
  async init() {
    console.log('[SyncManager] Initialized (cloud sync disabled in V1.0.7)');
    this.status = 'disabled';
    this.isEnabled = false;
  },

  /**
   * 将本地数据同步到云端
   * V1.0.7：占位，未实现
   *
   * @param {object} data 要同步的数据
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async pushToCloud(data) {
    if (!this.isEnabled) {
      return {
        success: false,
        message: 'Cloud sync is not enabled. Configure cloud provider first.'
      };
    }

    // TODO: V1.1 实现 Supabase / Firebase 上传逻辑
    throw new Error('[SyncManager] pushToCloud not yet implemented');
  },

  /**
   * 从云端拉取最新数据
   * V1.0.7：占位，未实现
   *
   * @returns {Promise<{ success: boolean, data?: object, message: string }>}
   */
  async pullFromCloud() {
    if (!this.isEnabled) {
      return {
        success: false,
        message: 'Cloud sync is not enabled. Configure cloud provider first.'
      };
    }

    // TODO: V1.1 实现 Supabase / Firebase 拉取逻辑
    throw new Error('[SyncManager] pullFromCloud not yet implemented');
  },

  /**
   * 双向同步（先拉取再推送）
   * V1.0.7：占位，未实现
   *
   * @param {object} localData 本地数据
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async sync(localData) {
    if (!this.isEnabled) {
      return {
        success: false,
        message: 'Cloud sync is not enabled.'
      };
    }

    this.status = 'syncing';

    try {
      // TODO: V1.1 实现冲突检测和处理逻辑
      throw new Error('[SyncManager] sync not yet implemented');
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  },

  /**
   * 配置云同步提供商
   * V1.0.7：接口占位
   *
   * @param {'supabase' | 'firebase'} provider 提供商名称
   * @param {object} config 配置内容（如 url, apiKey 等）
   */
  configure(provider, config) {
    // TODO: V1.1 实现各提供商适配器
    console.log(`[SyncManager] Provider '${provider}' configured (not yet active):`, config);
  },

  /**
   * 获取当前同步状态
   * @returns {{ status: string, isEnabled: boolean }}
   */
  getStatus() {
    return {
      status: this.status,
      isEnabled: this.isEnabled
    };
  }
};

export default SyncManager;
