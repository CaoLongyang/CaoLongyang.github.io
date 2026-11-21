# stage · 桌面

亚麻桌面、斜掠的窗光、暗角、卷下的投影；夜间换成一盏会呼吸的台灯。

**单独看：** 起本地服务器后打开 `features/stage/demo.html`，或从 `lab/index.html` 进入。

**文件：** `stage.css` · `stage.js` · `demo.html` · `README.md`

## 用法

```html
<div class="rail"><main class="scene">…</main></div>
```

## 事件

| 听 | 发 |
| --- | --- |
| 无 | 无 |

## 可调

`--desk-hi` `--desk` `--desk-mid` `--desk-lo`（tokens.css）

## 备注

`stage.js` 只做一件事：往 `.scene` 里放一个 `.stage-lamp`。卷没展开时 `body` 不可滚动。
