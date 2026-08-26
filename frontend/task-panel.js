// Task Panel
// 任务管理前端面板 — 参考「写下来」与手账温馨风格
// 包含：顶部「☀️ 今天要处理」置顶提示、状态胶囊、多维时间/优先级录入表单、到点提醒与定时检查

import { TaskModule } from '../modules/task.js';

export const TaskPanel = {
  container: null,
  currentFilter: 'all', // 'all' | 'todo' | 'in-progress' | 'done'
  timerId: null,

  async init(container) {
    this.container = container;
    await this.render();
    this.startReminderTimer();
  },

  /**
   * 启动后台定时检查（定点提醒与时间段检查）
   */
  startReminderTimer() {
    if (this.timerId) return;

    this.timerId = setInterval(async () => {
      await this.checkReminders();
    }, 15000); // 每 15 秒检查一次
  },

  async checkReminders() {
    const tasks = await TaskModule.list();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const task of tasks) {
      if (task.status === 'done') continue;

      // 1. 定点提醒检查
      if (task.timeType === 'point' && task.date === today && task.timePoint === currentHM && !task.reminderSent) {
        this.triggerNotification(task);
        await TaskModule.update(task.id, { reminderSent: true });
        if (this.container) await this.render();
      }

      // 2. 时间段自动激活为进行中
      if (task.timeType === 'range' && task.date === today && task.timeRange && task.timeRange.start && task.timeRange.end) {
        if (currentHM >= task.timeRange.start && currentHM <= task.timeRange.end) {
          if (task.status === 'todo') {
            await TaskModule.update(task.id, { status: 'in-progress' });
            if (this.container) await this.render();
          }
        }
      }
    }
  },

  /**
   * 触发浏览器通知与页面 Toast 提醒
   */
  triggerNotification(task) {
    const title = '小呼呼任务提醒 🌸';
    const body = `【${task.title}】到时间啦！快去处理吧~`;

    // 1. 浏览器原生系统通知
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌸</text></svg>'
        });
      } catch (e) {
        console.warn('[Notification Error]', e);
      }
    }

    // 2. 页面内 Toast 提醒浮层
    this.showToast(`⏰ 任务提醒：【${this.escapeHtml(task.title)}】到时间啦！`);
  },

  showToast(message) {
    let toastContainer = document.getElementById('global-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'global-toast-container';
      toastContainer.className = 'global-toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  },

  async render() {
    if (!this.container) return;

    const allTasks = await TaskModule.list();
    const todayTasks = await TaskModule.getTodayPendingTasks();

    const todoCount = allTasks.filter(t => t.status === 'todo').length;
    const inProgressCount = allTasks.filter(t => t.status === 'in-progress').length;
    const doneCount = allTasks.filter(t => t.status === 'done').length;

    const filteredTasks = allTasks.filter(task => {
      if (this.currentFilter === 'todo') return task.status === 'todo';
      if (this.currentFilter === 'in-progress') return task.status === 'in-progress';
      if (this.currentFilter === 'done') return task.status === 'done';
      return true;
    });

    const todayStr = new Date().toISOString().split('T')[0];

    this.container.innerHTML = `
      <!-- 顶部置顶区：☀️ 今天要处理 -->
      <div class="today-focus-card">
        <div class="today-focus-header">
          <div class="today-focus-title">
            <span class="focus-icon">☀️</span>
            <span>今天要处理</span>
            <span class="focus-count-badge">${todayTasks.length}</span>
          </div>
          ${todayTasks.length > 0 ? `
            <div class="focus-subtitle">保持专注，一步一步完成吧~ ✨</div>
          ` : ''}
        </div>

        ${todayTasks.length > 0 ? `
          <div class="today-focus-list">
            ${todayTasks.map(task => `
              <div class="today-focus-item ${task.status === 'in-progress' ? 'focus-item-active' : ''}">
                <div class="focus-item-left">
                  <span class="priority-dot priority-${task.priority || 'medium'}" title="优先级: ${this.getPriorityLabel(task.priority)}"></span>
                  <div class="focus-item-info">
                    <span class="focus-item-title">${this.escapeHtml(task.title)}</span>
                    <div class="focus-item-meta">
                      ${this.renderTimeTag(task)}
                      ${task.details ? `<span class="focus-item-detail">${this.escapeHtml(task.details)}</span>` : ''}
                    </div>
                  </div>
                </div>
                <div class="focus-item-right">
                  ${task.status === 'in-progress' ? '<span class="status-pill status-pill-active">⏳ 进行中</span>' : ''}
                  <button class="btn btn-sm btn-primary quick-done-btn" data-id="${task.id}" title="快速完成">
                    ✓ 完成
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="today-empty-state">
            <div class="empty-cat-emoji">🐱💤</div>
            <p class="today-empty-text">今天没有待处理的事项，好好休息吧~ 🌸</p>
          </div>
        `}
      </div>

      <!-- 每日任务主区域头与统计胶囊 -->
      <div class="task-section-header">
        <div class="task-section-title-wrap">
          <div class="task-title-icon-box">📋</div>
          <div>
            <h3 class="task-main-heading">每日任务</h3>
            <p class="task-sub-heading">一步一步来，你可以的</p>
          </div>
        </div>

        <div class="task-stats-pills">
          <div class="stat-bubble">待办: <strong>${todoCount}</strong></div>
          <div class="stat-bubble stat-bubble-warn">进行中: <strong>${inProgressCount}</strong></div>
          <div class="stat-bubble stat-bubble-success">已完成: <strong>${doneCount}</strong></div>
        </div>
      </div>

      <!-- 任务录入卡片（参考截图手账排版） -->
      <div class="task-form-card">
        <div class="task-form-row">
          <div class="form-col col-title">
            <input
              id="taskTitleInput"
              class="input-text task-input-main"
              placeholder="任务名称..."
              autocomplete="off"
            />
          </div>

          <div class="form-col col-priority">
            <select id="taskPrioritySelect" class="select-input">
              <option value="medium" selected>🟡 中优先级</option>
              <option value="high">🔴 高优先级</option>
              <option value="low">🟢 低优先级</option>
            </select>
          </div>

          <div class="form-col col-date">
            <input
              id="taskDateInput"
              type="date"
              class="input-text date-input"
              value="${todayStr}"
            />
          </div>
        </div>

        <!-- 第二行：时间模式选择与时间输入 -->
        <div class="task-form-row time-row">
          <div class="form-col col-timetype">
            <select id="taskTimeTypeSelect" class="select-input">
              <option value="none" selected>🔘 无具体时间</option>
              <option value="point">⏰ 定点提醒</option>
              <option value="range">⏱️ 时间段任务</option>
            </select>
          </div>

          <div class="form-col col-timevalues" id="timeValuesContainer" style="display: none;">
            <div id="timePointWrap" style="display: none; width: 100%;">
              <input id="taskTimePoint" type="time" class="input-text" placeholder="提醒时间" />
            </div>
            <div id="timeRangeWrap" class="time-range-group" style="display: none;">
              <input id="taskTimeRangeStart" type="time" class="input-text" title="开始时间" />
              <span class="time-range-sep">至</span>
              <input id="taskTimeRangeEnd" type="time" class="input-text" title="结束时间" />
            </div>
          </div>

          <div class="form-col col-details">
            <input
              id="taskDetailsInput"
              class="input-text"
              placeholder="任务详情 / 备注（选填）"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="task-form-footer">
          <button id="writeTaskBtn" class="btn btn-primary btn-submit-task">
            写下来 🌸
          </button>
        </div>
      </div>

      <!-- 筛选标签栏 -->
      <div class="filter-tabs">
        <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">全部 (${allTasks.length})</button>
        <button class="filter-tab ${this.currentFilter === 'todo' ? 'active' : ''}" data-filter="todo">待办 (${todoCount})</button>
        <button class="filter-tab ${this.currentFilter === 'in-progress' ? 'active' : ''}" data-filter="in-progress">进行中 (${inProgressCount})</button>
        <button class="filter-tab ${this.currentFilter === 'done' ? 'active' : ''}" data-filter="done">已完成 (${doneCount})</button>
      </div>

      <!-- 任务列表区 -->
      <div class="task-list-container">
        ${filteredTasks.length ? `
          <ul id="taskList" class="item-list">
            ${filteredTasks.map(task => `
              <li class="task-item ${task.status === 'done' ? 'task-done' : ''} ${task.status === 'in-progress' ? 'task-item-inprogress' : ''}">
                <div class="task-left">
                  <input
                    type="checkbox"
                    class="task-checkbox"
                    data-id="${task.id}"
                    ${task.status === 'done' ? 'checked' : ''}
                    title="${task.status === 'done' ? '标记为未完成' : '标记为已完成'}"
                  />
                  <div class="task-main-info">
                    <div class="task-title-line">
                      <span class="priority-tag priority-tag-${task.priority || 'medium'}">${this.getPriorityLabel(task.priority)}</span>
                      <span class="task-title">${this.escapeHtml(task.title)}</span>
                    </div>
                    <div class="task-sub-meta">
                      ${this.renderTimeTag(task)}
                      <span class="meta-date">📅 ${task.date || task.createdAt.split('T')[0]}</span>
                      ${task.details ? `<span class="meta-details" title="${this.escapeHtml(task.details)}">📝 ${this.escapeHtml(task.details)}</span>` : ''}
                    </div>
                  </div>
                </div>

                <div class="task-actions">
                  ${task.status !== 'done' ? `
                    <button class="btn-icon btn-toggle-progress" data-id="${task.id}" title="${task.status === 'in-progress' ? '设为普通待办' : '设为进行中'}">
                      ${task.status === 'in-progress' ? '⏳' : '▶️'}
                    </button>
                  ` : ''}
                  <button class="btn-icon btn-delete" data-id="${task.id}" title="删除任务">🗑️</button>
                </div>
              </li>
            `).join('')}
          </ul>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">🍃</div>
            <p class="empty-text">这里还空空的~ 快写下第一条吧 ✨</p>
          </div>
        `}
      </div>
    `;

    this.bindEvents();
  },

  renderTimeTag(task) {
    if (task.timeType === 'point' && task.timePoint) {
      return `<span class="badge-time badge-time-point">⏰ ${task.timePoint}</span>`;
    }
    if (task.timeType === 'range' && task.timeRange && task.timeRange.start) {
      return `<span class="badge-time badge-time-range">⏱️ ${task.timeRange.start} - ${task.timeRange.end || '...'}</span>`;
    }
    return '';
  },

  getPriorityLabel(priority) {
    switch (priority) {
      case 'high': return '🔴 高';
      case 'low': return '🟢 低';
      default: return '🟡 中';
    }
  },

  bindEvents() {
    const titleInput = this.container.querySelector('#taskTitleInput');
    const prioritySelect = this.container.querySelector('#taskPrioritySelect');
    const dateInput = this.container.querySelector('#taskDateInput');
    const timeTypeSelect = this.container.querySelector('#taskTimeTypeSelect');
    const timeValuesContainer = this.container.querySelector('#timeValuesContainer');
    const timePointWrap = this.container.querySelector('#timePointWrap');
    const timeRangeWrap = this.container.querySelector('#timeRangeWrap');
    const timePointInput = this.container.querySelector('#taskTimePoint');
    const timeRangeStart = this.container.querySelector('#taskTimeRangeStart');
    const timeRangeEnd = this.container.querySelector('#taskTimeRangeEnd');
    const detailsInput = this.container.querySelector('#taskDetailsInput');
    const writeBtn = this.container.querySelector('#writeTaskBtn');

    // 时间类型下拉联动
    if (timeTypeSelect) {
      timeTypeSelect.onchange = () => {
        const val = timeTypeSelect.value;
        if (val === 'none') {
          timeValuesContainer.style.display = 'none';
          timePointWrap.style.display = 'none';
          timeRangeWrap.style.display = 'none';
        } else if (val === 'point') {
          timeValuesContainer.style.display = 'flex';
          timePointWrap.style.display = 'block';
          timeRangeWrap.style.display = 'none';

          // 请求浏览器通知权限
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        } else if (val === 'range') {
          timeValuesContainer.style.display = 'flex';
          timePointWrap.style.display = 'none';
          timeRangeWrap.style.display = 'flex';
        }
      };
    }

    const handleCreate = async () => {
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        return;
      }

      const taskData = {
        title,
        priority: prioritySelect.value,
        date: dateInput.value || new Date().toISOString().split('T')[0],
        timeType: timeTypeSelect.value,
        timePoint: timePointInput ? timePointInput.value : '',
        timeRange: {
          start: timeRangeStart ? timeRangeStart.value : '',
          end: timeRangeEnd ? timeRangeEnd.value : ''
        },
        details: detailsInput.value.trim(),
        status: 'todo'
      };

      await TaskModule.create(taskData);
      await this.render();
    };

    if (writeBtn) writeBtn.onclick = handleCreate;
    if (titleInput) {
      titleInput.onkeydown = async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await handleCreate();
        }
      };
    }

    // 顶部置顶区快速完成
    this.container.querySelectorAll('.quick-done-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await TaskModule.complete(id);
        await this.render();
      };
    });

    // 状态切换（checkbox）
    this.container.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.onchange = async () => {
        const id = cb.dataset.id;
        if (cb.checked) {
          await TaskModule.complete(id);
        } else {
          await TaskModule.update(id, { status: 'todo' });
        }
        await this.render();
      };
    });

    // 进行中 / 待办 切换
    this.container.querySelectorAll('.btn-toggle-progress').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const tasks = await TaskModule.list();
        const target = tasks.find(t => t.id === id);
        if (target) {
          const nextStatus = target.status === 'in-progress' ? 'todo' : 'in-progress';
          await TaskModule.update(id, { status: nextStatus });
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

window.TaskPanel = TaskPanel;
