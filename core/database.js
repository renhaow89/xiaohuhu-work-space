// Xiaohuhu Work Space Database Layer
// Unified access point for workspace modules.

import Storage from './storage.js';

const Database = {
  async set(collection, data) {
    return Storage.save(collection, data);
  },

  async get(collection, defaultValue = []) {
    return Storage.load(collection, defaultValue);
  },

  async append(collection, item) {
    const list = await this.get(collection, []);
    list.push(item);
    await this.set(collection, list);
    return item;
  },

  async remove(collection) {
    return Storage.remove(collection);
  },

  exportBackup() {
    return Storage.exportAll();
  }
};

export default Database;
