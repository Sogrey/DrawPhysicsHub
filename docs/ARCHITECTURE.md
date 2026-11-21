# DrawPhysicsHub 架构说明

## 分层

```
app/          Vue 壳：路由、DemoPlayer（三栏教学 UI）、参数 / 挑战 / 解析
demos/        具体演示：DemoMeta + PhysicsModel + Adapter（如 mechanics/projectile）
core/physics  模型层：协议、ODE、表达式、场采样、pedagogy、注册表、adapter（可单测）
core/render   渲染层：Canvas2D / Three.js / Chart 适配器（坐标系、矢量、辅助线）
```

## 边界

- **物理对错**只由 `core/physics` 与各 demo 的 model 负责；渲染层不得改写物理状态。
- **渲染**只消费 `ObserveSnapshot`（及模板约定字段），可随时替换实现。
- **Demo 协议**见 `core/physics/types.ts`：`DemoMeta` / `ParamDef` / `PhysicsModel` / `DemoDocs` / `DemoAdapter`。

## 时间轴约定

- scrub / 曲线全长读取 `observe.values[meta.time.maxKey]`。
- `maxKey` 缺省为 `tMax`；未设置时兼容旧键 `flightTime`。
- 模型在 `done === 1` 时表示当前过程结束（再点播放会先复位）。

## DemoDocs 教学字段

| 字段 | 用途 |
|------|------|
| `concept` | 概念解释（**仅说明页**；中栏不重复） |
| `steps` + `bindings` | 分步解析 + 公式旁实时代入 |
| `challenges` | 引导挑战（声明式 `check`，播放器判定） |
| `legend` / `insight` | 图例（可用 `id`）、提示条 |
| `objectives` / `formulas` | 教学目标、公式列表 |

辅助：`core/physics/pedagogy.ts`（`buildPedagogyContext` **只 merge** params + live，不写死 demo 公式；衍生量由 model.observe 输出）。  
模型可选实现 `seek(t)`，供时间轴 scrub。

## 可复用拆分（对照抛体样板）

详见 [组件复用拆分.md](./组件复用拆分.md)。

| 层 | 复用 |
|----|------|
| Vue | `app/components/demo/*`：参数台 / 播放条 / 读数 / 解析 / 挑战 / 图例 / Tabs / Three HUD |
| Composable | `useDemoModel` · `useSimPlayback` · `usePedagogy` · `useCanvas2DView` · `useThreeView` · `useCompareTrail` · `useDemoCharts` |
| 渲染原语 | `primitives2d` / `primitives3d` / `particle3d` / `chart2d` |
| Demo 专用 | `demos/<subject>/`：model + adapter + render* + meta |

`DemoPlayer` 只负责组装壳 + 通过 **Adapter**（`meta.adapter` → `registerAdapter`）挂接 paint / setup3d / buildCompare；不 import 具体 demo。`features.compare|scrub|charts` 控制能力；对比图例用 `legend.id` / `features.compareLegendId`。

目录页：`app/catalog/demoCatalog.ts` 由 `listDemos()` + `catalogPlan.PLANNED_SOON` 现算学科→分类树，支持搜索/标签与「敬请期待」卡片；封面走 `LIVE_COVERS`（`public/covers/*.png`）或通用 `PLACEHOLDER_COVER`，URL 经 `publicAsset` 拼 Vite `base`；壳文案走 `app/i18n`。

## 新增一个演示

力学包细则见 [力学内容规范.md](./力学内容规范.md)；抽检见 [力学包抽检报告.md](./力学包抽检报告.md)。  
电磁 / 光学见 [电磁内容规范.md](./电磁内容规范.md)、[光学内容规范.md](./光学内容规范.md)、[电磁光学抽检报告.md](./电磁光学抽检报告.md)。目录分类序：`catalogPlan.CATEGORY_ORDER`。

1. 在 `demos/<subject>/` 实现 `createXxxModel()` + `DemoMeta`（填齐 `concept` / `steps` / `challenges` / `readouts`；输出 `tMax` 与所需衍生量）
2. 实现 `createXxxAdapter()`（`paint2d` / `setup3d` / `buildCompare` 等）
3. 专用画面放同目录 `render*.ts`
4. 用 `registerDemoBundle({ model, adapter, meta })`（或分别 `registerModel` / `registerAdapter` / `registerDemo`），并在 `demos/index.ts` 调用
5. （可选）极限行为与挑战 `*.spec.ts`
6. （可选）在 `LIVE_COVERS` 登记封面，并把截图放到 `public/covers/<id>.png`（可用 `scripts/capture-covers.mjs`）  
   实操与踩坑见 [演示开发经验与封面截图.md](./演示开发经验与封面截图.md)
7. **勿改** `DemoPlayer.vue`；复用壳与 `components/demo/*`

## 已注册力学演示（`demos/index.ts`）

| id | 目录入口 | 要点 |
|----|----------|------|
| `mech-projectile` | `projectile.ts` | 教学样板：分解 / 对比 / scrub |
| `mech-circular` | `circular.ts` | 匀速圆周、向心加速度 |
| `mech-natural-frame` | `naturalFrame.ts` | 自然坐标系：椭圆轨道 aₜ / aₙ |
| `mech-incline` | `incline.ts` | 斜面滑块、摩擦、能量 |
| `mech-harmonic` | `harmonic.ts` | 简谐；Adapter 验收样板 |
| `mech-damped` | `damped.ts` | 欠阻尼包络 |
| `mech-forced` | `forced.ts` | 受迫稳态 / 共振 |
| `mech-pendulum` | `pendulum.ts` | 单摆小角 / 大摆角 |
| `mech-collision-1d` | `collision.ts` | 一维碰撞 |
| `mech-rolling` | `rolling.ts` | 无滑滚动、\(v=\omega R\)、动能分配 |
| `mech-rotation-axis` | `rotationAxis.ts` | 定轴转动：ω/α、τ=Iα、轮缘线速度 |
| `mech-wave-transverse` | `waveTransverse.ts` | 行进横波：λ、T、相速 v=λ/T |
| `mech-standing-wave` | `standingWave.ts` | 驻波：波节/波腹、包络 \(2A|\cos kx|\) |
| `mech-energy-curve` | `energyCurve.ts` | 势能曲线 U(x) 与 E、K 联动 |
| `mech-angular-momentum` | `angularMomentum.ts` | 对点角动量：直线掠过，L=mvb |

2D 图注约定：优先用 `primitives2d` 的 `drawAngleMark` / `drawDimLine` / `drawDiagramLabel`，避免与轴线/轨迹压线。

## 禁止事项

- 不做通用动态几何 / CAS 白板
- 不在浏览器执行任意用户脚本表达式（仅受限算术求值器）
