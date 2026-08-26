# Xiaohuhu Work Space

个人智能工作空间 · 脱离第三方平台依赖的长期个人工作平台。

---

## 🌟 项目定位与特性

- **纯个人数据主权**：数据存储于本地 `localStorage`，支持全量 JSON 备份、版本化导出与恢复。
- **分层数据架构**：通过 `modules → database → data-adapter → storage` 完整解耦业务与存储底座，未来可平滑迁移云端（如 Supabase / Firebase）。
- **统一版本与迁移体系**：中央管理应用版本与数据 Schema，内置链式数据迁移机制（`core/migration.js`）。
- **全功能日常工作流**：
  - 📌 **任务管理（Task）**：支持待办/已完成切换、筛选过滤、统计与快捷删除。
  - 📝 **工作日志（Journal）**：支持分类标签（💻开发 / 🧪实验 / 📖思考 / 📌总结 / 💡灵感）、快捷键保存与卡片流。
  - 📚 **阅读中心（Reading）**：支持文献/书籍记录、阅读状态管理（想读/在读/已读）、读书笔记与筛选。
  - 🧪 **科研记录（Research）**：支持实验方案记录、观察总结、多标签管理与详情查看。
  - ⚙️ **设置中心（Settings）**：数据一键导出/导入/清空，最近 20 条备份历史审计追踪。
  - 🧪 **自动化测试套件（Test Suite）**：内置纯浏览器运行的端到端与单元测试集（访问 `frontend/test.html`）。

---

## 🏗️ 系统技术架构

```
Frontend (HTML / CSS / Panels)
       │
       ▼
Modules Layer (Task / Journal / Reading / Research)
       │
       ▼
Database Layer (core/database.js)
       │
       ▼
Data Adapter (core/data-adapter.js)
       │
       ▼
Storage Layer (core/storage.js)
       │
       ▼
localStorage (将来可扩展为 Supabase / IndexedDB / Cloud)
```

---

## 📁 目录结构

```
xiaohuhu-work-space/
├── core/                     # 核心框架层
│   ├── version.js            # 统一版本与 Schema 管理
│   ├── config.js             # 系统配置
│   ├── storage.js            # 底层持久化封装
│   ├── data-adapter.js       # 存储适配器抽象
│   ├── database.js           # 业务数据库统一接口
│   ├── backup.js             # 备份与恢复管理器
│   ├── backup-history.js     # 备份审计历史管理
│   ├── migration.js          # 数据 Schema 链式迁移器
│   ├── sync-manager.js       # 云同步接口抽象（V1.1 预留）
│   ├── event.js              # EventBus 事件总线
│   └── model.js              # 数据模型与实体生成器
│
├── modules/                  # 业务领域模块
│   ├── task.js               # 任务管理逻辑
│   ├── journal.js            # 日志管理逻辑
│   ├── reading.js            # 阅读文献逻辑
│   └── research.js           # 科研实验逻辑
│
├── frontend/                 # 用户界面层
│   ├── index.html            # 主工作台入口
│   ├── style.css             # 现代化响应式样式
│   ├── main.js               # 前端引导加载脚本
│   ├── dashboard.js          # Dashboard 面板管理器
│   ├── task-panel.js         # 任务管理面板
│   ├── journal-panel.js      # 日志面板
│   ├── reading-panel.js      # 阅读面板
│   ├── research-panel.js     # 科研记录面板
│   ├── file-panel.js         # 文件索引面板
│   ├── settings-panel.js     # 设置与备份面板
│   └── test.html             # 自动化集成测试套件
│
└── docs/                     # 项目规划与开发设计文档
    ├── project-plan.md       # 长期规划路线图
    └── antigravity-dev-plan-v1.md
```

---

## 🚀 快速使用

本平台采用纯原生 ES Module 开发，无需 Node.js 或构建工具：

1. 克隆本仓库：
   ```bash
   git clone https://github.com/renhaow89/xiaohuhu-work-space.git
   ```
2. 直接使用任意静态 HTTP 服务器运行（例如 VSCode Live Server、Python http.server 或静态网页托管）：
   ```bash
   npx serve .
   # 或
   python -m http.server 8000
   ```
3. 访问 `http://localhost:8000/frontend/index.html` 开始使用！
4. 访问 `http://localhost:8000/frontend/test.html` 运行自动化测试。

---

## 📌 当前版本

- **当前版本**：`V1.0.8`
- **Schema 版本**：`1`
- **维护原则**：模块化、向后兼容、数据安全第一。
