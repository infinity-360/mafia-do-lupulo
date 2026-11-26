// Hero: o filme da Máfia em loop ao fundo e a logo surgindo do escuro (do desfoque estourado ao nítido, girando um
// pouco, com um halo âmbar e um brilho que passa por ela). Depois as palavras saem de trás da logo e o resto sobe
// pela máscara, por tempo. Movimento reduzido: vídeo parado no pôster e tudo só aparece.
import { gsap } from 'gsap';

export function hero({ reduzido }) {
  const el = document.querySelector('[data-hero]');
  const video = el.querySelector('[data-video]');
  som(el, video);

  const textos = ['[data-entra="titulo"]', '[data-entra="fio"]', '[data-entra="linha"]', '.hero__som', '.hero__desce'];
  if (reduzido) {
    video.pause();
    gsap.set(['.hero__filme', '.logo__img', '.logo__halo', '.nav', ...textos], { opacity: 1 });
    return;
  }
  // fora da tela o vídeo para (economiza bateria); volta ao aparecer
  new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause())).observe(el);

  const emPé = matchMedia('(max-aspect-ratio: 4/5)').matches;
  const [esq, dir] = el.querySelectorAll('[data-entra="titulo"]');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.2 });
  tl.fromTo('.hero__filme', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2.6, ease: 'power2.out' }, 0)
    .fromTo('.logo__halo', { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 2.6 }, 0.35)
    .fromTo('.logo__img',
      { opacity: 0, scale: 0.5, rotate: -14, filter: 'blur(30px) brightness(2.4)' },
      { opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px) brightness(1)', duration: 2.3, clearProps: 'filter' }, 0.45)
    .fromTo('.logo__brilho', { opacity: 1, backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.5, ease: 'power2.inOut' }, 1.7)
    // as palavras saem de trás da logo (no celular, sobem e descem a partir dela)
    .fromTo(esq, { opacity: 1, xPercent: emPé ? 0 : 105, yPercent: emPé ? 105 : 0 }, { xPercent: 0, yPercent: 0, duration: 1.7 }, 1.9)
    .fromTo(dir, { opacity: 1, xPercent: emPé ? 0 : -105, yPercent: emPé ? -105 : 0 }, { xPercent: 0, yPercent: 0, duration: 1.7 }, 1.95)
    .fromTo('.nav', { opacity: 0, y: -14, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, clearProps: 'filter' }, 2.2)
    .fromTo('[data-entra="fio"]', { opacity: 1, scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 1.2 }, 2.4)
    .fromTo('[data-entra="linha"]', { opacity: 1, yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.07 }, 2.45)
    .fromTo(['.hero__som', '.hero__desce'], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 2.8);
}

// o vídeo começa mudo (o navegador só deixa tocar sozinho assim); o botão liga e desliga o som
function som(el, video) {
  const botao = el.querySelector('[data-som]');
  const rótulo = botao.querySelector('[data-som-rotulo]');
  botao.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted) video.play().catch(() => {});
    botao.setAttribute('aria-pressed', String(!video.muted));
    rótulo.textContent = video.muted ? 'Ligar som' : 'Desligar som';
  });
}
