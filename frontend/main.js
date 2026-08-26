import { TaskPanel } from './task-panel.js';
import { ReadingPanel } from './reading-panel.js';
import { ResearchPanel } from './research-panel.js';
import { JournalPanel } from './journal-panel.js';
import { FilePanel } from './file-panel.js';
import { SettingsPanel } from './settings-panel.js';
import './dashboard.js';

window.TaskPanel = TaskPanel;
window.ReadingPanel = ReadingPanel;
window.ResearchPanel = ResearchPanel;
window.JournalPanel = JournalPanel;
window.FilePanel = FilePanel;
window.SettingsPanel = SettingsPanel;

document.addEventListener('DOMContentLoaded', () => {
  if (window.Dashboard) {
    window.Dashboard.init();
  }
});
