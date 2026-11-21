# page-turn · 翻纸转场

跨页面 View Transitions：前进时旧页向右滑出、新页从左送进来；返回方向相反。

**单独看：** 起本地服务器后打开 `features/page-turn/demo.html`，或从 `lab/index.html` 进入。

**文件：** `page-turn.css` · `page-turn.js` · `demo.html` + `demo-b.html` · `README.md`

## 用法

```html
<script src="features/page-turn/page-turn.js"></script>  <!-- 放在 <head>，普通脚本 -->
<a href="../../index.html#works" data-turn="back">返回</a>
```

## 事件

| 听 | 发 |
| --- | --- |
| 无 | 无 |

## 可调

无

## 备注

不支持的浏览器就是普通跳转。演示需要两页：`demo.html` ↔ `demo-b.html`。
