// Xiaohuhu Work Space Data Adapter
// V1.0.7 storage abstraction layer

import Storage from './storage.js';

const DataAdapter = {
  async save(key, data) {
    return Storage.save(key, data);
  },

  async get(key, defaultValue = null) {
    return Storage.load(key, defaultValue);
  },

  async remove(key) {
    return Storage.remove(key);
  },

  exportAll() {
    return Storage.exportAll();
  }
};

export default DataAdapter;
