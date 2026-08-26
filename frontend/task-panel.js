import { TaskModule } from '../modules/task.js';

export const TaskPanel = {
  render(container) {
    if (!container) return;

    const tasks = TaskModule.list();

    container.innerHTML = `
      <h2>今日任务</h2>
      <input id="taskInput" placeholder="输入新任务" />
      <button id="addTaskBtn">添加</button>
      <ul id="taskList"></ul>
    `;

    const list = container.querySelector('#taskList');

    tasks.forEach(task => {
      const item = document.createElement('li');
      item.textContent = `${task.title} (${task.status})`;
      list.appendChild(item);
    });

    container.querySelector('#addTaskBtn').onclick = () => {
      const input = container.querySelector('#taskInput');
      if (!input.value.trim()) return;

      TaskModule.create(input.value.trim());
      input.value = '';
      this.render(container);
    };
  }
};
