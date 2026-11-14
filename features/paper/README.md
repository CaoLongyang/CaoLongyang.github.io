# paper · 纸面

纸纹（SVG 噪点）、水墨、卷痕、焦边四层。`paper.js` 会自动给 `.paper` 补上 `.paper-ink` `.paper-roll` `.paper-char`。

**单独看：** 起本地服务器后打开 `features/paper/demo.html`，或从 `lab/index.html` 进入。

**文件：** `paper.css` · `paper.js` · `demo.html` · `README.md`

## 用法

```html
<div class="paper"></div>            <!-- 长卷里的纸 -->
<div class="paper is-static"></div>  <!-- 详情页、演示页里的独立纸 -->
```

## 事件

| 听 | 发 |
| --- | --- |
| 无 | 无 |

## 可调

`--paper-hi` `--paper` `--paper-lo` `--paper-dim`

## 备注

焦边用的是 `core/filters.js` 里的 `#burnEdge`。
