// Research Module
// Scientific project and experiment records

const ResearchModule = {
  create(title) {
    return {
      type: 'research',
      title,
      content: '',
      files: [],
      createdAt: new Date().toISOString()
    };
  }
};

export default ResearchModule;
