import { TaskPanel } from './task-panel.js';
import './reading-panel.js';
import './research-panel.js';
import './journal-panel.js';
import './file-panel.js';
import './dashboard.js';

window.TaskPanel = TaskPanel;

document.addEventListener('DOMContentLoaded', () => {
  if (window.Dashboard) {
    window.Dashboard.init();
  }
});
