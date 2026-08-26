// Task Module
// 负责任务管理与时间任务支持
// 严格遵守分层：使用 Database 抽象层，不直接访问 Storage / localStorage

import Database from '../core/database.js';

const TASK_KEY = 'workspace_tasks';

export const TaskModule = {
  /**
   * 获取所有任务列表
   * @returns {Promise<Array>}
   */
  async list() {
    const tasks = await Database.get(TASK_KEY, []);
    return tasks.map(t => this._normalize(t));
  },

  /**
   * 数据标准化，确保向下兼容老数据
   * @private
   */
  _normalize(task) {
    if (!task) return task;
    return {
      id: task.id || Date.now().toString(),
      type: 'task',
      title: task.title || '',
      status: task.status || 'todo', // 'todo' | 'in-progress' | 'done'
      priority: task.priority || 'medium', // 'high' | 'medium' | 'low'
      date: task.date || (task.createdAt ? task.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      timeType: task.timeType || 'none', // 'none' | 'point' | 'range'
      timePoint: task.timePoint || '',
      timeRange: task.timeRange || { start: '', end: '' },
      details: task.details || '',
      reminderSent: task.reminderSent || false,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: task.updatedAt || task.createdAt || new Date().toISOString()
    };
  },

  /**
   * 创建任务
   * @param {string|object} input 任务标题字符串或任务对象
   * @returns {Promise<object>}
   */
  async create(input) {
    const tasks = await this.list();

    let taskData = {};
    if (typeof input === 'string') {
      taskData = { title: input };
    } else if (typeof input === 'object' && input !== null) {
      taskData = input;
    }

    const task = this._normalize({
      id: Date.now().toString() + Math.floor(Math.random() * 1000),
      type: 'task',
      title: taskData.title || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      date: taskData.date || new Date().toISOString().split('T')[0],
      timeType: taskData.timeType || 'none',
      timePoint: taskData.timePoint || '',
      timeRange: taskData.timeRange || { start: '', end: '' },
      details: taskData.details || '',
      reminderSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    tasks.push(task);
    await Database.set(TASK_KEY, tasks);
    return task;
  },

  /**
   * 更新任务
   * @param {string} id 任务ID
   * @param {object} updates 更新属性
   * @returns {Promise<Array>} 更新后的列表
   */
  async update(id, updates) {
    const tasks = await this.list();
    let found = false;

    const updated = tasks.map(task => {
      if (task.id === id) {
        found = true;
        return this._normalize({
          ...task,
          ...updates,
          updatedAt: new Date().toISOString()
        });
      }
      return task;
    });

    if (found) {
      await Database.set(TASK_KEY, updated);
    }
    return updated;
  },

  /**
   * 标记任务完成
   * @param {string} id
   * @returns {Promise<Array>}
   */
  async complete(id) {
    return await this.update(id, { status: 'done' });
  },

  /**
   * 删除任务
   * @param {string} id
   * @returns {Promise<Array>}
   */
  async delete(id) {
    const tasks = await this.list();
    const filtered = tasks.filter(task => task.id !== id);
    await Database.set(TASK_KEY, filtered);
    return filtered;
  },

  /**
   * 获取今日需要处理的任务列表（包括今日待办、进行中、或处于当前时间段内的任务）
   * @returns {Promise<Array>}
   */
  async getTodayPendingTasks() {
    const tasks = await this.list();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return tasks.filter(task => {
      if (task.status === 'done') return false;

      // 1. 如果是今天或历史未完成任务
      const isTodayOrPast = !task.date || task.date <= today;

      // 2. 如果是时间段任务且当前时间在时间段内
      if (task.timeType === 'range' && task.timeRange && task.timeRange.start && task.timeRange.end) {
        if (task.date === today && currentHM >= task.timeRange.start && currentHM <= task.timeRange.end) {
          return true;
        }
      }

      return isTodayOrPast;
    });
  }
};

export default TaskModule;
