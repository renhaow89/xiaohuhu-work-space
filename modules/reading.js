// Reading Module
// Manage papers, books and knowledge records

import Storage from '../core/storage.js';

const READING_KEY = 'workspace_readings';

const ReadingModule = {
  async list() {
    return await Storage.load(READING_KEY, []);
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
    await Storage.save(READING_KEY, records);

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

    await Storage.save(READING_KEY, updated);
    return updated;
  }
};

export default ReadingModule;
