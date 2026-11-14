# ink-reveal · 墨迹显影

文字先糊后清，像墨刚落在纸上慢慢定住，一行比一行晚 85ms。

**单独看：** 起本地服务器后打开 `features/ink-reveal/demo.html`，或从 `lab/index.html` 进入。

**文件：** `ink-reveal.css` · `ink-reveal.js` · `demo.html` · `README.md`

## 用法

```html
<p data-ink>…</p>
```

## 事件

| 听 | 发 |
| --- | --- |
| `content:ready` · `content:changed` | 无 |

## 可调

`--i`（先后顺序，自动编号）

## 备注

在长卷里：所在 `.panel` 拿到 `.is-in` 时显影。不在长卷里（详情页）：滚进视野时自己显影。
