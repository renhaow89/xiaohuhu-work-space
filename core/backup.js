// Xiaohuhu Work Space Backup Manager
// V1.0.5 data backup center

import Database from './database.js';

const BackupManager = {
  version: '1.0.5',

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

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `xiaohuhu-backup-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  },

  async validateBackup(backup) {
    return !!(
      backup &&
      backup.app === 'xiaohuhu-work-space' &&
      backup.data
    );
  },

  async importData(backup) {
    if (!(await this.validateBackup(backup))) {
      throw new Error('Invalid backup file');
    }

    Object.keys(backup.data).forEach((key) => {
      localStorage.setItem(
        key,
        JSON.stringify(backup.data[key])
      );
    });
  },

  clearAllData() {
    localStorage.clear();
  }
};

export default BackupManager;
