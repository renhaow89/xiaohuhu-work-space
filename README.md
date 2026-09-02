# Xiaohuhu Work Space

个人智能工作空间 · 脱离第三方商业平台依赖的长期个人数字工作平台。

---

## 🌟 项目定位与核心特性

- **纯个人数据主权**：数据存储于本地 `localStorage`，支持全量 JSON 备份、版本化导出与恢复。
- **☁️ Supabase 多端云同步**：支持轻量邮箱密码认证、军工级 RLS 行级加密隔离与多设备（电脑/手机/平板）双向实时数据同步。
- **📱 PWA 离线运行与独立 App**：
  * **电脑端**：一键安装为 Windows / Mac 纯净无边框独立桌面软件。
  * **手机端**：添加到 iOS / Android 主屏幕，实现原生 App 级全屏手账体验（**左侧垂直手账侧边栏**）。
  * **离线秒开 & 自动平滑更新**：采用 `NetworkFirst` 网络优先策略 + 自动版本更新检测，断网秒级回退离线缓存。
- **分层数据架构**：通过 `modules → database → data-adapter → storage` 完整解耦业务与存储底座。
- **统一版本与迁移体系**：中央管理应用版本与数据 Schema，内置链式数据迁移机制（`core/migration.js`）。
- **全功能日常工作流**：
  - 📌 **任务管理（Task）**：顶部「☀️ 今天要处理」置顶聚焦、跨日月时分时间段、定点提醒、多行换行（Shift+Enter）、红黄绿优先级标签。
  - 📝 **工作日志（Journal）**：支持分类标签（💻开发 / 🧪实验 / 📖思考 / 📌总结 / 💡灵感）、快捷键保存与卡片流。
  - 📚 **阅读中心（Reading）**：支持文献/书籍记录、阅读状态管理（想读/在读/已读）、读书笔记与评分。
  - 🧪 **科研记录（Research）**：支持实验方案记录、观察总结、多标签管理与详情查看。
  - 📅 **日历日程（Schedule）**：月历网格全景概览、支持按日/月检索、全天/时段标记与分类标签管理。
  - 📁 **文件中心（File）**：文件索引与本地附件关联管理。
  - ⚙️ **设置中心（Settings）**：云同步配置、保姆级图文教程、数据一键导出/导入/清空，备份历史审计。
  - 🧪 **自动化测试套件（Test Suite）**：内置纯浏览器运行的端到端与单元测试集（访问 `frontend/test.html`）。

---

## 📖 AI 开发者全景交接手册

如果你是后续接手本项目的 AI Agent 或开发者，请优先查阅根目录与 `docs/` 目录下的权威指南：
- 👉 **[`AI_DEVELOPMENT_GUIDE.md`](AI_DEVELOPMENT_GUIDE.md)**：开发规范、架构规范与扩展指南
- 👉 **[`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)**：项目当前状态、架构演进与 AI 交接文档

该手册涵盖：
1. **四大开发铁律**（零构建工具、严格数据分层、统一版本源、原子 Commit 规范）。
2. **详细模块架构与数据流图**。
3. **Step-by-Step 新增模块与功能扩展范式**。
4. **Supabase 建表与 RLS 安全策略**。
5. **视觉设计系统 Token 规范**（全端统一粉橙手账美学与移动端左侧侧边栏规范）。

---

## 🏗️ 系统技术架构

```
Frontend UI (HTML / CSS / Panels)
       │
       ▼
Modules Layer (Task / Journal / Reading / Research / Schedule)
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
       ├── localStorage (本地优先持久化)
       └── SyncManager (core/sync-manager.js) ──► Supabase Cloud
```

---

## 🚀 线上访问与运行

- 🌍 **国内直连（GitHub Pages）**：[https://renhaow89.github.io/xiaohuhu-work-space/](https://renhaow89.github.io/xiaohuhu-work-space/)
- ⚡ **海外 CDN（Vercel）**：[https://xiaohuhu-work-space.vercel.app/](https://xiaohuhu-work-space.vercel.app/)
- 🧪 **自动化测试套件**：[https://renhaow89.github.io/xiaohuhu-work-space/frontend/test.html](https://renhaow89.github.io/xiaohuhu-work-space/frontend/test.html)

---

## 📌 当前版本

- **当前版本**：`v1.4.2`
- **Schema 版本**：`1`
- **维护原则**：纯原生、模块化、向后兼容、数据安全第一。
