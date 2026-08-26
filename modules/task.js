// Task Module
// 负责任务管理与时间任务支持（支持单点时间、跨日月时分时间段）
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
   * 数据标准化，确保向下兼容老数据与跨日月时间段
   * @private
   */
  _normalize(task) {
    if (!task) return task;
    const defaultDate = task.date || (task.createdAt ? task.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);

    let normalizedRange = {
      startDate: defaultDate,
      startTime: '',
      endDate: defaultDate,
      endTime: ''
    };

    if (task.timeRange && typeof task.timeRange === 'object') {
      normalizedRange.startDate = task.timeRange.startDate || task.date || defaultDate;
      normalizedRange.startTime = task.timeRange.startTime || task.timeRange.start || '';
      normalizedRange.endDate = task.timeRange.endDate || task.timeRange.startDate || task.date || defaultDate;
      normalizedRange.endTime = task.timeRange.endTime || task.timeRange.end || '';
    }

    return {
      id: task.id || Date.now().toString(),
      type: 'task',
      title: task.title || '',
      status: task.status || 'todo', // 'todo' | 'in-progress' | 'done'
      priority: task.priority || 'medium', // 'high' | 'medium' | 'low'
      date: task.date || defaultDate,
      timeType: task.timeType || 'none', // 'none' | 'point' | 'range'
      timePoint: task.timePoint || '',
      timeRange: normalizedRange,
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

    const defaultDate = taskData.date || new Date().toISOString().split('T')[0];

    const task = this._normalize({
      id: Date.now().toString() + Math.floor(Math.random() * 1000),
      type: 'task',
      title: taskData.title || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      date: defaultDate,
      timeType: taskData.timeType || 'none',
      timePoint: taskData.timePoint || '',
      timeRange: taskData.timeRange || {
        startDate: defaultDate,
        startTime: '',
        endDate: defaultDate,
        endTime: ''
      },
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
    const nowTimestamp = now.getTime();

    return tasks.filter(task => {
      if (task.status === 'done') return false;

      // 1. 如果是跨日月时间段任务
      if (task.timeType === 'range' && task.timeRange) {
        const { startDate, startTime, endDate, endTime } = task.timeRange;
        if (startDate && endDate) {
          // 当前日期落在开始与结束日期之间
          if (today >= startDate && today <= endDate) {
            // 如果起止都有时间，进一步比对精确时间
            if (startTime && endTime) {
              const startDt = new Date(`${startDate}T${startTime}:00`).getTime();
              const endDt = new Date(`${endDate}T${endTime}:00`).getTime();
              if (!isNaN(startDt) && !isNaN(endDt)) {
                // 如果当前时间处于起止时间戳之内，或者今天为进行中区间
                if (nowTimestamp >= startDt && nowTimestamp <= endDt) {
                  return true;
                }
              }
            }
            return true;
          }
        }
      }

      // 2. 如果是今天或历史未完成任务
      const isTodayOrPast = !task.date || task.date <= today;
      return isTodayOrPast;
    });
  }
};

export default TaskModule;
