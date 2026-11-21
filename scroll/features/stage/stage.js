/* stage · 往每个 .scene 里放一盏夜灯（只在夜间显形） */

for (const scene of document.querySelectorAll('.scene')) {
  if (scene.querySelector('.stage-lamp')) continue;
  const lamp = document.createElement('div');
  lamp.className = 'stage-lamp';
  lamp.setAttribute('aria-hidden', 'true');
  scene.prepend(lamp);
}
