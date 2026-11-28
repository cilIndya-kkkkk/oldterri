# oldterri HANDOFF — 会话交接

> 目标：让新对话无缝接手。oldterri 是把原版 Territorial.io 适配到 **iOS 12 老设备**（跑不动 FX client）的项目。
> 本会话完成：验证绕过（16框）、完整 automation 移植、以及 26 Nov 游戏版本适配。**务必先读本文再动手。**

---

## ★ 待办交接（下个对话接手）

> 28 Nov 进展：**B 已打补丁待真机确认**，**C 已有初版工具待下次更新验证**，A 仍未修。下面保留原始发现与方向，避免重复踩坑。

### C. 给 oldterri 加自动更新工具（28 Nov 已做初版，待真机/下次更新验证）
- 新工具在 `update/`（已 commit）：`update.py` + `hooks.json`（26 Nov 全量钩子，含 tick 计数器）+ 自带的 `derive_hooks.py` 副本（不再依赖易丢的 `/usr/tmp`）。
- 用法：
  ```bash
  cd ~/oldterri
  python3 update/update.py                          # dry run：抓新版 + 派生新名 + 打印 diff
  python3 update/update.py --game-file /path/new.js # 用本地脚本
  python3 update/update.py --apply                  # 写回 game/injectionA/build + 重 build + node --check
  ```
- 机制：token 对齐派生新名 → 全路径替换（`bB.iD.iK` 这种）→ 别名替换（`support.jL`/`controller.a68`/`__fxAd.fn`，靠初始化式识别别名）→ 写回 `automation/full/injectionA.js` 和 `build.js` 的 rawChecks/注入锚点。派生不出来的 hook 直接报错、不部分写入。
- 已用合成改名脚本端到端 dry-run 验证：能正确改出 `bB.zZ.qQ`/`bD.h7.zz`/`bF.q9`/`a4N.zz9`，别名 `support.jQ→support.zz`、`controller.a6M→controller.q9` 也对。
- 仍**需手工**的：`build.js` 里非 hook 锚点（`function dN`、`ei`/`dv` 验证补丁、16 框诊断块），工具会预先 WARNING 列出；build 本身也会 fail loudly。更新后仍需真机验证。
- 旧记录（保留）：`~/goodupdate`、`~/srez_update` 是给 goodclient/srez 的，未适配 oldterri。
- 已验证可用：`~/goodupdate/derive_hooks.py`（token 对齐）能解混淆名。26 Nov 适配时它抓出我手工漏掉的 **4 处**（sendSupport=s2、supportAmount=jQ、supportCalc=sT、setUiHidden=a6M）。**凡是改名的更新，必须用它交叉验证。**
- 历史难点（已由上面的工具解决大部分）：名以各种访问形式出现（`bB.iD.iK` 直接路径、`support.jL`/`controller.a68` 经变量访问），不是简单键值。
- 相关构建脚本（dev-side，`/usr/tmp` 可能被清，需时可重建）：`/data/data/com.termux/files/usr/tmp/opencode/autobuild/`（stub_settings.js、stub_gameInterface.js、entry.js、build_engine.mjs 用 esbuild 打引擎；extract_injection.mjs 从 goodclient 补丁提取注入A）。
- **注意**：引擎 getVar 的 gameState 已改稳健判断（玩家有领土/兵力即视为对局），不再依赖会变的 gameState 名，所以那处不用每次重推。a48 门控（state===2）曾试过但**会卡住开场自动化，已废弃**——别再用。

### A. Farm 打不了人机（单机）—— 28 Nov 已找到并修复根因（待真机确认）
- 现象：单机（人机）时，Farm 清野模式定位不到人机来打。
- **根因**：`injectionA.js` 里一批 22 Nov 的字段名在 26 Nov 改名后没跟上（手工适配漏掉，token 对齐工具当时没覆盖这些 hook）：
  - `aE.l4`（其实是攻击系数数组，不是人数）→ `aE.l9`（humanCount）
  - `aE.a14`（已不存在）→ `aE.a19`（lobby max join）
  - `aE.ie`（是个函数，被当布尔用）→ `aE.il`（isTeamGame）
  - `game.oA`→`game.oF`（uiHidden）、`game.iA`→`game.iB`（selectableSpawn）、`ah.a4j`→`ah.a4x`（rawPlayerNames）
  - 后果：`Number(aE.l4)` = NaN → `findV20ReserveBotAttackTarget` / `findSimpleBestBotAttackTarget` 等**一进门就 return -1**，所有 bot 定位全废。这比阈值问题更根本。
- 已全部替换；并把 6 个 hook 加进 `update/hooks.json`，下次更新工具会从 22nov→26nov 正确派生出 `l9/a19/il/oF/iB/a4x`（已验证 votes 62/9/32/18/32/11）。
- `ah.go` 仍存在但 goodclient 源码已注明是旧 build 的名字、只在未接线的兜底函数里，忽略即可。
- 已查：`findV20ReserveBotAttackTarget`（默认 v20reserve 模式）有一堆阈值门槛，单机早期自己兵少、人机地小，容易被挡：
  - `var sendTroops = ownTroops * 0.11; if (sendTroops < 200) return -1;`
  - `var minLand = Math.max(300, ownLand*0.005); if (land < minLand) continue;`
  - 还有 `breakeven` 成本、`activeTargets`/`recentTargets` 冷却等。
- 位置：goodclient `patches/gc_openingAutomation.js`（约 201-254 行）→ oldterri `automation/full/injectionA.js`（转译后的同名方法）。引擎调这些 find* 方法。
- 方向：放宽阈值（降 sendTroops<200、minLand）或调单机下的参数。**需设备实测确认，不能盲改。**
- 也检查 `canAttack`（`bw.fe`）在单机下对 bot 是否返回 true（若返回 false 会跳过所有 bot）。

### B. 16 框验证码旧设备弹不出来（28 Nov 已修一处 + 加了诊断，**待真机确认**）
- 现象：iOS 12 旧设备上 16 框验证码弹不出来，进大厅后没验证 UI，被踢。**新设备正常**。
- **28 Nov 进展（本次）**：找到高度可疑的根因——16 框浮层的 CSS 是 `.captcha-overlay{position:fixed;inset:0;...}`，`inset` 简写 Safari 14.1 才支持，iOS 12 直接忽略。浮层是 append 到 body、排在全屏 canvas 之后，没有 offset 就停在静态位置（屏幕外），所以"触发了但看不见"。`build.js` 已补 `top:0;left:0;right:0;bottom:0`（保留 inset 给新设备），并给按钮补 `-webkit-appearance:none`。
- **双保险**：除改 CSS 字符串外，`dp.resize()` 里还给浮层写了纯 inline 的 px 几何（`position:fixed;top/left/right/bottom:0;width/height:100%;z-index:999999`，grid 列和 16 个 tile 也都用 px 写死），不依赖 CSS 简写/变量；`resize` 每次都会重算。
- **诊断链**：`build.js` 加了 `__fxvlog()`（仅 `?debug=1` 生效，平时完全 no-op），在 8 个关键点打点：`bX.dv → ed.show → ef.eq(et 5 请求) → aco(服务端下发 17 张图) → dp.show → ov → ef.show → ef.eu`。`resize` 里还会打印浮层 `getBoundingClientRect()` 和 viewport 尺寸，可直接确认是否还在屏幕外。旧设备开 `?debug=1` 看日志停在哪一步；**诊断完记得关 debug**（会掉帧）。
- 验证：已 `node build.js` + `node --check docs/latest.js`；产物已 push 部署。
- 已排除：
  - debug 框（已改为 `?debug=1` 才开，非元凶）。
  - 无报错（debug 框无错误，说明不是代码崩）。
  - 16 框技术栈 iOS 12 兼容（canvas 2d、typed array、CSS 变量都支持；无 WebGL）。
- 已确认：`ei()=0` 强制走 16 框的补丁生效（新设备能弹，逻辑对）。
- 方向（复杂，用户知道且要求做）：
  1. 修 iOS 12 上 16 框的渲染/触发（需定位是"没触发"还是"触发了没渲染"）。
  2. 或真 token 中转（现代设备取 Turnstile token 传给旧设备，token 有时效，需实时）。
- 诊断手段：旧设备没 console，靠 debug 框。给旧设备 URL 加 `?debug=1`，看有没有验证相关日志（turnstile/验证码相关），判断到哪一步。**注意 debug 框在 `?debug=1` 时是开的，会掉帧，诊断完记得关。**
- 兜底：如果 16 框和 Turnstile 在 iOS 12 都无解，可能得走"真 token 中转"或"16 框自动解（OCR，用户之前抵触）"。

---

## 0. 关键事实

- 部署：GitHub Pages 从 `/docs` 部署 → `https://cilindya-kkkkk.github.io/oldterri/`
- 远程：`cilIndya-kkkkk/oldterri`，分支 `main`。SSH 不稳，push 用 HTTPS + token：
  ```bash
  TOKEN=$(grep -A2 'cilIndya-kkkkk:' ~/.config/gh/hosts.yml | grep oauth_token | head -1 | sed 's/.*oauth_token: //')
  git push "https://x-access-token:${TOKEN}@github.com/cilIndya-kkkkk/oldterri.git" main
  ```
- 游戏版本：**26 Nov 2026**（`game/latest.js`，647885 字节）。旧版备份在 `game/latest_22nov.js`。
- 构建：`node build.js` → 输出 `docs/latest.js`（单文件，iOS 12 可跑）。Pages 只服务 `/docs`，所以**每次都要把产物 commit 上去**。

---

## 1. 验证绕过（16 框）

老设备跑不了 Cloudflare Turnstile（iOS 12 解析不了它的 iframe），所以：
- `dv()` 改成 `if(true)` → 不加载 Turnstile 脚本。
- `ei()` 强制返回 0 → 游戏转用自带的 **16 格验证码**，玩家手动点选即可。服务器接受 16 框作为替代验证。

补丁在 `build.js` 里（`appearance:"execute"`、`this.ei=...return 0`、`this.dv=...if(true)`）。

## 2. Automation（完整引擎移植）

把 goodclient 的 `openingAutomation.js` 引擎完整移植成 ES5（iOS 12 兼容），**用 esbuild 把 ES2020 的 `?.`/`??` 降级**。

`automation/full/` 下（都已 commit）：
- `engine.js` — esbuild 打包后的引擎（ES5，~75KB）。设置 `__fx.openingAutomation` + keybindFunctions（状态存储）+ settings stub（localStorage `fx_auto_settings`）。**注意：keybindFunctions 用状态存储即可，引擎走 sendAttack 直发路径，不需要接游戏攻击条。**
- `injectionA.js` — 游戏内原始方法绑定（从 goodclient 的 `gc_openingAutomation.js` 提取 + 转 ES5），注入到 `function dN`。
- `control.js` — 右下角按钮：**Farm**（循环清野模式 v20reserve/best/messiah/off）、**Opening**、**Inf**（无限扩张开关）。
- `openingControl.js` — 左下角 "Opening setup" 面板：自定义开局策略（下拉选 `~/ttresearch` 研究策略）+ tick offset。

`build.js` 编排：debug overlay + engine + controls + 策略数据注入到游戏前；injectionA 注入到 `function dN`；**tick 钩子（injectionB）注入到 `this.eq=function(){this.a4N.an9++;}`**；验证补丁；`window.aE`/`window.ah` getter。

### 状态机关键点
- 引擎用 `getVar("gameState")` 做"是否在对局中"门控（只取真值）。**用了稳健判断**：玩家有领土/兵力（`ah.hZ[aE.fV]>0`）即视为对局中，不再依赖会变的 gameState 混淆名。这避免了每次更新都要重推 gameState 名。
- 引擎只走 `sendAttack` 直发，百分比通过 `keybindFunctions.setAbsolute/getAttackPercentage` 状态存储传递。

---

## 3. 游戏更新适配流程（CRITICAL，本会话核心经验）

游戏每次更新混淆名都会重排。以下是从 22 Nov 适配 26 Nov 的实操经验。

### 3.1 更新步骤
1. 下载最新游戏：`https://territorial.io` → 提取 `<script>` → 替换 `game/latest.js`。先备份旧版（`cp game/latest.js game/latest_<date>.js`）。
2. 跑 `node build.js` —— **raw-name 校验会报哪些名断了**（`build.js` 里 `rawChecks`），这是最快的定位。
3. 用 token-alignment 工具重推新名（见 3.2）——**必须用它交叉验证，手工推导会漏**。
4. 更新 `automation/full/injectionA.js`（find-and-replace 访问模式）、`build.js`（rawChecks + tick 锚点）、以及 `engine.js` 里 `getVar` stub（如用稳健判断则不用动）。
5. `node build.js` + 用 acorn 验证 ES2015 解析通过 + 部署。

### 3.2 更新工具（token-alignment，验证过有效）
工具在 `~/goodupdate/derive_hooks.py`（goodclient 项目，未在 oldterri 里）。它用 token 上下文对齐解出新名，**只处理改名，不处理架构改动**（架构改动会 unresolved，需手工）。

```bash
python3 ~/goodupdate/derive_hooks.py \
  --old game/latest_<旧版>.js --new game/latest.js \
  --hooks <hooks.json> --out resolved.json
```

`hooks.json` 列出语义名 → 旧混淆路径（含 `component`：取路径的第几个组件）。结果 `resolved.json` 里每个 hook 有 `value`（新名）和 `votes`（投票数，越高越可信）。

**重要教训**：26 Nov 手工推导时我漏了 4 处（sendSupport、supportAmount、supportCalc、setUiHidden），是这个工具抓出来的。**凡是改了名，都要用工具交叉验证。**

### 3.3 26 Nov 改名的具体记录（供参考）
| 语义 | 22 Nov | 26 Nov |
| --- | --- | --- |
| sendAttack | `bB.iC.iJ` | `bB.iD.iK` |
| sendSupport | `bB.iC.rx` | `bB.iD.s2` |
| cancelAttack | `bB.iC.sD` | `bB.iD.sI` |
| gameCommandSender | `bB.iC` | `bB.iD` |
| supportAmount | `bD.h7.jL` | `bD.h7.jQ` |
| supportCalc | `bD.h7.sO` | `bD.h7.sT` |
| setUiHidden | `bF.a68` | `bF.a6M` |
| mapIsRendered | `bV.aME` | `bV.aMz`（注入A块未用到，忽略） |
| tick 计数器 | `this.a49.alS++` | `this.a4N.an9++` |
| gameState | `aE.a3z` | （已改稳健判断，不需名） |

**注意**：injectionA.js 里的名通过变量访问（`support.jL`、`controller.a68`、`bB.iD.iK`），不是简单键值。手工改时要找对访问形式。

---

## 4. 构建工具链（dev-side，未 commit）

引擎和 injectionA 是**在 oldterri 外**用工具生成的（不在 oldterri 内）：

- **引擎打包**：esbuild（target es2015）把 goodclient 的 `src/openingAutomation.js` + stub 依赖打成 ES5。stub 在 `/data/data/com.termux/files/usr/tmp/opencode/autobuild/`：
  - `stub_settings.js`（settings 存 localStorage，暴露 `window.__fxAutoGetSettings`/`__fxAutoPersist`）
  - `stub_gameInterface.js`（`getVar("gameState")` 稳健判断）
  - `entry.js`（设 `__fx` + keybindFunctions + `__fx.openingAutomation`）
  - `build_engine.mjs`（esbuild，alias settings/gameInterface 到 stub）→ `engine_out.js` → 拷到 `automation/full/engine.js`
- **injectionA**：`extract_injection.mjs` 从 goodclient 的 `patches/gc_openingAutomation.js` 提取模板、替换 `${dict.X}`/`${g.X}`、esbuild 降级 `?.` → `injectionA.js`。

> 这些脚本在 `/usr/tmp/` 下，**可能被清**。若丢失，需按上述机制重建（或改在 oldterri 内建一条稳定链路）。目前 engine.js/injectionA.js 的**产物已 commit**，不重建也能跑。

## 5. 已知问题 / 待办

- **控制 UI 是否在 iOS 12 上正常显示/交互**：未在真机验证。游戏会删 body 的 DIV/INPUT/BUTTON，control 用 setInterval 重挂。右下角 `fxAutoControls`（Farm/Opening/Inf 整块）28 Nov 起也改成可触摸拖动（与 `fxOpeningSetupBtn` 同款 touch 事件 + `__moved` 抑制误触 + localStorage `fx_controls_pos` 持久化），位置每 500ms 重挂后仍保留。
- **16 框验证**：需确认在最新游戏上仍能弹出并完成。
- **automation 在新版上能否跑**：26 Nov 适配已部署，但**尚未在设备上验证自动化实际攻防**。这是最大的未知。
- **gameState 稳健判断**：基于"玩家有领土/兵力"。若某局玩家 0 领土开局有延迟，开场自动化可能晚几 tick。需真机确认。
- **cancelAttack=sI 由工具确认**（我手工也是 sI，工具验证一致）。sendSupport=s2 是工具纠正的。
- **策略只嵌入了 >=2500 land 的**（best-2520 到 best-3960），因用户只要大目标的。

## 6. 关键文件速查
- `build.js` — 编排所有补丁 + rawChecks + 策略内嵌。
- `automation/full/engine.js` — 引擎（ES5，勿手改，改 stub 后重打包）。
- `automation/full/injectionA.js` — 游戏内绑定（游戏更新时改这里的名）。
- `automation/full/control.js` / `openingControl.js` — 控制 UI。
- `game/latest.js` — 当前 26 Nov 游戏。
- 顶层 `~/HANDOFF.md` — 多项目总交接（含 goodclient/srez/oldterri）。
