# seal · 火漆

手绘 SVG 火漆，挂在绳结上。悬停 1.5 秒裂开一道缝；点击后蜡抬起、脱手落下。

**单独看：** 起本地服务器后打开 `features/seal/demo.html`，或从 `lab/index.html` 进入。

**文件：** `seal.css` · `seal.js` · `demo.html` · `README.md`

## 用法

```html
<sc-seal mark="卷"></sc-seal>   <!-- mark：印文，一个字 -->
```

## 事件

| 听 | 发 |
| --- | --- |
| `scroll:opened`（之后不再可聚焦）· `scroll:closed`（重新封上） | `seal:broken` |

## 可调

无
