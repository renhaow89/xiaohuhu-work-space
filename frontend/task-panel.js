import { TaskModule } from '../modules/task.js';

export const TaskPanel = {
  init(container) {
    this.render(container);
  },

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
      item.innerHTML = `
        <span>${task.title} (${task.status})</span>
        ${task.status === 'todo' ? `<button data-id="${task.id}" class="completeBtn">完成</button>` : ''}
      `;
      list.appendChild(item);
    });

    container.querySelectorAll('.completeBtn').forEach(button => {
      button.onclick = () => {
        TaskModule.complete(button.dataset.id);
        this.render(container);
      };
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
