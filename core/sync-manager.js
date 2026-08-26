// Xiaohuhu Work Space — 同步管理器 (SyncManager)
// 负责基于 Supabase 的邮箱认证与多端数据双向增量同步
// 保持纯原生 ES Modules 零构建工具依赖

import Database from './database.js';
import BackupManager from './backup.js';
import AppVersion from './version.js';

const CONFIG_KEY = 'workspace_sync_config';
const AUTH_KEY = 'workspace_sync_auth';
const SYNC_META_KEY = 'workspace_sync_meta';

export const SyncManager = {
  status: 'idle', // 'idle' | 'syncing' | 'synced' | 'error' | 'disabled'
  isEnabled: false,
  user: null,
  token: null,
  lastSyncTime: null,
  config: {
    supabaseUrl: '',
    supabaseAnonKey: ''
  },

  /**
   * 初始化同步管理器：读取本地配置与认证信息
   */
  async init() {
    try {
      const savedConfig = await Database.get(CONFIG_KEY, null);
      if (savedConfig && savedConfig.supabaseUrl && savedConfig.supabaseAnonKey) {
        this.config = savedConfig;
      }

      const savedAuth = await Database.get(AUTH_KEY, null);
      if (savedAuth && savedAuth.token && savedAuth.user) {
        this.token = savedAuth.token;
        this.user = savedAuth.user;
        this.isEnabled = true;
        this.status = 'idle';
      } else {
        this.isEnabled = false;
        this.status = 'disabled';
      }

      const meta = await Database.get(SYNC_META_KEY, null);
      if (meta && meta.lastSyncTime) {
        this.lastSyncTime = meta.lastSyncTime;
      }

      console.log('[SyncManager] Initialized. Enabled:', this.isEnabled, 'User:', this.user ? this.user.email : 'None');
    } catch (e) {
      console.warn('[SyncManager] Init failed:', e);
      this.status = 'error';
    }
  },

  /**
   * 保存 Supabase 项目配置
   * @param {string} url Supabase Project URL
   * @param {string} key Supabase Anon Key
   */
  async saveConfig(url, key) {
    this.config = {
      supabaseUrl: (url || '').trim().replace(/\/+$/, ''),
      supabaseAnonKey: (key || '').trim()
    };
    await Database.set(CONFIG_KEY, this.config);
  },

  /**
   * 邮箱注册
   * @param {string} email
   * @param {string} password
   */
  async signup(email, password) {
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      throw new Error('请先配置 Supabase Project URL 与 Anon Key');
    }

    const res = await fetch(`${this.config.supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': this.config.supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || data.error_description || data.message || '注册失败');
    }

    // 如果直接返回了 access_token
    if (data.access_token && data.user) {
      await this._saveSession(data);
    }

    return {
      success: true,
      user: data.user,
      needEmailConfirm: !data.access_token,
      message: data.access_token ? '注册成功并已自动登录' : '注册成功！请查收验证邮件（若无需验证可直接登录）'
    };
  },

  /**
   * 邮箱密码登录
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      throw new Error('请先配置 Supabase Project URL 与 Anon Key');
    }

    const res = await fetch(`${this.config.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': this.config.supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.message || '登录失败，请检查账号密码');
    }

    await this._saveSession(data);

    // 登录后自动触发一次全量拉取合并
    try {
      await this.sync();
    } catch (err) {
      console.warn('[SyncManager] Auto sync after login failed:', err);
    }

    return {
      success: true,
      user: this.user,
      message: '登录成功'
    };
  },

  /**
   * 退出登录
   */
  async logout() {
    this.user = null;
    this.token = null;
    this.isEnabled = false;
    this.status = 'disabled';
    await Database.remove(AUTH_KEY);
    return { success: true, message: '已退出登录' };
  },

  /**
   * 将本地全量数据打包推送到 Supabase 云端
   */
  async pushToCloud(customData = null) {
    if (!this.isEnabled || !this.token || !this.user) {
      return {
        success: false,
        message: '未登录或未启用云同步'
      };
    }

    this.status = 'syncing';

    try {
      const backup = customData || await BackupManager.exportData();
      const payload = [{
        id: this.user.id,
        user_id: this.user.id,
        data: backup.data,
        schema: backup.schema || AppVersion.schema,
        updated_at: new Date().toISOString()
      }];

      const res = await fetch(`${this.config.supabaseUrl}/rest/v1/user_workspace_data`, {
        method: 'POST',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.hint || `推送失败 (${res.status})`);
      }

      this.status = 'synced';
      this.lastSyncTime = new Date().toISOString();
      await Database.set(SYNC_META_KEY, { lastSyncTime: this.lastSyncTime });

      return {
        success: true,
        message: '数据已成功同步至云端',
        lastSyncTime: this.lastSyncTime
      };
    } catch (error) {
      this.status = 'error';
      console.error('[SyncManager] pushToCloud error:', error);
      throw error;
    }
  },

  /**
   * 从 Supabase 云端拉取最新数据
   */
  async pullFromCloud() {
    if (!this.isEnabled || !this.token || !this.user) {
      return {
        success: false,
        message: '未登录或未启用云同步'
      };
    }

    this.status = 'syncing';

    try {
      const res = await fetch(`${this.config.supabaseUrl}/rest/v1/user_workspace_data?id=eq.${this.user.id}&select=*`, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `拉取失败 (${res.status})`);
      }

      const rows = await res.json();
      this.status = 'idle';

      if (!rows || rows.length === 0) {
        return {
          success: true,
          data: null,
          message: '云端尚无历史数据'
        };
      }

      const remoteRecord = rows[0];
      return {
        success: true,
        data: remoteRecord.data,
        schema: remoteRecord.schema,
        updatedAt: remoteRecord.updated_at,
        message: '成功拉取云端数据'
      };
    } catch (error) {
      this.status = 'error';
      console.error('[SyncManager] pullFromCloud error:', error);
      throw error;
    }
  },

  /**
   * 双向智能同步：拉取远端 -> 基于时间戳合并 -> 推送最新合并状态
   */
  async sync() {
    if (!this.isEnabled) {
      return { success: false, message: '未启用云同步' };
    }

    this.status = 'syncing';

    try {
      // 1. 拉取远端数据
      const pullRes = await this.pullFromCloud();

      // 如果云端没有数据，直接将本地数据全量推上云端
      if (!pullRes.data) {
        return await this.pushToCloud();
      }

      // 2. 本地自动安全备份
      const localBackup = await BackupManager.exportData();

      // 3. 智能合并各模块列表
      const mergedData = this._mergeDataSets(localBackup.data, pullRes.data);

      // 4. 应用合并结果回本地数据库
      for (const [key, value] of Object.entries(mergedData)) {
        await Database.set(key, value);
      }

      // 5. 将合并后的最新数据推回云端
      const pushRes = await this.pushToCloud();

      this.status = 'synced';
      this.lastSyncTime = new Date().toISOString();
      await Database.set(SYNC_META_KEY, { lastSyncTime: this.lastSyncTime });

      return {
        success: true,
        message: '多端双向同步完成 ✨',
        lastSyncTime: this.lastSyncTime
      };
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  },

  /**
   * 多模块列表项根据 id 与 updatedAt 进行 Last-Write-Wins 智能合并
   * @private
   */
  _mergeDataSets(localData = {}, remoteData = {}) {
    const allKeys = Array.from(new Set([...Object.keys(localData), ...Object.keys(remoteData)]));
    const merged = {};

    for (const key of allKeys) {
      const localVal = localData[key];
      const remoteVal = remoteData[key];

      if (!localVal) {
        merged[key] = remoteVal;
      } else if (!remoteVal) {
        merged[key] = localVal;
      } else if (Array.isArray(localVal) && Array.isArray(remoteVal)) {
        const itemMap = new Map();

        for (const item of remoteVal) {
          if (item && item.id) itemMap.set(item.id, item);
        }

        for (const item of localVal) {
          if (item && item.id) {
            if (!itemMap.has(item.id)) {
              itemMap.set(item.id, item);
            } else {
              const remoteItem = itemMap.get(item.id);
              const localTs = new Date(item.updatedAt || item.createdAt || 0).getTime();
              const remoteTs = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();
              if (localTs >= remoteTs) {
                itemMap.set(item.id, item);
              }
            }
          }
        }

        merged[key] = Array.from(itemMap.values());
      } else {
        merged[key] = typeof localVal === 'object' ? { ...remoteVal, ...localVal } : localVal;
      }
    }

    return merged;
  },

  async _saveSession(authData) {
    this.token = authData.access_token;
    this.user = authData.user;
    this.isEnabled = true;
    this.status = 'idle';

    await Database.set(AUTH_KEY, {
      token: this.token,
      refreshToken: authData.refresh_token,
      user: this.user,
      expiresAt: Date.now() + (authData.expires_in || 3600) * 1000
    });
  },

  getStatus() {
    return {
      status: this.status,
      isEnabled: this.isEnabled,
      user: this.user,
      lastSyncTime: this.lastSyncTime,
      hasConfig: !!(this.config.supabaseUrl && this.config.supabaseAnonKey)
    };
  }
};

export default SyncManager;
