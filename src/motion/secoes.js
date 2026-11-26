// Seções depois do hero: textos que entram por marco (por tempo, nunca arrastados pela rolagem), a frase da história
// que acende linha a linha, fotos com paralaxe (só a imagem segue a rolagem), e âncoras pela Lenis.
import { gsap } from 'gsap';
import { lenis, rolagem } from './rolagem.js';

export function secoes({ reduzido }) {
  revela({ reduzido });
  if (!reduzido) paralaxe();
  ancoras();
}

// cada grupo entra quando chega a 25% da tela e volta a esconder quando sai por baixo (rolando para cima): na próxima
// descida, entra de novo. Linhas sobem pela máscara; botões sobem do desfoque.
function revela({ reduzido }) {
  const grupos = [...document.querySelectorAll('[data-revela-grupo]')];
  // o AKARI do rodapé espera mais baixo, cortado pela borda, e sobe quando o rodapé chega
  if (!reduzido) gsap.set('[data-revela-marca]', { yPercent: 60 });
  const entra = g => {
    const linhas = g.querySelectorAll('[data-revela]');
    const botoes = g.querySelectorAll('[data-revela-botao]');
    const marca = g.querySelector('[data-revela-marca]');
    if (reduzido) {
      if (linhas.length || botoes.length) gsap.to([...linhas, ...botoes], { opacity: 1, duration: 0.6, overwrite: 'auto' });
      if (g.matches('[data-acende]')) linhas.forEach(l => l.classList.add('is-acesa'));
      return;
    }
    if (linhas.length) gsap.fromTo(linhas, { opacity: 1, yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, overwrite: 'auto' });
    if (botoes.length) gsap.fromTo(botoes, { opacity: 0, y: 14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'expo.out', delay: 0.35, overwrite: 'auto', clearProps: 'filter' });
    if (marca) gsap.fromTo(marca, { yPercent: 60 }, { yPercent: 14, duration: 1.6, ease: 'expo.out', overwrite: 'auto' });
    // a frase da história acende de cinza para branco, uma linha depois da outra
    if (g.matches('[data-acende]')) linhas.forEach((l, i) => gsap.delayedCall(0.5 + i * 0.22, () => l.classList.add('is-acesa')));
  };
  const sai = g => {
    const linhas = g.querySelectorAll('[data-revela]');
    if (linhas.length) {
      gsap.killTweensOf(linhas);
      gsap.set(linhas, { opacity: 0 });
      linhas.forEach(l => l.classList.remove('is-acesa'));
    }
    const botoes = g.querySelectorAll('[data-revela-botao]');
    if (botoes.length) gsap.set(botoes, { opacity: 0 });
    const marca = g.querySelector('[data-revela-marca]');
    if (marca && !reduzido) gsap.set(marca, { yPercent: 60 });
  };
  const io = new IntersectionObserver(entradas => {
    for (const e of entradas) {
      if (e.isIntersecting) { if (!e.target.dataset.dentro) { e.target.dataset.dentro = '1'; entra(e.target); } }
      else if (e.boundingClientRect.top > 0 && e.target.dataset.dentro) { delete e.target.dataset.dentro; sai(e.target); }
    }
  }, { rootMargin: '0px 0px -25% 0px' });
  grupos.forEach(g => io.observe(g));
}

// fotos com paralaxe: a imagem (maior que a moldura) desce mais devagar que a página
function paralaxe() {
  const fotos = [...document.querySelectorAll('[data-paralaxe]')].map(img => ({ img, caixa: img.parentElement, vista: false }));
  const io = new IntersectionObserver(es => es.forEach(e => { const f = fotos.find(f => f.caixa === e.target); if (f) f.vista = e.isIntersecting; }));
  fotos.forEach(f => io.observe(f.caixa));
  rolagem(() => {
    const vh = innerHeight;
    for (const f of fotos) {
      if (!f.vista) continue;
      const r = f.caixa.getBoundingClientRect();
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1 (saindo por cima) a 1 (entrando por baixo)
      f.img.style.transform = `translate3d(0, ${(p * 6).toFixed(2)}%, 0) scale(1.12)`;
    }
    return false;
  });
}

// âncoras rolam pela Lenis
function ancoras() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const alvo = document.getElementById(id);
    if (!alvo) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(alvo, { duration: 1.6 });
    else alvo.scrollIntoView();
  });
}
