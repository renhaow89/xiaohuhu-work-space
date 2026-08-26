// Xiaohuhu Work Space Database Layer
// Unified access point for workspace modules.
// V1.0.7 uses DataAdapter abstraction.

import DataAdapter from './data-adapter.js';

const Database = {
  async set(collection, data) {
    return DataAdapter.save(collection, data);
  },

  async get(collection, defaultValue = []) {
    return DataAdapter.get(collection, defaultValue);
  },

  async append(collection, item) {
    const list = await this.get(collection, []);
    list.push(item);
    await this.set(collection, list);
    return item;
  },

  async remove(collection) {
    return DataAdapter.remove(collection);
  },

  exportBackup() {
    return DataAdapter.exportAll();
  }
};

export default Database;
