# DrawPhysicsHub 架构说明

## 分层

```
app/          Vue 壳：路由、DemoPlayer（三栏教学 UI）、参数 / 挑战 / 解析
demos/        具体演示：DemoMeta + PhysicsModel 工厂（如 mechanics/projectile）
core/physics  模型层：协议、ODE、表达式、场采样、pedagogy、注册表（可单测）
core/render   渲染层：Canvas2D / Three.js / Chart 适配器（坐标系、矢量、辅助线）
```

## 边界

- **物理对错**只由 `core/physics` 与各 demo 的 model 负责；渲染层不得改写物理状态。
- **渲染**只消费 `ObserveSnapshot`（及模板约定字段），可随时替换实现。
- **Demo 协议**见 `core/physics/types.ts`：`DemoMeta` / `ParamDef` / `PhysicsModel` / `DemoDocs`。

## DemoDocs 教学字段（抛体样板已用）

| 字段 | 用途 |
|------|------|
| `concept` | 概念解释（中栏顶部 / 说明页） |
| `steps` + `bindings` | 分步解析 + 公式旁实时代入 |
| `challenges` | 引导挑战（声明式 `check`，播放器判定） |
| `legend` / `insight` | 图例、提示条 |
| `objectives` / `formulas` | 教学目标、公式列表 |

辅助：`core/physics/pedagogy.ts`（`buildPedagogyContext` / `formatBinding` / `challengeStatus`）。  
模型可选实现 `seek(t)`，供时间轴 scrub。

## 新增一个演示

1. 在 `demos/<subject>/` 实现 `createXxxModel()` + `DemoMeta`（尽量填齐 `concept` / `steps` / `challenges`）
2. `registerModel` + `registerDemo`
3. 在 `demos/index.ts` 调用注册函数
4. （可选）为极限行为与挑战判定写 `*.spec.ts`
5. 布局与播放器能力复用 `DemoPlayer`；专用画法放在 `core/render` 或 demo 侧适配函数

## 禁止事项

- 不做通用动态几何 / CAS 白板
- 不在浏览器执行任意用户脚本表达式（仅受限算术求值器）
