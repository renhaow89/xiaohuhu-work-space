// Xiaohuhu Work Space Settings Panel
// V1.0.5

import BackupManager from '../core/backup.js';

export const SettingsPanel = {
  init(container) {
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

      <p>
        当前版本：xiaohuhu-work-space V1.0.5
      </p>
    `;

    container
      .querySelector('#export-backup')
      .onclick = () => {
        BackupManager.downloadBackup();
      };

    container
      .querySelector('#import-backup')
      .onclick = () => {
        alert('导入功能将在下一步接入文件选择器');
      };

    container
      .querySelector('#clear-data')
      .onclick = () => {
        if(confirm('确定清空全部数据吗？')) {
          BackupManager.clearAllData();
          location.reload();
        }
      };
  }
};
