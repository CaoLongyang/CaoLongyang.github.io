# brush · 一笔飞白

首页名字下面那一笔。打开页面 0.55 秒后从左往右写出来（1.15 秒），墨再从边缘晕开。颜色跟主题走（`--wash`）。

**用法：** `<div data-brush></div>`，引入 `brush.css` 和 `brush.js`。

**省在哪：** 干笔纹理是 SVG 滤镜，只算一次；动的只是遮罩线的 `stroke-dashoffset`。
