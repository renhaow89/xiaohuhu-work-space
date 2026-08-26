// Xiaohuhu Work Space Backup History Manager
// V1.0.6 backup record support

const BackupHistory = {
  storageKey: 'xiaohuhu_backup_history',

  getHistory() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  },

  addRecord(record) {
    const history = this.getHistory();

    history.unshift({
      time: new Date().toISOString(),
      ...record
    });

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(history.slice(0, 20))
    );

    return history;
  },

  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }
};

export default BackupHistory;
