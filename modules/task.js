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
  }
};

export default TaskModule;
