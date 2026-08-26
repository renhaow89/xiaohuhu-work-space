// Task Module
// Responsible for task management

const TaskModule = {
  create(title) {
    return {
      type: 'task',
      title,
      status: 'todo',
      createdAt: new Date().toISOString()
    };
  },

  complete(task) {
    return {
      ...task,
      status: 'done',
      updatedAt: new Date().toISOString()
    };
  }
};

export default TaskModule;
