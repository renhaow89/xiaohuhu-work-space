// Xiaohuhu Work Space — Dashboard 控制器
// 侧边栏单面板切换、顶部 Header 动态中文日期与快捷备份/导入
// 增强：每次切换面板自动触发对应面板的 render() 重新拉取最新数据，消除多端同步后界面不刷新的问题

import { TaskPanel } from './task-panel.js';
import { JournalPanel } from './journal-panel.js';
import { ReadingPanel } from './reading-panel.js';
import { ResearchPanel } from './research-panel.js';
import { FilePanel } from './file-panel.js';
import { SettingsPanel } from './settings-panel.js';
import BackupManager from '../core/backup.js';

export const PANEL_CONFIG = {
  'task-panel': {
    title: '📌 任务管理',
    init: (c) => TaskPanel && TaskPanel.init(c),
    render: () => TaskPanel && TaskPanel.render()
  },
  'journal-panel': {
    title: '📝 今日记录',
    init: (c) => JournalPanel && JournalPanel.init(c),
    render: () => JournalPanel && JournalPanel.render()
  },
  'reading-panel': {
    title: '📚 阅读中心',
    init: (c) => ReadingPanel && ReadingPanel.init(c),
    render: () => ReadingPanel && ReadingPanel.render()
  },
  'research-panel': {
    title: '🧪 科研记录',
    init: (c) => ResearchPanel && ResearchPanel.init(c),
    render: () => ResearchPanel && ResearchPanel.render()
  },
  'file-panel': {
    title: '📁 文件中心',
    init: (c) => FilePanel && FilePanel.init(c),
    render: () => FilePanel && FilePanel.render()
  },
  'settings-panel': {
    title: '⚙️ 设置中心',
    init: (c) => SettingsPanel && SettingsPanel.init(c),
    render: () => SettingsPanel && SettingsPanel.render()
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
   * 刷新所有面板的最新数据渲染
   */
  async refreshAllPanels() {
    for (const key of Object.keys(PANEL_CONFIG)) {
      const cfg = PANEL_CONFIG[key];
      if (cfg && typeof cfg.render === 'function') {
        try {
          await cfg.render();
        } catch (err) {
          console.warn(`[Dashboard] Failed to refresh panel ${key}:`, err);
        }
      }
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
        try {
          PANEL_CONFIG[panelId].init(container);
        } catch (e) {
          console.error(`[Dashboard] Failed to init panel ${panelId}:`, e);
        }
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

    // 4. 重新获取最新数据进行渲染
    if (PANEL_CONFIG[panelId] && typeof PANEL_CONFIG[panelId].render === 'function') {
      try {
        PANEL_CONFIG[panelId].render();
      } catch (e) {
        console.warn(`[Dashboard] Failed to re-render panel ${panelId}:`, e);
      }
    }

    // 5. 更新 Hash（不刷新页面）
    if (window.location.hash !== `#${panelId}`) {
      try {
        history.replaceState(null, '', `#${panelId}`);
      } catch (e) {
        window.location.hash = `#${panelId}`;
      }
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

// 保证在 DOM 就绪时稳定执行（移动端兼容）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Dashboard.init());
} else {
  Dashboard.init();
}

export default Dashboard;
