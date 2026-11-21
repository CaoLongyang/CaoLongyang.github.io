# scenes/works · 画心（作品册页）

目录上那本合着的册页，点开就是这个场景：一本摊开的册页，一开一件作品。右页是作品（名字、年份、标签、线稿、一句话、链接），左页是它的做法。从右往左读。

**单独看：** `scenes/works/demo.html`（直接打开册页，不经过开场）

**文件：** `works.css` · `works.js` · `demo.html` · `README.md`；内容在 `data/works.json`

## 玩法：翻页

| 输入 | 行为 |
| --- | --- |
| 按住左页往右拖 | 往后翻；过一半或甩得够快就翻过去，否则落回 |
| 按住右页往左拖 | 往前翻 |
| 点左页 / 右页 | 往后 / 往前翻一页 |
| `←` `→` `Home` `End` | 往后 / 往前 / 第一开 / 最后一开 |
| 目次里点一件 | 连续翻过去，每页 0.16 秒 |

## 加一件作品

在 `data/works.json` 里加一条，字段：`id` `title` `year` `tags{en,zh}` `status` `link`（私有仓库留空）`progress`（进行中填 true）`glyph`（线稿的 SVG path，画布 200×140）`summary{en,zh}` `steps{en[],zh[]}`。册页自动多一开，网址 `#works/<id>` 直达。

## 对外

由 `features/scene-router` 按需加载：`mount(layer, { sub, fromRect, instant })` → `{ go(id), unmount() }`。不发、不听任何全站事件，只改网址里 `#works/<id>` 这一段。
