import { ResearchModule } from '../modules/research.js';

const ResearchPanel = {
  async init(container) {
    this.container = container;
    await this.render();
  },

  async render() {
    if (!this.container) return;

    const records = await ResearchModule.list();

    this.container.innerHTML = `
      <h2>🧪 科研记录</h2>
      <input id="research-title" placeholder="实验名称">
      <textarea id="research-content" placeholder="实验记录"></textarea>
      <button id="add-research">保存</button>
      <div>
        ${records.map(item => `<p>${item.title}</p>`).join('')}
      </div>
    `;

    document.getElementById('add-research').onclick = async () => {
      const title = document.getElementById('research-title').value;
      const content = document.getElementById('research-content').value;
      await ResearchModule.create(title, content);
      await this.render();
    };
  }
};

window.ResearchPanel = ResearchPanel;
