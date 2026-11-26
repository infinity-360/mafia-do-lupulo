// Rolagem suave com Lenis (a posição continua sendo o scrollY da página) e um laço de rAF só para quem segue a
// rolagem (o trilho, a paralaxe, a barra). O laço dorme quando ninguém pede quadro novo e acorda no evento de scroll.
// Com movimento reduzido, a rolagem é a nativa.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const mq = matchMedia('(prefers-reduced-motion: reduce)');
export const reduzido = () => mq.matches;

export const lenis = reduzido() ? null : new Lenis({ autoRaf: true, lerp: 0.07, wheelMultiplier: 0.85 });

const quem = new Set();
let vivo = false;
function laço() {
  let mais = false;
  for (const f of quem) mais = f() || mais;
  if (mais) requestAnimationFrame(laço);
  else vivo = false;
}
export function acorda() {
  if (vivo) return;
  vivo = true;
  requestAnimationFrame(laço);
}
/** fn roda a cada quadro enquanto a página rola; devolve true se ainda precisa de outro quadro */
export function rolagem(fn) {
  quem.add(fn);
  acorda();
}

// .is-scrolling: rolando com o cursor parado, o hover não acende (é assim que a prévia é gravada).
// Sai no primeiro movimento real do mouse (o Safari zera movementX, então compara a posição).
const html = document.documentElement;
let px = -1, py = -1;
addEventListener('scroll', () => { html.classList.add('is-scrolling'); acorda(); }, { passive: true });
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  if (Math.abs(e.clientX - px) + Math.abs(e.clientY - py) > 2 && px >= 0) html.classList.remove('is-scrolling');
  px = e.clientX; py = e.clientY;
}, { passive: true });
