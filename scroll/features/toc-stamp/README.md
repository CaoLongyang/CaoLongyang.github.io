# toc-stamp · 章名落印

目录里鼠标停在哪一章，章名旁就浮出一方朱印（刻章名两个字）；点下去，印压下去、抬起，纸上留一个斑驳的印痕，朱色从印痕处晕开，进入那一章的场景。

- 还没做的章：浮出一方淡灰的空印，点了只轻轻一顿
- 从场景回来：章名旁留一个淡淡的印痕（只在这次浏览里）
- 键盘：Tab 到某一章 = 悬停，回车 = 盖印；动画中再点一下直接进去

**文件：** `toc-stamp.css` · `toc-stamp.js` · `demo.html` · `README.md`

## 用法

目录里每一栏：

```html
<li class="toc-col" data-chapter="works" data-ready>
  <span class="toc-namewrap"><b class="toc-name">画心</b></span>
  …
  <button class="toc-hit" type="button"></button>
</li>
```

印和印痕由脚本补进 `.toc-namewrap`。卷上的目录和目录笺（toc-slip）都适用。

## 事件

| 听 | 发 |
| --- | --- |
| `content:ready` · `content:changed` · `scene:closed { name }` | `scene:enter { name, from, tint: 'zhu' }` |

删掉这个文件夹：scene-router 退回「点一栏直接进入」。
