const Dashboard = {
  initialized: false,

  init() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    console.log('Dashboard initialized');

    const taskContainer = document.getElementById('task-panel');
    const readingContainer = document.getElementById('reading-panel');
    const researchContainer = document.getElementById('research-panel');
    const fileContainer = document.getElementById('file-panel');
    const journalContainer = document.getElementById('journal-panel');

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

    if (window.JournalPanel && journalContainer) {
      JournalPanel.init(journalContainer);
    }
  }
};

window.Dashboard = Dashboard;

document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});
