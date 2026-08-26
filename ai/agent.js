// AI Agent Interface
// Future GPT / local model integration point

const Agent = {
  ask(prompt) {
    return {
      prompt,
      status: 'pending'
    };
  },

  remember(data) {
    return data;
  }
};

export default Agent;
