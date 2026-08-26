import { TaskPanel } from './task-panel.js';

const dashboard = document.querySelector('#dashboard');

if (dashboard) {
  dashboard.innerHTML = `
    <section id="task-section"></section>
  `;

  const taskSection = document.querySelector('#task-section');
  TaskPanel.render(taskSection);
}
