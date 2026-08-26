// File Panel
// 文件中心面板 — 温暖粉橙主题重构
// 提供文件索引检索与知识库入口

import { FileIndex } from '../mcp/file-index.js';

export const FilePanel = {
  container: null,

  init(container) {
    this.container = container;
    this.render();
    this.bindEvents();
  },

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="panel-header">
        <h2>📁 文件中心</h2>
        <span class="badge badge-info">文件索引与 AI 检索</span>
      </div>

      <!-- 搜索卡片 -->
      <div class="form-card">
        <div class="input-group">
          <input
            id="file-search"
            class="input-text"
            placeholder="输入文件名或关键字检索文件..."
            autocomplete="off"
          />
          <button id="file-search-btn" class="btn btn-primary">
            🔍 搜索
          </button>
        </div>
      </div>

      <!-- 文件结果列表区 -->
      <div id="file-list" class="task-list-container">
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <p class="empty-text">输入关键词开始检索本地文件与知识库～</p>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const btn = this.container.querySelector('#file-search-btn');
    const input = this.container.querySelector('#file-search');

    if (!btn || !input) return;

    const handleSearch = () => {
      const keyword = input.value ? input.value.trim() : '';
      const result = FileIndex.search(keyword);
      this.showResult(result, keyword);
    };

    btn.onclick = handleSearch;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    };
  },

  showResult(files, keyword = '') {
    const list = this.container.querySelector('#file-list');
    if (!list) return;

    if (files && files.length) {
      list.innerHTML = `
        <ul class="item-list">
          ${files.map(file => `
            <li class="task-item">
              <div class="task-left">
                <span style="font-size: 18px;">📄</span>
                <span class="task-title">${this.escapeHtml(file.name || file)}</span>
              </div>
              <div class="task-actions">
                ${file.size ? `<span class="item-time">${file.size}</span>` : ''}
              </div>
            </li>
          `).join('')}
        </ul>
      `;
    } else {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📂</div>
          <p class="empty-text">${keyword ? `未找到与 “${this.escapeHtml(keyword)}” 匹配的文件～` : '暂无相关文件，输入关键词搜索～'}</p>
        </div>
      `;
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

window.FilePanel = FilePanel;
