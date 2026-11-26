// Palco (a estrutura da Akari, com copos no lugar das latas):
// - Abertura, por tempo: o filme da Máfia entra, a logo surge do escuro (do desfoque estourado ao nítido, com halo e
//   brilho) e dá lugar ao copo do meio, que sobe do escuro; HOW BEER e SHOULD BE saem de trás dele. Durante a
//   abertura a página não rola; rolar, clicar ou apertar uma tecla acelera até o fim.
// - Rolando, preso à rolagem: as palavras voltam para trás do copo (por marco) e os outros dois copos saem de trás
//   dele até ficarem em linha. Só os copos seguem a rolagem; os textos entram e saem por marcos.
// - Rolando rápido nada se atropela: o movimento tem teto de velocidade e a UI dos três copos só sobe quando eles
//   chegaram em linha.
import { gsap } from 'gsap';
import { lenis, rolagem, acorda } from './rolagem.js';

// marcos, em telas de rolagem desde o topo do palco
const SAI = 0.06;      // as palavras voltam para trás do copo
const COMEÇA = 0.12;   // os copos começam a sair
const FIM = 2.3;       // os três em linha
const TELAS = 3.2;     // os três parados com a UI até o palco subir
const VMAX = 1 / 1.8;  // fração do movimento por segundo, no máximo (no mínimo 1,8 s do começo ao fim)
const SEGUE = 9;       // quão colado o movimento anda na rolagem
const ESPERA = 0.4;    // s: os copos esperam as palavras voltarem para trás do copo
const PRESSA = 5;      // velocidade da abertura depois de um gesto
const limita = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = t => t * t * (3 - 2 * t);
const $ = s => [...document.querySelectorAll(s)];
const emPé = () => matchMedia('(max-aspect-ratio: 4/5)').matches;

export function palco({ reduzido }) {
  const seção = document.querySelector('[data-palco]');
  const hero = seção.querySelector('[data-hero]');
  const video = hero.querySelector('[data-video]');
  const copos = hero.querySelector('[data-copos]');
  const botões = $('.copo');
  const meio = hero.querySelector('.copo--meio .copo__img');
  const html = document.documentElement;
  seção.style.setProperty('--telas', TELAS);
  seção.style.setProperty('--fim', FIM + 0.05);
  som(hero, video);

  // fora da tela o vídeo para (economiza bateria); volta ao aparecer
  if (reduzido) video.pause();
  else new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause())).observe(hero);

  // ---------- medidas: a escala dos três em linha e a distância entre eles ----------
  let topo = 0, alto = innerHeight;
  const mede = () => {
    topo = seção.getBoundingClientRect().top + scrollY;
    alto = hero.offsetHeight;
    const w1 = meio.offsetWidth || hero.querySelector('.copo--meio').offsetWidth;
    const folga = emPé() ? 10 : Math.max(24, innerWidth * 0.035);
    // os três (com folga entre eles) cabem em 86% da largura; no computador, no máximo 78% do copo do hero
    const k3 = Math.min(0.78, (innerWidth * (emPé() ? 0.96 : 0.86) - 2 * folga) / (3 * w1));
    hero.style.setProperty('--k3', k3.toFixed(4));
    hero.style.setProperty('--gap', `${(w1 * k3 + folga).toFixed(1)}px`);
  };
  mede();
  meio.addEventListener('load', mede);
  addEventListener('resize', mede, { passive: true });

  // ---------- abertura ----------
  let pronto = false;
  const abre = abertura({ reduzido, aoFim: () => { pronto = true; html.classList.remove('na-intro'); lenis?.start(); gestos.forEach(g => removeEventListener(g, acelera)); acorda(); } });
  const gestos = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  const acelera = () => abre.timeScale(PRESSA);
  if (!reduzido) {
    html.classList.add('na-intro');
    lenis?.stop();
    gestos.forEach(g => addEventListener(g, acelera, { passive: true }));
  }

  // ---------- marcos ----------
  let estado = 'hero';  // hero | filme | copos
  let saiuEm = -1e9;
  function marca(y, t) {
    const novo = y < SAI ? 'hero' : t >= 0.995 ? 'copos' : 'filme';
    if (novo === estado) return;
    const antes = estado;
    estado = novo;
    hero.dataset.estado = novo;
    if (antes === 'hero') { saiuEm = performance.now(); saiHero({ reduzido }); }
    if (antes === 'copos') { solta(); saiCopos({ reduzido }); }
    if (novo === 'hero') entraHero({ reduzido });
    if (novo === 'copos') entraCopos({ reduzido });
  }

  // ---------- a cada quadro de rolagem ----------
  let t = 0, antes = performance.now();
  function desenha() {
    const agora = performance.now();
    const dt = Math.min(0.05, (agora - antes) / 1000);
    antes = agora;
    if (!pronto) return false;
    const y = (scrollY - topo) / alto;
    let alvo = limita((y - COMEÇA) / (FIM - COMEÇA));
    // rolando rápido: os copos seguram até as palavras voltarem para trás do copo do meio
    if (!reduzido && t === 0 && (agora - saiuEm) / 1000 < ESPERA) alvo = 0;
    if (reduzido) t = alvo;
    else {
      const passo = (alvo - t) * (1 - Math.exp(-SEGUE * dt)), teto = VMAX * dt;
      t += Math.max(-teto, Math.min(teto, passo));
      if (Math.abs(alvo - t) < 0.0005) t = alvo;
    }
    // o do meio encolhe na primeira metade; os dos lados saem de trás dele logo depois
    hero.style.setProperty('--p', suave(limita(t / 0.6)).toFixed(4));
    hero.style.setProperty('--q', suave(limita((t - 0.15) / 0.85)).toFixed(4));
    marca(y, t);
    return t !== alvo || (agora - saiuEm) / 1000 < ESPERA;
  }
  rolagem(desenha);

  // ---------- foco num copo: os outros apagam, o nome acende ----------
  let fixo = null;
  const foca = qual => {
    if (estado !== 'copos') qual = null;
    copos.classList.toggle('tem-foco', !!qual);
    botões.forEach(b => b.classList.toggle('is-foco', b.dataset.copo === qual));
  };
  const solta = () => { fixo = null; botões.forEach(b => b.setAttribute('aria-pressed', 'false')); foca(null); };
  botões.forEach(b => {
    const qual = b.dataset.copo;
    b.addEventListener('pointerenter', e => e.pointerType === 'mouse' && foca(qual));
    b.addEventListener('pointerleave', e => e.pointerType === 'mouse' && foca(fixo));
    b.addEventListener('focus', () => foca(qual));
    b.addEventListener('blur', () => foca(fixo));
    b.addEventListener('click', () => {
      fixo = fixo === qual ? null : qual;
      botões.forEach(o => o.setAttribute('aria-pressed', String(o.dataset.copo === fixo)));
      foca(fixo ?? qual);
    });
  });
}

// a logo surge e dá lugar ao copo; as palavras saem de trás dele; menu e textos entram
function abertura({ reduzido, aoFim }) {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: aoFim });
  if (reduzido) {
    return tl.set(['.hero__filme', '.copo--meio .copo__img', '.nav', '.hero__som', '.hero__desce'], { opacity: 1 })
      .add(entraHero({ reduzido }));
  }
  tl.fromTo('.hero__filme', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2.6, ease: 'power2.out' }, 0.2)
    .fromTo('.logo__halo', { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 2.6 }, 0.5)
    .fromTo('.logo__img',
      { opacity: 0, scale: 0.5, rotate: -14, filter: 'blur(30px) brightness(2.4)' },
      { opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px) brightness(1)', duration: 2.3 }, 0.6)
    .fromTo('.logo__brilho', { opacity: 1, backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.5, ease: 'power2.inOut' }, 1.8)
    // a logo recua e se apaga; o copo sobe do escuro no lugar dela
    .to('.logo', { opacity: 0, scale: 0.7, filter: 'blur(14px)', duration: 0.9, ease: 'power3.in' }, 3.4)
    .fromTo('.copo--meio .copo__img',
      { opacity: 0, yPercent: 14, filter: 'blur(22px) brightness(2)' },
      { opacity: 1, yPercent: 0, filter: 'blur(0px) brightness(1)', duration: 1.8, clearProps: 'filter,transform' }, 3.85)
    .add(entraHero({ reduzido }), 4.45)
    .fromTo('.nav', { opacity: 0, y: -14, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, clearProps: 'filter' }, 4.6)
    .fromTo(['.hero__som', '.hero__desce'], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 5.1);
  return tl;
}

// as palavras deslizam de trás do copo (no celular, sobem e descem a partir dele); o lema sobe pela máscara
function entraHero({ reduzido }) {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out', overwrite: 'auto' } });
  const alvos = ['[data-entra="titulo"]', '[data-entra="fio"]', '[data-entra="linha"]'];
  if (reduzido) return tl.set(alvos, { clearProps: 'transform' }).to(alvos, { opacity: 1, duration: 0.6, ease: 'power1.out' });
  const [esq, dir] = $('[data-entra="titulo"]');
  const pé = emPé();
  return tl
    .fromTo(esq, { opacity: 1, xPercent: pé ? 0 : 105, yPercent: pé ? 105 : 0 }, { xPercent: 0, yPercent: 0, duration: 1.7 }, 0)
    .fromTo(dir, { opacity: 1, xPercent: pé ? 0 : -105, yPercent: pé ? -105 : 0 }, { xPercent: 0, yPercent: 0, duration: 1.7 }, 0.05)
    .fromTo('[data-entra="fio"]', { opacity: 1, scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 1.2 }, 0.4)
    .fromTo('[data-entra="linha"]', { opacity: 1, yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.07 }, 0.45);
}

function saiHero({ reduzido }) {
  const tl = gsap.timeline({ defaults: { ease: 'power3.in', overwrite: 'auto' } });
  const alvos = ['[data-entra="titulo"]', '[data-entra="fio"]', '[data-entra="linha"]'];
  if (reduzido) return tl.to(alvos, { opacity: 0, duration: 0.4, ease: 'power1.out' });
  const [esq, dir] = $('[data-entra="titulo"]');
  const pé = emPé();
  // voltam para trás do copo pelo mesmo recorte da entrada
  return tl.to(esq, pé ? { yPercent: 105, duration: 0.45 } : { xPercent: 105, duration: 0.45 }, 0)
    .to(dir, pé ? { yPercent: -105, duration: 0.45 } : { xPercent: -105, duration: 0.45 }, 0)
    .to('[data-entra="linha"]', { yPercent: 110, duration: 0.4, stagger: 0.03 }, 0)
    .to('[data-entra="fio"]', { scaleX: 0, transformOrigin: 'right', duration: 0.4 }, 0)
    // o copo encolhe depois: escondidas, as palavras não aparecem pela borda dele
    .set([esq, dir], { opacity: 0 });
}

function entraCopos({ reduzido }) {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out', overwrite: 'auto' } });
  if (reduzido) return tl.set('[data-entra-copos]', { clearProps: 'transform' }).to(['[data-entra-copos]', '[data-copos-seta]'], { opacity: 1, duration: 0.6 });
  return tl
    .fromTo('.copo [data-entra-copos]', { opacity: 1, yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.06 }, 0.1)
    .fromTo('.copos__titulo [data-entra-copos]', { opacity: 1, yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.07 }, 0)
    .set('[data-copos-seta]', { opacity: 1 }, 0.4)
    .fromTo('[data-copos-seta] .seta__anel circle', { attr: { 'stroke-dasharray': '0 1000' } }, { attr: { 'stroke-dasharray': '1000 0' }, duration: 1.6, ease: 'power3.inOut' }, 0.4)
    .fromTo('[data-copos-seta] .seta__ponta', { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: 1 }, 0.75)
    .fromTo('[data-copos-seta] .linha > span', { opacity: 1, yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.07 }, 0.55);
}

function saiCopos({ reduzido }) {
  const tl = gsap.timeline({ defaults: { ease: 'power3.in', overwrite: 'auto' } });
  if (reduzido) return tl.to(['[data-entra-copos]', '[data-copos-seta]'], { opacity: 0, duration: 0.4 });
  return tl.to('[data-entra-copos]', { yPercent: 110, duration: 0.45, stagger: 0.02 }, 0)
    .to('[data-copos-seta]', { opacity: 0, duration: 0.4 }, 0);
}

// o vídeo começa mudo (o navegador só deixa tocar sozinho assim); o botão liga e desliga o som
function som(hero, video) {
  const botao = hero.querySelector('[data-som]');
  const rótulo = botao.querySelector('[data-som-rotulo]');
  botao.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted) video.play().catch(() => {});
    botao.setAttribute('aria-pressed', String(!video.muted));
    rótulo.textContent = video.muted ? 'Ligar som' : 'Desligar som';
  });
}
