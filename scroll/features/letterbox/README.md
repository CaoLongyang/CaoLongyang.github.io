# letterbox · 遮幅

上下两条暖黑色的边，像电影画幅。卷着时窄（`--lb-closed`），展开时往中间合拢到 `--lb-open`。下黑边里有一行操作提示。

**单独看：** `features/letterbox/demo.html`

**文件：** `letterbox.css` · `letterbox.js` · `demo.html` · `README.md`

## 用法

```html
<sc-letterbox data-hint-en="drag · wheel · ← →" data-hint-zh="拖动 · 滚轮 · ← →"></sc-letterbox>
```

## 事件

无（读 `body.opened` / `body.settled` / `body.is-moved`）

## 可调

`--lb-color` `--lb-closed` `--lb-open` `--desk-gap`（tokens.css）
