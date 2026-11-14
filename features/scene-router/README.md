# scene-router · 场景路由

所有场景共用：进出场景、墨晕转场、回目录、网址直达、按需加载。

**文件：** `scene-router.css` · `scene-router.js` · `README.md`

## 用法

```html
<button data-scene="works">…</button>   <!-- 任何带 data-scene 的元素都是入口 -->
```

场景放在 `scenes/<名字>/`，要有 `<名字>.js`（导出 `mount`）和 `<名字>.css`。点入口时才下载这两个文件。

## 流程

进：墨从入口处晕开（0.56s）→ 加载并挂载场景 → 墨退去（0.42s）。
出：墨盖住（0.26s）→ 卸载场景 → 墨收回入口处（0.42s）。
出口：左上角「目」、`Esc`、浏览器后退。系统要求减少动效时没有墨，直接切换。

## 网址

`#works` 打开场景；`#works/<子项>` 直接翻到那一项。直接打开这样的链接会跳过开场、落在场景里。

## 事件

| 听 | 发 |
| --- | --- |
| `scene:enter { name, sub, from }` · `scene:exit` · `scroll:opened` · `content:ready` | `scene:opened { name }` · `scene:closed { name }` · `nav:goto` · `content:changed` |

## 状态 class

`body.in-scene` — 场景打开中；手卷隐藏，`drag` 停止响应。
