# unroll · 开场编排

打开页面 0.3 秒后自动播放：解绳 → 合遮幅 → 卷转正、摆到纸框右端 → 从右往左滚开 → 显字，2.5 秒后可操作。开场中点击、按键或滚轮会快进（0.3 秒内到位）。老访客、带锚点进来的、要求减少动效的，直接是展开好的样子。

**单独看：** 起本地服务器后打开 `features/unroll/demo.html`，或从 `lab/index.html` 进入。

**文件：** `unroll.css` · `unroll.js` · `demo.html` · `README.md`

## 用法

页面上 `data-action="replay"`（重看开场）或 `data-action="rollup"`（收卷）的按钮

## 事件

| 听 | 发 |
| --- | --- |
| `intro:replay` · `scroll:rollup` | `scroll:opened { instant }` · `scroll:closed` |

## 可调

无

## 备注

时序：静置 0.3s · 解绳 0–0.6s · 合遮幅 0.1–0.8s · 转正摆位 0.2–0.8s · 滚开 0.7–2.0s · 显字 1.7s 起 · 2.2s 后 `settled`（均从开始播放算起）。记忆键 `scroll-opened-v1`。
