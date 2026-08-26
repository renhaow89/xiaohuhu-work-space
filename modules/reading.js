// Reading Module
// Paper and knowledge reading management

const ReadingModule = {
  create(title) {
    return {
      type: 'reading',
      title,
      notes: '',
      tags: [],
      createdAt: new Date().toISOString()
    };
  }
};

export default ReadingModule;
