const Dashboard = {
  init() {
    console.log('Dashboard initialized');

    if (window.TaskPanel) {
      TaskPanel.init();
    }
  }
};

window.Dashboard = Dashboard;

document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});
