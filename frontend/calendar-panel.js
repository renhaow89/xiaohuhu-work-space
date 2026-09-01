// Calendar Panel
// 日历日程与全景回顾面板 — 温馨粉橙手账风格
// 包含：月度日历网格、日程安排与管理、跨模块历史记录聚合回顾（任务、日志、文献、科研）

import ScheduleModule from '../modules/schedule.js';
import TaskModule from '../modules/task.js';
import JournalModule from '../modules/journal.js';
import ReadingModule from '../modules/reading.js';
import ResearchModule from '../modules/research.js';

export const CalendarPanel = {
  container: null,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth() + 1, // 1-12
  selectedDate: new Date().toISOString().split('T')[0], // 'YYYY-MM-DD'
  activeTab: 'schedules', // 'schedules' | 'review'
  isModalOpen: false,
  editingScheduleId: null,

  async init(container) {
    this.container = container;
    await this.render();
  },

  /**
   * 主渲染入口
   */
  async render() {
    if (!this.container) return;

    // 获取当月所有日程与各模块数据
    const schedulesMap = await ScheduleModule.getMonthScheduleMap(this.viewYear, this.viewMonth);
    const allTasks = await TaskModule.list().catch(() => []);
    const allJournals = await JournalModule.list().catch(() => []);
    const allReadings = await ReadingModule.list().catch(() => []);
    const allResearch = await ResearchModule.list().catch(() => []);

    // 聚合统计各日期的数据活跃度映射
    const activityMap = this._buildActivityMap(this.viewYear, this.viewMonth, {
      tasks: allTasks,
      journals: allJournals,
      readings: allReadings,
      research: allResearch
    });

    // 渲染日历主体 HTML
    this.container.innerHTML = `
      <div class="calendar-panel-wrapper">
        <!-- 顶部控制栏：年月切换、今天、新建日程 -->
        <div class="calendar-header-bar">
          <div class="calendar-nav-group">
            <button id="cal-prev-month" class="btn btn-secondary btn-sm" title="上一月">◀</button>
            <h2 id="cal-month-title" class="calendar-month-title">${this.viewYear}年 ${this.viewMonth}月</h2>
            <button id="cal-next-month" class="btn btn-secondary btn-sm" title="下一月">▶</button>
            <button id="cal-today-btn" class="btn btn-secondary btn-sm" title="跳转到今天">🏠 今天</button>
          </div>

          <div class="calendar-header-actions">
            <button id="cal-add-schedule-btn" class="btn btn-primary btn-sm">
              ➕ 新建日程
            </button>
          </div>
        </div>

        <!-- 日历主体区与右侧/下方面板（自适应双栏） -->
        <div class="calendar-main-grid-layout">
          <!-- 左侧：月度日历网格 -->
          <div class="calendar-grid-card">
            <div class="calendar-weekdays-header">
              <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span class="weekend">六</span><span class="weekend">日</span>
            </div>
            <div class="calendar-days-grid" id="calendar-days-container">
              ${this._renderMonthGrid(this.viewYear, this.viewMonth, schedulesMap, activityMap)}
            </div>
          </div>

          <!-- 右侧：选中日期的日程管理与多模块全景回顾 -->
          <div class="calendar-detail-card" id="calendar-detail-panel">
            ${await this._renderDetailPanel(allTasks, allJournals, allReadings, allResearch)}
          </div>
        </div>
      </div>

      <!-- 新建 / 编辑日程弹窗 -->
      <div class="schedule-modal-overlay ${this.isModalOpen ? 'active' : ''}" id="schedule-modal">
        <div class="schedule-modal-dialog">
          <div class="modal-header">
            <h3 id="schedule-modal-title">${this.editingScheduleId ? '✏️ 编辑日程' : '➕ 新建日程'}</h3>
            <button class="modal-close-btn" id="close-schedule-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="input-row">
              <label class="input-label">日程标题 *</label>
              <input id="sched-title-input" class="input-text" placeholder="例如：项目组会、文献研讨、答辩准备..." />
            </div>

            <div class="input-row">
              <label class="input-label">分类标签</label>
              <div class="category-selector" id="sched-category-selector">
                <button type="button" class="tag-btn active" data-cat="💼工作">💼工作</button>
                <button type="button" class="tag-btn" data-cat="🔬科研">🔬科研</button>
                <button type="button" class="tag-btn" data-cat="📖学习">📖学习</button>
                <button type="button" class="tag-btn" data-cat="🎉生活">🎉生活</button>
                <button type="button" class="tag-btn" data-cat="📌重要">📌重要</button>
              </div>
            </div>

            <div class="form-row-dual">
              <div class="input-row" style="flex: 1;">
                <label class="input-label">开始日期</label>
                <input id="sched-date-input" type="date" class="input-text" value="${this.selectedDate}" />
              </div>
              <div class="input-row" style="flex: 1;">
                <label class="input-label">结束日期 (选填)</label>
                <input id="sched-enddate-input" type="date" class="input-text" value="${this.selectedDate}" />
              </div>
            </div>

            <div class="input-row">
              <label class="checkbox-label" style="margin: 4px 0 8px 0; cursor: pointer;">
                <input id="sched-allday-check" type="checkbox" checked /> 全天日程
              </label>
            </div>

            <div class="form-row-dual" id="sched-time-inputs" style="display: none;">
              <div class="input-row" style="flex: 1;">
                <label class="input-label">开始时间</label>
                <input id="sched-starttime-input" type="time" class="input-text" value="09:00" />
              </div>
              <div class="input-row" style="flex: 1;">
                <label class="input-label">结束时间</label>
                <input id="sched-endtime-input" type="time" class="input-text" value="10:00" />
              </div>
            </div>

            <div class="input-row">
              <label class="input-label">详细备注</label>
              <textarea id="sched-details-input" class="input-textarea" rows="3" placeholder="添加地点、参会链接或详细备忘..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button id="cancel-schedule-modal" class="btn btn-secondary">取消</button>
            <button id="save-schedule-modal" class="btn btn-primary">✨ 保存日程</button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  },

  /**
   * 渲染月度日历方格
   */
  _renderMonthGrid(year, month, schedulesMap = {}, activityMap = {}) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const totalDays = lastDay.getDate();

    // 转换为周一为起始 (0 = Mon, 6 = Sun)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const todayStr = new Date().toISOString().split('T')[0];
    let html = '';

    // 1. 填充上月末尾空白格
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      html += `<div class="calendar-day-cell prev-month-day"><span class="day-number">${dayNum}</span></div>`;
    }

    // 2. 渲染当月每一天
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === this.selectedDate;

      const daySchedules = schedulesMap[dateStr] || [];
      const activities = activityMap[dateStr] || {};

      const hasJournals = activities.journalCount > 0;
      const hasTasks = activities.taskCount > 0;
      const hasReadings = activities.readingCount > 0;
      const hasResearch = activities.researchCount > 0;

      html += `
        <div class="calendar-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
          <div class="cell-top-bar">
            <span class="day-number">${day}</span>
            ${isToday ? '<span class="today-tag">今</span>' : ''}
          </div>

          <!-- 日程胶囊预览（最多显示2条） -->
          <div class="day-schedules-list">
            ${daySchedules.slice(0, 2).map(s => `
              <div class="mini-schedule-pill ${s.status === 'done' ? 'done' : ''}" title="${this.escapeHtml(s.title)}">
                <span class="pill-dot"></span>
                <span class="pill-title">${this.escapeHtml(s.title)}</span>
              </div>
            `).join('')}
            ${daySchedules.length > 2 ? `<div class="mini-more-tag">+${daySchedules.length - 2}条</div>` : ''}
          </div>

          <!-- 模块活动小徽标 -->
          <div class="day-activity-dots">
            ${hasJournals ? '<span class="activity-dot journal-dot" title="工作日志">📝</span>' : ''}
            ${hasTasks ? '<span class="activity-dot task-dot" title="任务待办">📌</span>' : ''}
            ${hasReadings ? '<span class="activity-dot reading-dot" title="文献阅读">📚</span>' : ''}
            ${hasResearch ? '<span class="activity-dot research-dot" title="科研记录">🧪</span>' : ''}
          </div>
        </div>
      `;
    }

    // 3. 填充下月月初空白格补齐 35 或 42 格
    const totalRendered = startDayOfWeek + totalDays;
    const remaining = (totalRendered % 7 === 0) ? 0 : 7 - (totalRendered % 7);
    for (let j = 1; j <= remaining; j++) {
      html += `<div class="calendar-day-cell next-month-day"><span class="day-number">${j}</span></div>`;
    }

    return html;
  },

  /**
   * 渲染选中日期的详情与多模块聚合回顾面板
   */
  async _renderDetailPanel(allTasks = [], allJournals = [], allReadings = [], allResearch = []) {
    const selectedDate = this.selectedDate;
    const schedules = await ScheduleModule.getByDate(selectedDate);

    // 格式化日期星期
    const dt = new Date(selectedDate + 'T00:00:00');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const formattedDateTitle = `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日 ${weekdays[dt.getDay()]}`;

    // 过滤当天相关的各模块记录
    const dayTasks = allTasks.filter(t => (t.date === selectedDate) || (t.timeRange && t.timeRange.startDate <= selectedDate && t.timeRange.endDate >= selectedDate));
    const dayJournals = allJournals.filter(j => (j.date === selectedDate) || (j.createdAt && j.createdAt.startsWith(selectedDate)));
    const dayReadings = allReadings.filter(r => r.createdAt && r.createdAt.startsWith(selectedDate));
    const dayResearch = allResearch.filter(res => res.createdAt && res.createdAt.startsWith(selectedDate));

    const totalReviewItems = dayTasks.length + dayJournals.length + dayReadings.length + dayResearch.length;

    return `
      <div class="detail-panel-header">
        <div class="detail-date-title">
          <span class="detail-icon">📅</span>
          <div>
            <h3>${formattedDateTitle}</h3>
            <span class="detail-sub-meta">共 ${schedules.length} 项日程 · ${totalReviewItems} 条历史记录</span>
          </div>
        </div>

        <div class="detail-tab-switcher">
          <button class="detail-tab-btn ${this.activeTab === 'schedules' ? 'active' : ''}" id="tab-show-schedules">
            📅 日程安排 (${schedules.length})
          </button>
          <button class="detail-tab-btn ${this.activeTab === 'review' ? 'active' : ''}" id="tab-show-review">
            🔍 全景回顾 (${totalReviewItems})
          </button>
        </div>
      </div>

      <!-- Tab 1: 日程安排管理 -->
      <div class="detail-content-tab ${this.activeTab === 'schedules' ? 'active' : ''}" id="detail-schedules-tab">
        <div class="quick-add-schedule-bar">
          <input id="quick-sched-title" class="input-text" placeholder="快速添加日程（按回车保存）..." />
          <button id="quick-sched-submit" class="btn btn-primary btn-sm">➕ 添加</button>
        </div>

        <div class="schedules-timeline-list">
          ${schedules.length === 0 ? `
            <div class="empty-state-mini">
              <span class="empty-icon-mini">🍃</span>
              <p>今天暂无日程安排，点击上方快速添加~</p>
            </div>
          ` : schedules.map(item => `
            <div class="schedule-item-card ${item.status === 'done' ? 'completed' : ''}" data-id="${item.id}">
              <div class="schedule-card-left">
                <input type="checkbox" class="schedule-check" ${item.status === 'done' ? 'checked' : ''} />
                <div class="schedule-card-body">
                  <div class="schedule-card-title-row">
                    <span class="badge badge-category">${this.escapeHtml(item.category)}</span>
                    <strong class="schedule-card-title">${this.escapeHtml(item.title)}</strong>
                  </div>
                  <div class="schedule-card-meta">
                    <span>🕒 ${item.isAllDay ? '全天' : (item.startTime ? `${item.startTime} ~ ${item.endTime || ''}` : '全天')}</span>
                    ${item.details ? `<span class="schedule-details-text">${this.escapeHtml(item.details)}</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="schedule-card-actions">
                <button class="btn-icon delete-schedule-btn" title="删除日程">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tab 2: 多模块全景时间线回顾 -->
      <div class="detail-content-tab ${this.activeTab === 'review' ? 'active' : ''}" id="detail-review-tab">
        <div class="review-timeline-container">
          ${totalReviewItems === 0 ? `
            <div class="empty-state-mini">
              <span class="empty-icon-mini">📖</span>
              <p>这一天还没有写入日志或任务记录哦~</p>
            </div>
          ` : `
            <!-- 1. 工作日志回顾 -->
            ${dayJournals.length > 0 ? `
              <div class="review-section-block">
                <h4 class="review-section-title">📝 工作日志 (${dayJournals.length})</h4>
                <div class="review-cards-list">
                  ${dayJournals.map(j => `
                    <div class="review-card journal-review-card">
                      <div class="review-card-header">
                        <span class="badge badge-info">${this.escapeHtml(j.category || '📝工作日志')}</span>
                        <span class="review-time">${j.createdAt ? new Date(j.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <div class="review-card-content">${this.escapeHtml(j.content)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- 2. 任务处理回顾 -->
            ${dayTasks.length > 0 ? `
              <div class="review-section-block">
                <h4 class="review-section-title">📌 任务事项 (${dayTasks.length})</h4>
                <div class="review-cards-list">
                  ${dayTasks.map(t => `
                    <div class="review-card task-review-card ${t.status === 'done' ? 'done-card' : ''}">
                      <div class="review-card-header">
                        <span class="badge ${t.status === 'done' ? 'badge-success' : 'badge-warning'}">
                          ${t.status === 'done' ? '✅ 已完成' : (t.status === 'in-progress' ? '⚡ 进行中' : '⏳ 待办')}
                        </span>
                        <strong class="review-task-title">${this.escapeHtml(t.title)}</strong>
                      </div>
                      ${t.details ? `<div class="review-card-content text-muted">${this.escapeHtml(t.details)}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- 3. 文献阅读回顾 -->
            ${dayReadings.length > 0 ? `
              <div class="review-section-block">
                <h4 class="review-section-title">📚 文献阅读 (${dayReadings.length})</h4>
                <div class="review-cards-list">
                  ${dayReadings.map(r => `
                    <div class="review-card reading-review-card">
                      <div class="review-card-header">
                        <span class="badge badge-primary">📚 文献</span>
                        <strong>${this.escapeHtml(r.title)}</strong>
                      </div>
                      ${r.notes ? `<div class="review-card-content">${this.escapeHtml(r.notes)}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- 4. 科研记录回顾 -->
            ${dayResearch.length > 0 ? `
              <div class="review-section-block">
                <h4 class="review-section-title">🧪 科研实验 (${dayResearch.length})</h4>
                <div class="review-cards-list">
                  ${dayResearch.map(res => `
                    <div class="review-card research-review-card">
                      <div class="review-card-header">
                        <span class="badge badge-success">🧪 科研</span>
                        <strong>${this.escapeHtml(res.title)}</strong>
                      </div>
                      ${res.content ? `<div class="review-card-content">${this.escapeHtml(res.content)}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          `}
        </div>
      </div>
    `;
  },

  /**
   * 统计各日期的历史数据活跃度
   */
  _buildActivityMap(year, month, data) {
    const map = {};

    // 统计日志
    (data.journals || []).forEach(j => {
      const d = j.date || (j.createdAt ? j.createdAt.slice(0, 10) : null);
      if (d) {
        if (!map[d]) map[d] = { journalCount: 0, taskCount: 0, readingCount: 0, researchCount: 0 };
        map[d].journalCount++;
      }
    });

    // 统计任务
    (data.tasks || []).forEach(t => {
      const d = t.date || (t.createdAt ? t.createdAt.slice(0, 10) : null);
      if (d) {
        if (!map[d]) map[d] = { journalCount: 0, taskCount: 0, readingCount: 0, researchCount: 0 };
        map[d].taskCount++;
      }
    });

    // 统计阅读
    (data.readings || []).forEach(r => {
      const d = r.createdAt ? r.createdAt.slice(0, 10) : null;
      if (d) {
        if (!map[d]) map[d] = { journalCount: 0, taskCount: 0, readingCount: 0, researchCount: 0 };
        map[d].readingCount++;
      }
    });

    // 统计科研
    (data.research || []).forEach(res => {
      const d = res.createdAt ? res.createdAt.slice(0, 10) : null;
      if (d) {
        if (!map[d]) map[d] = { journalCount: 0, taskCount: 0, readingCount: 0, researchCount: 0 };
        map[d].researchCount++;
      }
    });

    return map;
  },

  /**
   * 绑定界面交互事件
   */
  _bindEvents() {
    const container = this.container;

    // 1. 上一月 / 下一月 / 今天
    const prevBtn = container.querySelector('#cal-prev-month');
    const nextBtn = container.querySelector('#cal-next-month');
    const todayBtn = container.querySelector('#cal-today-btn');

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (this.viewMonth === 1) {
          this.viewYear--;
          this.viewMonth = 12;
        } else {
          this.viewMonth--;
        }
        this.render();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.viewMonth === 12) {
          this.viewYear++;
          this.viewMonth = 1;
        } else {
          this.viewMonth++;
        }
        this.render();
      };
    }

    if (todayBtn) {
      todayBtn.onclick = () => {
        const now = new Date();
        this.viewYear = now.getFullYear();
        this.viewMonth = now.getMonth() + 1;
        this.selectedDate = now.toISOString().split('T')[0];
        this.render();
      };
    }

    // 2. 点击日期方格
    const dayCells = container.querySelectorAll('.calendar-day-cell[data-date]');
    dayCells.forEach(cell => {
      cell.onclick = () => {
        const date = cell.dataset.date;
        if (date) {
          this.selectedDate = date;
          this.render();
        }
      };
    });

    // 3. Tab 切换（日程 vs 全景回顾）
    const tabSchedBtn = container.querySelector('#tab-show-schedules');
    const tabReviewBtn = container.querySelector('#tab-show-review');

    if (tabSchedBtn) {
      tabSchedBtn.onclick = () => {
        this.activeTab = 'schedules';
        this.render();
      };
    }

    if (tabReviewBtn) {
      tabReviewBtn.onclick = () => {
        this.activeTab = 'review';
        this.render();
      };
    }

    // 4. 快速添加日程
    const quickTitleInput = container.querySelector('#quick-sched-title');
    const quickSubmitBtn = container.querySelector('#quick-sched-submit');

    const handleQuickAdd = async () => {
      const title = (quickTitleInput?.value || '').trim();
      if (!title) return;

      await ScheduleModule.create({
        title,
        date: this.selectedDate,
        endDate: this.selectedDate,
        isAllDay: true,
        category: '💼工作'
      });

      if (quickTitleInput) quickTitleInput.value = '';
      await this.render();
    };

    if (quickSubmitBtn) quickSubmitBtn.onclick = handleQuickAdd;
    if (quickTitleInput) {
      quickTitleInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleQuickAdd();
        }
      };
    }

    // 5. 切换日程完成状态
    const checkBoxes = container.querySelectorAll('.schedule-check');
    checkBoxes.forEach(cb => {
      cb.onchange = async (e) => {
        const card = cb.closest('.schedule-item-card');
        const id = card?.dataset.id;
        if (id) {
          await ScheduleModule.toggleStatus(id);
          await this.render();
        }
      };
    });

    // 6. 删除日程
    const deleteBtns = container.querySelectorAll('.delete-schedule-btn');
    deleteBtns.forEach(btn => {
      btn.onclick = async () => {
        const card = btn.closest('.schedule-item-card');
        const id = card?.dataset.id;
        if (id && confirm('确定删除此日程吗？')) {
          await ScheduleModule.delete(id);
          await this.render();
        }
      };
    });

    // 7. 弹窗打开与关闭
    const addSchedBtn = container.querySelector('#cal-add-schedule-btn');
    const modal = container.querySelector('#schedule-modal');
    const closeBtn = container.querySelector('#close-schedule-modal');
    const cancelBtn = container.querySelector('#cancel-schedule-modal');

    const openModal = () => {
      this.isModalOpen = true;
      if (modal) modal.classList.add('active');
    };

    const closeModal = () => {
      this.isModalOpen = false;
      this.editingScheduleId = null;
      if (modal) modal.classList.remove('active');
    };

    if (addSchedBtn) addSchedBtn.onclick = openModal;
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    // 弹窗全天选择器联动
    const allDayCheck = container.querySelector('#sched-allday-check');
    const timeInputsRow = container.querySelector('#sched-time-inputs');
    if (allDayCheck && timeInputsRow) {
      allDayCheck.onchange = () => {
        timeInputsRow.style.display = allDayCheck.checked ? 'none' : 'flex';
      };
    }

    // 弹窗分类切换
    const catBtns = container.querySelectorAll('#sched-category-selector .tag-btn');
    let currentModalCategory = '💼工作';
    catBtns.forEach(btn => {
      btn.onclick = () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentModalCategory = btn.dataset.cat;
      };
    });

    // 弹窗保存
    const saveModalBtn = container.querySelector('#save-schedule-modal');
    if (saveModalBtn) {
      saveModalBtn.onclick = async () => {
        const title = (container.querySelector('#sched-title-input')?.value || '').trim();
        const date = container.querySelector('#sched-date-input')?.value || this.selectedDate;
        const endDate = container.querySelector('#sched-enddate-input')?.value || date;
        const isAllDay = container.querySelector('#sched-allday-check')?.checked;
        const startTime = isAllDay ? '' : (container.querySelector('#sched-starttime-input')?.value || '');
        const endTime = isAllDay ? '' : (container.querySelector('#sched-endtime-input')?.value || '');
        const details = (container.querySelector('#sched-details-input')?.value || '').trim();

        if (!title) {
          alert('请输入日程标题');
          return;
        }

        await ScheduleModule.create({
          title,
          date,
          endDate,
          isAllDay,
          startTime,
          endTime,
          category: currentModalCategory,
          details
        });

        closeModal();
        this.selectedDate = date;
        await this.render();
      };
    }
  },

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

window.CalendarPanel = CalendarPanel;
export default CalendarPanel;
