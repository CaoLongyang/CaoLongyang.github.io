# screen · 屏风

一扇 = 一件作品，内容来自 `data/works.json`。四扇相接：铜合页、内框线、共用屏座；收着的扇一明一暗。

- **首页小屏风：** `<div data-screen="mini" data-src="data/works.json" data-base="works/"></div>`。悬停 / 聚焦哪扇，哪扇变宽；点击进入作品集，转场时同一扇放大成详情（跨页 View Transitions）。
- **作品集整座屏风：** 由 `works/works.js` 调用 `renderPanels()`、`wireHover()`，自己管折叠和详情。
- **手机：** 一次一扇，左右滑。
- 还没有真截图时显示简化的界面示意（`mock`：dark / light / warm / scroll）。
