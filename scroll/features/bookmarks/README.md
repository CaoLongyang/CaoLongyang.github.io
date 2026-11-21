# bookmarks · 布带书签

从顶上垂下的布带，一段一根；悬停会摆，当前段换成朱色的绢。手机上收成底部一条。

**单独看：** 起本地服务器后打开 `features/bookmarks/demo.html`，或从 `lab/index.html` 进入。

**文件：** `bookmarks.css` · `bookmarks.js` · `demo.html` · `README.md`

## 用法

```html
<sc-bookmarks></sc-bookmarks>
<section id="works" data-bookmark data-mark="画心" data-name="Works">…</section>
```

## 事件

| 听 | 发 |
| --- | --- |
| `section:change { id }` | `nav:goto { id }` |

## 可调

`--len`（每根的长度）

## 备注

只在 `body.settled` 后垂下来。
