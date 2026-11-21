/* ============================================================
   roller · 给第一根 .roller 补上锦缎卷的各层
   <div class="roller" data-title="手卷"></div>  ← 卷
   <div class="roller"></div>                        ← 天杆
   木纹 / 纸卷转动读取 .scroll 上的 --spin（由 scroll-fx 写入）
   ============================================================ */

document.querySelectorAll('.scroll').forEach((scroll) => {
  const rolls = scroll.querySelectorAll(':scope > .roller');
  rolls.forEach((r) => r.setAttribute('aria-hidden', 'true'));
  const roll = rolls[0];
  if (!roll || roll.dataset.dressed) return;
  roll.dataset.dressed = '1';
  const title = roll.dataset.title || '卷一';
  roll.innerHTML = `
    <span class="roll-brocade"></span>
    <span class="roll-grain"></span>
    <span class="roll-label"><b>${title}</b><i></i></span>
    <span class="roll-shade"></span>
    <span class="roll-cap roll-cap--top"><span class="roll-knob"></span></span>
    <span class="roll-cap roll-cap--bottom"><span class="roll-knob"></span></span>`;
});
