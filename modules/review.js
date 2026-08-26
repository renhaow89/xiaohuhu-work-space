// Review Module
// Daily and periodic review management

const ReviewModule = {
  create(content) {
    return {
      type: 'review',
      content,
      createdAt: new Date().toISOString()
    };
  }
};

export default ReviewModule;
