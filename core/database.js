// Xiaohuhu Work Space Database Layer
// Unified access point for workspace modules.
// V1.0.7 uses DataAdapter abstraction.
// V1.2.5 emits EventBus events on mutations for automatic cloud sync.

import DataAdapter from './data-adapter.js';
import EventBus from './event.js';

const Database = {
  async set(collection, data) {
    const res = await DataAdapter.save(collection, data);
    EventBus.emit('data:changed', { collection, data });
    return res;
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
    const res = await DataAdapter.remove(collection);
    EventBus.emit('data:changed', { collection, data: null });
    return res;
  },

  exportBackup() {
    return DataAdapter.exportAll();
  }
};

export default Database;
