/* reveal · 区块进入视野时淡入上浮一次。<section data-reveal> */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
export const watch = (root = document) => root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
watch();
