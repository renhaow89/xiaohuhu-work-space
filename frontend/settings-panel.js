// Xiaohuhu Work Space Settings Panel
// 设置中心面板 — 包含多端云同步 (Supabase 邮箱登录/注册)、内置保姆级配置手册、备份管理与数据清空

import BackupManager from '../core/backup.js';
import BackupHistory from '../core/backup-history.js';
import SyncManager from '../core/sync-manager.js';
import AppVersion from '../core/version.js';

export const SettingsPanel = {
  container: null,
  authTab: 'login', // 'login' | 'signup'

  async init(container) {
    this.container = container;
    await SyncManager.init();
    await this.render();
  },

  async render() {
    if (!this.container) return;

    const history = await BackupHistory.getHistory();
    const syncStatus = SyncManager.getStatus();

    this.container.innerHTML = `
      <div class="panel-header">
        <h2>⚙️ 设置中心</h2>
        <span class="badge badge-info">v${AppVersion.version}</span>
      </div>

      <!-- ☁️ 多端云同步卡片 (Supabase 邮箱同步) -->
      <div class="cloud-sync-card">
        <div class="cloud-sync-header">
          <div class="cloud-sync-title">
            <span class="cloud-icon">☁️</span>
            <div>
              <h3 class="sync-main-title">多端云同步 (Supabase)</h3>
              <p class="sync-sub-title">支持手机与电脑数据实时双向互通</p>
            </div>
          </div>
          <span class="sync-badge ${syncStatus.isEnabled ? 'sync-badge-active' : 'sync-badge-offline'}">
            ${syncStatus.isEnabled ? '🟢 已连接云端' : '⚪ 离线单机模式'}
          </span>
        </div>

        <!-- 项目配置折叠区域 -->
        <details id="syncConfigDetails" class="sync-config-details" ${!syncStatus.hasConfig ? 'open' : ''}>
          <summary class="sync-config-summary">⚙️ Supabase 项目连接配置 (初次使用或修改请点开)</summary>
          <div class="sync-config-body">
            <div class="input-row">
              <label class="input-label">Project URL:</label>
              <input id="cfgSupabaseUrl" class="input-text" placeholder="https://your-project.supabase.co" value="${this.escapeHtml(SyncManager.config.supabaseUrl || '')}" />
            </div>
            <div class="input-row">
              <label class="input-label">Anon Key / Publishable Key:</label>
              <input id="cfgSupabaseKey" type="password" class="input-text" placeholder="eyJhbGciOi... 或 sb_publishable_..." value="${this.escapeHtml(SyncManager.config.supabaseAnonKey || '')}" />
            </div>
            <div class="config-actions">
              <button id="saveConfigBtn" class="btn btn-secondary btn-sm">💾 保存配置</button>
              <span id="configMsg" class="tip-msg"></span>
            </div>
          </div>
        </details>

        <!-- 📖 内置保姆级 Supabase 申请与配置图文手册 -->
        <details class="sync-tutorial-details">
          <summary class="sync-tutorial-summary">📖 如何免费申请与配置 Supabase 云端？(零基础保姆级图文教程)</summary>
          <div class="sync-tutorial-content">
            <div class="tutorial-step">
              <div class="step-num">Step 1</div>
              <div class="step-desc">
                <strong>打开 Supabase 并登录：</strong><br>
                电脑浏览器访问 <a href="https://supabase.com" target="_blank" style="color: var(--primary-color);">https://supabase.com</a>，点击右上角 <code>Start your project</code>（推荐直接用 GitHub 账号一键授权登录，完全永久免费）。
              </div>
            </div>
            
            <div class="tutorial-step">
              <div class="step-num">Step 2</div>
              <div class="step-desc">
                <strong>新建云端项目 (New project)：</strong><br>
                • <strong>Project Name</strong>：填 <code>xiaohuhu</code>（或任意名称）<br>
                • <strong>Database Password</strong>：输入或生成一个密码并记住<br>
                • <strong>Region（地区）</strong>：下拉选择 <code>Southeast Asia (Singapore) - 新加坡</code>（物理距离最近、国内直连最稳定）<br>
                • 点击绿色 <code>Create new project</code>，等待 1 分钟创建完成。
              </div>
            </div>

            <div class="tutorial-step">
              <div class="step-num">Step 3</div>
              <div class="step-desc">
                <strong>运行建表与专属加密防盗锁 (RLS)：</strong><br>
                点击左侧黑色菜单第 3 个图标 <code>SQL Editor (>_)</code> $\to$ 点击 <code>+ New query</code> $\to$ 粘贴下方代码 $\to$ 点击右下角绿色 <code>Run</code> 按钮（执行成功将显示 <code>Success. No rows returned</code>）：
                <pre class="tutorial-code-block"><code>CREATE TABLE IF NOT EXISTS user_workspace_data (\n  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,\n  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,\n  data JSONB NOT NULL DEFAULT '{}'::jsonb,\n  schema INT NOT NULL DEFAULT 1,\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n\nALTER TABLE user_workspace_data ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY \"Users can manage their own workspace data\"\nON user_workspace_data FOR ALL\nUSING (auth.uid() = user_id)\nWITH CHECK (auth.uid() = user_id);</code></pre>
                <div class="tutorial-tip-box">
                  💡 <strong>为什么要做这步？</strong><br>
                  ① <strong>建储物柜</strong>：在云端建好存放你任务和日志的数据表；<br>
                  ② <strong>上安全锁</strong>：开启 RLS（行级安全防护），确保只有用你自己的邮箱密码才能解密读取数据，其他人绝对无法窥探。
                </div>
              </div>
            </div>

            <div class="tutorial-step">
              <div class="step-num">Step 4</div>
              <div class="step-desc">
                <strong>获取连接配置 (URL & Anon Key)：</strong><br>
                • 点击左下角 <code>⚙️ Project Settings</code> $\to$ 点击 <code>API</code> 菜单；<br>
                • 复制 <strong>Project URL</strong>（如 <code>https://xxx.supabase.co</code>）；<br>
                • 复制 <strong>Publishable key</strong>（或 <code>anon public</code> Key）；<br>
                • 粘贴回上方小呼呼的配置框并点击「保存配置」即可！
              </div>
            </div>
          </div>
        </details>

        <!-- 认证与同步主操作区 -->
        <div class="sync-main-body">
          ${syncStatus.isEnabled && syncStatus.user ? `
            <!-- 已登录状态 -->
            <div class="logged-in-box">
              <div class="user-info-row">
                <span class="user-avatar">🌸</span>
                <div class="user-details">
                  <div class="user-email">${this.escapeHtml(syncStatus.user.email)}</div>
                  <div class="sync-time-label">🕒 最后同步时间：${syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleString() : '尚未同步'}</div>
                </div>
              </div>

              <div class="sync-buttons-row">
                <button id="manualSyncBtn" class="btn btn-primary">
                  🔄 立即双向同步
                </button>
                <button id="pushCloudBtn" class="btn btn-secondary btn-sm">
                  ⬆️ 推送到云端
                </button>
                <button id="pullCloudBtn" class="btn btn-secondary btn-sm">
                  ⬇️ 从云端拉取
                </button>
                <button id="logoutBtn" class="btn btn-danger btn-sm">
                  🚪 退出登录
                </button>
              </div>
              <div id="syncFeedbackMsg" class="sync-feedback-text"></div>
            </div>
          ` : `
            <!-- 未登录状态：邮箱登录/注册表单 -->
            <div class="auth-form-box">
              <div class="auth-tabs">
                <button class="auth-tab ${this.authTab === 'login' ? 'active' : ''}" id="tabLogin">🔑 邮箱登录</button>
                <button class="auth-tab ${this.authTab === 'signup' ? 'active' : ''}" id="tabSignup">✉️ 注册新账号</button>
              </div>

              <div class="auth-inputs">
                <input id="authEmail" type="email" class="input-text" placeholder="输入你的邮箱地址..." autocomplete="email" />
                <input id="authPassword" type="password" class="input-text" placeholder="输入密码 (至少6位)..." autocomplete="current-password" />
              </div>

              <div class="auth-actions">
                <button id="authSubmitBtn" class="btn btn-primary">
                  ${this.authTab === 'login' ? '🔐 登录并开启多端同步' : '✉️ 注册并绑定设备'}
                </button>
              </div>
              <div id="authFeedbackMsg" class="auth-feedback-text"></div>
            </div>
          `}
        </div>
      </div>

      <!-- 数据备份与迁移操作卡片 -->
      <div class="form-card">
        <h3 style="font-size: 14px; margin: 0 0 12px 0;">💾 本地数据与备份操作</h3>
        <div class="settings-actions">
          <button id="export-backup" class="btn btn-primary">
            💾 导出全量备份 (JSON)
          </button>

          <button id="import-backup" class="btn btn-secondary">
            📂 导入数据备份
          </button>

          <a href="test.html" target="_blank" class="btn btn-secondary" style="text-decoration: none;">
            🧪 自动化测试套件
          </a>

          <button id="clear-data" class="btn btn-danger">
            🗑️ 清空本地全部数据
          </button>
        </div>
      </div>

      <input
        id="backup-file-input"
        type="file"
        accept="application/json"
        style="display:none"
      />

      <!-- 历史备份区 -->
      <div class="backup-section">
        <h3>📋 最近备份记录</h3>
        <div id="backup-history" class="backup-list">
          ${history.length ? history.map(item => `
            <div class="backup-item">
              <div class="backup-item-title">${this.escapeHtml(item.filename || 'backup.json')}</div>
              <div class="backup-item-meta">
                <span>🕒 ${new Date(item.time).toLocaleString()}</span>
                ${item.size ? `<span class="badge">${this.escapeHtml(item.size)}</span>` : ''}
                ${item.schema ? `<span class="badge badge-schema">Schema v${item.schema}</span>` : ''}
              </div>
            </div>
          `).join('') : `
            <div class="empty-state">
              <div class="empty-icon">💾</div>
              <p class="empty-text">暂无备份记录，建议定期导出备份～</p>
            </div>
          `}
        </div>
      </div>

      <div class="version-footer">
        <p>应用标识：<code>${AppVersion.app}</code> | 版本：<code>${AppVersion.version}</code> | Schema：<code>${AppVersion.schema}</code></p>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const container = this.container;

    // 1. 配置保存
    const saveCfgBtn = container.querySelector('#saveConfigBtn');
    if (saveCfgBtn) {
      saveCfgBtn.onclick = async () => {
        const url = (container.querySelector('#cfgSupabaseUrl')?.value || '').trim();
        const key = (container.querySelector('#cfgSupabaseKey')?.value || '').trim();
        if (!url || !key) {
          const msg = container.querySelector('#configMsg');
          msg.textContent = '❌ 请完整填写 URL 与 Key';
          msg.style.color = '#EF4444';
          return;
        }
        await SyncManager.saveConfig(url, key);
        const msg = container.querySelector('#configMsg');
        msg.textContent = '✅ 项目配置已保存';
        msg.style.color = '';
        setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
      };
    }

    // 2. Auth Tab 切换
    const tabLogin = container.querySelector('#tabLogin');
    const tabSignup = container.querySelector('#tabSignup');
    if (tabLogin) {
      tabLogin.onclick = () => {
        this.authTab = 'login';
        this.render();
      };
    }
    if (tabSignup) {
      tabSignup.onclick = () => {
        this.authTab = 'signup';
        this.render();
      };
    }

    // 3. 登录 / 注册 提交
    const authSubmitBtn = container.querySelector('#authSubmitBtn');
    if (authSubmitBtn) {
      authSubmitBtn.onclick = async () => {
        const email = container.querySelector('#authEmail').value.trim();
        const password = container.querySelector('#authPassword').value.trim();
        const feedback = container.querySelector('#authFeedbackMsg');

        // 智能自动读取并保存配置输入框中的 URL 与 Key
        const urlInput = container.querySelector('#cfgSupabaseUrl');
        const keyInput = container.querySelector('#cfgSupabaseKey');
        const urlVal = urlInput ? urlInput.value.trim() : '';
        const keyVal = keyInput ? keyInput.value.trim() : '';

        if (urlVal && keyVal) {
          await SyncManager.saveConfig(urlVal, keyVal);
        }

        if (!SyncManager.config.supabaseUrl || !SyncManager.config.supabaseAnonKey) {
          const detailsEl = container.querySelector('#syncConfigDetails');
          if (detailsEl) detailsEl.open = true;
          feedback.textContent = '❌ 请在上方「⚙️ Supabase 项目连接配置」中填入 URL 与 Key 并保存';
          feedback.className = 'auth-feedback-text text-danger';
          if (urlInput) urlInput.focus();
          return;
        }

        if (!email || !password) {
          feedback.textContent = '❌ 请输入邮箱和密码';
          feedback.className = 'auth-feedback-text text-danger';
          return;
        }

        feedback.textContent = '⏳ 正在连接云端...';
        feedback.className = 'auth-feedback-text';
        authSubmitBtn.disabled = true;

        try {
          if (this.authTab === 'signup') {
            const res = await SyncManager.signup(email, password);
            feedback.textContent = '✅ ' + res.message;
            feedback.className = 'auth-feedback-text text-success';
            if (!res.needEmailConfirm) {
              await this.render();
              if (window.Dashboard?.refreshAllPanels) window.Dashboard.refreshAllPanels();
            }
          } else {
            await SyncManager.login(email, password);
            feedback.textContent = '✅ 登录成功！';
            feedback.className = 'auth-feedback-text text-success';
            await this.render();
            if (window.Dashboard?.refreshAllPanels) window.Dashboard.refreshAllPanels();
          }
        } catch (err) {
          feedback.textContent = '❌ ' + err.message;
          feedback.className = 'auth-feedback-text text-danger';
        } finally {
          authSubmitBtn.disabled = false;
        }
      };
    }

    // 4. 登出
    const logoutBtn = container.querySelector('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        if (confirm('确定退出当前账号登录吗？退出后将暂停云同步。')) {
          await SyncManager.logout();
          await this.render();
        }
      };
    }

    // 5. 立即双向同步
    const manualSyncBtn = container.querySelector('#manualSyncBtn');
    if (manualSyncBtn) {
      manualSyncBtn.onclick = async () => {
        const feedback = container.querySelector('#syncFeedbackMsg');
        feedback.textContent = '⏳ 正在进行双向数据同步...';
        feedback.className = 'sync-feedback-text';
        manualSyncBtn.disabled = true;

        try {
          const res = await SyncManager.sync();
          feedback.textContent = '✅ ' + res.message;
          feedback.className = 'sync-feedback-text text-success';
          if (window.Dashboard?.refreshAllPanels) {
            await window.Dashboard.refreshAllPanels();
          }
          setTimeout(() => this.render(), 1200);
        } catch (err) {
          feedback.textContent = '❌ 同步失败: ' + err.message;
          feedback.className = 'sync-feedback-text text-danger';
          if (err.message.includes('过期') || err.message.includes('重新登录') || err.message.includes('JWT')) {
            setTimeout(() => this.render(), 1800);
          }
        } finally {
          manualSyncBtn.disabled = false;
        }
      };
    }

    // 6. 仅推送 / 仅拉取
    const pushCloudBtn = container.querySelector('#pushCloudBtn');
    if (pushCloudBtn) {
      pushCloudBtn.onclick = async () => {
        const feedback = container.querySelector('#syncFeedbackMsg');
        feedback.textContent = '⏳ 正在推送本地数据到云端...';
        try {
          await SyncManager.pushToCloud();
          feedback.textContent = '✅ 推送成功！';
          feedback.className = 'sync-feedback-text text-success';
          if (window.Dashboard?.refreshAllPanels) {
            await window.Dashboard.refreshAllPanels();
          }
          setTimeout(() => this.render(), 1200);
        } catch (err) {
          feedback.textContent = '❌ 推送失败: ' + err.message;
          feedback.className = 'sync-feedback-text text-danger';
          if (err.message.includes('过期') || err.message.includes('重新登录') || err.message.includes('JWT')) {
            setTimeout(() => this.render(), 1800);
          }
        }
      };
    }

    const pullCloudBtn = container.querySelector('#pullCloudBtn');
    if (pullCloudBtn) {
      pullCloudBtn.onclick = async () => {
        const feedback = container.querySelector('#syncFeedbackMsg');
        feedback.textContent = '⏳ 正在从云端拉取数据...';
        try {
          const res = await SyncManager.pullFromCloud();
          if (res.data) {
            const Database = (await import('../core/database.js')).default;
            for (const [k, v] of Object.entries(res.data)) {
              await Database.set(k, v);
            }
          }
          feedback.textContent = '✅ 拉取成功并已更新本地！';
          feedback.className = 'sync-feedback-text text-success';
          if (window.Dashboard?.refreshAllPanels) {
            await window.Dashboard.refreshAllPanels();
          }
          setTimeout(() => this.render(), 1200);
        } catch (err) {
          feedback.textContent = '❌ 拉取失败: ' + err.message;
          feedback.className = 'sync-feedback-text text-danger';
          if (err.message.includes('过期') || err.message.includes('重新登录') || err.message.includes('JWT')) {
            setTimeout(() => this.render(), 1800);
          }
        }
      };
    }

    // 7. 本地导出 / 导入 / 清空
    const fileInput = container.querySelector('#backup-file-input');
    const exportBtn = container.querySelector('#export-backup');
    const importBtn = container.querySelector('#import-backup');
    const clearBtn = container.querySelector('#clear-data');

    if (exportBtn) {
      exportBtn.onclick = async () => {
        await BackupManager.downloadBackup();
        await this.render();
      };
    }

    if (importBtn) {
      importBtn.onclick = () => fileInput.click();
    }

    if (fileInput) {
      fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const backup = JSON.parse(text);
          await BackupManager.importData(backup);
          alert('✅ 数据恢复成功，即将刷新页面');
          location.reload();
        } catch (error) {
          console.error(error);
          alert('❌ 备份文件无效或损坏: ' + error.message);
        }
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        if (confirm('⚠️ 警告：确定清空全部本地数据吗？此操作不可逆！')) {
          BackupManager.clearAllData();
          location.reload();
        }
      };
    }
  },

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

window.SettingsPanel = SettingsPanel;
