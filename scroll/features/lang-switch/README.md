# lang-switch · 中英切换

右上角 EN / 中。文字写成 `data-en` + `data-zh` 两份，开关只是挑一份。选择会被记住。

**单独看：** 起本地服务器后打开 `features/lang-switch/demo.html`，或从 `lab/index.html` 进入。

**文件：** `lang-switch.css` · `lang-switch.js` · `demo.html` · `README.md`

## 用法

```html
<sc-lang-switch></sc-lang-switch>
<p data-en="Hello" data-zh="你好">Hello</p>
<button data-en-label="Close" data-zh-label="关闭">×</button>
```

## 事件

| 听 | 发 |
| --- | --- |
| `content:ready` · `content:changed`（重新套一遍） | `lang:change { lang }` |

## 可调

无

## 备注

只替换纯文本；要带链接的句子，把链接拆成单独的元素。
