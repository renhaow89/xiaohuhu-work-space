// Reading Module
// 管理论文、书籍和知识记录
// V1.0.7: 使用 Database 抗象层，不直接访问 Storage

import Database from '../core/database.js';

const READING_KEY = 'workspace_readings';

const ReadingModule = {
  async list() {
    return await Database.get(READING_KEY, []);
  },

  async create(title, notes = '') {
    const records = await this.list();

    const record = {
      id: Date.now().toString(),
      type: 'reading',
      title,
      notes,
      tags: [],
      createdAt: new Date().toISOString()
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
    return filtered;
  }
};

export default ReadingModule;
