// Research Module
// 管理实验、项目和科研记录
// V1.0.8: 支持命名与默认导出兼容

import Database from '../core/database.js';

const RESEARCH_KEY = 'workspace_research';

export const ResearchModule = {
  async list() {
    return await Database.get(RESEARCH_KEY, []);
  },

  async create(title, content = '') {
    const records = await this.list();

    const record = {
      id: Date.now().toString(),
      type: 'research',
      title,
      content,
      files: [],
      tags: [],
      createdAt: new Date().toISOString()
    };

    records.push(record);
    await Database.set(RESEARCH_KEY, records);

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

    await Database.set(RESEARCH_KEY, updated);
    return updated;
  },

  async attachFile(id, file) {
    const records = await this.list();

    const updated = records.map(record => {
      if (record.id === id) {
        return {
          ...record,
          files: [...(record.files || []), file],
          updatedAt: new Date().toISOString()
        };
      }
      return record;
    });

    await Database.set(RESEARCH_KEY, updated);
    return updated;
  },

  async delete(id) {
    const records = await this.list();
    const filtered = records.filter(r => r.id !== id);
    await Database.set(RESEARCH_KEY, filtered);
    return filtered;
  }
};

export default ResearchModule;
