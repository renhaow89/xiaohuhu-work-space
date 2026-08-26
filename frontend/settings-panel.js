// Xiaohuhu Work Space Settings Panel
// V1.0.6

import BackupManager from '../core/backup.js';
import BackupHistory from '../core/backup-history.js';

export const SettingsPanel = {
  init(container) {
    const history = BackupHistory.getHistory();

    container.innerHTML = `
      <h2>⚙️ 设置中心</h2>

      <div class="settings-actions">
        <button id="export-backup">
          导出数据
        </button>

        <button id="import-backup">
          导入备份
        </button>

        <button id="clear-data">
          清空数据
        </button>
      </div>

      <input
        id="backup-file-input"
        type="file"
        accept="application/json"
        style="display:none"
      />

      <h3>最近备份</h3>
      <div id="backup-history">
        ${history.length ? history.map(item => `
          <p>
            ${new Date(item.time).toLocaleString()}<br>
            ${item.filename || 'backup.json'}
          </p>
        `).join('') : '<p>暂无备份记录</p>'}
      </div>

      <p>
        当前版本：xiaohuhu-work-space V1.0.6
      </p>
    `;

    const fileInput = container.querySelector('#backup-file-input');

    container
      .querySelector('#export-backup')
      .onclick = () => {
        BackupManager.downloadBackup();
      };

    container
      .querySelector('#import-backup')
      .onclick = () => {
        fileInput.click();
      };

    fileInput.onchange = async (event) => {
      const file = event.target.files[0];

      if (!file) return;

      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        await BackupManager.importData(backup);

        alert('数据恢复成功，即将刷新页面');
        location.reload();
      } catch (error) {
        console.error(error);
        alert('备份文件无效，恢复失败');
      }
    };

    container
      .querySelector('#clear-data')
      .onclick = () => {
        if (confirm('确定清空全部数据吗？')) {
          BackupManager.clearAllData();
          location.reload();
        }
      };
  }
};
