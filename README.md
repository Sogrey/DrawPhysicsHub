# DrawPhysicsHub

物理现象可视化演示平台（Vue 3 + Vite + Three.js）。架构：**物理模型层 + 渲染层**；以教学交互为主，不复刻通用动态几何 / CAS 白板。

本仓库**默认使用 pnpm**（勿用 npm / yarn 安装依赖）。

## 快速开始

```bash
pnpm install
pnpm dev          # 开发：base 为 /DrawPhysicsHub/
pnpm test         # Vitest
pnpm typecheck
pnpm build
pnpm preview
```

浏览器打开演示目录后进入 **抛体运动**（HelloDemo / 教学样板）。

## 文档

| 文档 | 说明 |
|------|------|
| [`src/ARCHITECTURE.md`](src/ARCHITECTURE.md) | 分层边界、Demo 协议、如何新增演示 |
| [`docs/DrawPhysicsHub开发计划.md`](docs/DrawPhysicsHub开发计划.md) | 里程碑与任务（AI / 协作） |
| [`docs/DrawPhysicsHub开发计划.html`](docs/DrawPhysicsHub开发计划.html) | 同上，可勾选进度（本地保存） |
| [`docs/vue-threejs-物理可视化可行性评估.md`](docs/vue-threejs-物理可视化可行性评估.md) | Vue+Three 可行性与架构结论 |

## 当前进度

- **M1 引擎骨架**：已完成（协议、RK4 / 受限表达式 / 场采样、Canvas2D + Three + Chart、抛体联调）。
- **抛体教学样板**（后续 Demo 对照此标准）：
  - 三栏布局：左控制台 / 中概念+解析 / 右视口（左中内滚，右撑满）
  - 公式实时代入、时间轴 scrub、速度分解与投影辅助线
  - 引导挑战、对比幽灵轨迹、2D/3D 坐标系
  - `DemoDocs`：`concept` / `steps` / `bindings` / `challenges` / `legend` / `insight`
- **M2 播放器与目录**：部分完成（路由深链、播放控制、参数面板、说明区、多视图 Tab）；目录搜索/缩略图/全屏等仍待做。

## 技术要点

- 包管理：`packageManager` + `preinstall only-allow pnpm`；Windows 下 `.npmrc` 使用 `node-linker=hoisted`
- 部署 `base`：`/DrawPhysicsHub/`（见 `vite.config.ts`）
- 物理对错只在 `core/physics` + 各 demo model；渲染只消费 `ObserveSnapshot`
