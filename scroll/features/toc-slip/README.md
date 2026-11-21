# toc-slip · 「目」字布带 + 目录笺

上黑边正中垂下一根朱红的「目」字布带。任何时候点它（或按 `T`），一张目录笺从下黑边里抽上来，盖在卷上；再点布带、按 `Esc` 或点笺外面就退回去。

笺里的内容和卷上的目录是同一份 `sections/toc.html`，点「画心」照常进入作品集。

**文件：** `toc-slip.css` · `toc-slip.js` · `demo.html` · `README.md`

## 用法

```html
<sc-toc-slip data-toc="sections/toc.html"></sc-toc-slip>
```

## 事件

| 听 | 发 |
| --- | --- |
| `scene:opened`（场景打开时自动收起） | `content:changed`（内容载入后，让中英文套上） |

打开时 `body` 加 `.slip-open`，drag 会暂停。
