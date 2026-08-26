// Reading Module
// Manage papers, books and knowledge records

const ReadingModule = {
  create(title, notes = '') {
    return {
      type: 'reading',
      title,
      notes,
      tags: [],
      createdAt: new Date().toISOString()
    };
  },

  update(record, changes = {}) {
    return {
      ...record,
      ...changes,
      updatedAt: new Date().toISOString()
    };
  }
};

export default ReadingModule;
