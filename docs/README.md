# docs/

| 文件 | 用途 |
|------|------|
| [开发记录与路线图.md](./开发记录与路线图.md) | **开发记录 · 下一步 · 后期计划**（v2.0，优先读） |
| [DrawPhysicsHub开发计划.md](./DrawPhysicsHub开发计划.md) | 分期 / 里程碑 / 任务清单（与 HTML 同步，**v2.0**） |
| [DrawPhysicsHub开发计划.html](./DrawPhysicsHub开发计划.html) | 人工勾选进度版（localStorage） |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 分层边界、Demo 协议、已注册演示、如何新增 |
| [演示开发经验与封面截图.md](./演示开发经验与封面截图.md) | **实操总结**：新演示路径、教学可视化、封面截图命令与踩坑 |
| [力学内容规范.md](./力学内容规范.md) | M4-01：命名 / 单位 / 验收清单 |
| [力学包抽检报告.md](./力学包抽检报告.md) | M4-16：极限与守恒抽检（`pnpm audit:mechanics`） |
| [电磁内容规范.md](./电磁内容规范.md) | M5-11：电磁命名 / 场约定 / 分类序 |
| [光学内容规范.md](./光学内容规范.md) | M5-12：光学命名 / 光路偏振约定 / 分类序 |
| [电磁光学抽检报告.md](./电磁光学抽检报告.md) | M5-16：`pnpm audit:em-optics` |
| [热学量子抽检报告.md](./热学量子抽检报告.md) | M7-18：`pnpm audit:thermo-qm` |
| [M8抽检报告.md](./M8抽检报告.md) | M8-14：`pnpm audit:m8`（封面 + theo/math/rel/课次） |
| [vue-threejs-物理可视化可行性评估.md](./vue-threejs-物理可视化可行性评估.md) | Vue + Three.js 可行性与架构结论 |
| [组件复用拆分.md](./组件复用拆分.md) | Adapter 化与可复用组件 / composable 清单 |
| [发布与部署.md](./发布与部署.md) | M6-01：构建 / Pages / spa-404 |
| [演示清单.md](./演示清单.md) | M6-02：`pnpm list:demos` 自动生成 |
| [一期已知问题.md](./一期已知问题.md) | M6-07：发版已知问题 |
| [性能基线.md](./性能基线.md) | M6-04：产物量级与 fps 测法 |
| [一期评审清单.md](./一期评审清单.md) | M6-10：验收会勾选 |

仓库总览与命令见根目录 [README.md](../README.md)。

**教学样板：** `src/demos/mechanics/projectile.ts`  
**Adapter 验收：** 自简谐起，各学科演示均只改 `demos/` + 注册，Player 零修改。  
**进度摘要：** M1～M8 ✅ · 可玩 **118** · 2D 视口缩放/平移 · 下一步 **M9**（见 [开发记录与路线图.md](./开发记录与路线图.md)）。

**上手建议：** 先看路线图；新增演示读 [演示开发经验与封面截图.md](./演示开发经验与封面截图.md)，再对照对应学科内容规范。
