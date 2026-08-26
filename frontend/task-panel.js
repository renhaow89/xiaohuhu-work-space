// Task Panel
// 任务管理前端面板
// V1.0.8: 支持任务筛选、快捷完成、删除、统计及键盘快捷键

import { TaskModule } from '../modules/task.js';

export const TaskPanel = {
  container: null,
  currentFilter: 'all', // 'all' | 'todo' | 'done'

  async init(container) {
    this.container = container;
    await this.render();
  },

  async render() {
    if (!this.container) return;

    const allTasks = await TaskModule.list();
    const todoCount = allTasks.filter(t => t.status === 'todo').length;
    const doneCount = allTasks.filter(t => t.status === 'done').length;

    const filteredTasks = allTasks.filter(task => {
      if (this.currentFilter === 'todo') return task.status === 'todo';
      if (this.currentFilter === 'done') return task.status === 'done';
      return true;
    });

    this.container.innerHTML = `
      <div class="panel-header">
        <h2>📌 任务管理</h2>
        <div class="panel-stats">
          <span class="badge ${todoCount > 0 ? 'badge-warning' : 'badge-success'}">待办 ${todoCount}</span>
          <span class="badge badge-info">已完成 ${doneCount}</span>
        </div>
      </div>

      <div class="input-group">
        <input id="taskInput" class="input-text" placeholder="添加新任务，按回车快速创建..." />
        <button id="addTaskBtn" class="btn btn-primary">添加任务</button>
      </div>

      <div class="filter-tabs">
        <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">全部 (${allTasks.length})</button>
        <button class="filter-tab ${this.currentFilter === 'todo' ? 'active' : ''}" data-filter="todo">进行中 (${todoCount})</button>
        <button class="filter-tab ${this.currentFilter === 'done' ? 'active' : ''}" data-filter="done">已完成 (${doneCount})</button>
      </div>

      <div class="task-list-container">
        ${filteredTasks.length ? `
          <ul id="taskList" class="item-list">
            ${filteredTasks.map(task => `
              <li class="task-item ${task.status === 'done' ? 'task-done' : ''}">
                <div class="task-left">
                  <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.status === 'done' ? 'checked' : ''} />
                  <span class="task-title">${this.escapeHtml(task.title)}</span>
                </div>
                <div class="task-actions">
                  <span class="item-time">${new Date(task.createdAt).toLocaleDateString()}</span>
                  <button class="btn-icon btn-delete" data-id="${task.id}" title="删除任务">🗑️</button>
                </div>
              </li>
            `).join('')}
          </ul>
        ` : `
          <p class="empty-state">暂无${this.currentFilter === 'all' ? '' : this.currentFilter === 'todo' ? '进行中' : '已完成'}任务</p>
        `}
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const input = this.container.querySelector('#taskInput');
    const addBtn = this.container.querySelector('#addTaskBtn');

    const handleCreate = async () => {
      const title = input.value.trim();
      if (!title) return;
      await TaskModule.create(title);
      input.value = '';
      await this.render();
    };

    if (addBtn) addBtn.onclick = handleCreate;
    if (input) {
      input.onkeydown = async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await handleCreate();
        }
      };
    }

    // 状态切换（checkbox）
    this.container.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.onchange = async () => {
        const id = cb.dataset.id;
        const tasks = await TaskModule.list();
        const target = tasks.find(t => t.id === id);
        if (target) {
          if (cb.checked) {
            await TaskModule.complete(id);
          } else {
            // 重新置为 todo
            target.status = 'todo';
            target.updatedAt = new Date().toISOString();
            const Database = (await import('../core/database.js')).default;
            await Database.set('workspace_tasks', tasks);
          }
          await this.render();
        }
      };
    });

    // 删除任务
    this.container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await TaskModule.delete(id);
        await this.render();
      };
    });

    // 筛选标签
    this.container.querySelectorAll('.filter-tab').forEach(tab => {
      tab.onclick = async () => {
        this.currentFilter = tab.dataset.filter;
        await this.render();
      };
    });
  },

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};
