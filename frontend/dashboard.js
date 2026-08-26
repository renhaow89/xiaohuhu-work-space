// Xiaohuhu Work Space — Dashboard 控制器
// 重构：侧边栏单面板切换、顶部 Header 动态中文日期与快捷备份/导入

import BackupManager from '../core/backup.js';

const PANEL_CONFIG = {
  'task-panel': {
    title: '📌 任务管理',
    init: (c) => window.TaskPanel && window.TaskPanel.init(c)
  },
  'journal-panel': {
    title: '📝 今日记录',
    init: (c) => window.JournalPanel && window.JournalPanel.init(c)
  },
  'reading-panel': {
    title: '📚 阅读中心',
    init: (c) => window.ReadingPanel && window.ReadingPanel.init(c)
  },
  'research-panel': {
    title: '🧪 科研记录',
    init: (c) => window.ResearchPanel && window.ResearchPanel.init(c)
  },
  'file-panel': {
    title: '📁 文件中心',
    init: (c) => window.FilePanel && window.FilePanel.init(c)
  },
  'settings-panel': {
    title: '⚙️ 设置中心',
    init: (c) => window.SettingsPanel && window.SettingsPanel.init(c)
  }
};

export const Dashboard = {
  initialized: false,
  currentPanel: 'task-panel',

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.initDate();
    this.initPanels();
    this.initSidebar();
    this.initHeaderActions();
    this.initHashListener();

    // 默认或通过 Hash 激活面板
    const hash = window.location.hash.replace('#', '');
    if (hash && PANEL_CONFIG[hash]) {
      this.switchPanel(hash);
    } else {
      this.switchPanel('task-panel');
    }
  },

  /**
   * 初始化动态中文日期
   */
  initDate() {
    const dateEl = document.getElementById('current-date');
    if (!dateEl) return;

    const now = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekday = weekdays[now.getDay()];

    dateEl.textContent = `${year}年${month}月${day}日 ${weekday}`;
  },

  /**
   * 初始化所有子面板
   */
  initPanels() {
    Object.keys(PANEL_CONFIG).forEach((panelId) => {
      const container = document.getElementById(panelId);
      if (container && PANEL_CONFIG[panelId].init) {
        PANEL_CONFIG[panelId].init(container);
      }
    });
  },

  /**
   * 绑定侧边栏切换事件
   */
  initSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const panelId = btn.dataset.panel;
        if (panelId) {
          this.switchPanel(panelId);
        }
      });
    });

    const brand = document.getElementById('brand-home');
    if (brand) {
      brand.addEventListener('click', () => {
        this.switchPanel('task-panel');
      });
    }
  },

  /**
   * 切换激活面板
   * @param {string} panelId 目标面板 ID
   */
  switchPanel(panelId) {
    if (!PANEL_CONFIG[panelId]) return;
    this.currentPanel = panelId;

    // 1. 更新顶部 Header 标题
    const titleEl = document.getElementById('current-panel-title');
    if (titleEl) {
      titleEl.textContent = PANEL_CONFIG[panelId].title;
    }

    // 2. 侧边栏按钮高亮
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((btn) => {
      if (btn.dataset.panel === panelId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 3. 面板显示切换
    const panels = document.querySelectorAll('.panel');
    panels.forEach((p) => {
      if (p.id === panelId) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    // 4. 更新 Hash（不刷新页面）
    if (window.location.hash !== `#${panelId}`) {
      history.replaceState(null, '', `#${panelId}`);
    }
  },

  /**
   * 监听 URL Hash 变化
   */
  initHashListener() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && PANEL_CONFIG[hash] && hash !== this.currentPanel) {
        this.switchPanel(hash);
      }
    });
  },

  /**
   * 顶部 Header 导出 / 导入快捷操作
   */
  initHeaderActions() {
    const exportBtn = document.getElementById('header-export-btn');
    const importBtn = document.getElementById('header-import-btn');
    const fileInput = document.getElementById('global-backup-file-input');

    if (exportBtn) {
      exportBtn.onclick = async () => {
        try {
          await BackupManager.downloadBackup();
        } catch (e) {
          console.error(e);
          alert('导出失败: ' + e.message);
        }
      };
    }

    if (importBtn && fileInput) {
      importBtn.onclick = () => {
        fileInput.click();
      };

      fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const backup = JSON.parse(text);
          await BackupManager.importData(backup);
          alert('✅ 数据恢复成功，即将刷新页面');
          location.reload();
        } catch (error) {
          console.error(error);
          alert('❌ 备份文件无效或损坏，恢复失败: ' + error.message);
        } finally {
          fileInput.value = '';
        }
      };
    }
  }
};

window.Dashboard = Dashboard;

document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});

export default Dashboard;
