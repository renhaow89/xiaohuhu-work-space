// Xiaohuhu Work Space Backup Manager
// V1.0.6 backup history integration

import Database from './database.js';
import BackupHistory from './backup-history.js';

const BackupManager = {
  version: '1.0.6',

  async exportData() {
    const data = Database.exportBackup();

    return {
      app: 'xiaohuhu-work-space',
      version: this.version,
      created: new Date().toISOString(),
      data
    };
  },

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

    BackupHistory.addRecord({
      filename,
      version: this.version,
      size: `${Math.round(blob.size / 1024)} KB`
    });

    return filename;
  },

  validateBackup(backup) {
    return !!(
      backup &&
      backup.app === 'xiaohuhu-work-space' &&
      typeof backup.data === 'object'
    );
  },

  async importData(backup) {
    if (!this.validateBackup(backup)) {
      throw new Error('Invalid backup file');
    }

    Object.entries(backup.data).forEach(([key, value]) => {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    });

    return true;
  },

  clearAllData() {
    localStorage.clear();
  }
};

export default BackupManager;
