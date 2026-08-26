// Journal Panel
// 个人日常工作日志面板
// V1.0.8: 支持分类标签、快捷键保存、删除与优雅卡片流展示

import { JournalModule } from '../modules/journal.js';

export const JournalPanel = {
  container: null,
  selectedCategory: '💻开发',

  async init(container) {
    this.container = container;
    await this.render();
  },

  async render() {
    if (!this.container) return;

    const journals = await JournalModule.list();
    // 逆序排列，最新记录排在前面
    const sorted = [...journals].reverse();

    const categories = ['💻开发', '🧪实验', '📖思考', '📌总结', '💡灵感'];

    this.container.innerHTML = `
      <div class="panel-header">
        <h2>📝 今日记录</h2>
        <span class="badge badge-info">共 ${journals.length} 篇日志</span>
      </div>

      <div class="journal-box">
        <div class="category-selector">
          ${categories.map(cat => `
            <button type="button" class="tag-btn ${this.selectedCategory === cat ? 'active' : ''}" data-cat="${cat}">
              ${cat}
            </button>
          `).join('')}
        </div>

        <textarea id="journal-input" class="input-textarea" rows="3" placeholder="记录今天的工作、实验与思考... (支持 Ctrl+Enter 快捷保存)"></textarea>
        
        <div class="journal-action-bar">
          <span class="tip-text">按 Ctrl + Enter 快捷提交</span>
          <button id="save-journal" class="btn btn-primary">保存记录</button>
        </div>

        <div class="journal-list">
          ${sorted.length ? sorted.map(j => `
            <div class="journal-card">
              <div class="journal-card-header">
                <div class="journal-meta">
                  <span class="badge badge-category">${this.escapeHtml(j.category || '📝记录')}</span>
                  <span class="journal-date">${j.date || (j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '')}</span>
                </div>
                <button class="btn-icon btn-delete-journal" data-id="${j.id}" title="删除日志">🗑️</button>
              </div>
              <div class="journal-content">${this.escapeHtml(j.content)}</div>
            </div>
          `).join('') : '<p class="empty-state">暂无日志记录，快写下今天的第一个想法吧！</p>'}
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const input = this.container.querySelector('#journal-input');
    const saveBtn = this.container.querySelector('#save-journal');

    // 标签选择
    this.container.querySelectorAll('.tag-btn').forEach(btn => {
      btn.onclick = () => {
        this.selectedCategory = btn.dataset.cat;
        this.container.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    const handleSave = async () => {
      const content = input.value.trim();
      if (!content) return;

      await JournalModule.create({
        content,
        category: this.selectedCategory,
        date: new Date().toISOString().slice(0, 10)
      });

      input.value = '';
      await this.render();
    };

    if (saveBtn) saveBtn.onclick = handleSave;

    if (input) {
      input.onkeydown = async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          await handleSave();
        }
      };
    }

    // 删除日志
    this.container.querySelectorAll('.btn-delete-journal').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await JournalModule.delete(id);
        await this.render();
      };
    });
  },

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br/>');
  }
};
