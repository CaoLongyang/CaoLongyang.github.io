# theme-switch · 昼夜

昼 / 夜 两套主题，写在 `<html data-theme>` 上；没选过就跟随系统。

**单独看：** 起本地服务器后打开 `features/theme-switch/demo.html`，或从 `lab/index.html` 进入。

**文件：** `theme-switch.css` · `theme-switch.js` · `demo.html` · `README.md`

## 用法

```html
<sc-theme-switch></sc-theme-switch>
```

## 事件

| 听 | 发 |
| --- | --- |
| 无 | `theme:change { theme }` |

## 可调

tokens.css 里 `:root[data-theme="night"]` 一组

## 备注

页面 `<head>` 里有一行启动脚本提前设好主题，避免闪一下。
