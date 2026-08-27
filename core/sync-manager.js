// Xiaohuhu Work Space — 同步管理器 (SyncManager)
// 负责基于 Supabase 的邮箱认证与多端数据双向增量同步
// 包含：4秒轻量心跳轮询实现秒级多端互通、实时防抖自动推送、前后台切换拉取与删除墓碑同步
// 保持纯原生 ES Modules 零构建工具依赖

import Database from './database.js';
import BackupManager from './backup.js';
import AppVersion from './version.js';
import EventBus from './event.js';

const CONFIG_KEY = 'workspace_sync_config';
const AUTH_KEY = 'workspace_sync_auth';
const SYNC_META_KEY = 'workspace_sync_meta';
const DELETED_KEY = 'workspace_deleted_items';

const SYNCABLE_COLLECTIONS = new Set([
  'workspace_tasks',
  'journals',
  'workspace_readings',
  'workspace_research',
  DELETED_KEY
]);

export const SyncManager = {
  status: 'idle', // 'idle' | 'syncing' | 'synced' | 'error' | 'disabled'
  isEnabled: false,
  user: null,
  token: null,
  refreshToken: null,
  expiresAt: 0,
  lastSyncTime: null,
  config: {
    supabaseUrl: '',
    supabaseAnonKey: ''
  },
  _isInternalSyncing: false,
  _syncTimer: null,
  _pollingTimer: null,
  _listenersAttached: false,

  /**
   * 初始化同步管理器：读取本地配置与认证信息并绑定自动同步监听器
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
        this.refreshToken = savedAuth.refreshToken || null;
        this.expiresAt = savedAuth.expiresAt || 0;
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

      this._attachAutoSyncListeners();

      if (this.isEnabled) {
        this.startAutoPolling(4000);
      }

      console.log('[SyncManager] Initialized. Enabled:', this.isEnabled, 'User:', this.user ? this.user.email : 'None');
    } catch (e) {
      console.warn('[SyncManager] Init failed:', e);
      this.status = 'error';
    }
  },

  /**
   * 启动多端秒级实时轮询（每 4 秒检查一次云端时间戳，有变动自动拉取刷新）
   * @param {number} intervalMs 轮询间隔（默认 4000ms）
   */
  startAutoPolling(intervalMs = 4000) {
    if (this._pollingTimer) return;

    this._pollingTimer = setInterval(async () => {
      if (!this.isEnabled || !this.token || !this.user || this._isInternalSyncing) {
        return;
      }

      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      try {
        const res = await fetch(`${this.config.supabaseUrl}/rest/v1/user_workspace_data?id=eq.${this.user.id}&select=updated_at`, {
          method: 'GET',
          headers: {
            'apikey': this.config.supabaseAnonKey,
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });

        if (res.status === 401 && this.refreshToken) {
          await this.refreshSession();
          return;
        }

        if (res.ok) {
          const rows = await res.json();
          if (rows && rows.length > 0) {
            const remoteUpdatedAt = rows[0].updated_at;
            if (remoteUpdatedAt && remoteUpdatedAt !== this.lastSyncTime) {
              console.log('[SyncManager] Cloud updates detected via auto-polling. Merging...');
              await this.sync();
              if (window.Dashboard?.refreshAllPanels) {
                await window.Dashboard.refreshAllPanels();
              }
            }
          }
        }
      } catch (e) {
        // 心跳静默处理
      }
    }, intervalMs);
  },

  stopAutoPolling() {
    if (this._pollingTimer) {
      clearInterval(this._pollingTimer);
      this._pollingTimer = null;
    }
  },

  /**
   * 绑定实时自动同步与前后台切换监听
   * @private
   */
  _attachAutoSyncListeners() {
    if (this._listenersAttached) return;
    this._listenersAttached = true;

    // 1. 当本地数据发生增删改时，300ms 快速防抖静默同步到云端
    EventBus.on('data:changed', ({ collection }) => {
      if (this.isEnabled && !this._isInternalSyncing && SYNCABLE_COLLECTIONS.has(collection)) {
        this.debouncedSync(300);
      }
    });

    // 2. 当用户切换回当前应用或解锁手机屏幕时，自动静默双向拉取合并
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && this.isEnabled && !this._isInternalSyncing) {
          console.log('[SyncManager] App became visible, checking cloud updates...');
          try {
            await this.sync();
            if (window.Dashboard?.refreshAllPanels) {
              window.Dashboard.refreshAllPanels();
            }
          } catch (err) {
            console.warn('[SyncManager] Auto sync on visibilitychange failed:', err);
          }
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', async () => {
        if (this.isEnabled && !this._isInternalSyncing) {
          try {
            await this.sync();
            if (window.Dashboard?.refreshAllPanels) {
              window.Dashboard.refreshAllPanels();
            }
          } catch (err) {
            // 静默忽略
          }
        }
      });
    }
  },

  /**
   * 防抖静默同步（用于在用户写任务、打勾、删日志后自动同步，无需每次手动点击）
   * @param {number} delay 延迟毫秒数
   */
  debouncedSync(delay = 300) {
    if (!this.isEnabled) return;
    if (this._syncTimer) clearTimeout(this._syncTimer);

    this._syncTimer = setTimeout(async () => {
      if (this._isInternalSyncing) return;
      try {
        console.log('[SyncManager] Auto debounced sync started...');
        await this.sync();
        if (window.Dashboard?.refreshAllPanels) {
          window.Dashboard.refreshAllPanels();
        }
      } catch (err) {
        console.warn('[SyncManager] Auto debounced sync failed:', err);
      }
    }, delay);
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

    if (data.access_token && data.user) {
      await this._saveSession(data);
      this.startAutoPolling(4000);
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
    this.startAutoPolling(4000);

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
   * 自动使用 refresh_token 换取新的 access_token
   */
  async refreshSession() {
    if (!this.refreshToken || !this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      throw new Error('登录态已失效，请重新登录');
    }

    try {
      const res = await fetch(`${this.config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: this.refreshToken })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_description || data.message || 'Token 刷新失败');
      }

      await this._saveSession(data);
      console.log('[SyncManager] Token refreshed successfully');
      return true;
    } catch (err) {
      console.warn('[SyncManager] Token refresh failed:', err);
      await this.logout();
      throw new Error('登录态已过期，请重新登录');
    }
  },

  /**
   * 检查并在 Token 即将过期前自动刷新
   * @private
   */
  async _ensureValidToken() {
    if (!this.token) {
      throw new Error('未登录或未启用云同步');
    }
    if (this.expiresAt && Date.now() > this.expiresAt - 60000) {
      if (this.refreshToken) {
        console.log('[SyncManager] Token expired or expiring, refreshing silently...');
        await this.refreshSession();
      }
    }
  },

  /**
   * 退出登录
   */
  async logout() {
    this.stopAutoPolling();
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.expiresAt = 0;
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
      await this._ensureValidToken();

      const backup = customData || await BackupManager.exportData();
      const updatedTimestamp = new Date().toISOString();
      const payload = [{
        id: this.user.id,
        user_id: this.user.id,
        data: backup.data,
        schema: backup.schema || AppVersion.schema,
        updated_at: updatedTimestamp
      }];

      let res = await fetch(`${this.config.supabaseUrl}/rest/v1/user_workspace_data`, {
        method: 'POST',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        body: JSON.stringify(payload)
      });

      if (res.status === 401 && this.refreshToken) {
        console.log('[SyncManager] 401 Unauthorized received, refreshing token and retrying...');
        await this.refreshSession();
        res = await fetch(`${this.config.supabaseUrl}/rest/v1/user_workspace_data`, {
          method: 'POST',
          headers: {
            'apikey': this.config.supabaseAnonKey,
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store',
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.hint || `推送失败 (${res.status})`);
      }

      this.status = 'synced';
      this.lastSyncTime = updatedTimestamp;
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
      await this._ensureValidToken();

      let res = await fetch(`${this.config.supabaseUrl}/rest/v1/user_workspace_data?id=eq.${this.user.id}&select=*`, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (res.status === 401 && this.refreshToken) {
        console.log('[SyncManager] 401 Unauthorized received during pull, refreshing token...');
        await this.refreshSession();
        res = await fetch(`${this.config.supabaseUrl}/rest/v1/user_workspace_data?id=eq.${this.user.id}&select=*`, {
          method: 'GET',
          headers: {
            'apikey': this.config.supabaseAnonKey,
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
      }

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
   * 双向智能同步：拉取远端 -> 基于时间戳与删除墓碑合并 -> 推送最新合并状态
   */
  async sync() {
    if (!this.isEnabled) {
      return { success: false, message: '未启用云同步' };
    }

    if (this._isInternalSyncing) {
      return { success: true, message: '同步正在进行中...' };
    }

    this._isInternalSyncing = true;
    this.status = 'syncing';

    try {
      // 1. 拉取远端数据
      const pullRes = await this.pullFromCloud();

      // 如果云端没有数据，直接将本地数据全量推上云端
      if (!pullRes.data) {
        const pushRes = await this.pushToCloud();
        this._isInternalSyncing = false;
        return pushRes;
      }

      // 2. 本地自动安全备份
      const localBackup = await BackupManager.exportData();

      // 3. 智能合并各模块列表与删除墓碑
      const mergedData = this._mergeDataSets(localBackup.data, pullRes.data);

      // 4. 应用合并结果回本地数据库（标记内部同步中，防止死循环）
      for (const [key, value] of Object.entries(mergedData)) {
        await Database.set(key, value);
      }

      // 5. 将合并后的最新全量数据推回云端
      const pushRes = await this.pushToCloud();

      this.status = 'synced';
      this.lastSyncTime = pushRes.lastSyncTime || new Date().toISOString();
      await Database.set(SYNC_META_KEY, { lastSyncTime: this.lastSyncTime });

      return {
        success: true,
        message: '多端双向同步完成 ✨',
        lastSyncTime: this.lastSyncTime
      };
    } catch (error) {
      this.status = 'error';
      throw error;
    } finally {
      this._isInternalSyncing = false;
    }
  },

  /**
   * 多模块列表项根据 id、updatedAt 与删除墓碑进行 Last-Write-Wins 智能合并
   * @private
   */
  _mergeDataSets(localData = {}, remoteData = {}) {
    const allKeys = Array.from(new Set([...Object.keys(localData), ...Object.keys(remoteData)]));
    const merged = {};

    // 1. 合并删除墓碑记录
    const localDeleted = localData[DELETED_KEY] || {};
    const remoteDeleted = remoteData[DELETED_KEY] || {};
    const mergedDeleted = { ...remoteDeleted, ...localDeleted };

    for (const key of allKeys) {
      if (key === DELETED_KEY) continue;

      const localVal = localData[key];
      const remoteVal = remoteData[key];

      if (!localVal && !remoteVal) {
        merged[key] = [];
      } else if (Array.isArray(localVal) || Array.isArray(remoteVal)) {
        const localList = Array.isArray(localVal) ? localVal : [];
        const remoteList = Array.isArray(remoteVal) ? remoteVal : [];
        const itemMap = new Map();

        // 处理远端项
        for (const item of remoteList) {
          if (!item || !item.id) continue;
          const delTs = mergedDeleted[item.id] ? new Date(mergedDeleted[item.id]).getTime() : 0;
          const itemTs = new Date(item.updatedAt || item.createdAt || 0).getTime();
          // 若被删除且删除时间比修改时间新，则丢弃
          if (delTs > 0 && delTs >= itemTs) continue;
          itemMap.set(item.id, item);
        }

        // 处理本地项并基于 updatedAt 进行冲突仲裁
        for (const item of localList) {
          if (!item || !item.id) continue;
          const delTs = mergedDeleted[item.id] ? new Date(mergedDeleted[item.id]).getTime() : 0;
          const itemTs = new Date(item.updatedAt || item.createdAt || 0).getTime();
          if (delTs > 0 && delTs >= itemTs) continue;

          if (!itemMap.has(item.id)) {
            itemMap.set(item.id, item);
          } else {
            const remoteItem = itemMap.get(item.id);
            const remoteTs = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();
            if (itemTs >= remoteTs) {
              itemMap.set(item.id, item);
            }
          }
        }

        merged[key] = Array.from(itemMap.values());
      } else if (typeof localVal === 'object' || typeof remoteVal === 'object') {
        merged[key] = { ...(remoteVal || {}), ...(localVal || {}) };
      } else {
        merged[key] = localVal !== undefined ? localVal : remoteVal;
      }
    }

    merged[DELETED_KEY] = mergedDeleted;
    return merged;
  },

  async _saveSession(authData) {
    this.token = authData.access_token;
    this.refreshToken = authData.refresh_token || this.refreshToken;
    this.user = authData.user || this.user;
    this.expiresAt = Date.now() + (authData.expires_in || 3600) * 1000;
    this.isEnabled = true;
    this.status = 'idle';

    await Database.set(AUTH_KEY, {
      token: this.token,
      refreshToken: this.refreshToken,
      user: this.user,
      expiresAt: this.expiresAt
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
