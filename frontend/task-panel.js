// Task Panel
// 任务管理前端面板 — 参考「写下来」与手账温馨风格
// 包含：顶部「☀️ 今天要处理」置顶提示、状态胶囊、明确日月时分时间段/定点提醒录入表单、到点提醒与定时检查

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
   * 启动后台定时检查（定点提醒与跨日月时间段状态流转）
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
    const nowTs = now.getTime();
    const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const task of tasks) {
      if (task.status === 'done') continue;

      // 1. 定点提醒检查
      if (task.timeType === 'point' && task.date === today && task.timePoint === currentHM && !task.reminderSent) {
        this.triggerNotification(task);
        await TaskModule.update(task.id, { reminderSent: true });
        if (this.container) await this.render();
      }

      // 2. 跨日月时间段自动激活为进行中
      if (task.timeType === 'range' && task.timeRange) {
        const { startDate, startTime, endDate, endTime } = task.timeRange;
        if (startDate && endDate) {
          const startStr = `${startDate}T${startTime || '00:00'}:00`;
          const endStr = `${endDate}T${endTime || '23:59'}:59`;
          const sTime = new Date(startStr).getTime();
          const eTime = new Date(endStr).getTime();

          if (!isNaN(sTime) && !isNaN(eTime)) {
            if (nowTs >= sTime && nowTs <= eTime) {
              if (task.status === 'todo') {
                await TaskModule.update(task.id, { status: 'in-progress' });
                if (this.container) await this.render();
              }
            }
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

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

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

      <!-- 任务录入卡片（参考手账网格排版） -->
      <div class="task-form-card">
        <div class="task-form-row">
          <div class="form-col col-title">
            <textarea
              id="taskTitleInput"
              class="input-text task-input-main task-textarea-auto"
              rows="1"
              placeholder="任务名称... (Enter提交, Shift+Enter换行)"
              autocomplete="off"
            ></textarea>
          </div>

          <div class="form-col col-priority">
            <select id="taskPrioritySelect" class="select-input">
              <option value="medium" selected>🟡 中优先级</option>
              <option value="high">🔴 高优先级</option>
              <option value="low">🟢 低优先级</option>
            </select>
          </div>

          <div class="form-col col-date" id="singleDateWrap">
            <input
              id="taskDateInput"
              type="date"
              class="input-text date-input"
              value="${todayStr}"
              title="任务日期"
            />
          </div>

          <div class="form-col col-details" id="row1DetailsWrap" style="display: none;">
            <textarea
              id="taskDetailsInputAlt"
              class="input-text task-textarea-auto"
              rows="1"
              placeholder="任务详情 / 备注（选填，Shift+Enter换行）"
              autocomplete="off"
            ></textarea>
          </div>
        </div>

        <!-- 第二行：时间模式选择与时间输入 -->
        <div class="task-form-row time-row">
          <div class="form-col col-timetype">
            <select id="taskTimeTypeSelect" class="select-input">
              <option value="none" selected>🔘 无具体时间</option>
              <option value="point">⏰ 定点提醒 (时分)</option>
              <option value="range">⏱️ 时间段任务 (跨日月时分)</option>
            </select>
          </div>

          <!-- 定点提醒时间输入 -->
          <div class="form-col col-timepoint" id="timePointWrap" style="display: none;">
            <input id="taskTimePoint" type="time" class="input-text" placeholder="提醒时间" />
          </div>

          <!-- 跨日月时分时间段输入区 -->
          <div class="form-col col-timerange-full" id="timeRangeWrap" style="display: none;">
            <div class="range-field-group">
              <span class="range-label">开始:</span>
              <input id="taskRangeStartDate" type="date" class="input-text date-input-sm" value="${todayStr}" title="开始日期" />
              <input id="taskRangeStartTime" type="time" class="input-text time-input-sm" value="09:00" title="开始时间" />
            </div>
            <span class="time-range-sep">至</span>
            <div class="range-field-group">
              <span class="range-label">结束:</span>
              <input id="taskRangeEndDate" type="date" class="input-text date-input-sm" value="${todayStr}" title="结束日期" />
              <input id="taskRangeEndTime" type="time" class="input-text time-input-sm" value="18:00" title="结束时间" />
            </div>
          </div>

          <!-- 详情备注（非时间段模式下显示在第二行） -->
          <div class="form-col col-details" id="row2DetailsWrap">
            <textarea
              id="taskDetailsInput"
              class="input-text task-textarea-auto"
              rows="1"
              placeholder="任务详情 / 备注（选填，Shift+Enter换行）"
              autocomplete="off"
            ></textarea>
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
                      ${task.timeType !== 'range' ? `<span class="meta-date">📅 ${task.date || task.createdAt.split('T')[0]}</span>` : ''}
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
    if (task.timeType === 'range' && task.timeRange) {
      const { startDate, startTime, endDate, endTime } = task.timeRange;
      if (startDate && endDate) {
        if (startDate === endDate) {
          const timeStr = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || '全天';
          return `<span class="badge-time badge-time-range">⏱️ ${startDate.slice(5)} ${timeStr}</span>`;
        } else {
          return `<span class="badge-time badge-time-range">⏱️ ${startDate.slice(5)} ${startTime || '00:00'} 至 ${endDate.slice(5)} ${endTime || '23:59'}</span>`;
        }
      }
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
    const singleDateWrap = this.container.querySelector('#singleDateWrap');
    const row1DetailsWrap = this.container.querySelector('#row1DetailsWrap');
    const row2DetailsWrap = this.container.querySelector('#row2DetailsWrap');

    const timeTypeSelect = this.container.querySelector('#taskTimeTypeSelect');
    const timePointWrap = this.container.querySelector('#timePointWrap');
    const timeRangeWrap = this.container.querySelector('#timeRangeWrap');
    const timePointInput = this.container.querySelector('#taskTimePoint');

    const rangeStartDateInput = this.container.querySelector('#taskRangeStartDate');
    const rangeStartTimeInput = this.container.querySelector('#taskRangeStartTime');
    const rangeEndDateInput = this.container.querySelector('#taskRangeEndDate');
    const rangeEndTimeInput = this.container.querySelector('#taskRangeEndTime');

    const detailsInput = this.container.querySelector('#taskDetailsInput');
    const detailsInputAlt = this.container.querySelector('#taskDetailsInputAlt');
    const writeBtn = this.container.querySelector('#writeTaskBtn');

    // 自适应高度与多行按键监听
    const autoResize = (el) => {
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    };

    const attachMultiLineKeyHandler = (el) => {
      if (!el) return;
      el.addEventListener('input', () => autoResize(el));
      el.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          if (e.shiftKey) {
            // Shift + Enter 允许原生换行，并在下一事件循环更新自适应高度
            setTimeout(() => autoResize(el), 0);
            return;
          }
          // 单独 Enter 触发任务创建
          e.preventDefault();
          await handleCreate();
        }
      });
    };

    attachMultiLineKeyHandler(titleInput);
    attachMultiLineKeyHandler(detailsInput);
    attachMultiLineKeyHandler(detailsInputAlt);

    // 时间类型下拉联动
    if (timeTypeSelect) {
      timeTypeSelect.onchange = () => {
        const val = timeTypeSelect.value;
        if (val === 'none') {
          singleDateWrap.style.display = 'block';
          row1DetailsWrap.style.display = 'none';
          row2DetailsWrap.style.display = 'block';
          timePointWrap.style.display = 'none';
          timeRangeWrap.style.display = 'none';
        } else if (val === 'point') {
          singleDateWrap.style.display = 'block';
          row1DetailsWrap.style.display = 'none';
          row2DetailsWrap.style.display = 'block';
          timePointWrap.style.display = 'block';
          timeRangeWrap.style.display = 'none';

          // 请求浏览器通知权限
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        } else if (val === 'range') {
          singleDateWrap.style.display = 'none';
          row1DetailsWrap.style.display = 'block';
          row2DetailsWrap.style.display = 'none';
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

      const isRange = timeTypeSelect.value === 'range';
      const details = (isRange && detailsInputAlt && detailsInputAlt.value.trim()) || (detailsInput ? detailsInput.value.trim() : '');

      let timeRangeData = {
        startDate: (isRange && rangeStartDateInput && rangeStartDateInput.value) || dateInput.value || new Date().toISOString().split('T')[0],
        startTime: (isRange && rangeStartTimeInput && rangeStartTimeInput.value) || '09:00',
        endDate: (isRange && rangeEndDateInput && rangeEndDateInput.value) || dateInput.value || new Date().toISOString().split('T')[0],
        endTime: (isRange && rangeEndTimeInput && rangeEndTimeInput.value) || '18:00'
      };

      const taskData = {
        title,
        priority: prioritySelect.value,
        date: isRange ? timeRangeData.startDate : (dateInput.value || new Date().toISOString().split('T')[0]),
        timeType: timeTypeSelect.value,
        timePoint: timePointInput ? timePointInput.value : '',
        timeRange: timeRangeData,
        details,
        status: 'todo'
      };

      await TaskModule.create(taskData);
      await this.render();
    };

    if (writeBtn) writeBtn.onclick = handleCreate;

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
