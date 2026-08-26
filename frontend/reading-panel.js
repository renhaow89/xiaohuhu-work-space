import { ReadingModule } from '../modules/reading.js';

export const ReadingPanel = {
  async init(container) {
    if (!container) return;
    const records = await ReadingModule.list();

    container.innerHTML = `
      <h2>📚 阅读中心</h2>
      <input id="readingTitle" placeholder="输入阅读标题" />
      <button id="addReadingBtn">保存</button>
      <ul id="readingList"></ul>
    `;

    const list = container.querySelector('#readingList');
    records.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.title;
      list.appendChild(li);
    });

    container.querySelector('#addReadingBtn').onclick = async () => {
      const input = container.querySelector('#readingTitle');
      if (!input.value.trim()) return;
      await ReadingModule.create(input.value.trim(), '');
      await this.init(container);
    };
  }
};
