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

## 当前进度（2026-11-16 · 计划 v1.5）

| 里程碑 | 状态 |
|--------|------|
| **M1 引擎骨架** | ✅ 完成（协议、RK4 / 受限表达式 / 场采样、Canvas2D + Three + Chart） |
| **M2 播放器与目录** | ✅ 完成（学科树、搜索标签、多学科卡片、真实封面、全屏、错误边界、FPS HUD、浅色壳 + i18n） |
| **M3 场景模板** | ⏳ 未单独立项；能力已以 Adapter + 渲染原语形式沉淀 |
| **M4 力学样板包** | ✅ **完成**（15 可玩 + [内容规范](docs/力学内容规范.md) + [抽检报告](docs/力学包抽检报告.md) 56/56） |
| **M5 电磁/光学** | 进行中（10 样板 ✅ · 目录规范 M5-11/12 ✅ · 抽检 41/41 · 下一 M5-13） |

### 平台能力（相对抛体样板）

- 三栏教学壳 + `DemoAdapter`：新增演示只改 `demos/` + 注册，**不改** `DemoPlayer.vue`
- 目录：`app/catalog` 学科→分类树 + 搜索/标签；已实现用 `public/covers/*.png`，未实现「敬请期待」用通用 `placeholder.svg`（路径经 `publicAsset` 拼 Vite `base`）
- 多学科预告：`catalogPlan.PLANNED_SOON`（电磁 / 光学扩展 + 热 / 量子 / 理论力学代表条）；分类序 `CATEGORY_ORDER`
- `tMax` 协议、`pedagogy` 去抛体化、对比轨迹 / 图例 id、纵向堆叠曲线随 \(t\) 揭示
- 2D 图上参数标注（角度弧 / 尺寸线 / 标签）、3D 平移取景；演示全屏 / 可选 FPS

### 已注册力学演示（15）

| id | 名称 | M4 对应 |
|----|------|---------|
| `mech-projectile` | 抛体运动 | M4-02 ✅ |
| `mech-natural-frame` | 自然坐标系速度/加速度 | M4-03 ✅ |
| `mech-collision-1d` | 一维碰撞 | M4-04 ✅ |
| `mech-harmonic` | 简谐振动 | M4-05 ✅ |
| `mech-damped` | 阻尼振动 | M4-06 ✅ |
| `mech-forced` | 受迫振动与共振 | M4-07 ✅ |
| `mech-rolling` | 无滑滚动（平面） | M4-08 ✅ |
| `mech-rotation-axis` | 定轴转动 | M4-09 ✅ |
| `mech-pendulum` | 单摆 | M4-10 ✅ |
| `mech-wave-transverse` | 横波形成与传播 | M4-11 ✅ |
| `mech-standing-wave` | 驻波 | M4-12 ✅ |
| `mech-angular-momentum` | 角动量对点 | M4-13 ✅ |
| `mech-energy-curve` | 机械能 / 势能曲线 | M4-14 ✅ |
| `mech-circular` | 匀速圆周 | 运动学增补 |
| `mech-incline` | 斜面滑块 | 动力学增补 |

M4 已完成。复验：`pnpm test:mechanics` / `pnpm audit:mechanics`。封面可用 `scripts/capture-covers.mjs` 更新。

### M5 电磁 / 光学（进行中）

| id | 名称 | 状态 |
|----|------|------|
| `em-point-charge` | 点电荷电场叠加 | M5-01 ✅ |
| `em-dipole` | 电偶极子场（极限过程） | M5-02 ✅ |
| `em-wire-b` | 无限长直导线磁场 | M5-03 ✅ |
| `em-cyclotron` | 洛伦兹力回旋 | M5-04 ✅ |
| `em-lenz` | 磁通量 / 楞次定律 | M5-05 ✅ |
| `opt-double-slit` | 双缝干涉条纹 | M5-06 ✅ |
| `opt-diffraction` | 单缝衍射 | M5-07 ✅ |
| `opt-malus` | 偏振片起偏检偏（马吕斯） | M5-08 ✅ |
| `opt-waveplate` | 波片与偏振态（线/圆/椭圆） | M5-09 ✅ |
| `opt-refraction` | 反射折射光路（斯涅尔） | M5-10 ✅ |

目录规范：[`docs/电磁内容规范.md`](docs/电磁内容规范.md) · [`docs/光学内容规范.md`](docs/光学内容规范.md)  
抽检：`pnpm test:em` / `pnpm test:optics` / `pnpm audit:em-optics`  
预告（敬请期待）：电势线、圆环 B、安培力、动生；薄透镜、薄膜、光栅、双折射。

下一优先：M5-13 场可视化箭头密度自适应等。

## 技术要点

- 包管理：`packageManager` + `preinstall only-allow pnpm`；Windows 下 `.npmrc` 使用 `node-linker=hoisted`
- 部署 `base`：`/DrawPhysicsHub/`（见 `vite.config.ts`）
- 物理对错只在 `core/physics` + 各 demo model；渲染只消费 `ObserveSnapshot`
