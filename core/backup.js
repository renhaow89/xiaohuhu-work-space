// Xiaohuhu Work Space Backup Manager
// V1.0.8 — 引入统一版本管理与异步备份历史

import Database from './database.js';
import BackupHistory from './backup-history.js';
import AppVersion from './version.js';

const BackupManager = {

  /**
   * 导出备份数据
   * 返回标准备份结构：
   * {
   *   app,       — 应用标识符
   *   version,   — 应用版本号
   *   schema,    — 数据 schema 版本
   *   created,   — 备份时间
   *   data       — 全部数据
   * }
   */
  async exportData() {
    const data = Database.exportBackup();

    return {
      app: AppVersion.app,
      version: AppVersion.version,
      schema: AppVersion.schema,
      created: new Date().toISOString(),
      data
    };
  },

  /**
   * 下载备份文件到本地
   */
  async downloadBackup() {
    const backup = await this.exportData();
    const json = JSON.stringify(backup, null, 2);

    const blob = new Blob(
      [json],
      { type: 'application/json' }
    );

    const filename = `xiaohuhu-backup-${Date.now()}.json`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    await BackupHistory.addRecord({
      filename,
      version: AppVersion.version,
      schema: AppVersion.schema,
      size: `${Math.round(blob.size / 1024)} KB`
    });

    return filename;
  },

  /**
   * 校验备份文件是否合法
   */
  validateBackup(backup) {
    return !!(
      backup &&
      backup.app === AppVersion.app &&
      typeof backup.data === 'object'
    );
  },

  /**
   * 导入备份数据
   * 通过 Storage 抽象层写入，不直接操作 localStorage
   */
  async importData(backup) {
    if (!this.validateBackup(backup)) {
      throw new Error('Invalid backup file: missing required fields or wrong app identifier');
    }

    // 导入前尝试 migration（如果 schema 不匹配）
    if (typeof backup.schema === 'number' && backup.schema !== AppVersion.schema) {
      console.warn(
        `[BackupManager] Schema mismatch: backup=${backup.schema}, current=${AppVersion.schema}. Migration may be needed.`
      );
    }

    // 使用 Database 层写入，保持数据流一致
    for (const [key, value] of Object.entries(backup.data)) {
      await Database.set(key, value);
    }

    return true;
  },

  /**
   * 清空全部应用数据
   */
  clearAllData() {
    localStorage.clear();
  }
};

export default BackupManager;
