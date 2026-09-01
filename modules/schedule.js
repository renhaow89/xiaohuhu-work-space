// Schedule Module
// 负责日程管理与日历时间安排
// 包含：日程增删改查、按日期/月份检索、状态流转与删除墓碑追踪
// 严格遵守分层：使用 Database 抽象层，不直接访问 Storage

import Database from '../core/database.js';

const SCHEDULE_KEY = 'workspace_schedules';
const DELETED_KEY = 'workspace_deleted_items';

export const ScheduleModule = {
  /**
   * 获取所有日程列表
   * @returns {Promise<Array>}
   */
  async list() {
    const items = await Database.get(SCHEDULE_KEY, []);
    return items.map(item => this._normalize(item));
  },

  /**
   * 数据标准化
   * @private
   */
  _normalize(item) {
    if (!item) return item;
    const defaultDate = item.date || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);

    return {
      id: item.id || Date.now().toString(),
      type: 'schedule',
      title: item.title || '',
      date: item.date || defaultDate,
      endDate: item.endDate || item.date || defaultDate,
      isAllDay: typeof item.isAllDay === 'boolean' ? item.isAllDay : !item.startTime,
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      category: item.category || '💼工作', // '💼工作' | '🔬科研' | '📖学习' | '🎉生活' | '📌重要'
      color: item.color || '#F4738A',
      details: item.details || '',
      status: item.status || 'pending', // 'pending' | 'done' | 'cancelled'
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString()
    };
  },

  /**
   * 创建日程
   * @param {object} input 日程对象
   * @returns {Promise<object>}
   */
  async create(input) {
    const list = await this.list();
    const today = new Date().toISOString().split('T')[0];

    const newItem = this._normalize({
      id: Date.now().toString() + Math.floor(Math.random() * 1000),
      type: 'schedule',
      title: input.title || '新日程',
      date: input.date || today,
      endDate: input.endDate || input.date || today,
      isAllDay: typeof input.isAllDay === 'boolean' ? input.isAllDay : (!input.startTime),
      startTime: input.startTime || '',
      endTime: input.endTime || '',
      category: input.category || '💼工作',
      color: input.color || '#F4738A',
      details: input.details || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    list.push(newItem);
    await Database.set(SCHEDULE_KEY, list);
    return newItem;
  },

  /**
   * 更新日程
   * @param {string} id
   * @param {object} updates
   * @returns {Promise<Array>}
   */
  async update(id, updates) {
    const list = await this.list();
    let found = false;

    const updated = list.map(item => {
      if (item.id === id) {
        found = true;
        return this._normalize({
          ...item,
          ...updates,
          updatedAt: new Date().toISOString()
        });
      }
      return item;
    });

    if (found) {
      await Database.set(SCHEDULE_KEY, updated);
    }
    return updated;
  },

  /**
   * 切换日程完成状态
   * @param {string} id
   * @returns {Promise<object>}
   */
  async toggleStatus(id) {
    const list = await this.list();
    let target = null;

    const updated = list.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'done' ? 'pending' : 'done';
        target = { ...item, status: nextStatus, updatedAt: new Date().toISOString() };
        return target;
      }
      return item;
    });

    if (target) {
      await Database.set(SCHEDULE_KEY, updated);
    }
    return target;
  },

  /**
   * 删除日程
   * @param {string} id
   * @returns {Promise<Array>}
   */
  async delete(id) {
    const list = await this.list();
    const filtered = list.filter(item => item.id !== id);
    await Database.set(SCHEDULE_KEY, filtered);

    try {
      const deletedMap = await Database.get(DELETED_KEY, {});
      deletedMap[id] = new Date().toISOString();
      await Database.set(DELETED_KEY, deletedMap);
    } catch (e) {
      console.warn('[ScheduleModule] Failed to record deletion tombstone:', e);
    }

    return filtered;
  },

  /**
   * 获取指定日期的所有日程（包含跨天日程）
   * @param {string} dateStr 'YYYY-MM-DD'
   * @returns {Promise<Array>}
   */
  async getByDate(dateStr) {
    const list = await this.list();
    return list.filter(item => {
      const start = item.date;
      const end = item.endDate || item.date;
      return dateStr >= start && dateStr <= end;
    });
  },

  /**
   * 获取指定年月的所有日程映射（以 YYYY-MM-DD 为键的字典）
   * @param {number} year
   * @param {number} month 1-12
   * @returns {Promise<object>}
   */
  async getMonthScheduleMap(year, month) {
    const list = await this.list();
    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    const map = {};

    list.forEach(item => {
      const start = item.date;
      const end = item.endDate || item.date;

      // 判断是否有交集在当月
      const sYearMonth = start.slice(0, 7);
      const eYearMonth = end.slice(0, 7);

      if (sYearMonth === prefix || eYearMonth === prefix || (start <= `${prefix}-01` && end >= `${prefix}-31`)) {
        // 如果是单日日程
        if (start === end) {
          if (!map[start]) map[start] = [];
          map[start].push(item);
        } else {
          // 跨天日程：将日程放入起止范围内的所有当天
          let curr = new Date(start);
          const stop = new Date(end);
          while (curr <= stop) {
            const dStr = curr.toISOString().split('T')[0];
            if (!map[dStr]) map[dStr] = [];
            map[dStr].push(item);
            curr.setDate(curr.getDate() + 1);
          }
        }
      }
    });

    return map;
  }
};

export default ScheduleModule;
