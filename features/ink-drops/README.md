# ink-drops · 三滴淡墨

首屏名字旁边的三滴墨：在做、在哪、心情。内容在 `data/now.json` 的 `drops` 里（`label`、`value` 中英各一，`at` 是在首屏里的初始位置比例，`r` 是半径，`dot` 是心情颜色，`href` 是点了去哪）。

- 慢慢漂、互相轻碰弹开，不会漂进中间的文字区（`data-avoid`）
- 鼠标靠近会让开
- 手机、减少动效：不动，排成一行放在按钮下面
- 离开视野就停下，不耗电

**用法：** `<div data-drops data-src="data/now.json" data-avoid=".hero-core"></div>`，页面里要有 `#ink-soft` 这个 SVG 滤镜（见 `index.html`）。
