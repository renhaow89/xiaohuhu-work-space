const Dashboard = {
  init() {
    console.log('Dashboard initialized');

    const taskContainer = document.getElementById('task-panel');
    const readingContainer = document.getElementById('reading-panel');
    const researchContainer = document.getElementById('research-panel');
    const fileContainer = document.getElementById('file-panel');

    if (window.TaskPanel && taskContainer) {
      TaskPanel.init(taskContainer);
    }

    if (window.ReadingPanel && readingContainer) {
      ReadingPanel.init(readingContainer);
    }

    if (window.ResearchPanel && researchContainer) {
      ResearchPanel.init(researchContainer);
    }

    if (window.FilePanel && fileContainer) {
      FilePanel.init(fileContainer);
    }
  }
};

window.Dashboard = Dashboard;

document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});
