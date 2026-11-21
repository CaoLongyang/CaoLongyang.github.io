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

## Steam 游戏自动同步

游戏页（`studio/games/`）和首页「Games」那扇窗的数据来自 `data/steam.json`，由 GitHub Action 每天自动从 Steam 拉一次（`.github/workflows/sync-steam.yml`），有变化才提交。

**第一次设置（约 5 分钟）：**

1. **Steam 设为公开：** Steam → 个人资料 → 编辑个人资料 → 隐私设置：「我的个人资料」和「游戏详情」都设为**公开**。
2. **拿 API Key：** 打开 https://steamcommunity.com/dev/apikey ，域名随便填（比如 `caolongyang.github.io`），复制得到的 Key。
3. **拿 SteamID64：** 打开你的 Steam 个人主页，网址里 `/profiles/` 后面那串 17 位数字就是；如果网址是 `/id/自定义名`，用 https://steamid.io 查一下。
4. **填进 GitHub：** 打开部署网站的仓库 → Settings → Secrets and variables → Actions → New repository secret，添加两个：`STEAM_API_KEY`、`STEAM_ID`。
5. **跑第一次：** 仓库 → Actions → Sync Steam → Run workflow。一两分钟后，`data/steam.json` 就是你真实的数据了，页面上的「示例数据」标签会消失。

**不想显示某些游戏：** 把它的 appid（商店网址 `store.steampowered.com/app/数字` 里的数字）写进 `data/steam.config.json` 的 `hide`。

**本地手动同步：** `STEAM_API_KEY=… STEAM_ID=… node scripts/sync-steam.mjs`（Key 不要写进任何文件、不要提交）。
