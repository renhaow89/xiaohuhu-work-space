# Xiaohuhu Work Space · Antigravity 专属开发规则 V1.0

> 用途：供 Antigravity 在长期维护 Xiaohuhu Work Space 时遵守。本文档定义项目维护方式，不要求当前阶段接入 AI、MCP、Local Agent 或 Windows 文件系统。

## 一、项目定位

Xiaohuhu Work Space 是一个长期维护的个人数字工作台，而不是一个 AI Agent 平台。

当前优先级：稳定使用、持续维护、按真实需求增加功能、保持现有架构简单可靠。

当前阶段不主动开发：
- AI 连接电脑文件
- Windows Local Agent
- MCP 文件系统能力
- 本地电脑常驻代理
- 为未来可能需求提前增加复杂基础设施

仓库中的 `mcp/` 与 `local-agent/` 仅作为未来扩展预留，除非用户明确提出需求，否则不要主动实现或扩展。

## 二、接手项目后的固定流程

开始任何开发任务前，先阅读：
1. `AI_DEVELOPMENT_GUIDE.md`
2. `docs/PROJECT_STATUS.md`
3. 本文件
4. 与本次需求直接相关的代码文件

不得仅凭文件名猜测当前实现。先查看现有代码，再决定修改位置。

## 三、需求处理原则

用户提出新功能时：

1. 先明确需求属于现有哪个模块。
2. 优先复用已有数据模型、核心 API、UI 结构和样式 Token。
3. 能在现有架构内完成，就不要新增技术栈。
4. 能做小范围修改，就不要重构整个模块。
5. 不因为“以后可能需要”而提前引入新框架、构建工具、服务或依赖。
6. 对影响数据结构的需求，先检查 Schema、migration 和备份机制。

## 四、技术约束

必须遵守现有项目的 Zero Build Tools 原则：
- HTML5
- CSS3
- Vanilla JavaScript
- ES Modules

除非用户明确批准架构升级，否则禁止擅自引入：
- React
- Vue
- Next.js
- Vite
- Webpack
- Rollup
- Babel
- npm 构建链

数据访问必须继续遵守现有分层：

`frontend → modules → core/database → data-adapter → storage`

禁止在 `frontend/` 或 `modules/` 中绕过 `Database` 直接操作 `localStorage`。

## 五、Skill 使用规则

Antigravity 根据任务类型按需调用 Skill，不要求所有 Skill 同时参与。

### UI / 交互问题
优先使用：
- UI/UX Pro Max
- frontend-ui-engineering

完成后使用：
- browser-testing-with-devtools

### 功能开发 / Bug 修复
优先使用程序开发能力，包括：
- planning-and-task-breakdown
- incremental-implementation
- debugging-and-error-recovery
- test-driven-development
- code-review-and-quality

### 架构或接口调整
使用：
- context-engineering
- api-and-interface-design
- documentation-and-adrs
- source-driven-development（涉及官方 API、标准或外部技术文档时）

### 安全相关修改
涉及认证、Supabase、数据同步、文件、权限或外部输入时，使用：
- security-and-hardening

## 六、测试要求

每次独立功能修改完成后：

1. 优先运行现有 `frontend/test.html` 测试套件。
2. 对 UI 修改进行实际浏览器验证。
3. 检查浏览器 Console 是否出现新的错误。
4. 检查本次修改涉及的旧功能是否回归。
5. 测试失败时，先修复问题，再报告完成。

不要因为“只是改样式”就完全跳过验证。

## 七、版本与 Git 规范

项目版本号继续以 `core/version.js` 为唯一事实源。

涉及功能、数据结构或明显行为变化时：
- 更新版本号
- 如涉及 Schema，更新 Schema 并提供 migration
- 必要时更新 `README.md`、`AI_DEVELOPMENT_GUIDE.md` 或 `docs/PROJECT_STATUS.md`

每个独立功能使用一次原子 Commit，并遵守现有语义化前缀：
- `feat:`
- `fix:`
- `test:`
- `refactor:`
- `style:`
- `docs:`
- `chore:`

修改前先获取目标文件最新 SHA，避免覆盖其他修改。

## 八、与用户协作方式

用户通常用自然语言描述想要的效果。不要要求用户理解代码结构后再提出需求。

由 Antigravity 负责：
- 定位相关模块
- 读取上下文
- 制定实现方案
- 选择 Skill
- 修改代码
- 测试
- 修复回归
- 更新必要文档
- 提交 Git

用户主要负责：
- 提出目标
- 判断体验是否符合预期
- 验收最终效果

当需求存在多种实现方式时，优先选择改动小、可靠、易维护、符合现有架构的方案。

## 九、禁止事项

未经用户明确要求，不要：
- 把项目改造成 React/Vue/Vite 等新技术栈
- 重写现有核心数据层
- 删除已有模块
- 删除已有测试
- 引入大型依赖
- 增加 AI 自动化功能
- 实现 MCP / Local Agent / Windows 文件访问
- 为“以后可能需要”增加复杂架构

## 十、长期维护目标

这个项目的成功标准不是技术复杂度，而是：

> 用户提出一个真实的小需求，Antigravity 能在现有架构下快速、安全地把它实现，并且不会破坏已有功能。

因此应持续优先：
- 稳定性
- 可维护性
- 用户体验
- 数据安全
- 向后兼容
- 小步迭代

而不是追求功能堆叠或技术栈升级。
