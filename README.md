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

浏览器打开演示目录，可选力学包中任一演示（默认样板为 **抛体运动**）。

## 文档

| 文档 | 说明 |
|------|------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | 分层边界、Demo 协议、已注册演示、如何新增 |
| [`docs/DrawPhysicsHub开发计划.md`](docs/DrawPhysicsHub开发计划.md) | 里程碑与任务（AI / 协作） |
| [`docs/DrawPhysicsHub开发计划.html`](docs/DrawPhysicsHub开发计划.html) | 同上，可勾选进度（本地保存） |
| [`docs/vue-threejs-物理可视化可行性评估.md`](docs/vue-threejs-物理可视化可行性评估.md) | Vue+Three 可行性与架构结论 |
| [`docs/组件复用拆分.md`](docs/组件复用拆分.md) | Adapter 化与可复用组件 / composable 清单 |

## 当前进度（2026-11-15）

| 里程碑 | 状态 |
|--------|------|
| **M1 引擎骨架** | ✅ 完成（协议、RK4 / 受限表达式 / 场采样、Canvas2D + Three + Chart） |
| **M2 播放器与目录** | 🔶 部分完成（深链、播放/scrub、参数台、助学 UI、多视图）；目录树/搜索/缩略图/全屏仍待做 |
| **M3 场景模板** | ⏳ 未单独立项；能力已以 Adapter + 渲染原语形式沉淀 |
| **M4 力学样板包** | 🔶 进行中：**9 / ≥12** 演示可玩；助学协议与 Adapter 验收通过 |

### 平台能力（相对抛体样板）

- 三栏教学壳 + `DemoAdapter`：新增演示只改 `demos/` + 注册，**不改** `DemoPlayer.vue`
- `tMax` 协议、`pedagogy` 去抛体化、对比轨迹 / 图例 id、纵向堆叠曲线随 \(t\) 揭示
- 2D 图上参数标注（角度弧 / 尺寸线 / 标签）、3D 平移取景

### 已注册力学演示（9）

| id | 名称 | M4 对应 |
|----|------|---------|
| `mech-projectile` | 抛体运动 | M4-02 ✅ |
| `mech-collision-1d` | 一维碰撞 | M4-04 ✅ |
| `mech-harmonic` | 简谐振动 | M4-05 ✅ |
| `mech-damped` | 阻尼振动 | M4-06 ✅ |
| `mech-forced` | 受迫振动与共振 | M4-07 ✅ |
| `mech-rolling` | 无滑滚动（平面） | M4-08 ✅ |
| `mech-pendulum` | 单摆 | M4-10 ✅ |
| `mech-circular` | 匀速圆周 | 运动学增补 |
| `mech-incline` | 斜面滑块 | 动力学增补 |

待做（M4）：自然坐标系、定轴转动深化、横波/驻波、角动量示意、势能曲线、目录 JSON / 抽检等。

## 技术要点

- 包管理：`packageManager` + `preinstall only-allow pnpm`；Windows 下 `.npmrc` 使用 `node-linker=hoisted`
- 部署 `base`：`/DrawPhysicsHub/`（见 `vite.config.ts`）
- 物理对错只在 `core/physics` + 各 demo model；渲染只消费 `ObserveSnapshot`
