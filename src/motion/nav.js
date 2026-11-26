// Nav: seletor de idioma (lista com teclado), menu em tela cheia no celular e o "hover" do toque.

export function nav() {
  idioma();
  menu();
  toque();
}

// O seletor só troca o rótulo: a tradução do site fica para quem usar a template (ver o guia da entrega).
function idioma() {
  const el = document.querySelector('[data-idioma]');
  if (!el) return;
  const botao = el.querySelector('button');
  const atual = el.querySelector('[data-idioma-atual]');
  const opcoes = [...el.querySelectorAll('[role="option"]')];
  const abre = sim => {
    el.classList.toggle('is-aberto', sim);
    botao.setAttribute('aria-expanded', String(sim));
    if (sim) (opcoes.find(o => o.getAttribute('aria-selected') === 'true') ?? opcoes[0]).focus();
  };
  const escolhe = op => {
    opcoes.forEach(o => o.setAttribute('aria-selected', String(o === op)));
    atual.textContent = op.dataset.valor;
    botao.setAttribute('aria-label', `Idioma: ${op.textContent.toLowerCase()}`);
    abre(false);
    botao.focus();
  };
  botao.addEventListener('click', () => abre(!el.classList.contains('is-aberto')));
  opcoes.forEach(op => op.addEventListener('click', () => escolhe(op)));
  el.addEventListener('keydown', e => {
    const i = opcoes.indexOf(document.activeElement);
    if (e.key === 'Escape') { abre(false); botao.focus(); }
    else if (e.key === 'ArrowDown' && i >= 0) { e.preventDefault(); opcoes[Math.min(i + 1, opcoes.length - 1)].focus(); }
    else if (e.key === 'ArrowUp' && i >= 0) { e.preventDefault(); opcoes[Math.max(i - 1, 0)].focus(); }
    else if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { e.preventDefault(); escolhe(opcoes[i]); }
  });
  document.addEventListener('pointerdown', e => { if (!el.contains(e.target)) abre(false); });
}

function menu() {
  const botao = document.querySelector('.nav__abre');
  const el = document.querySelector('[data-menu]');
  if (!botao || !el) return;
  let fecha = 0;
  const abre = sim => {
    clearTimeout(fecha);
    botao.setAttribute('aria-expanded', String(sim));
    botao.setAttribute('aria-label', sim ? 'Fechar menu' : 'Abrir menu');
    document.documentElement.classList.toggle('com-menu', sim);
    if (sim) {
      el.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-aberto')));
    } else {
      el.classList.remove('is-aberto');
      fecha = setTimeout(() => { el.hidden = true; }, 450);
    }
  };
  botao.addEventListener('click', () => abre(el.hidden));
  el.querySelectorAll('a').forEach(a => a.addEventListener('click', () => abre(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !el.hidden) { abre(false); botao.focus(); } });
}

// No toque não há hover: o elemento tocado acende por 600 ms (link, botão, seta)
function toque() {
  if (!document.documentElement.classList.contains('toque')) return;
  document.addEventListener('touchstart', e => {
    const alvo = e.target.closest('.link, .botao, .seta');
    if (!alvo) return;
    alvo.classList.add('is-tocado');
    setTimeout(() => alvo.classList.remove('is-tocado'), 600);
  }, { passive: true });
}
