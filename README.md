# DrawPhysicsHub

物理现象可视化演示平台（Vue 3 + Vite + Three.js）。架构：**物理模型层 + 渲染层**；以教学交互为主，不复刻通用动态几何 / CAS 白板。

本仓库**默认使用 pnpm**（勿用 npm / yarn 安装依赖）。

## 快速开始

```bash
pnpm install
pnpm dev          # 开发：base 为 /DrawPhysicsHub/
pnpm test         # Vitest
pnpm typecheck
pnpm build        # vue-tsc + vite + spa-404
pnpm preview
pnpm list:demos   # 生成 docs/演示清单.md 并核对封面
```

浏览器打开演示目录，可选力学包中任一演示（默认样板为 **抛体运动**）。

## 文档

| 文档 | 说明 |
|------|------|
| [`docs/开发记录与路线图.md`](docs/开发记录与路线图.md) | **开发记录 · 下一步 · 后期计划**（优先读） |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | 分层边界、Demo 协议、已注册演示、如何新增 |
| [`docs/演示开发经验与封面截图.md`](docs/演示开发经验与封面截图.md) | 新演示路径、教学可视化、封面截图与踩坑 |
| [`docs/DrawPhysicsHub开发计划.md`](docs/DrawPhysicsHub开发计划.md) | 里程碑与任务（AI / 协作） |
| [`docs/DrawPhysicsHub开发计划.html`](docs/DrawPhysicsHub开发计划.html) | 同上，可勾选进度（本地保存） |
| [`docs/vue-threejs-物理可视化可行性评估.md`](docs/vue-threejs-物理可视化可行性评估.md) | Vue+Three 可行性与架构结论 |
| [`docs/组件复用拆分.md`](docs/组件复用拆分.md) | Adapter 化与可复用组件 / composable 清单 |
| [`docs/热学内容规范.md`](docs/热学内容规范.md) | 热学包命名 / 分类 / 验收 |
| [`docs/量子内容规范.md`](docs/量子内容规范.md) | 量子·近代包命名 / 分类 / 验收 |
| [`docs/热学量子抽检报告.md`](docs/热学量子抽检报告.md) | M7 抽检记录 |
| [`docs/M8抽检报告.md`](docs/M8抽检报告.md) | M8 进阶扩包抽检（`pnpm audit:m8`） |

## 当前进度（2026-11-25 · 计划 v2.0）

| 里程碑 | 状态 |
|--------|------|
| **M1 引擎骨架** | ✅ 完成（协议、RK4 / 受限表达式 / 场采样、Canvas2D + Three + Chart） |
| **M2 播放器与目录** | ✅ 完成（学科树、搜索标签、多学科卡片、真实封面、全屏、错误边界、FPS HUD、浅色壳 + i18n） |
| **M3 场景模板** | ⏳ 未单独立项；能力已以 Adapter + 渲染原语形式沉淀 |
| **M4 力学样板包** | ✅ **完成**（15 可玩 + [内容规范](docs/力学内容规范.md) + [抽检报告](docs/力学包抽检报告.md) 56/56） |
| **M5 电磁/光学** | ✅ **完成**（18 演示 + 目录/场密度/公式对照/3D 相机 + [抽检](docs/电磁光学抽检报告.md)） |
| **M6 发布验收** | ✅ 主体完成（见下；Pages/fps 收尾中） |
| **M7 热学与近代物理** | ✅ **完成**（热学 8 + 量子 8 + Worker 管线 + [规范](docs/热学内容规范.md)/[抽检](docs/热学量子抽检报告.md)） |
| **理论力学代表** | ✅ `theo-coriolis`（M8 先行） |
| **M8 进阶扩包** | ✅ A–D + Rel + F（68）+ 课次包 E + [抽检](docs/M8抽检报告.md) |

**可玩合计：118**（含 M8）；`PLANNED_SOON` 已清空。M8 已收口，下一步 **M9**。

### 平台能力（相对抛体样板）

- 三栏教学壳 + `DemoAdapter`：新增演示只改 `demos/` + 注册，**不改** `DemoPlayer.vue`
- 目录：`app/catalog` 学科→分类树 + 搜索/标签；已实现用 `public/covers/*.png`，未实现「敬请期待」用通用 `placeholder.svg`（路径经 `publicAsset` 拼 Vite `base`）
- 多学科：电磁 / 光学 / 热学 / 量子 / 理论力学 / 数物·晶格 / 近代物理已落地；分类序 `CATEGORY_ORDER`；首页「课次包」浏览
- `tMax` 协议、`pedagogy` 去抛体化、对比轨迹 / 图例 id、纵向堆叠曲线随 \(t\) 揭示
- **2D 视口**：拖拽平移 · 滚轮缩放 · 双击/「重置视角」复位（`createCanvas2DHost` + `Canvas2DHud`）
- **3D 视口**：拖拽旋转 · 右键/Shift 平移 · 滚轮缩放（`ThreeViewHud`）；演示全屏 / 可选 FPS
- 2D 图上参数标注（角度弧 / 尺寸线 / 标签）；3D 文字精灵 `createTextSprite`；水平转盘类 `(x,y)→(x,z)`、`Ω∥Y`

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

### M5 电磁 / 光学（✅）

| id | 名称 | 状态 |
|----|------|------|
| `em-point-charge` | 点电荷电场叠加 | M5-01 ✅ |
| `em-potential` | 电势与等势线 | 静电场增补 ✅ |
| `em-dipole` | 电偶极子场（极限过程） | M5-02 ✅ |
| `em-wire-b` | 无限长直导线磁场 | M5-03 ✅ |
| `em-loop-b` | 载流圆环磁场 | 电流磁场增补 ✅ |
| `em-cyclotron` | 洛伦兹力回旋 | M5-04 ✅ |
| `em-ampere` | 安培力（导线受力） | 洛伦兹力增补 ✅ |
| `em-lenz` | 磁通量 / 楞次定律 | M5-05 ✅ |
| `em-motional-emf` | 动生电动势 | 电磁感应增补 ✅ |
| `opt-double-slit` | 双缝干涉条纹 | M5-06 ✅ |
| `opt-diffraction` | 单缝衍射 | M5-07 ✅ |
| `opt-malus` | 偏振片起偏检偏（马吕斯） | M5-08 ✅ |
| `opt-waveplate` | 波片与偏振态（线/圆/椭圆） | M5-09 ✅ |
| `opt-refraction` | 反射折射光路（斯涅尔） | M5-10 ✅ |
| `opt-lens` | 薄透镜成像 | 几何光学增补 ✅ |
| `opt-thin-film` | 薄膜干涉 | 干涉增补 ✅ |
| `opt-grating` | 光栅衍射 | 衍射增补 ✅ |
| `opt-birefringence` | 双折射光路 | 偏振增补 ✅ |

### M7 热学（8） / 量子·近代（8）

| id | 名称 | 状态 |
|----|------|------|
| `thermo-gas` | 分子碰撞与压强示意 | M7-01 ✅ |
| `thermo-maxwell` | 麦克斯韦速率分布 | M7-02 ✅ |
| `thermo-mfp` | 平均自由程 | M7-03 ✅ |
| `thermo-pv-process` | 准静态过程功（P–V） | M7-04 ✅ |
| `thermo-carnot` | 卡诺循环 P–V 图 | M7-05 ✅ |
| `thermo-diffusion` | 扩散与均方位移 | 输运增补 ✅ |
| `thermo-ideal-gas` | 理想气体定律对照 | 状态方程 ✅ |
| `thermo-entropy` | 自由膨胀与熵增 | 熵与不可逆 ✅ |
| `qm-well` | 一维无限深势阱 | M7-06 ✅ |
| `qm-barrier` | 势垒隧道 | M7-07 ✅ |
| `qm-oscillator` | 谐振子本征态 | M7-08 ✅ |
| `qm-photoelectric` | 光电效应 | M7-09 ✅ |
| `qm-compton` | 康普顿散射 | M7-10 ✅ |
| `qm-double-slit` | 电子双缝干涉示意 | M7-11 ✅ |
| `qm-alpha` | α 散射轨道（Worker） | M7-12 ✅ |
| `qm-blackbody` | 黑体辐射曲线 | M7-13 ✅ |
| `theo-coriolis` | 科里奥利力示意 | M8-01 先行 ✅ |

**呈现约定（摘要）**

- `qm-well`：2D 为 ψₙ / \|ψ\|² / Reψ(t) + 顶栏位相钟；3D 为复曲线 `(x,Re,Im)`。
- `qm-alpha`：卢瑟福数值轨道；`core/physics/worker` 协议 + 默认同步后备。
- `theo-coriolis`：3D 水平转盘 `(x,y)`→`(x,z)`，`Ω∥+Y`。

规范：[`docs/热学内容规范.md`](docs/热学内容规范.md) · [`docs/量子内容规范.md`](docs/量子内容规范.md)  
抽检：`pnpm test:thermo` / `pnpm test:qm` / `pnpm audit:thermo-qm`  
### M8 进阶扩包（A–D + Rel + F + 课次包 E ✅）

`PLANNED_SOON` 已清空；首页可切换「课次包」按章节浏览。抽检：`pnpm audit:m8` → [M8抽检报告](docs/M8抽检报告.md)。

| 批次 | 内容 | 条数 | 状态 |
|:----:|------|:----:|:----:|
| **A** | 理论力学（双摆/进动/傅科/有心力…） | 6 | ✅ |
| **B** | 电磁波 / 偶极辐射 / 布儒斯特… | 6 | ✅ |
| **C** | 傅里叶 / 球谐 / 晶格 / 石墨烯… | 7 | ✅ |
| **D** | 六科补洞（耦合振子、RLC、艾里斑、热传导、波包…） | 19 | ✅ |
| **Rel** | 闵氏图 / 时胀 / 玻尔 | 3 | ✅ |
| **F** | 教材续扩（阿特伍德、霍尔、光纤、拉比、衰变…） | 27 | ✅ |
| **E** | 课次包 v1 + [抽检报告](docs/M8抽检报告.md) | — | ✅ |

完整 id 表：[docs/开发记录与路线图.md](docs/开发记录与路线图.md) §4.2。

### M6 发布（主体完成）

| 项 | 状态 |
|----|------|
| M6-01 生产构建与静态部署 | ✅ [发布与部署](docs/发布与部署.md) |
| M6-02 演示清单脚本 | ✅ `pnpm list:demos` → [演示清单](docs/演示清单.md) |
| M6-03 SEO / OG | ✅ `index.html` Open Graph / Twitter |
| M6-04 性能基线 | ✅ [性能基线](docs/性能基线.md)（实机 fps 待填） |
| M6-05 键盘播放 | ✅ Space / R·Home / F |
| M6-06 演示数 ≥30 | ✅ 当前 37 |
| M6-07 已知问题 | ✅ [一期已知问题](docs/一期已知问题.md) |
| M6-08 评估对照 | ✅ 评估附录 C 已更新 |
| M6-09 录屏素材 | ⏳ 封面已有；短录屏可选 |
| M6-10 评审清单 | ✅ [一期评审清单](docs/一期评审清单.md) |

线上：`https://sogrey.github.io/DrawPhysicsHub/`（`main` 推送后由 Actions 发布）。

### 下一步 / 后期计划（摘要）

| 阶段 | 内容 |
|------|------|
| **立即** | Pages 抽检 + 实机 fps；可选短录屏；F 批体验巡检（取景/播放驱动） |
| **近前 M9** | 移动端手势与布局、对比双视图、性能自动降级、投影模式、课次进度等 |
| **Backlog** | 作者工具 / LMS 等（不做通用动态几何白板） |

完整开发记录与路线：[docs/开发记录与路线图.md](docs/开发记录与路线图.md)。

## 技术要点

- 包管理：`packageManager` + `preinstall only-allow pnpm`；Windows 下 `.npmrc` 使用 `node-linker=hoisted`
- 部署 `base`：`/DrawPhysicsHub/`（见 `vite.config.ts`）；SPA 深链靠 `dist/404.html`
- 物理对错只在 `core/physics` + 各 demo model；渲染只消费 `ObserveSnapshot`
