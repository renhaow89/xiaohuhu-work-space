// Research Module
// Manage experiments, projects and research records

const ResearchModule = {
  create(title, content = '') {
    return {
      type: 'research',
      title,
      content,
      files: [],
      tags: [],
      createdAt: new Date().toISOString()
    };
  },

  attachFile(record, file) {
    return {
      ...record,
      files: [...(record.files || []), file],
      updatedAt: new Date().toISOString()
    };
  }
};

export default ResearchModule;
