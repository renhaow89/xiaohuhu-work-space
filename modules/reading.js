// Reading Module
// 管理论文、书籍和知识记录
// V1.0.8: 支持命名与默认导出兼容
// V1.2.5: 增加 updatedAt 与删除墓碑追踪

import Database from '../core/database.js';

const READING_KEY = 'workspace_readings';
const DELETED_KEY = 'workspace_deleted_items';

export const ReadingModule = {
  async list() {
    return await Database.get(READING_KEY, []);
  },

  async create(title, notes = '') {
    const records = await this.list();

    const record = {
      id: Date.now().toString() + Math.floor(Math.random() * 1000),
      type: 'reading',
      title,
      notes,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    records.push(record);
    await Database.set(READING_KEY, records);

    return record;
  },

  async update(id, changes = {}) {
    const records = await this.list();

    const updated = records.map(record => {
      if (record.id === id) {
        return {
          ...record,
          ...changes,
          updatedAt: new Date().toISOString()
        };
      }
      return record;
    });

    await Database.set(READING_KEY, updated);
    return updated;
  },

  async delete(id) {
    const records = await this.list();
    const filtered = records.filter(r => r.id !== id);
    await Database.set(READING_KEY, filtered);

    try {
      const deletedMap = await Database.get(DELETED_KEY, {});
      deletedMap[id] = new Date().toISOString();
      await Database.set(DELETED_KEY, deletedMap);
    } catch (e) {
      console.warn('[ReadingModule] Failed to record deletion tombstone:', e);
    }

    return filtered;
  }
};

export default ReadingModule;
