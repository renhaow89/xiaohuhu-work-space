// Task Module
// Responsible for task management

import Storage from '../core/storage.js';

const TASK_KEY = 'workspace_tasks';

export const TaskModule = {
  async list() {
    return await Storage.load(TASK_KEY, []);
  },

  async create(title) {
    const tasks = await this.list();

    const task = {
      id: Date.now().toString(),
      type: 'task',
      title,
      status: 'todo',
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    await Storage.save(TASK_KEY, tasks);

    return task;
  },

  async complete(id) {
    const tasks = await this.list();

    const updated = tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          status: 'done',
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    });

    await Storage.save(TASK_KEY, updated);
    return updated;
  }
};
