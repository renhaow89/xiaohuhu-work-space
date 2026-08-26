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

      <input
        id="backup-file-input"
        type="file"
        accept="application/json"
        style="display:none"
      />

      <p>
        当前版本：xiaohuhu-work-space V1.0.5
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

      if (!file) {
        return;
      }

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
        if(confirm('确定清空全部数据吗？')) {
          BackupManager.clearAllData();
          location.reload();
        }
      };
  }
};
