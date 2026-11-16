# roll-up · 收卷转场（自序 → 目录）

从自序往后拖：前半程一根锦缎轴从右往左把包首和自序卷起来，后半程卷好的轴带着目录滑回右边，并到天杆上。往回拖就倒着放。

**文件：** `roll-up.css` · `roll-up.js` · `demo.html` · `README.md`

## 原理

drag 只管逻辑位置 `x`；这里通过 `core/track-map.js` 把 `x` 换算成画面位置，前半程画面不动、后半程用一半的距离追上。吸附点、键盘、网址都不受影响。删掉这个文件夹，就退回普通的平滑滚动。

## 事件

| 听 | 发 |
| --- | --- |
| `drag:move` · `scroll:opened` · `content:ready` · `content:changed` · `scroll:closed` | — |

## 不做的情况

手机（宽 ≤ 720px）、系统开了「减少动效」：直接普通滚动。
