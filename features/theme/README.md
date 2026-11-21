# theme · 天青 / 黑漆朱

两种主题，颜色都写在 `assets/css/tokens.css`。第一次来跟随系统，点过开关后记住选择。切换时从开关处一圈晕开（View Transitions，不支持的浏览器直接切）。

**用法：** `<button class="chip" data-theme-toggle></button>`，并在 `<head>` 最前面放那段内联脚本（见 `index.html`），在第一帧前定好主题。

**事件：** 听 `lang:change`（更新按钮文字）。
