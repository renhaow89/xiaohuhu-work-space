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
      <div class="panel">
        <h2>📁 文件中心</h2>
        <p>文件索引与 AI 检索入口</p>
        <input id="file-search" placeholder="搜索文件" />
        <button id="file-search-btn">搜索</button>
        <div id="file-list"></div>
      </div>
    `;
  },

  bindEvents() {
    const btn = document.getElementById('file-search-btn');
    const input = document.getElementById('file-search');

    if (!btn || !input) return;

    btn.onclick = () => {
      const result = FileIndex.search(input.value || '');
      this.showResult(result);
    };
  },

  showResult(files) {
    const list = document.getElementById('file-list');
    if (!list) return;

    list.innerHTML = files.length
      ? files.map(file => `<div>${file.name}</div>`).join('')
      : '<div>暂无文件</div>';
  }
};
