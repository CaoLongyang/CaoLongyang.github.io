# drag · 推纸

用手推纸：按住拖 1:1 跟手；松手按速度惯性滑一段，吸附到最近的接缝；拖到头有橡皮筋。滚轮 / 触控板直接推，停下 160ms 后吸附。键盘 `←` 下一段、`→` 上一段、`Home` / `End`。

往右拖 = 把纸从左边的卷里拉出来（和真手卷一样：从右往左读）。

**单独看：** 首页就是它的演示；工坊里的「滚动动效」演示也用它。

**文件：** `drag.css` · `drag.js` · `README.md`

## 用法

需要页面里有 `.view` 和 `[data-track]`，段落标 `[data-panel]`。页面里 `data-goto="段 id"` 的链接会卷过去。

## 事件

| 听 | 发 |
| --- | --- |
| `nav:goto { id, instant }` · `scroll:opened` · `scroll:closed` · `content:ready` · `content:changed` | `drag:move { x, maxX }` |

## 可调

`drag.js` 顶部：橡皮筋系数 0.32、惯性投射 260ms、吸附补间 ≤ 1s、滚轮停顿 160ms。

## 备注

只有 `body.settled`（开场走完）之后才能推。
