// Xiaohuhu Work Space Backup History Manager
// V1.0.8: 统一接入 Database 抽象层

import Database from './database.js';

const BackupHistory = {
  storageKey: 'xiaohuhu_backup_history',

  /**
   * 获取备份历史记录列表
   * @returns {Promise<Array>}
   */
  async getHistory() {
    return await Database.get(this.storageKey, []);
  },

  /**
   * 添加一条备份历史记录（最多保留最近 20 条）
   * @param {object} record 包含 filename, version, schema, size 等信息
   * @returns {Promise<Array>}
   */
  async addRecord(record) {
    const history = await this.getHistory();

    history.unshift({
      time: new Date().toISOString(),
      ...record
    });

    const trimmed = history.slice(0, 20);
    await Database.set(this.storageKey, trimmed);

    return trimmed;
  },

  /**
   * 清空备份历史
   * @returns {Promise<void>}
   */
  async clearHistory() {
    await Database.remove(this.storageKey);
  }
};

export default BackupHistory;
