// Research Panel
// 科研实验、研究项目与论文笔记面板
// V1.0.8: 支持科研记录富文本详情、标签、删除及折叠展示

import ResearchModule from '../modules/research.js';

export const ResearchPanel = {
  container: null,

  async init(container) {
    this.container = container;
    await this.render();
  },

  async render() {
    if (!this.container) return;

    const records = await ResearchModule.list();
    const sorted = [...records].reverse();

    this.container.innerHTML = `
      <div class="panel-header">
        <h2>🧪 科研记录</h2>
        <span class="badge badge-info">共 ${records.length} 条记录</span>
      </div>

      <div class="research-form">
        <input id="research-title" class="input-text" placeholder="实验主题 / 课题方向 / 调研项目..." />
        <textarea id="research-content" class="input-textarea" rows="3" placeholder="记录实验假设、参数、数据观察、结论..."></textarea>
        <div class="research-form-footer">
          <input id="research-tags" class="input-text tag-input" placeholder="添加标签（用逗号或空格分隔，如：AI, 算法）" />
          <button id="add-research" class="btn btn-primary">保存科研记录</button>
        </div>
      </div>

      <div class="research-list">
        ${sorted.length ? sorted.map(item => `
          <div class="research-card">
            <div class="research-card-header">
              <strong class="research-title">🔬 ${this.escapeHtml(item.title)}</strong>
              <div class="research-actions">
                <span class="item-time">${new Date(item.createdAt).toLocaleDateString()}</span>
                <button class="btn-icon btn-delete-research" data-id="${item.id}" title="删除记录">🗑️</button>
              </div>
            </div>
            ${item.content ? `<div class="research-content">${this.escapeHtml(item.content)}</div>` : ''}
            ${item.tags && item.tags.length ? `
              <div class="research-tags">
                ${item.tags.map(t => `<span class="badge badge-tag">#${this.escapeHtml(t)}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('') : '<p class="empty-state">暂无科研记录，开始记录您的第一个科研探索吧！</p>'}
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const titleInput = this.container.querySelector('#research-title');
    const contentInput = this.container.querySelector('#research-content');
    const tagsInput = this.container.querySelector('#research-tags');
    const addBtn = this.container.querySelector('#add-research');

    if (addBtn) {
      addBtn.onclick = async () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        if (!title) return;

        const rawTags = tagsInput.value.trim();
        const tags = rawTags ? rawTags.split(/[,，\s]+/).filter(Boolean) : [];

        const record = await ResearchModule.create(title, content);
        if (tags.length > 0) {
          await ResearchModule.update(record.id, { tags });
        }

        titleInput.value = '';
        contentInput.value = '';
        tagsInput.value = '';
        await this.render();
      };
    }

    // 删除
    this.container.querySelectorAll('.btn-delete-research').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        await ResearchModule.delete(id);
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

window.ResearchPanel = ResearchPanel;
