/* Секции 2–4 карты юзкейсов: плитки задач, шторка задачи, «Чем обработали», дата,
   каталог, история, карточка питомца. Логика — pets.js (из лоу-фай), разметка —
   по кадрам Figma (номера кадров у каждого куска). */

import { protRows, taskOf, drugsFor, findDrug, typicalPeriod, PARASITE, IMG,
         taskRow, taskGroups, drugCards, recentDrugs, alsoNote, recCovers, logOf, treatmentInfo,
         drugOfRecord, fmtDay, fmtDayNoYear, daysWord, plural, todayISO, ago, parasitesOf, parasitesList,
         parasitesName, up, perText, rubles } from './pets.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Подпись пустой плитки — кадр 22:9599 для собаки; у остальных видов — как в компоненте плитки */
const EMPTY_NOTE = { base: 'Уже давали таблетку или капли?', tick: 'Уже обрабатывали в этом сезоне?' };
const TILE_TITLE = { base: 'Гельминты\nи блохи' };

/* ─── плитка задачи · treatment-card 42:14043 ─── */

/* Три состояния плашки: фиолетовая — срок идёт; жёлтая — осталось 7 дней и меньше; красная — срок вышел, «пора повторить» (ОС клиента 27.10) */
const clockHTML = '<span class="badge__clock"><img src="icons/clock-due-12.svg" alt=""></span>';
const badgeHTML = (soon, text, clock) => soon
  ? `<span class="badge badge--soon${clock ? ' badge--clock' : ''}"><span>${esc(text)}</span>${clock ? clockHTML : ''}</span>`
  : `<span class="badge">${esc(text)}</span>`;
const alertHTML = '<span class="badge__clock"><img src="icons/alert-12.svg" alt=""></span>';   /* красная — восклицательный знак, а не часы (29.10) */
const badgeDue = (text, clock) =>
  `<span class="badge badge--due${clock ? ' badge--clock' : ''}"><span>${esc(text)}</span>${clock ? alertHTML : ''}</span>`;

/* Нижняя строка плитки — расшифровка бейджа (правила лоу-фай) */
function tileWhen(r) {
  const last = r.log[r.log.length - 1];
  if (!r.next || r.days > 0) {
    if (r.partial) return `Только ${parasitesOf(r.covered.map(x => x.par))}<br>${fmtDayNoYear(last.date)}`;
    return `Обработали<br>${fmtDayNoYear(last.date)}`;
  }
  const due = r.parts.filter(x => x.info && x.info.days <= 0).map(x => x.par);
  const part = due.length < r.parts.length ? `Защита ${parasitesOf(due)}` : null;
  if (r.days === 0) return part ? `${part}<br>истекает сегодня` : 'Срок подошёл<br>сегодня';
  return part ? `${part}<br>истекла ${fmtDayNoYear(r.next)}` : `Срок вышел<br>${fmtDayNoYear(r.next)}`;
}

/* Итерация «один блок» (22.09, ОС клиента): одна плитка на всю ширину, фиксированной
   высоты — карточки на слайдах не прыгают. Строка на паразита: что закрыто и до какого
   числа; не отмеченное — серым (клещи сезонные, тревожить жёлтым незачем).
   Тап по плитке — шторка с разбивкой; кнопка — сразу «Чем обработали». */
const rowState = x => {
  if (!x.t) return '<span class="prow__none">не отмечали</span>';
  if (!x.info) return `<span class="prow__none">обработали ${esc(fmtDayNoYear(x.t.date))}</span>`;
  return x.info.days <= 0 ? badgeDue('пора повторить', true)
    : badgeHTML(false, `до ${fmtDayNoYear(x.info.next)}`);
};
function tileA(p, r) {
  return `
    <div class="pblock" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pblock__rows">${r.parts.map(x => `
        <span class="prow"><span class="prow__name">${esc(up(PARASITE[x.par].name))}</span>${rowState(x)}</span>`).join('')}
      </span>
      <span class="task__btn pblock__btn" role="button" data-act="quick-mark" data-value="${r.key}">
        <img src="icons/plus-20.svg" alt="">Отметить обработку</span>
    </div>`;
}

/* Вариант Б: главный статус крупно, фото препаратов, которыми обрабатывали,
   и чипсы по паразитам (жёлтый — пора, фиолетовый — под защитой, серый — не отмечали).
   Переключение: ?v=a / ?v=b, запоминается до конца сессии. */
const VARIANT = (() => {
  const q = new URLSearchParams(location.search).get('v');
  try { if (q) sessionStorage.setItem('4lapy-blok-v', q); return sessionStorage.getItem('4lapy-blok-v') || 'k'; }
  catch { return q || 'k'; }
})();

function headline(r) {
  if (r.empty) return ['Ещё не отмечали', 'Отметьте — напомним, когда повторить'];
  const due = r.parts.filter(x => x.info && x.info.days <= 0).map(x => x.par);
  if (due.length) return ['Пора повторить', parasitesOf(due)];
  if (!r.next) return [`Обработали ${fmtDayNoYear(r.t.date)}`, 'Срок повтора не считаем'];
  if (r.partial) return [`Защита до ${fmtDayNoYear(r.next)}`, `Только ${parasitesOf(r.covered.map(x => x.par))}`];
  return [`Защита до ${fmtDayNoYear(r.next)}`, parasitesOf(r.parasites)];
}

function tileB(p, r) {
  const [h, sub] = headline(r);
  const due = r.parts.some(x => x.info && x.info.days <= 0);
  const drugs = [...new Map(r.parts.filter(x => x.t).map(x => [x.t.drug, x.t])).values()]
    .map(t => findDrug(p.species, t.drug) || { name: t.drug, custom: true });
  const shield = '<span class="treat-icon"><img class="l" src="icons/treat-l.svg" alt=""><img class="r" src="icons/treat-r.svg" alt=""><img class="t" src="icons/treat-top.svg" alt=""></span>';
  /* фото товара; у своего препарата — карандаш; у товара без фото — значок обработки */
  const phOf = d => IMG(d.img) ? `<img src="${IMG(d.img)}" alt="">` : d.custom ? '<img class="own" src="icons/edit-20.svg" alt="">' : shield;
  const ph = drugs.length
    ? drugs.slice(0, 3).map(d => `<span class="pb2__ph${!IMG(d.img) && !d.custom ? ' pb2__ph--empty' : ''}">${phOf(d)}</span>`).join('')
    : `<span class="pb2__ph pb2__ph--empty">${shield}</span>`;
  const chip = x => {
    const st = !x.t ? 'none' : x.info && x.info.days <= 0 ? 'due' : 'ok';
    const ic = st === 'due' ? '<img src="icons/clock-due-12.svg" alt="">' : st === 'ok' ? '<img src="icons/check-16-white.svg" alt="">' : '';
    return `<span class="pchip pchip--${st}">${esc(up(PARASITE[x.par].name))}${ic}</span>`;
  };
  return `
    <div class="pb2${due ? ' pb2--due' : ''}" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pb2__top">
        <span class="pb2__phs">${ph}</span>
        <span class="pb2__text"><b>${esc(h)}</b><small>${esc(sub)}</small></span>
        <img class="pb2__arrow" src="icons/arrow-right-16.svg" alt="">
      </span>
      <span class="pb2__chips">${r.parts.map(chip).join('')}</span>
      <span class="task__btn pblock__btn" role="button" data-act="quick-mark" data-value="${r.key}">
        <img src="icons/plus-20.svg" alt="">Отметить обработку</span>
    </div>`;
}

/* Вариант В: полоса защиты у каждого паразита — сколько осталось от срока препарата.
   Пора повторить — полоса жёлтая, не отмечали — пустая пунктирная, без срока — серая целиком */
function tileC(p, r) {
  const row = x => {
    let bar, lab;
    if (!x.t) { bar = '<i class="pbar pbar--none"></i>'; lab = '<span class="prow__none">не отмечали</span>'; }
    else if (!x.info) { bar = '<i class="pbar pbar--flat"><b style="width:100%"></b></i>'; lab = `<span class="prow__none">${esc(fmtDayNoYear(x.t.date))}</span>`; }
    else if (x.info.days <= 0) { bar = '<i class="pbar pbar--due"><b style="width:100%"></b></i>'; lab = badgeDue('пора', true); }
    else {
      const w = Math.max(6, Math.min(100, Math.round(x.info.days / x.t.periodDays * 100)));
      bar = `<i class="pbar"><b style="width:${w}%"></b></i>`; lab = `<span class="prow__till">до ${esc(fmtDayNoYear(x.info.next))}</span>`;
    }
    return `<span class="prow prow--bar"><span class="prow__name">${esc(up(PARASITE[x.par].name))}</span>${bar}${lab}</span>`;
  };
  return `
    <div class="pblock${r.parts.length === 1 ? ' pblock--one' : ''}" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pblock__rows">${r.parts.map(row).join('')}</span>
      <span class="task__btn pblock__btn" role="button" data-act="quick-mark" data-value="${r.key}">
        <img src="icons/plus-20.svg" alt="">Отметить обработку</span>
    </div>`;
}

/* Вариант Г — на модели клиента («ЛК Питомца», UC 4–5, файл sm51…, 7043:101943): в блоке
   список препаратов, у каждого их «прогресс-бар» (7043:101866) и «осталось N дней»:
   зелёный — больше половины срока, жёлтый — меньше половины, красный — неделя и меньше,
   розовый — срок истёк. Как у них, видно два препарата — самые срочные. */
function drugBar(g) {
  if (!g.info) return { cls: 'flat', w: 100, lab: `обработали ${fmtDayNoYear(g.t.date)}`, labCls: '' };
  const d = g.info.days, per = g.t.periodDays;
  if (d <= 0) return { cls: 'over', w: 100, lab: d === 0 ? 'срок истекает сегодня' : 'срок действия истёк', labCls: 'red' };
  const w = Math.max(4, Math.min(100, Math.round(d / per * 100)));
  const cls = d <= 7 ? 'red' : d / per <= .5 ? 'yellow' : 'green';
  return { cls, w, lab: `осталось ${daysWord(d)}`, labCls: cls === 'red' ? 'red' : '' };
}
function tileD(p, r) {
  if (r.empty) return `
    <div class="pb4 pb4--empty" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pb4__empty"><b>Препараты ещё не отмечали</b><small>Отметьте, чем обработали, — покажем, сколько действует защита, и напомним о повторе</small></span>
      <span class="task__btn pblock__btn" role="button" data-act="quick-mark" data-value="${r.key}"><img src="icons/plus-20.svg" alt="">Отметить обработку</span>
    </div>`;
  const rank = g => (g.info ? g.info.days : 1e4);
  const groups = taskGroups(p, r).sort((a, b) => rank(a) - rank(b));
  const row = g => {
    const bar = drugBar(g);
    const src = IMG(g.d.img);
    return `<span class="pdrug">
      <span class="pdrug__ph">${src ? `<img src="${src}" alt="">` : g.d.custom ? '<img class="own" src="icons/edit-20.svg" alt="">' : '<span class="treat-icon"><img class="l" src="icons/treat-l.svg" alt=""><img class="r" src="icons/treat-r.svg" alt=""><img class="t" src="icons/treat-top.svg" alt=""></span>'}</span>
      <span class="pdrug__body">
        <span class="pdrug__name">${esc(g.d.name)}</span>
        <i class="kbar kbar--${bar.cls}"><b style="width:${bar.w}%"></b></i>
        <span class="pdrug__left${bar.labCls ? ' pdrug__left--red' : ''}">${esc(bar.lab)}</span>
      </span>
    </span>`;
  };
  const more = groups.length - 2;
  return `
    <div class="pb4" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pb4__list">${groups.slice(0, 2).map(row).join('')}</span>
      ${r.missing.length ? `<span class="pb4__gap">${esc(up(parasitesOf(r.missing.map(x => x.par))))} — не отмечали</span>` : more > 0 ? `<span class="pb4__gap">и ещё ${more} ${plural(more, 'препарат', 'препарата', 'препаратов')}</span>` : ''}
      <span class="task__btn pblock__btn" role="button" data-act="quick-mark" data-value="${r.key}"><img src="icons/plus-20.svg" alt="">Отметить обработку</span>
    </div>`;
}

/* Вариант Д — тихий: одна фраза статуса, одна полоса срока (прогресс-бар клиента) по
   самой ранней защите, маленькие фото препаратов. Ни бейджей, ни чипсов. */
/* Вариант Д (итог обсуждения 22.09): строка на паразита, справа прямым текстом —
   сколько осталось. Точка слева: зелёная — под защитой, красная — неделя и меньше,
   жёлтая — пора повторить, серая — без срока, пустой кружок — не обрабатывали */
function tileE(p, r) {
  /* Ячейка на паразита, в ряд: сверху паразит мелко, снизу срок. Три паразита — три ячейки,
     один — одна широкая; высота плитки одна и та же, пустоты нет */
  const one = r.parts.length === 1;
  const row = x => {
    let val;
    if (!x.t) val = '<small class="none">не отмечали</small>';
    else if (!x.info) val = `<small>${esc(one ? `обработали ${fmtDayNoYear(x.t.date)}` : fmtDayNoYear(x.t.date))}</small>`;
    else if (x.info.days <= 0) val = `<b>${one ? 'пора повторить' : 'повторить'}</b>`;
    else {
      /* число — главное, крупно; единица и «осталось» — мелко серым */
      const n = x.info.days, unit = plural(n, 'день', 'дня', 'дней');
      val = `${one ? '<small>осталось</small> ' : ''}<b class="num${n <= 7 ? ' soon' : ''}">${n}</b> <small>${unit}</small>`;
    }
    const due = x.info && x.info.days <= 0;
    return `<span class="qcell${due ? ' qcell--due' : ''}"><span class="qcell__name">${esc(up(PARASITE[x.par].name))}</span><span class="qcell__val">${val}</span></span>`;
  };
  /* фото препаратов, которыми обрабатывали, — только если у товара есть фото */
  const drugs = [...new Map(r.parts.filter(x => x.t).map(x => [x.t.drug, x.t])).values()]
    .map(t => findDrug(p.species, t.drug) || { name: t.drug, custom: true });
  const ph = d => `<span class="pb5__ph"><img src="${IMG(d.img)}" alt=""></span>`;
  return `
    <div class="pb5" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pb5__head"><b>Обработка от паразитов</b>
        <span class="pb5__phs">${drugs.filter(d => IMG(d.img)).slice(0, 3).map(ph).join('')}</span></span>
      <span class="qcells">${r.parts.map(row).join('')}</span>
      <span class="task__btn pblock__btn" role="button" data-act="quick-mark" data-value="${r.key}"><img src="icons/plus-20.svg" alt="">Отметить обработку</span>
    </div>`;
}

/* Вариант Е — строго на языке исходного дизайна (кадры 120:9839, 232:23018):
   якорь секции (двухцветная иконка + 17 semi) остаётся снаружи; внутри одной плитки
   паразиты колонками: название 16 med, статус — фирменной плашкой (фиолетовая — срок,
   жёлтая — пора повторить или неделя и меньше); три стиля текста на всё; пустое
   состояние — белая плитка с пунктиром, как у исходной «Отметить» */
function tileF(p, r) {
  const one = r.parts.length === 1;
  const col = x => {
    let st;
    if (!x.t) st = '<span class="pcol__none">не отмечали</span>';
    else if (!x.info) st = `<span class="pcol__none">обработали ${esc(fmtDayNoYear(x.t.date))}</span>`;   /* срок не считаем — без плашки защиты */
    else if (x.info.days <= 0) st = badgeDue(one ? 'пора повторить' : 'повторить', true);
    else if (x.info.days <= 7) st = badgeHTML(true, `${one ? 'осталось ' : ''}${daysWord(x.info.days)}`);
    else st = badgeHTML(false, `${one ? 'осталось ' : ''}${daysWord(x.info.days)}`);
    return `<span class="pcol"><span class="pcol__name">${esc(up(PARASITE[x.par].name))}</span>${st}</span>`;
  };
  const dash = r.empty ? `<svg class="task__dash" aria-hidden="true"><rect x="0.5" y="0.5" rx="20" ry="20" width="100%" height="100%"
      fill="none" stroke="#C7D6E1" stroke-dasharray="4 4"/></svg>` : '';
  return `
    <div class="pb6${r.empty ? ' pb6--empty' : ''}" role="button" tabindex="0" data-act="task" data-value="${r.key}">${dash}
      <span class="pcols">${r.parts.map(col).join('')}</span>
      <span class="task__btn" role="button" data-act="quick-mark" data-value="${r.key}"><img src="icons/plus-20.svg" alt="">Отметить</span>
    </div>`;
}

/* Общий статус паразита фирменной плашкой (для вариантов Ж–И) */
const stBadge = (x, long) => {
  if (!x.t) return '<span class="pcol__none">не отмечали</span>';
  if (!x.info) return `<span class="pcol__none">обработали ${esc(fmtDayNoYear(x.t.date))}</span>`;
  if (x.info.days <= 0) return badgeDue(long ? 'пора повторить' : 'повторить', true);
  return badgeHTML(x.info.days <= 7, `${long ? 'осталось ' : ''}${daysWord(x.info.days)}`);
};
const SHIELD = '<span class="treat-icon"><img class="l" src="icons/treat-l.svg" alt=""><img class="r" src="icons/treat-r.svg" alt=""><img class="t" src="icons/treat-top.svg" alt=""></span>';
const markBtn = r => `<span class="task__btn" role="button" data-act="quick-mark" data-value="${r.key}"><img src="icons/plus-20.svg" alt="">Отметить</span>`;

/* Ж — как плитка услуги: крупная двухцветная иконка, рядом строки статусов */
function tileG(p, r) {
  return `
    <div class="pb7" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pb7__top"><span class="pb7__ic">${SHIELD}</span>
        <span class="pb7__rows">${r.parts.map(x => `<span class="pb7__row"><span>${esc(up(PARASITE[x.par].name))}</span>${stBadge(x)}</span>`).join('')}</span></span>
      ${markBtn(r)}
    </div>`;
}
/* З — список: название 16 med слева, плашка справа */
function tileH(p, r) {
  return `
    <div class="pb8" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pb8__rows">${r.parts.map(x => `<span class="pb8__row"><span class="pb8__name">${esc(up(PARASITE[x.par].name))}</span>${stBadge(x, true)}</span>`).join('')}</span>
      ${markBtn(r)}
    </div>`;
}
/* И — анатомия исходной плитки на всю ширину: заголовок и препараты сверху, плашки и кнопка снизу */
function tileI(p, r) {
  const n = r.drugs.length;
  const what = r.empty ? 'Уже давали таблетку или капли?' : n > 1 ? `${n} ${plural(n, 'препарат', 'препарата', 'препаратов')}` : r.drugs[0];
  const chip = x => `<span class="pb9__chip"><small>${esc(up(PARASITE[x.par].name))}</small>${stBadge(x)}</span>`;
  return `
    <div class="pb9" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="ttile__head"><span class="ttile__title">${esc(r.name)}</span><span class="ttile__drug">${esc(what)}</span></span>
      <span class="pb9__chips">${r.parts.map(chip).join('')}</span>
      ${markBtn(r)}
    </div>`;
}

/* К — тихая плитка (понравилась по размеру и раскладке). Что подсвечиваем:
   1) самое срочное — плашка сверху (как «Новинка» над названием товара) и паразиты
      крупно под ней, до двух строк, плашка не уезжает при длинных названиях;
   2) остальное — мелкой строкой, одинаковые статусы объединены;
   3) справа фото препаратов, а если их нет — щит (якорь блока);
   пустая плитка — «Обработка от паразитов» + подсказка */
function tileK(p, r) {
  const stOf = x => !x.t ? { k: 'none', o: 3e4, s: 'не обрабатывали' }
    : !x.info ? { k: 'flat' + x.t.date, o: 2e4, s: `обработали ${fmtDayNoYear(x.t.date)}` }
    : x.info.days <= 0 ? { k: 'due', o: -1, s: 'пора повторить' }
    : { k: 'd' + x.info.days, o: x.info.days, s: `ещё ${daysWord(x.info.days)}` };
  const groups = [];
  /* паразиты независимы, но одинаковый статус объединяется («Блохи и клещи — ещё 30 дней»),
     разный — отдельно; при равной срочности — порядок задачи (гельминты, блохи, клещи) */
  r.parts.forEach((x, i) => { const s = stOf(x); const g = groups.find(y => y.k === s.k);
    g ? g.pars.push(x.par) : groups.push({ ...s, pars: [x.par], i }); });
  groups.sort((a, b) => a.o - b.o || a.i - b.i);
  const first = groups[0], one = r.parts.length === 1;
  const x0 = r.parts.find(x => x.par === first.pars[0]);
  const badge = r.empty ? '' : !x0.t ? '<span class="badge badge--none">не обрабатывали</span>'
    : !x0.info ? `<span class="badge badge--none">обработали ${esc(fmtDayNoYear(x0.t.date))}</span>`
    : x0.info.days <= 0 ? badgeDue('пора повторить', true)
    : badgeHTML(x0.info.days <= 7, `ещё ${daysWord(x0.info.days)}`);
  /* пара «Клещи: не обрабатывали» не рвётся — перенос только по «·» */
  const line = g => `${up(parasitesName(g.pars))}: ${g.s}`.replace(/ /g, '\u00a0');
  const h = r.empty ? 'Обработка от паразитов' : up(parasitesName(first.pars));
  const sub = r.empty ? 'Отметьте — напомним, когда повторить'
    /* статус один (всё под защитой, один паразит) — мелко препарат, иначе под плашкой пусто */
    : groups.length === 1 ? [...new Set(r.parts.filter(x => x.t).map(x => x.t.drug))].join(' + ') : groups.slice(1).map(line).join(' · ');
  /* превью — препараты тех же частей, что в шторке, в её порядке; больше трёх не показываем, даже если действующих четыре (ОС клиента 15.10) */
  const drugs = taskGroups(p, r).map(g => findDrug(p.species, g.t.drug)).filter(d => d && IMG(d.img));
  /* справа: фото препаратов; щит — только когда обработок нет совсем */
  const side = drugs.length
    ? `<span class="pb5__phs">${drugs.slice(0, 3).map(d => `<span class="pb5__ph"><img src="${IMG(d.img)}" alt=""></span>`).join('')}</span>`
    : r.empty ? `<span class="pbk__ic">${SHIELD}</span>` : '';
  return `
    <div class="pb5 pbk" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pb5__top">
        <span class="pb5__text"><b>${esc(h)}</b>${badge}${r.empty ? `<small>${esc(sub)}</small>` : ''}</span>
        ${side}
      </span>
      ${sub && !r.empty ? `<small class="pbk__sub">${esc(sub)}</small>` : ''}
      <span class="task__btn pblock__btn" role="button" data-act="quick-mark" data-value="${r.key}"><img src="icons/plus-20.svg" alt="">Отметить обработку</span>
    </div>`;
}

/* Виджет «Ближайшая обработка» (parasite-widget, 695:17276). Высота фиксированная — 170. Плашка — самый близкий срок из всех препаратов.
   Режимы по числу препаратов: 1 и 2 — с названиями, 3–5 — ряд превью, 6 и больше — стопка; 7 влезают уменьшением нахлёста, «+1» не пишем.
   Бейдж на превью — только у красных и жёлтых. Тап по плитке — экран задачи, кнопка — сразу «Чем обработали». */
const PILL = '<img class="own" src="icons/pill-20.svg" alt="">';
const STACK_MAX = 6;
const widgetPlate = cards => {
  const c = cards.find(x => x.info);
  if (!c) return '<span class="badge badge--white">без срока</span>';
  return c.info.days <= 0 ? badgeDue('пора повторить', true) : badgeHTML(c.info.days <= 7, `через ${daysWord(c.info.days)}`, c.info.days <= 7);
};
const widgetPhoto = ({ d, info }) => {
  const mark = !info || info.days > 7 ? '' : info.days <= 0
    ? '<i class="pw__mark pw__mark--due"><img src="icons/alert-12.svg" alt=""></i>'
    : '<i class="pw__mark pw__mark--soon"><img src="icons/clock-due-12.svg" alt=""></i>';
  return `<span class="pw__ph">${IMG(d.img) ? `<img src="${IMG(d.img)}" alt="">` : PILL}${mark}</span>`;
};
const widgetBtn = r => `<span class="task__btn pw__btn" role="button" data-act="quick-mark" data-value="${r.key}"><img src="icons/plus-20.svg" alt="">Отметить обработку</span>`;
function tileWidget(p, r) {
  const cards = drugCards(p, r), n = cards.length;
  if (!n) return `
    <div class="pw pw--empty" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pw__shield">${SHIELD}</span>
      <span class="pw__hint"><b>Обработка от паразитов</b><small>Отметьте — напомним, когда повторить</small></span>
      ${widgetBtn(r)}
    </div>`;
  const named = c => `<span class="pw__item">${widgetPhoto(c)}<span class="pw__name">${esc(c.d.name)}</span></span>`;
  const more = n > STACK_MAX + 1 ? n - STACK_MAX : 0;
  const shown = more ? cards.slice(0, STACK_MAX) : cards;
  const step = n === STACK_MAX + 1 ? 'pw__photos--tight' : '';
  const photos = n <= 2 ? cards.map(named).join('') : shown.map(widgetPhoto).join('') + (more ? `<i class="pw__more">+${more}</i>` : '');
  const mode = n === 1 ? 'one' : n === 2 ? 'two' : n <= 5 ? 'row' : 'stack';
  return `
    <div class="pw" role="button" tabindex="0" data-act="task" data-value="${r.key}">
      <span class="pw__top"><b>Ближайшая обработка</b>${widgetPlate(cards)}</span>
      <span class="pw__photos pw__photos--${mode} ${step}">${photos}</span>
      ${widgetBtn(r)}
    </div>`;
}

export const tileHTML = (p, r) => ({ a: tileA, b: tileB, c: tileC, d: tileD, e: tileE, f: tileF, g: tileG, h: tileH, i: tileI, k: tileK }[new URLSearchParams(location.search).get('v')] || tileWidget)(p, r);

/* ─── строки шторки (правила лоу-фай) ─── */

function sheetLine(r) {
  if (r.empty) return 'Обработку ещё не отмечали';
  if (r.partial) {
    const ok = r.covered.filter(x => x.info)
      .map(x => `${PARASITE[x.par].name} — ${x.info.days < 0 ? `срок вышел ${fmtDay(x.info.next)}`
        : x.info.days === 0 ? 'срок сегодня' : `до ${fmtDay(x.info.next)}`}`).join(', ');
    const gap = `${parasitesOf(r.missing.map(x => x.par))} не обрабатывали`;
    return ok ? `${up(ok)} · ${gap}` : up(gap);
  }
  if (!r.next) return `Обработали ${fmtDay(r.t.date)} · срок повтора не считаем`;
  if (r.overdue) return `Срок вышел ${daysWord(-r.days)} назад`;
  if (r.days === 0) return 'Срок подошёл сегодня';
  return `Защита действует до ${fmtDay(r.next)}`;
}

/* ─── карточка препарата · * cart-card (224:170) ─── */

const photoHTML = d => {
  const src = IMG(d.img);
  return `<span class="dcard__ph${src ? '' : ' dcard__ph--own'}">${src ? `<img src="${src}" alt="" loading="lazy">` : PILL}</span>`;
};
/* Три состояния покупки на карточке (ОС клиента 28.10), по UI kit: можно купить · в корзине — счётчик «− 1 +» ·
   недоступен — приглушённая кнопка «Нет в наличии» без действия (как на проде и в *bttn snippet disable). В корзине клиента для такого товара «Раскупили», но там другой контекст.
   Недоступность в моках — один товар для показа: в проде это признак наличия из каталога. */
export const cartQty = new Map();
const UNAVAILABLE = ['Астрафарм Празител Суспензия от гельминтов для щенков и собак мелких пород, 20 мл',
  'Elanco Адвантикс капли на холку для собак весом от 4 до 10 кг от блох, клещей и комаров, 1 пипетка, 1 мл'];
const buyState = d => UNAVAILABLE.includes(d.name) ? 'off' : cartQty.get(d.name) ? 'in' : 'can';
const stepper = d => `<span class="qty" role="group" aria-label="Количество">
    <button class="qty__b" type="button" data-act="qty" data-value="${esc(d.name)}" data-d="-1" aria-label="Меньше"><img src="icons/minus-24.svg" alt=""></button>
    <b>${cartQty.get(d.name)}</b>
    <button class="qty__b" type="button" data-act="qty" data-value="${esc(d.name)}" data-d="1" aria-label="Больше"><img src="icons/plus-24.svg" alt=""></button></span>`;
const pillBuy = d => {
  if (!d.price) return '';
  const st = buyState(d);
  if (st === 'off') return '<span class="pill pill--off" aria-disabled="true"><span>Нет в наличии</span></span>';   /* как на проде: приглушённая кнопка, карточка не меняется */
  if (st === 'in') return stepper(d);
  return `<span class="pill" role="button" data-act="cart" data-value="${esc(d.name)}">
    <span>В корзину</span><i></i><span>${rubles(d.price)}</span></span>`;
};
/* повтор тем же препаратом прямо из шторки — дальше обычный экран даты (22.09) */
const pillRepeat = d => `<span class="pill pill--rep" role="button" data-act="pick-drug" data-value="${esc(d.name)}" data-label="${esc(d.opt || '')}">
    <span>Повторить</span></span>`;
const btnsHTML = (d, buy, repeat) => {
  const list = [buy ? pillBuy(d) : '', repeat ? pillRepeat(d) : ''].filter(Boolean);
  return list.length ? `<span class="dcard__btns${list.length > 1 ? ' dcard__btns--two' : ''}">${list.join('')}</span>` : '';
};

/* date — дата обработки сверху; del — ссылка на запись журнала; meta — серая строка */
/* Карточка препарата в списке «Чем обработали»: сердечко, чипы вариантов (вес питомца), кнопка «Добавить».
   Нажатие на саму карточку больше не выбирает препарат: после выбора варианта нужно подтверждение (ОС клиента 27.10) */
const optsHTML = (d, sel) => d.opts && d.opts.length > 1
  ? `<span class="dcard__opts" role="radiogroup" aria-label="Вариант">${d.opts.map((o, i) =>
      `<button class="opt-chip" type="button" role="radio" aria-checked="${i === sel}" data-act="opt" data-value="${esc(d.name)}" data-i="${i}">${esc(o)}</button>`).join('')}</span>` : '';
const favHTML = (d, fav) => `<button class="dcard__fav" type="button" data-act="fav" data-value="${esc(d.name)}" aria-pressed="${!!fav}" aria-label="${fav ? 'Убрать из избранного' : 'В избранное'}">
      <img src="icons/favorite-${fav ? 'on' : 'off'}.svg" alt=""></button>`;
/* Плитка «Чем обработали» — как в поиске приложения (870:14536): фото, сердечко, название, чипы, рейтинг, «Добавить». Цены и кнопки покупки нет: препарат уже куплен */
const listCardHTML = (d, { sel = 0, fav }) => {
  const src = IMG(d.img);
  const chips = d.opts && d.opts.length > 1 ? d.opts.map((o, i) =>
    `<button class="vopt" type="button" role="radio" aria-checked="${i === sel}" data-act="opt" data-value="${esc(d.name)}" data-i="${i}">${esc(o)}</button>`).join('') : '';
  return `<div class="vcard vcard--mark">
    <span class="vcard__photo">${src ? `<img src="${src}" alt="" loading="lazy">` : PILL}${favHTML(d, fav)}</span>
    <span class="vcard__name">${esc(d.name)}</span>
    ${chips ? `<span class="vcard__opts" role="radiogroup" aria-label="Вариант">${chips}</span>` : ''}
    <span class="vcard__rate"><img src="icons/star-12.svg" alt="">5 (983 отзыва)</span>
    <button class="vcard__buy" type="button" data-act="pick-drug" data-value="${esc(d.name)}"
      data-label="${d.opts && d.opts.length > 1 ? esc(d.opts[sel]) : ''}">Добавить</button>
  </div>`;
};

/* вертикальная карточка каталога — кит «*snippet card-mini»: фото, сердечко, название до 4 строк, пилюля с ценой (27.10) */
/* Стандартная плитка каталога приложения (*snippet card клиента, 2094:58510; раскладка как на проде): фото, цена над названием,
   название в 2 строки, чипы вариантов, «в корзину». Рейтинг как на проде, в моках условный; «самовывоз» не рисуем — данных нет (схема 30.10) */
const vcardHTML = (d, fav, sel = 0) => {
  const src = IMG(d.img), st = buyState(d);
  const chips = d.opts && d.opts.length > 1 ? d.opts.map((o, i) =>
    `<button class="vopt" type="button" role="radio" aria-checked="${i === sel}" data-act="opt" data-value="${esc(d.name)}" data-i="${i}">${esc(o)}</button>`).join('') : '';
  const buy = !d.price ? '' : st === 'off' ? '<span class="vcard__buy vcard__buy--off" aria-disabled="true">Нет в наличии</span>'
    : st === 'in' ? stepper(d)
    : `<span class="vcard__buy" role="button" data-act="cart" data-value="${esc(d.name)}"><img src="icons/cart-20.svg" alt="">в корзину</span>`;
  return `<div class="vcard">
    <span class="vcard__photo">${src ? `<img src="${src}" alt="" loading="lazy">` : PILL}
      ${favHTML(d, fav)}</span>
    <span class="vcard__rate"><img src="icons/star-12.svg" alt="">5.0</span>
    ${d.price ? `<span class="vcard__price"><b>${rubles(d.price)}</b>${d.old ? `<s>${rubles(d.old)}</s>` : ''}</span>` : ''}
    <span class="vcard__name">${esc(d.name)}</span>
    <span class="vcard__opts" role="radiogroup" aria-label="Вариант">${chips}</span>
    ${buy}
  </div>`;
};

export function cardHTML(d, { date, del, meta, buy = true, center, act, repeat, fav, plate } = {}) {
  const top = date || del ? `<span class="dcard__top">
      ${date ? `<span class="dcard__date">${esc(date)}</span>` : ''}
      ${del != null ? `<span class="dcard__del" role="button" data-act="del-rec" data-value="${del}" aria-label="Убрать отметку">
        <img src="icons/trash-20.svg" alt=""></span>` : ''}</span>${plate || ''}` : '';
  const tag = act ? 'button' : 'div';
  return `<${tag} class="dcard${center ? ' dcard--center' : ''}${fav != null ? ' dcard--fav' : ''}"${act ? ` type="button" data-act="${act.name}" data-value="${esc(act.value)}"` : ''}>
    ${fav != null ? favHTML(d, fav) : ''}
    <span class="dcard__row">${photoHTML(d)}
      <span class="dcard__body">${top}
        <span class="dcard__name">${esc(d.name)}</span>
        ${meta ? `<span class="dcard__meta">${esc(meta)}</span>` : ''}
      </span></span>
    ${btnsHTML(d, buy, repeat)}
  </${tag}>`;
}

const OWN = 'Вы добавили сами';

/* ─── шапка и низ: шторка (короткое действие) и экран сценария (схема 30.10) ─── */

const grab = '<div class="psheet__grab"><i></i></div>';
const titleHTML = text => `<div class="psheet__title"><h2>${esc(text)}</h2></div>`;
const homebar = '<div class="homebar" aria-hidden="true"><i></i></div>';
const bottomHTML = btns => `<div class="psheet__bottom"><div class="psheet__btns">${btns}</div>${homebar}</div>`;
const btnSoft = (act, text, icon = 'cart-20') =>
  `<button class="btn-icon btn-icon--soft" type="button" data-act="${act}"><img src="icons/${icon}.svg" alt="">${esc(text)}</button>`;
const btnDark = (act, text, off = false) =>
  `<button class="btn-icon btn-icon--dark" type="button" data-act="${act}" aria-disabled="${off}"><img src="icons/check-20-white.svg" alt="">${esc(text)}</button>`;

/* Экран: шапка кита лежит поверх списка, список уходит под неё и под таб-бар — в скруглениях виден контент.
   От шапки до первого элемента 8, как в корзине и каталоге клиента. Нижний блок сливается с таб-баром в одну подложку */
const screenHTML = ({ title, back = 'panel-back', right = '', search = '', bottom = '', body, cls = '' }) => ({ screen: true, merged: !!bottom, html: `
  <div class="pscreen__scroll ${cls}${search ? ' pscreen__scroll--search' : ''}"${bottom ? ` style="--pbottom:${bottom.h}px"` : ''}>${body}</div>
  <div class="phead">
    <div class="phead__bar">
      <button class="phead__btn" type="button" data-act="${back}" aria-label="Назад"><img src="icons/arrow-back-24.svg" alt=""></button>
      <h2>${esc(title)}</h2>${right || '<span class="phead__btn"></span>'}
    </div>${search}
  </div>${bottom ? `<div class="pbottom">${bottom.html}</div>` : ''}` });

/* ─── 1 · задача: шторка первого входа (106:7701), экран с препаратами (224:2) ─── */

const SHEET_TITLE = 'Обработка от паразитов';

/* Плашка на карточке: красная, жёлтая и фиолетовая по сроку. На виджете та же, но без глагола — его заменяет заголовок (30.10) */
const cardPlate = (info) => !info ? '<span class="badge badge--none">без срока</span>'
  : info.days <= 0 ? badgeDue('пора повторить', true)
  : badgeHTML(info.days <= 7, `повторить через ${daysWord(info.days)}`, info.days <= 7);

export function taskSheet(p, key) {
  const r = taskRow(p, taskOf(p.species, key));
  /* обработок нет — короткая шторка с двумя кнопками: показывать нечего */
  if (r.empty) return { hug: true, html: `
    <div class="psheet__top">${grab}
      <div class="psheet__head">${titleHTML(SHEET_TITLE)}<p class="psheet__line">${sheetLine(r)}</p></div>
    </div>
    ${bottomHTML(btnSoft('catalog', 'Купить препарат') + btnDark('mark', 'Отметить обработку'))}` };

  /* один список без деления по типам: один препарат — одна карточка, дата и статус по последней отметке, остальное в истории */
  const log = logOf(p);
  const body = drugCards(p, r).map(({ t, d, info }) => cardHTML(d, { date: `Обработали ${fmtDay(t.date)}`, del: log.indexOf(t), repeat: true,
    plate: cardPlate(info), meta: d.custom ? OWN : '' })).join('');
  return screenHTML({ title: SHEET_TITLE, back: 'panel-close',
    right: '<button class="phead__btn" type="button" data-act="history" aria-label="История обработок"><img src="icons/history-24.svg" alt=""></button>',
    body: `<div class="plist">${body}</div>`,
    bottom: { h: 116, html: btnSoft('catalog', 'Купить препарат') + btnDark('mark', 'Отметить обработку') } });
}

/* ─── поиск ─── */

const searchHTML = (placeholder, q) => `
  <div class="psearch">
    <label class="psearch__box"><img src="icons/search-24.svg" alt="">
      <input id="pq" type="text" placeholder="${esc(placeholder)}" value="${esc(q)}" autocomplete="off" autocorrect="off" spellcheck="false">
      ${q ? '<button class="psearch__clear" type="button" data-act="q-clear" aria-label="Очистить"><img src="icons/close-20.svg" alt=""></button>' : ''}
    </label>
  </div>`;

const found = (list, q) => q ? list.filter(d => d.name.toLowerCase().includes(q.toLowerCase())) : list;
const notFound = q => `<p class="pempty">Среди препаратов для этого питомца «${esc(q)}» не нашли</p>`;

/* ─── 4 · 2 · каталог задачи — только покупка (228:15064) ─── */

export function catalogSheet(p, key, q, favs = [], opts = {}) {
  const list = found(drugsFor(p.species, key), q);
  return screenHTML({ title: 'Препараты от паразитов', search: searchHTML('Название препарата', q),
    body: list.length ? `<div class="plist--grid">${list.map(d => vcardHTML(d, favs.includes(d.name), opts[d.name] || 0)).join('')}</div>` : `<div class="plist">${notFound(q)}</div>` });
}

/* ─── 3 · 3 · «Чем обработали» (232:18204, 3а.1–3а.3) ─── */

/* Свой препарат: срок по умолчанию 30 дней, как в кадрах 3а.3–3а.4; там, где график не считаем, — без срока */
export const ownPeriod = (p, key) => typicalPeriod(p.species, key) ? 30 : null;

export function markSheet(p, key, q, only, ui = {}) {
  const hits = d => !only || d.covers.some(c => only.includes(c));
  const all = drugsFor(p.species, key).filter(hits);
  const recent = recentDrugs(p, key).filter(x => hits(x.drug));
  const chosen = ui.opts || {}, favs = ui.favs || [];
  /* какой вариант выбран: сам пользователь → вариант прошлой записи → первый */
  const selOf = d => chosen[d.name] ?? Math.max(0, d.opt && d.opts ? d.opts.indexOf(d.opt) : 0);
  const card = d => listCardHTML(d, { sel: selOf(d), fav: favs.includes(d.name) });
  let body;
  if (q) {
    const pool = [...recent.map(x => x.drug), ...all.filter(d => !recent.some(x => x.drug.name === d.name))];
    const list = found(pool, q);
    const per = ownPeriod(p, key);
    body = `${list.length ? list.map(card).join('') : notFound(q)}
      <div class="vcard vcard--mark vcard--own">
        <span class="vcard__photo"><img class="own" src="icons/plus-24.svg" alt=""></span>
        <span class="vcard__name">Записать как «${esc(q)}»</span>
        <span class="vcard__rate">${per ? up(perText(per)) : 'Без срока повтора'}</span>
        <button class="vcard__buy" type="button" data-act="pick-own">Добавить</button>
      </div>`;
  } else {
    const rest = all.filter(d => !recent.some(x => x.drug.name === d.name));
    body = `${recent.length ? `<p class="plabel">Ранее обрабатывали</p>
        ${recent.map(x => card(x.drug)).join('')}` : ''}
      ${recent.length && rest.length ? '<p class="plabel plabel--gap">Все препараты</p>' : ''}
      ${rest.map(card).join('')}`;
  }
  return screenHTML({ title: 'Чем обработали', search: searchHTML('Найти препарат', q), body: `<div class="plist--grid plist--mark">${body}</div>` });
}

/* ─── 3 · 4 · дата обработки (232:19517), свой препарат (235:2), срок вручную (844:12602) ─── */

const dmy = iso => iso.split('-').reverse().join('.');
export function dateResult(d, date) {
  const info = treatmentInfo({ date, periodDays: d.period });
  if (!info) return 'Срок повтора считать не будем';
  if (info.days < 0) return `Срок этой обработки уже вышел ${fmtDay(info.next)} — пора повторить`;
  if (info.days === 0) return 'Срок этой обработки подходит сегодня — пора повторить';
  return `Защита будет действовать до ${fmtDay(info.next)}`;
}

/* Срок действия своего препарата — выбирает пользователь: у введённого вручную его взять неоткуда (ОС клиента 24.09) */
const PERIODS = [['30 дней', 30], ['90 дней', 90], ['180 дней', 180]];

export function dateSheet(p, key, d, date, per = { unit: 'дн', val: '', own: false }, dtext = null) {
  const quick = [['Сегодня', 0], ['Вчера', 1]];   /* «Неделю назад» убрали (ОС клиента 28.09): любая другая дата — вводом или в календаре */
  const typing = dtext !== null;                   /* дата набирается руками и ещё не принята */
  return screenHTML({ title: 'Обработка', cls: 'pscreen__scroll--form', bottom: { h: 80, html: btnDark('save-mark', typing ? 'Отметить' : `Отметить ${fmtDay(date)}`, typing) }, body: `
        ${cardHTML(d, { buy: false, center: true, meta: d.custom ? OWN : '' })}
        ${d.custom ? `<div class="dblock">
          <div class="dblock__head"><p class="dblock__label">Срок действия препарата</p>
            <button class="checkbox-row" type="button" data-act="per-own">
              <span class="checkbox" aria-checked="${per.own}"><img src="icons/check-16.svg" alt=""></span>
              <span>Вручную</span></button>
          </div>
          ${per.own ? `<div class="dnum-row">
            <label class="dnum"><span class="dnum__l">Повторить через</span>
              <input id="pper" type="number" inputmode="numeric" min="1" max="999" placeholder="—" value="${esc(per.val)}"></label>
            <span class="seg" role="radiogroup">
              <button type="button" data-act="per-unit" data-value="дн" aria-checked="${per.unit !== 'мес'}">дней</button>
              <button type="button" data-act="per-unit" data-value="мес" aria-checked="${per.unit === 'мес'}">мес</button>
            </span>
          </div>` : `<div class="chips">${PERIODS.map(([t, v]) => `<button class="chip" type="button" data-act="period"
            data-value="${v}" aria-pressed="${d.period === v}">${t}</button>`).join('')}</div>`}
          </div>` : ''}
        <div class="dblock"><p class="dblock__label">Когда обработали</p>
          <div class="dinput" data-invalid="${typing && dtext.length === 10}">
            <label class="dinput__text"><small>Дата обработки</small>
              <input id="ptext" type="text" inputmode="numeric" autocomplete="off" maxlength="10" placeholder="ДД.ММ.ГГГГ"
                value="${typing ? esc(dtext) : dmy(date)}"></label>
            <button class="dinput__cal" type="button" data-act="open-cal" aria-label="Выбрать дату в календаре"><img src="icons/calendar-24.svg" alt=""></button>
            <input id="pdate" class="dinput__native" type="date" tabindex="-1" aria-hidden="true" value="${date}" max="${todayISO()}">
          </div>
          <div class="chips chips--date">${quick.map(([t, n]) => `<button class="chip" type="button" data-act="quick-date"
            data-value="${ago(n)}" aria-pressed="${!typing && date === ago(n)}">${t}</button>`).join('')}</div>
        </div>
        <p class="psheet__line"${typing ? ' hidden' : ''}>${dateResult(d, date)}</p>` });
}

/* ─── 4 · 1а.1 · история (224:186): чекбокс «Только разные препараты» в основной версии убран, включается флагом unique (вариант в макете) ─── */

export function historySheet(p, key, unique) {
  const r = taskRow(p, taskOf(p.species, key));
  const log = logOf(p);
  let rows = r.log.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  if (unique) { const seen = new Set(); rows = rows.filter(t => !seen.has(t.drug) && seen.add(t.drug)); }
  let year = null, first = true;
  const body = rows.map(t => {
    const y = t.date.slice(0, 4);
    const head = y !== year ? `<p class="hyear${first ? '' : ' hyear--next'}">${y}</p>` : '';
    year = y; first = false;
    const d = drugOfRecord(p, t);
    return head + cardHTML(d, { date: `Обработали ${fmtDayNoYear(t.date)}`, del: log.indexOf(t), repeat: true, meta: d.custom ? OWN : '' });
  }).join('');
  return screenHTML({ title: 'История обработок', body: `
    <div class="plist">${body || '<p class="pempty">Записей пока нет</p>'}</div>` });
}

/* Тост после отметки (ОС клиента 28.10) */
export function markedToast() {
  return 'Обработку отметили';   /* универсальный текст: тип и препарат не пишем, бэк их не классифицирует (встреча 28.10) */
}

export { findDrug, drugsFor, typicalPeriod, taskOf, protRows, taskRow, logOf, todayISO, fmtDay };
