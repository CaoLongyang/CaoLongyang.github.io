# Calvin Cao · 个人网站

**书斋里工作，画室里生活。** 首页、作品用新中式的「书斋」（天青 / 黑漆朱两种主题）；书、游戏、动漫、心情以后放在塞尚风格的「画室」。原来的手卷网站搬到了 [`/scroll/`](scroll/)，作为一件实验作品。

纯静态网站：没有构建步骤、没有框架，直接放在 GitHub Pages 上。

## 本地预览

页面用了 ES Modules 和 `fetch`，必须用本地服务器打开：

```bash
python -m http.server 5173
# 首页      http://localhost:5173
# 作品集    http://localhost:5173/works/
# 手卷      http://localhost:5173/scroll/
# 换正文字体对比：在网址后面加 ?font=manrope
```

## 改内容（改完推送就上线）

| 内容 | 文件 |
| --- | --- |
| 作品（屏风的每一扇、详情页） | `data/works.json`（截图放进 `assets/shots/`，填到 `shots` 里） |
| 首页名字旁的三滴墨 | `data/now.json` |
| 文章、想法 | `data/writing.json` · `data/thoughts.json` |
| 画室窗下的一行字 | `data/studio.json` |
| 邮箱、GitHub、LinkedIn、简历 | `data/site.json`（留空的不显示） |

现在 `writing` / `thoughts` / `studio` / 邮箱里是**示例内容**，记得换成你自己的；某一块整块清空，首页就不显示那一块。

## 目录

```
index.html            首页
works/                屏风作品集 + 作品详情（works/#作品名）
assets/css/           tokens（两种主题的颜色、字体）· base（顶栏、按钮、页脚）· home
features/             一个功能一个文件夹，各有说明
  theme/  lang/  brush/  ink-drops/  screen/  painting/  reveal/
js/home.js            首页里由数据生成的几块
data/                 所有内容
scroll/               原来的手卷网站（原样保留）
```
