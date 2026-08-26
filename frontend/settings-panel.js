// Xiaohuhu Work Space Settings Panel
// V1.0.8: 支持异步读取备份历史与优雅设置界面

import BackupManager from '../core/backup.js';
import BackupHistory from '../core/backup-history.js';
import AppVersion from '../core/version.js';

export const SettingsPanel = {
  async init(container) {
    await this.render(container);
  },

  async render(container) {
    if (!container) return;

    const history = await BackupHistory.getHistory();

    container.innerHTML = `
      <div class="panel-header">
        <h2>⚙️ 设置中心</h2>
        <span class="badge badge-info">v${AppVersion.version}</span>
      </div>

      <div class="settings-actions">
        <button id="export-backup" class="btn btn-primary">
          💾 导出数据
        </button>

        <button id="import-backup" class="btn btn-secondary">
          📂 导入备份
        </button>

        <button id="clear-data" class="btn btn-danger">
          🗑️ 清空数据
        </button>
      </div>

      <input
        id="backup-file-input"
        type="file"
        accept="application/json"
        style="display:none"
      />

      <div class="backup-section">
        <h3>📋 最近备份记录</h3>
        <div id="backup-history" class="backup-list">
          ${history.length ? history.map(item => `
            <div class="backup-item">
              <div class="backup-item-title">${item.filename || 'backup.json'}</div>
              <div class="backup-item-meta">
                <span>${new Date(item.time).toLocaleString()}</span>
                ${item.size ? `<span class="badge">${item.size}</span>` : ''}
                ${item.schema ? `<span class="badge badge-schema">Schema v${item.schema}</span>` : ''}
              </div>
            </div>
          `).join('') : '<p class="empty-state">暂无备份记录</p>'}
        </div>
      </div>

      <div class="version-footer">
        <p>应用标识：<code>${AppVersion.app}</code> | 版本：<code>${AppVersion.version}</code> | Schema：<code>${AppVersion.schema}</code></p>
      </div>
    `;

    const fileInput = container.querySelector('#backup-file-input');

    container.querySelector('#export-backup').onclick = async () => {
      await BackupManager.downloadBackup();
      await this.render(container);
    };

    container.querySelector('#import-backup').onclick = () => {
      fileInput.click();
    };

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
        alert('❌ 备份文件无效或损坏，恢复失败: ' + error.message);
      }
    };

    container.querySelector('#clear-data').onclick = () => {
      if (confirm('⚠️ 警告：确定清空全部本地数据吗？此操作不可逆！')) {
        BackupManager.clearAllData();
        location.reload();
      }
    };
  }
};
