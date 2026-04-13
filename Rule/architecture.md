# 架构规则

## 核心技术栈

- 框架：Next.js App Router
- 样式：Tailwind CSS
- 组件：shadcn/ui 风格组件
- 客户端状态：Zustand
- 服务端数据：TanStack Query
- 数据库：Prisma + PostgreSQL
- 文档系统：Nextra
- 动画：GSAP + Framer Motion

## 目录职责

- `src/app`：页面路由与路由级布局
- `src/components`：展示型组件与页面区块
- `src/components/ui`：可复用的基础 UI 组件
- `src/hooks`：接口 hooks 与业务逻辑 hooks
- `src/stores`：隔离后的客户端状态
- `src/lib`：工具函数、数据库客户端、共享能力
- `src/content`：Nextra 文档内容
- `prisma`：数据库 schema 与配置
- `Rule`：项目规则文档

## 数据流规则

- 所有服务端请求统一通过 TanStack Query 管理。
- 查询类操作走 query hooks。
- 提交、更新、删除类操作统一走 mutation hooks。
- 只要可以通过 hook 隔离请求细节，就不要把请求逻辑直接写进组件。
- hook 负责接口调用、数据整理、副作用封装，组件保持轻量。

## 状态规则

- Zustand 只用于客户端交互状态、跨组件 UI 状态、局部业务状态。
- 不要把远程服务端缓存和 TanStack Query 的职责混进 Zustand。
- store 按领域隔离，不做一个无边界的全局大 store。
- 能放在局部的派生状态就尽量不要提升到全局。

## 组件规则

- 组件以渲染和交互为主，不承载过重业务逻辑。
- 复杂逻辑优先进入 hooks 或 feature service。
- 基础 UI 组件统一放进 `src/components/ui`。
- 页面由多个可复用的小区块组合，不堆积成超大 JSX 文件。

## 演进规则

- 新的稳定约定出现后，优先补到 `Rule` 目录。
- 不允许长期依赖“默认大家都知道”的隐式规范。
