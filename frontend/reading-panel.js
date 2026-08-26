// Reading Panel
// 阅读中心面板（文献、论文、书籍、笔记管理）— 温暖粉橙主题重构
// 支持阅读状态切换、读书笔记、筛选及删除

import ReadingModule from '../modules/reading.js';

export const ReadingPanel = {
  container: null,
  currentStatusFilter: 'all',

  async init(container) {
    this.container = container;
    await this.render();
  },

  async render() {
    if (!this.container) return;

    const records = await ReadingModule.list();
    const readingCount = records.filter(r => r.status === 'reading').length;
    const finishedCount = records.filter(r => r.status === 'finished').length;
    const planCount = records.filter(r => !r.status || r.status === 'unread').length;

    const filtered = records.filter(r => {
      const status = r.status || 'unread';
      if (this.currentStatusFilter === 'unread') return status === 'unread';
      if (this.currentStatusFilter === 'reading') return status === 'reading';
      if (this.currentStatusFilter === 'finished') return status === 'finished';
      return true;
    });

    this.container.innerHTML = `
      <div class="panel-header">
        <h2>📚 阅读中心</h2>
        <div class="panel-stats">
          <span class="badge badge-warning">在读 ${readingCount}</span>
          <span class="badge badge-success">已读 ${finishedCount}</span>
        </div>
      </div>

      <!-- 添加文献表单卡片 -->
      <div class="form-card">
        <div class="reading-form">
          <input
            id="readingTitle"
            class="input-text"
            placeholder="书名 / 论文题目 / 文章链接..."
            autocomplete="off"
          />
          <textarea
            id="readingNotes"
            class="input-textarea"
            rows="2"
            placeholder="核心观点或阅读笔记（选填）..."
          ></textarea>
          
          <div class="reading-form-footer">
            <select id="readingStatusSelect" class="select-input">
              <option value="reading">📖 正在阅读</option>
              <option value="unread">📌 计划阅读</option>
              <option value="finished">✅ 已经读完</option>
            </select>
            <button id="addReadingBtn" class="btn btn-primary">
              📚 保存文献
            </button>
          </div>
        </div>
      </div>

      <!-- 筛选标签栏 -->
      <div class="filter-tabs">
        <button class="filter-tab ${this.currentStatusFilter === 'all' ? 'active' : ''}" data-filter="all">全部 (${records.length})</button>
        <button class="filter-tab ${this.currentStatusFilter === 'reading' ? 'active' : ''}" data-filter="reading">在读 (${readingCount})</button>
        <button class="filter-tab ${this.currentStatusFilter === 'unread' ? 'active' : ''}" data-filter="unread">想读 (${planCount})</button>
        <button class="filter-tab ${this.currentStatusFilter === 'finished' ? 'active' : ''}" data-filter="finished">已读 (${finishedCount})</button>
      </div>

      <!-- 阅读卡片列表 -->
      <div class="reading-list">
        ${filtered.length ? filtered.map(item => `
          <div class="reading-card">
            <div class="reading-card-header">
              <div class="reading-info">
                <span class="badge ${item.status === 'finished' ? 'badge-success' : item.status === 'reading' ? 'badge-warning' : 'badge-category'}">
                  ${item.status === 'finished' ? '✅ 已读完' : item.status === 'reading' ? '📖 在读' : '📌 想读'}
                </span>
                <strong class="reading-title">${this.escapeHtml(item.title)}</strong>
              </div>
              <button class="btn-icon btn-delete-reading" data-id="${item.id}" title="删除记录">🗑️</button>
            </div>
            ${item.notes ? `<div class="reading-notes">💬 ${this.escapeHtml(item.notes)}</div>` : ''}
            <div class="reading-meta">
              <span>添加于：${new Date(item.createdAt).toLocaleDateString()}</span>
              <div class="status-toggle-buttons">
                ${item.status !== 'reading' ? `<button class="btn-link btn-status-change" data-id="${item.id}" data-status="reading">设为在读</button>` : ''}
                ${item.status !== 'finished' ? `<button class="btn-link btn-status-change" data-id="${item.id}" data-status="finished">设为已读</button>` : ''}
              </div>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <p class="empty-text">暂无阅读记录，挑一本好书开始吧～</p>
          </div>
        `}
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const titleInput = this.container.querySelector('#readingTitle');
    const notesInput = this.container.querySelector('#readingNotes');
    const statusSelect = this.container.querySelector('#readingStatusSelect');
    const addBtn = this.container.querySelector('#addReadingBtn');

    if (addBtn) {
      addBtn.onclick = async () => {
        const title = titleInput.value.trim();
        if (!title) return;

        const record = await ReadingModule.create(title, notesInput.value.trim());
        if (statusSelect.value !== 'unread') {
          await ReadingModule.update(record.id, { status: statusSelect.value });
        }

        titleInput.value = '';
        notesInput.value = '';
        await this.render();
      };
    }

    // 状态切换按钮
    this.container.querySelectorAll('.btn-status-change').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const newStatus = btn.dataset.status;
        await ReadingModule.update(id, { status: newStatus });
        await this.render();
      };
    });

    // 筛选标签
    this.container.querySelectorAll('.filter-tab').forEach(tab => {
      tab.onclick = async () => {
        this.currentStatusFilter = tab.dataset.filter;
        await this.render();
      };
    });

    // 删除
    this.container.querySelectorAll('.btn-delete-reading').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        await ReadingModule.delete(id);
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

window.ReadingPanel = ReadingPanel;
