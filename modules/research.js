// Research Module
// Manage experiments, projects and research records

import Storage from '../core/storage.js';

const RESEARCH_KEY = 'workspace_research';

const ResearchModule = {
  async list() {
    return await Storage.load(RESEARCH_KEY, []);
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
    await Storage.save(RESEARCH_KEY, records);

    return record;
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

    await Storage.save(RESEARCH_KEY, updated);
    return updated;
  }
};

export default ResearchModule;
