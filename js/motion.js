// Aivo Design — движение по прокрутке. Сцены держатся на js/stage.js (GSAP + ScrollTrigger, плавная прокрутка Lenis).
// Без скрипта, при сбое и при «меньше движения» каждый раздел показывает готовый вид.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ── Заголовки разделов: текст в маску, выезжает из-под строки, когда раздел входит в экран
  const mk = $$('.apps>h2, .step h3, .about h2, .order h2, .osteps h3, .contact h2');
  mk.forEach((el) => {
    if (el.querySelector('.ln')) return;
    el.classList.remove('rise');
    const inner = document.createElement('span'); inner.innerHTML = el.innerHTML;
    const ln = document.createElement('span'); ln.className = 'ln'; ln.append(inner);
    el.replaceChildren(ln); el.classList.add('mk');
  });
  $$('.step .facts, .about .pics, .about .stores, .osteps li, .vcard').forEach((el) => el.classList.remove('rise'));
  const watch = [...mk, ...$$('.step, .about .pics, .about .stores, .osteps li, .vcard')];
  if (reduce || !('IntersectionObserver' in window)) watch.forEach((e) => e.classList.add('in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); if (!e.target.classList.contains('step')) io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    watch.forEach((e) => io.observe(e));
    // если страницу пролистали рывком (ссылка в меню, «Наверх»), всё, что уже выше низа экрана, показываем сразу
    let tick = false;
    addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => { tick = false; watch.forEach((e) => { if (!e.classList.contains('in') && e.getBoundingClientRect().top < innerHeight * 0.9) e.classList.add('in'); }); }); }, { passive: true });
  }

  // ── Номер телефона: каждая цифра прокручивается до своего значения
  $$('[data-roll]').forEach((el) => {
    const value = el.textContent.trim();
    const said = Object.assign(document.createElement('span'), { className: 'sr-only', textContent: value });
    const shown = Object.assign(document.createElement('span'), { className: 'roll__d' });
    shown.setAttribute('aria-hidden', 'true');
    let i = 0;
    for (const ch of value) {
      if (!/\d/.test(ch)) { shown.append(ch === ' ' ? ' ' : ch); continue; }
      const col = Object.assign(document.createElement('span'), { className: 'roll__col' });
      const strip = Object.assign(document.createElement('span'), { className: 'roll__strip' });
      strip.style.setProperty('--d', ch); strip.style.setProperty('--i', i++);
      for (let n = 0; n < 10; n++) strip.append(Object.assign(document.createElement('span'), { textContent: n }));
      col.append(strip); shown.append(col);
    }
    el.classList.add('roll'); el.replaceChildren(said, shown);
    if (reduce || !('IntersectionObserver' in window)) { el.classList.add('in'); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }), { rootMargin: '0px 0px -15% 0px' });
    io.observe(el);
    addEventListener('scroll', () => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add('in'); }, { passive: true });
  });

  if (!window.Stage || !Stage.live) return;   // дальше — только сцены на GSAP
  const gsap = window.gsap;

  // ── Сцена «Роспись»: роспись пишется на весь экран, сжимается и рассыпается на пять приложений
  Scenes.signature = (root) => Stage.scene(root, {
    hold: 2,
    build(tl, { q, stage }) {
      const big = q('.sig-big')[0], tiles = q('.sig-row .tl'), names = q('.sig-row b');
      // откуда вылетает каждая плитка: из центра росписи
      const from = (axis) => (i, el) => {
        const r = el.getBoundingClientRect(), b = big.getBoundingClientRect();
        return axis === 'x' ? (b.left + b.width / 2) - (r.left + r.width / 2) : (b.top + b.height / 2) - (r.top + r.height / 2);
      };
      const start = { x: from('x'), y: from('y'), scale: 2.2, autoAlpha: 0, rotate: (i) => (i - 2) * 9 };
      gsap.set(tiles, start); gsap.set(names, { autoAlpha: 0, y: 14 });
      tl.fromTo(big, { clipPath: 'inset(0% 66% 0% 0%)', scale: 1.06, autoAlpha: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.4 }, 0)
        .to(big, { scale: 0.3, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }, 0.46)
        .fromTo(tiles, start, { x: 0, y: 0, scale: 1, autoAlpha: 1, rotate: 0, duration: 0.26, stagger: 0.035, ease: 'power3.out', immediateRender: true }, 0.5)
        .fromTo(names, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.025, immediateRender: true }, 0.74);
    },
  });

  // ── «Aivo Scan в деле»: снимок стоит окном в середине и раскрывается на весь экран, потом выходит карточка
  Scenes.window = (root) => Stage.scene(root, {
    hold: 1.4,
    phone: 'rest',
    build(tl, { q }) {
      const img = q('.scene-stage>img')[0], card = q('.card')[0];
      tl.fromTo(img, { clipPath: 'inset(20% 27% 20% 27%)', scale: 1.22 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.6, ease: 'power1.inOut' }, 0)
        .fromTo(card, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.2, ease: 'power2.out' }, 0.62);
    },
  });

  Stage.smooth();
  Stage.init();

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const ST = { scrub: true };
    // Первый экран уходит: слова поднимаются и бледнеют, телефон чуть оседает
    gsap.to('.htext, .hlist', { yPercent: -8, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', ...ST } });
    gsap.to('.hfield .phone-frame', { yPercent: 8, scale: 0.94, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', ...ST } });

    // «Обо мне»: первая фраза наливается чернилами, слово за словом
    const fill = $('[data-fill]');
    if (fill) {
      const words = fill.textContent.trim().split(/\s+/);
      fill.setAttribute('aria-label', fill.textContent.trim());
      fill.replaceChildren(...words.flatMap((w, i) => { const s = Object.assign(document.createElement('span'), { className: 'fill-w', textContent: w }); s.setAttribute('aria-hidden', 'true'); return i ? [' ', s] : [s]; }));
      gsap.fromTo(fill.querySelectorAll('.fill-w'), { opacity: 0.45 }, { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: fill, start: 'top 82%', end: 'bottom 48%', ...ST } });
    }

    // Снимки «Обо мне» плывут чуть медленнее страницы
    $$('.about .pics img').forEach((im, i) => gsap.fromTo(im, { yPercent: i ? 6 : 3 }, { yPercent: i ? -6 : -3, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', ...ST } }));

    // Подвал выезжает из-под страницы, если помещается в экран; имя растёт, пока он открывается
    const foot = $('.foot'), name = $('.foot .name'), main = $('main');
    const fits = () => foot.offsetHeight < innerHeight * 0.96 && innerWidth >= 900;
    document.documentElement.classList.toggle('curtain', fits());
    gsap.fromTo(name, { scale: 0.84, yPercent: 18 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: main, start: 'bottom bottom', end: () => '+=' + foot.offsetHeight, invalidateOnRefresh: true, ...ST } });
    addEventListener('resize', () => document.documentElement.classList.toggle('curtain', fits()));
    return () => document.documentElement.classList.remove('curtain');
  });
})();
