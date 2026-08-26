// Task Module
// 负责任务管理
// V1.0.7: 使用 Database 抗象层，不直接访问 Storage

import Database from '../core/database.js';

const TASK_KEY = 'workspace_tasks';

export const TaskModule = {
  async list() {
    return await Database.get(TASK_KEY, []);
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
    await Database.set(TASK_KEY, tasks);

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

    await Database.set(TASK_KEY, updated);
    return updated;
  },

  async delete(id) {
    const tasks = await this.list();
    const filtered = tasks.filter(task => task.id !== id);
    await Database.set(TASK_KEY, filtered);
    return filtered;
  }
};
