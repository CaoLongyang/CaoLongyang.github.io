/* ============================================================
   page-turn · 普通脚本（不是 module），放在 <head> 里
   因为 pagereveal 在第一帧之前就触发，module 来不及。
   点 data-turn="back" 的链接 → 记下方向 → 新页面给转场加上 back 类型
   ============================================================ */

(function () {
  var KEY = 'scroll-turn-dir';

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    try { sessionStorage.setItem(KEY, a.dataset.turn === 'back' ? 'back' : 'forward'); } catch (err) {}
  }, true);

  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    var dir = 'forward';
    try { dir = sessionStorage.getItem(KEY) || 'forward'; sessionStorage.removeItem(KEY); } catch (err) {}
    if (dir === 'back' && e.viewTransition.types) e.viewTransition.types.add('back');
  });
})();
