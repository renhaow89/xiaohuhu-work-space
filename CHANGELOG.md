# 更新日志 (Changelog)

本项目的所有显著变更均将记录于此文件中。
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，并遵守语义化版本。

---

## [1.4.2] - 2026-09-02

### 变更 (Changed)
- **导航布局**：调整左侧侧边栏菜单顺序，将「📅 日历」移动到「🧪 科研」与「📁 文件」之间，使工作流聚焦更顺畅（顺序：任务 → 日志 → 阅读 → 科研 → 日历 → 文件 → 设置）。
- **版本递增**：升级全局版本号与 Service Worker 缓存键至 `v1.4.2`，客户端自动平滑刷新生效。

---

## [1.4.1] - 2026-09-02

### 新增 (Added)
- **多行任务输入**：任务名称与任务详情输入栏支持按 `Shift + Enter` 插入换行符，单按 `Enter` 保持快速提交任务。
- **自适应撑高**：输入框支持基于内容高度（`scrollHeight`）自适应动态拉伸高度。
- **多行展示排版**：任务列表与置顶卡片的标题和备注样式补充 `white-space: pre-wrap;`，换行内容正确排版对齐。

### 修复 (Fixed)
- **输入法冲突**：增加中文输入法合成状态检测（`e.isComposing`），解决拼音打字选词回车误拦截问题。
- **表单布局**：设置 `.task-form-row` 为 `align-items: flex-start;`，文本框多行拉伸时保持同行的优先级与日期控件顶部对齐。

---

## [1.4.0] - 2026-09-02

### 修复 (Fixed)
- **PWA 强缓存与更新失效**：
  - `frontend/sw.js` 缓存策略由 `Stale-While-Revalidate` 切换为 **`NetworkFirst`**，优先保证网络端资源实时新鲜，断网自动回退离线缓存。
  - `frontend/main.js` 增加 `controllerchange` 监听，检测到新版 Service Worker 激活后自动平滑重载页面。
  - `vercel.json` 为 `index.html`、`sw.js`、`manifest.json` 增加 `no-cache, no-store, must-revalidate` 响应头，消除 CDN 强缓存。

---

## [1.3.0] - 2026-08-30

### 新增 (Added)
- **日历日程全景**：新增日历日程面板（`calendar-panel.js`），支持月历网格概览、每日日程管理与全景回顾时间线。
- **文件中心**：新增文件中心面板（`file-panel.js`），支持本地文件索引与关联附件管理。

---

## [1.2.1] - 2026-08-25

### 新增 (Added)
- **Supabase 云端双向同步**：支持邮箱密码认证、行级加密（RLS）、心跳轮询与 Last-Write-Wins 冲突合并。
- **PWA 独立 App**：支持桌面端独立窗口安装与移动端全屏手账侧边栏体验。
