// Journal Module
// 个人日常工作日志存储模块
// V1.0.7: 使用 Database 抽象层，不直接访问 Storage
// V1.2.5: 增加 updatedAt 与删除墓碑追踪

import Database from '../core/database.js';

const JOURNAL_KEY = 'journals';
const DELETED_KEY = 'workspace_deleted_items';

export const JournalModule = {
  async list() {
    return await Database.get(JOURNAL_KEY, []);
  },

  async create(entry) {
    const journals = await this.list();

    const item = {
      id: Date.now().toString() + Math.floor(Math.random() * 1000),
      category: entry.category || '💻开发',
      date: entry.date || new Date().toISOString().slice(0, 10),
      content: entry.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    journals.push(item);
    await Database.set(JOURNAL_KEY, journals);

    return item;
  },

  async delete(id) {
    const journals = await this.list();
    const filtered = journals.filter(j => j.id !== id);
    await Database.set(JOURNAL_KEY, filtered);

    try {
      const deletedMap = await Database.get(DELETED_KEY, {});
      deletedMap[id] = new Date().toISOString();
      await Database.set(DELETED_KEY, deletedMap);
    } catch (e) {
      console.warn('[JournalModule] Failed to record deletion tombstone:', e);
    }

    return filtered;
  }
};

export default JournalModule;
