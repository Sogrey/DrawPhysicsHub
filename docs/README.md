# docs/

| 文件 | 用途 |
|------|------|
| [DrawPhysicsHub开发计划.md](./DrawPhysicsHub开发计划.md) | 分期 / 里程碑 / 任务清单（与 HTML 同步，**v1.5**） |
| [DrawPhysicsHub开发计划.html](./DrawPhysicsHub开发计划.html) | 人工勾选进度版（localStorage） |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 分层边界、Demo 协议、已注册演示、如何新增 |
| [力学内容规范.md](./力学内容规范.md) | M4-01：命名 / 单位 / 验收清单 |
| [力学包抽检报告.md](./力学包抽检报告.md) | M4-16：极限与守恒抽检（`pnpm audit:mechanics`） |
| [电磁内容规范.md](./电磁内容规范.md) | M5-11：电磁命名 / 场约定 / 分类序 |
| [光学内容规范.md](./光学内容规范.md) | M5-12：光学命名 / 光路偏振约定 / 分类序 |
| [电磁光学抽检报告.md](./电磁光学抽检报告.md) | M5-16：`pnpm audit:em-optics` |
| [vue-threejs-物理可视化可行性评估.md](./vue-threejs-物理可视化可行性评估.md) | Vue + Three.js 可行性与架构结论 |
| [组件复用拆分.md](./组件复用拆分.md) | Adapter 化与可复用组件 / composable 清单 |

仓库总览与命令见根目录 [README.md](../README.md)。

**教学样板：** `src/demos/mechanics/projectile.ts`  
**Adapter 验收：** 简谐及后续力学演示均只改 `demos/` + 注册，Player 零修改。  
**进度摘要：** M1 ✅ · M2 ✅ · M4 ✅（15 演示 + 规范 + 抽检）· M5 进行中（样板 10 演示 + 电磁/光学目录规范 + 抽检；下一 M5-13）。
