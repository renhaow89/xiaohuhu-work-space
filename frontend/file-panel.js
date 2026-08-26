export const FilePanel = {
  container: null,

  init(container) {
    this.container = container;
    this.render();
  },

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="panel">
        <h2>📁 文件中心</h2>
        <p>文件索引与 AI 检索入口</p>
        <input id="file-search" placeholder="搜索文件" />
        <div id="file-list"></div>
      </div>
    `;
  }
};
