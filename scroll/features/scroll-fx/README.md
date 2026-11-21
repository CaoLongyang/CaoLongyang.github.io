# scroll-fx · 滚动动效

竖着滚，纸横着走（带惯性）；木轴跟着转；卡片浮出、线一笔画出、数字滚动；高亮当前段。

**单独看：** 起本地服务器后打开 `features/scroll-fx/demo.html`，或从 `lab/index.html` 进入。

**文件：** `scroll-fx.css` · `scroll-fx.js` · `demo.html` · `README.md`

## 用法

```html
<div data-rail> … <div class="scroll" data-scroll> … <div class="track" data-track>
  <section class="panel" id="works" data-panel>
    <div data-float style="--i:0">…</div>
    <svg data-draw><path pathLength="1" d="…"/></svg>
    <b data-count="4">0</b>
  </section>
</div>
```

## 事件

| 听 | 发 |
| --- | --- |
| `scroll:opened` · `scroll:closed` · `content:ready` · `content:changed` · `nav:goto { id }` | `panel:in { id, el }` · `section:change { id }` |

## 可调

每段的 `--span`（宽度倍数）；写入每段的 `--p`（0–1 进入程度）

## 备注

长卷从右往左读：第一段在最右，往下滚纸往右送。
