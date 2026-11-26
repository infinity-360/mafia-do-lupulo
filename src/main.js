import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/yellowtail/400.css';
import './styles/tokens.css';
import './styles/base.css';
import './sections/nav.css';
import './sections/hero.css';
import './sections/secoes.css';
import './estilo.js';

import { palco } from './motion/palco.js';
import { nav } from './motion/nav.js';
import { barra } from './motion/barra.js';
import { secoes } from './motion/secoes.js';
import { trilho } from './motion/trilho.js';

const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
history.scrollRestoration = 'manual';
scrollTo(0, 0);

nav();
barra();
secoes({ reduzido });
trilho();
palco({ reduzido });
