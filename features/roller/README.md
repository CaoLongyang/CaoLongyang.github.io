# roller · 卷轴

卷着：一卷竖放在桌上，裹深靛锦缎（龟背纹），贴一条题签，两端露出紫檀轴头。展开：先被摆到右边，再从右往左滚过整个桌面，锦缎先放出去、露出里面的纸；左边剩一卷纸，右边留下天杆；最后纸面舒展到全屏高度。

**单独看：** 起本地服务器后打开 `features/roller/demo.html`，或从 `lab/index.html` 进入。

**文件：** `roller.css` · `roller.js` · `demo.html` · `README.md`

## 用法

```html
<div class="tilt"><div class="scroll" data-scroll>
  <div class="roller" data-title="手卷"></div>  <!-- 卷，data-title 是题签上的字 -->
  <div class="view"><div class="paper">…</div></div>
  <div class="roller"></div>
</div></div>
```

## 事件

| 听 | 发 |
| --- | --- |
| 无（读 `body.opened` / `body.settled`） | 无 |

## 可调

`--rd`（卷的直径）`--ph`（卷的长度）`--roll-open` `--axis-w` `--edge` `--pw` `--ph-open`，锦缎 `--brocade-base` `--brocade-img`；`.scroll` 上的 `--spin` 控制木纹转动

## 备注

木纹转动只在 `body.settled` 后出现。
