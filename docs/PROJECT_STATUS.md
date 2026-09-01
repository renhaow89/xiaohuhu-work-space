# Xiaohuhu Work Space — 项目当前状态与 AI 交接文档

> **文档用途**：将此文档完整提供给新 AI Agent 或开发者，使其快速了解项目全貌与当前状态，无需重复介绍背景。  
> **最后更新**：2026-09-02

---

## 一、项目基本信息

| 项目 | 详情 |
|---|---|
| **项目名称** | Xiaohuhu Work Space（小呼呼个人数字工作空间） |
| **定位** | 个人轻量手账风数字工作台 |
| **GitHub 仓库** | https://github.com/renhaow89/xiaohuhu-work-space （分支：`main`） |
| **线上访问（Vercel）** | https://xiaohuhu-work-space.vercel.app/ |
| **线上访问（GitHub Pages）** | https://renhaow89.github.io/xiaohuhu-work-space/ |
| **当前版本** | v1.4.0（Schema: 1） |
| **技术栈** | 纯原生 ES Modules（HTML5 + CSS3 + Vanilla JS），零构建工具，LocalStorage + PWA Service Worker + Supabase 云端双向同步 |

---

## 二、完整项目目录结构

```text
xiaohuhu-work-space/
├── index.html                   # 根目录重定向入口（跳转至 ./frontend/index.html）
├── vercel.json                  # Vercel 部署配置（含 no-cache 响应头）
├── AI_DEVELOPMENT_GUIDE.md      # AI 开发规约手册（必读）
├── README.md                    # 项目说明
├── docs/                        # 项目文档与规划
│   ├── PROJECT_STATUS.md        # 本项目当前状态与 AI 交接文档
│   ├── antigravity-dev-plan-v1.md
│   └── project-plan.md
├── core/                        # 核心基础设施层
│   ├── version.js               # 全局版本号管理（当前：v1.4.0，schema: 1）
│   ├── database.js              # 数据抽象层（统一派发 EventBus 事件）
│   ├── storage.js               # 底层 LocalStorage 驱动
│   ├── data-adapter.js          # 数据适配层
│   ├── event.js                 # 全局发布订阅事件总线（EventBus）
│   ├── sync-manager.js          # Supabase 认证、心跳轮询、墓碑追踪与双向合并引擎
│   ├── backup.js                # 全量 JSON 数据导出与导入恢复引擎
│   ├── backup-history.js        # 备份历史记录管理
│   ├── migration.js             # 数据迁移
│   └── model.js                 # 基础模型
├── modules/                     # 业务数据模型层
│   ├── task.js                  # 任务模块（定点提醒、跨日时间段）
│   ├── schedule.js              # 日程模块（按日/月检索、全天/时段、分类标签）
│   ├── journal.js               # 工作日志模块（分类标签、逆序流展示）
│   ├── reading.js               # 文献与书籍阅读记录模块
│   ├── research.js              # 科研实验进展与附件记录模块
│   ├── review.js                # 复盘模块骨架
│   └── finance.js               # 财务记账骨架
└── frontend/                    # 前端视图与交互层（SPA）
    ├── index.html               # 单页面应用主入口
    ├── style.css                # 手账粉橙风格全局样式（含移动端响应式断点）
    ├── main.js                  # 启动引导器、PWA Service Worker 注册
    ├── dashboard.js             # 单面板路由控制器
    ├── task-panel.js            # 任务管理面板
    ├── calendar-panel.js        # 日历日程面板（月历网格、全景回顾）
    ├── journal-panel.js         # 工作日志面板
    ├── reading-panel.js         # 文献阅读面板
    ├── research-panel.js        # 科研记录面板
    ├── file-panel.js            # 文件中心面板
    ├── settings-panel.js        # 设置中心（Supabase 配置、数据维护）
    ├── manifest.json            # PWA 安装清单
    ├── sw.js                    # PWA Service Worker（离线缓存控制器）
    ├── icons/                   # PWA 图标
    └── test.html                # 自动化测试套件
```

---

## 三、Supabase 数据库表结构（参考）

```sql
-- 用户数据表
CREATE TABLE IF NOT EXISTS user_workspace_data (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 行级安全策略（RLS）
ALTER TABLE user_workspace_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own workspace data"
ON user_workspace_data FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 四、已完成的工作记录

### ✅ PWA 强缓存问题修复（2026-09-02，Commit: `0d2f851`）

**问题描述**：用户刷新页面后仍停留在旧版本 UI，点击「清理缓存并更新」按钮也常常无效。

**根本原因（三层缓存叠加）**：
1. GitHub Pages CDN 对 HTML/JS 默认 `max-age=600`（10 分钟强缓存）
2. `sw.js` 采用 Stale-While-Revalidate 策略，刷新时永远先返回旧缓存
3. 新 SW 安装后未触发页面重载，旧 SW 继续控制当前页

**改动内容（3 个文件）**：

#### `frontend/sw.js`
- **策略变更**：`Stale-While-Revalidate` → **`NetworkFirst`**
- 联网时每次刷新都从服务器拉取最新代码
- 网络失败时自动回退本地缓存（离线可用性不受影响）
- `skipWaiting()` 和 `clients.claim()` 保留（原有）

#### `frontend/main.js`
- **新增**：`controllerchange` 事件触发 `window.location.reload()`
- 加入 `_swReloading` 防抖标志，防止循环重载
- 效果：新版本 SW 激活后，页面自动平滑刷新到最新版本

#### `vercel.json`
- **新增** `headers` 配置，对以下文件禁用 HTTP 强缓存：
  - `/frontend/index.html`
  - `/frontend/sw.js`
  - `/frontend/manifest.json`
- 响应头：`Cache-Control: no-cache, no-store, must-revalidate`

**修复效果**：
- 普通刷新即可获取最新版本，无需手动清理缓存
- 发布新版本后，用户下次打开即自动更新
- 「清理缓存并更新」按钮保留，作为彻底清理的保底手段

---

## 五、当前代码关键逻辑说明

### `frontend/sw.js` 当前 fetch 策略（NetworkFirst）

```javascript
event.respondWith(
  fetch(request)
    .then((networkResponse) => {
      // 网络成功：更新缓存 + 返回最新内容
      if (networkResponse && networkResponse.status === 200) {
        caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => {
      // 断网：回退缓存
      return caches.match(request).then(cached => cached ||
        new Response('', { status: 503 }));
    })
);
```

### `frontend/main.js` SW 控制器变更监听

```javascript
let _swReloading = false;
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (_swReloading) return;
  _swReloading = true;
  window.location.reload(); // 新版本激活后自动重载
});
```

### `vercel.json` no-cache 头配置

```json
{
  "headers": [
    {
      "source": "/frontend/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }]
    }
  ]
}
```

---

## 六、可继续投入的后续工作（待办）

> 以下任务均为独立、可拆分的小任务，可直接交给 AI 执行。

### 🔧 体验优化类

- [ ] **更新提示 Toast**：检测到新 SW 激活时，在重载前先弹出一个 2 秒提示（"✨ 新版本已就绪，正在刷新..."），而非静默跳转
- [ ] **更新按钮状态优化**：点击「清理缓存并更新」后加 loading 状态，防止用户多次点击
- [ ] **版本号显示**：在设置页面或底部角落显示当前版本号（读取 `core/version.js`），帮助用户确认是否已更新

### 📅 功能扩展类

- [ ] **日历面板重复日程**：支持每日/每周/每月重复事件（当前仅支持单次日程）
- [ ] **任务优先级排序**：今日聚焦列表按优先级自动排序（当前为手动顺序）
- [ ] **日志导出**：工作日志支持按日期范围导出为 Markdown 或 PDF

### 🛠 技术债清理类

- [ ] **`main.js` 重复 import**：第 1 行 `import './dashboard.js'` 和第 3 行 `import Dashboard from './dashboard.js'` 重复导入同一文件，应合并为一行
- [ ] **离线页面**：当 SW 缓存也没有对应资源时，当前返回空 503 响应，应改为返回一个友好的离线提示 HTML 页面
- [ ] **CACHE_NAME 自动递增**：每次发版时需手动修改 `sw.js` 中的 `CACHE_NAME`，可考虑用构建时注入版本号（但当前零构建工具约束需兼顾）

---

## 七、给新 AI 的操作权限说明

- ✅ 可直接读取 GitHub 仓库所有文件内容
- ✅ 可直接向 `main` 分支提交代码（通过 GitHub MCP 工具）
- ✅ Vercel 会自动检测 `main` 分支推送并重新部署（约 1-2 分钟）
- ⚠️ GitHub Pages 部署有约 5-10 分钟延迟，且受 CDN 缓存影响（已知限制）

---

## 八、注意事项与开发规范

1. **零构建工具**：严禁引入 npm/webpack/vite，所有代码均为原生 ES Modules
2. **不缓存 API**：`sw.js` 的规则明确排除所有 Supabase 和 `supabase.co` 域名请求，修改时务必保留
3. **版本同步**：修改功能后需同步更新 `core/version.js` 中的版本号
4. **数据兼容**：修改 LocalStorage 数据结构时需同步更新 Schema 版本号并编写迁移脚本
5. **AI 开发规约**：提交前请参考仓库中的 `AI_DEVELOPMENT_GUIDE.md`
