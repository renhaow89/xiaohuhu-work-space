// Journal Module
// 个人日常工作日志存储模块
// V1.0.7: 使用 Database 抗象层，不直接访问 Storage

import Database from '../core/database.js';

const JOURNAL_KEY = 'journals';

export const JournalModule = {
  async list() {
    return await Database.get(JOURNAL_KEY, []);
  },

  async create(entry) {
    const journals = await this.list();

    const item = {
      id: Date.now().toString(),
      date: entry.date || new Date().toISOString().slice(0, 10),
      content: entry.content || '',
      createdAt: new Date().toISOString()
    };

    journals.push(item);
    await Database.set(JOURNAL_KEY, journals);

    return item;
  },

  async delete(id) {
    const journals = await this.list();
    const filtered = journals.filter(j => j.id !== id);
    await Database.set(JOURNAL_KEY, filtered);
    return filtered;
  }
};
