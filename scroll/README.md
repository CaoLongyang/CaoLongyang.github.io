# 手卷 · 个人站

一个「展开」出来的个人网站：点开火漆，两卷分开，纸面摊平；往下滚，长卷从右往左继续展开。纯静态，没有构建步骤，没有框架。

## 本地预览

页面用了 ES Modules 和 `fetch`，**必须用本地服务器打开**（直接双击会空白）：

```bash
cd site
python -m http.server 5173
# 浏览器打开 http://localhost:5173
```

- 看开场：之前看过的话，点右下角「重看开场」，或者在工坊的「开场编排」演示里点「清除记忆」
- 看每个零件：http://localhost:5173/lab/

## 目录

```
site/
  index.html          只负责拼装：引入 core、各功能的样式与脚本、摆好结构
  core/               全站共用：变量、重置、事件、存储、滤镜、片段载入
  features/           一个功能一个文件夹（样式 · 脚本 · demo.html · README.md）
    stage roller paper twine seal unroll intro-controls     ← 开场
    scroll-fx ink-reveal bookmarks page-turn                 ← 滚动与转场
    cursor lang-switch theme-switch eggs                     ← 微交互与彩蛋
  sections/           首页五段：about · works · notes · fragments · contact（html + css）
  pages/              详情页：works/handscroll.html · notes/why-unroll.html · page.css
  data/fragments.json 「拾零」段的纸条，手动加一条就多一张
  lab/                工坊：所有 demo 的入口 + 演示工具条
```

## 三条规则

1. 功能之间不互相 import，只通过 `core/events.js` 里的事件说话
2. 颜色、时长、缓动只从 `core/tokens.css` 取
3. 删掉任何一个功能文件夹（并去掉 index.html 里对应的两行），网站其余部分照常运行

## 常改的地方

| 想改 | 去哪 |
| --- | --- |
| 名字、自我介绍 | `sections/about.html` |
| 作品 | `sections/works.html`；详情页照 `pages/works/handscroll.html` 复制一份 |
| 文章 | `sections/notes.html`；详情页照 `pages/notes/why-unroll.html` 复制一份 |
| 纸条 | `data/fragments.json` |
| 邮箱 | `sections/about.html` 与 `sections/contact.html` 里的 `hello@example.com`（占位，记得换） |
| 颜色、尺寸 | `core/tokens.css` |
| 每段宽度 | 各段 css 里的 `--span` |

## 现在的内容

作品 02–04、文章 2–4、纸条都是占位文案，结构是真的，换成你自己的就行。

## 彩蛋

- 点纸面空白处
- 在页面上敲 `burn`
