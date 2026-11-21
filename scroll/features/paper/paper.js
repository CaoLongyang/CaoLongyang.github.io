/* paper · 给每张 .paper 补上水墨、卷痕、焦边三层，页面里不用手写 */

function dress(paper) {
  if (paper.dataset.dressed) return;
  paper.dataset.dressed = '1';
  const layer = (cls) => {
    const d = document.createElement('div');
    d.className = cls;
    d.setAttribute('aria-hidden', 'true');
    return d;
  };
  paper.prepend(layer('paper-ink'));
  paper.append(layer('paper-roll'), layer('paper-char'));
}

document.querySelectorAll('.paper').forEach(dress);
