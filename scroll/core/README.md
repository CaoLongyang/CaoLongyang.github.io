# core · 全站共用层

功能文件夹只依赖这里，不互相依赖。

| 文件 | 作用 |
| --- | --- |
| tokens.css | 颜色、字体、尺寸、时长、缓动。改一处全站变 |
| reset.css | 重置、选中高亮（朱笔）、瞬间模式、减少动效 |
| events.js | 事件名表 `EV` + `emit` / `on`。功能之间只靠它说话 |
| store.js | localStorage 安全读写，键名表 `KEYS` |
| motion.js | `reduced()`、`finePointer()`、`wait()`、`clamp()`、`easeOut()` |
| filters.js | 注入共用 SVG 滤镜：roughen / burnEdge / inkEdge / bandEdge / waxEdge / slipEdge |
| include.js | 把 `data-src` 指向的 HTML 片段拼进页面，完成后发 `content:ready` |

## 全站共享的两个 class

- `body.opened` — 卷已展开。所有「展开后」的样式都挂在它下面。只有 `features/unroll` 会加 / 去掉它
- `body.instant` — 跳过一切过渡（老访客、减少动效）
