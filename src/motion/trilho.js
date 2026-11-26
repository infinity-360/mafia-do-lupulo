// Processo: o trilho dos ingredientes anda de lado com a rolagem vertical (scroll lateral comum, contínuo, sem
// travar por foto). A seção tem a altura da tela mais o quanto o trilho passa da largura; o palco dela fica preso.
import { rolagem } from './rolagem.js';

export function trilho() {
  const seção = document.querySelector('[data-trilho]');
  if (!seção) return;
  const faixa = seção.querySelector('[data-trilho-faixa]');
  let sobra = 0;
  const mede = () => {
    sobra = Math.max(0, faixa.scrollWidth - innerWidth);
    seção.style.height = `calc(100svh + ${sobra}px)`;
  };
  mede();
  addEventListener('resize', mede, { passive: true });
  addEventListener('load', mede);
  // as fotos chegam depois (loading lazy): a largura do trilho muda
  faixa.querySelectorAll('img').forEach(img => img.addEventListener('load', mede, { once: true }));
  rolagem(() => {
    // pela posição na tela, e não por um topo medido: as seções de cima mudam de altura quando as fotos carregam
    const p = Math.min(1, Math.max(0, -seção.getBoundingClientRect().top / Math.max(1, sobra)));
    faixa.style.transform = `translate3d(${(-p * sobra).toFixed(1)}px, 0, 0)`;
    return false;
  });
}
