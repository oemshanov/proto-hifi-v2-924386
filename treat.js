/* Секции 2–4 карты юзкейсов: плитки задач, шторка задачи, «Чем обработали», дата,
   каталог, история, карточка питомца. Логика — pets.js (из лоу-фай), разметка —
   по кадрам Figma (номера кадров у каждого куска). */

import { protRows, taskOf, drugsFor, findDrug, typicalPeriod, PARASITE, IMG,
         taskRow, taskGroups, recentDrugs, alsoNote, recCovers, logOf, treatmentInfo,
         fmtDay, fmtDayNoYear, daysWord, plural, todayISO, ago, parasitesOf, parasitesList,
         parasitesName, up, perText, rubles } from './pets.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Подпись пустой плитки — кадр 22:9599 для собаки; у остальных видов — как в компоненте плитки */
const EMPTY_NOTE = { base: 'Уже давали таблетку или капли?', tick: 'Уже обрабатывали в этом сезоне?' };
const TILE_TITLE = { base: 'Гельминты\nи блохи' };

/* ─── плитка задачи · treatment-card 42:14043 ─── */

const badgeHTML = (due, text, clock) => due
  ? `<span class="badge badge--due${clock ? ' badge--clock' : ''}"><span>${esc(text)}</span>${clock
      ? '<span class="badge__clock"><img src="icons/clock-due-12.svg" alt=""></span>' : ''}</span>`
  : `<span class="badge">${esc(text)}</span>`;

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
  return x.info.days <= 0 ? badgeHTML(true, 'пора повторить', true)
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
    else if (x.info.days <= 0) { bar = '<i class="pbar pbar--due"><b style="width:100%"></b></i>'; lab = badgeHTML(true, 'пора', true); }
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
    else if (x.info.days <= 0) st = badgeHTML(true, one ? 'пора повторить' : 'повторить', true);
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
  if (x.info.days <= 0) return badgeHTML(true, long ? 'пора повторить' : 'повторить', true);
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
    : x0.info.days <= 0 ? badgeHTML(true, 'пора повторить', true)
    : badgeHTML(x0.info.days <= 7, `ещё ${daysWord(x0.info.days)}`);
  /* пара «Клещи: не обрабатывали» не рвётся — перенос только по «·» */
  const line = g => `${up(parasitesName(g.pars))}: ${g.s}`.replace(/ /g, '\u00a0');
  const h = r.empty ? 'Обработка от паразитов' : up(parasitesName(first.pars));
  const sub = r.empty ? 'Отметьте — напомним, когда повторить'
    /* статус один (всё под защитой, один паразит) — мелко препарат, иначе под плашкой пусто */
    : groups.length === 1 ? [...new Set(r.parts.filter(x => x.t).map(x => x.t.drug))].join(' + ') : groups.slice(1).map(line).join(' · ');
  const drugs = [...new Map(r.parts.filter(x => x.t).map(x => [x.t.drug, x.t])).values()]
    .map(t => findDrug(p.species, t.drug)).filter(d => d && IMG(d.img));
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

export const tileHTML = (p, r) => ({ a: tileA, b: tileB, c: tileC, d: tileD, e: tileE, f: tileF, g: tileG, h: tileH, i: tileI, k: tileK }[VARIANT] || tileK)(p, r);

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
  return `<span class="dcard__ph">${src ? `<img src="${src}" alt="" loading="lazy">`
    : '<img class="own" src="icons/edit-20.svg" alt="">'}</span>`;
};
const pillBuy = d => d.price ? `<span class="pill" role="button" data-act="cart" data-value="${esc(d.name)}">
    <span>В корзину</span><i></i><span>${rubles(d.price)}</span></span>` : '';
/* повтор тем же препаратом прямо из шторки — дальше обычный экран даты (22.09) */
const pillRepeat = d => `<span class="pill pill--rep" role="button" data-act="pick-drug" data-value="${esc(d.name)}">
    <span>Повторить</span></span>`;
const btnsHTML = (d, buy, repeat) => {
  const list = [buy ? pillBuy(d) : '', repeat ? pillRepeat(d) : ''].filter(Boolean);
  return list.length ? `<span class="dcard__btns${list.length > 1 ? ' dcard__btns--two' : ''}">${list.join('')}</span>` : '';
};

/* date — дата обработки сверху; del — ссылка на запись журнала; meta — серая строка */
export function cardHTML(d, { date, del, meta, buy = true, center, act, repeat } = {}) {
  const top = date || del ? `<span class="dcard__top">
      ${date ? `<span class="dcard__date">${esc(date)}</span>` : ''}
      ${del != null ? `<span class="dcard__del" role="button" data-act="del-rec" data-value="${del}" aria-label="Убрать отметку">
        <img src="icons/trash-20.svg" alt=""></span>` : ''}</span>` : '';
  const tag = act ? 'button' : 'div';
  return `<${tag} class="dcard${center ? ' dcard--center' : ''}"${act ? ` type="button" data-act="${act.name}" data-value="${esc(act.value)}"` : ''}>
    <span class="dcard__row">${photoHTML(d)}
      <span class="dcard__body">${top}
        <span class="dcard__name">${esc(d.name)}</span>
        ${meta ? `<span class="dcard__meta">${esc(meta)}</span>` : ''}
      </span></span>
    ${btnsHTML(d, buy, repeat)}
  </${tag}>`;
}

const OWN = 'Вы добавили сами';

/* ─── шапка и низ шторки ─── */

const grab = '<div class="psheet__grab"><i></i></div>';
const titleHTML = (text, back, badge) => `
  <div class="psheet__title">
    ${back ? `<button class="back" type="button" data-act="${back}" aria-label="Назад"><img src="icons/arrow-back-24.svg" alt=""></button>` : ''}
    <h2>${esc(text)}</h2>${badge || ''}
  </div>`;
const homebar = '<div class="homebar" aria-hidden="true"><i></i></div>';
const bottomHTML = btns => `<div class="psheet__bottom"><div class="psheet__btns">${btns}</div>${homebar}</div>`;
const btnSoft = (act, text, icon = 'cart-20') =>
  `<button class="btn-icon btn-icon--soft" type="button" data-act="${act}"><img src="icons/${icon}.svg" alt="">${esc(text)}</button>`;
const btnDark = (act, text) =>
  `<button class="btn-icon btn-icon--dark" type="button" data-act="${act}"><img src="icons/check-20-white.svg" alt="">${esc(text)}</button>`;

/* Пустая часть кликабельна, если передан фильтр: ведёт в «Чем обработали» только с препаратами от этих паразитов */
const dashBox = (text, only) => `<${only ? `button type="button" data-act="mark" data-value="${only.join(',')}"` : 'div'} class="part__empty"><svg aria-hidden="true"><rect x=".5" y=".5" rx="20" ry="20"
  width="calc(100% - 1px)" height="calc(100% - 1px)" fill="none" stroke="#C7D6E1" stroke-dasharray="6 4"/></svg>${esc(text)}</${only ? 'button' : 'div'}>`;

/* ─── 1 · шторка задачи: первая (106:7701) и с препаратами (224:147) ─── */

const SHEET_TITLE = 'Обработка от паразитов';

export function taskSheet(p, key) {
  const r = taskRow(p, taskOf(p.species, key));
  /* обработок нет — показывать нечего, шторка по содержимому (кадр 2), остальные на всю высоту */
  if (r.empty) return { hug: true, html: `
    <div class="psheet__top">${grab}
      <div class="psheet__head">${titleHTML(SHEET_TITLE)}<p class="psheet__line">${sheetLine(r)}</p></div>
    </div>
    ${bottomHTML(btnSoft('catalog', 'Купить препарат') + btnDark('mark', 'Отметить обработку'))}` };

  const groups = taskGroups(p, r);
  const idx = g => logOf(p).indexOf(g.t);
  const card = g => cardHTML(g.d, { date: fmtDay(g.t.date), del: idx(g), repeat: true,
    meta: [g.d.custom ? OWN : '', alsoNote(p, key, g.t)].filter(Boolean).join(' · ') });
  const stateBadge = (info, t) => !info
    ? `<span class="badge badge--none">обработали ${fmtDayNoYear(t.date)}</span>`
    : info.days <= 0 ? badgeHTML(true, 'пора повторить') : badgeHTML(false, `защита до ${fmtDayNoYear(info.next)}`);

  /* Части показываем всегда, даже когда препарат один: у каждой свой подзаголовок и своя плашка.
     Тогда подстрочник со сроками не нужен — он только дублировал плашки (ОС клиента 24.09). */
  const parts = groups.map((g, i) => ({ at: i, html: `<div class="part">
    <div class="part__head"><b>${esc(up(parasitesName(g.pars)))}</b>${stateBadge(g.info, g.t)}</div>${card(g)}</div>` }));
  if (r.partial) parts.push({
    at: r.parasites.indexOf(r.missing[0].par) < r.parasites.indexOf(groups[0].pars[0]) ? -1 : groups.length,
    html: `<div class="part"><div class="part__head"><b>${esc(up(parasitesName(r.missing.map(x => x.par))))}</b>${
      '<span class="badge badge--none">не отмечали</span>'}</div>${dashBox('Отметьте, чем обработали, или подберите препарат', r.missing.map(x => x.par))}</div>` });
  const body = parts.sort((a, b) => a.at - b.at).map(x => x.html).join('');

  return { html: `
    <div class="psheet__top">${grab}
      <div class="psheet__content psheet__content--task">
        <div class="psheet__head">${titleHTML(SHEET_TITLE)}</div>
        <div class="parts">${body}
          <button class="histlink" type="button" data-act="history">История обработок · ${r.log.length}
            <img src="icons/arrow-right-16-grey.svg" alt=""></button>
        </div>
      </div>
    </div>
    ${bottomHTML(btnSoft('catalog', 'Купить препарат') + btnDark('mark', 'Отметить обработку'))}` };
}

/* ─── поиск ─── */

const searchHTML = (placeholder, q) => `
  <div class="psearch">
    <label class="psearch__box"><img src="icons/search-24.svg" alt="">
      <input id="pq" type="text" placeholder="${esc(placeholder)}" value="${esc(q)}" autocomplete="off" autocorrect="off" spellcheck="false">
      ${q ? '<button class="psearch__clear" type="button" data-act="q-clear" aria-label="Очистить"><img src="icons/close-20.svg" alt=""></button>' : ''}
    </label>
    ${q ? '<button class="psearch__cancel" type="button" data-act="q-clear">Отмена</button>' : ''}
  </div>`;

/* Серая строка препарата: для чего он, форма, срок — «от гельминтов · таблетки · раз в 90 дней».
   Пишем, от чего препарат, а не чего он не закроет — так понятнее (22.09) */
const drugMeta = (p, key, d) => {
  const task = taskOf(p.species, key).parasites;
  const covers = d.covers.filter(c => task.includes(c));
  return [covers.length ? parasitesOf(covers) : '', d.form, perText(d.period)].filter(Boolean).join(' · ');
};
const found = (list, q) => q ? list.filter(d => d.name.toLowerCase().includes(q.toLowerCase())) : list;
const notFound = q => `<p class="pempty">Среди препаратов для этого питомца «${esc(q)}» не нашли</p>`;

/* ─── 4 · 2 · каталог задачи — только покупка (228:15064) ─── */

export function catalogSheet(p, key, q) {
  const list = found(drugsFor(p.species, key), q);
  return { html: `
    <div class="psheet__top">${grab}
      <div class="psheet__content">
        ${titleHTML(`Препараты ${taskOf(p.species, key).of}`, 'panel-back')}
        ${searchHTML('Название препарата', q)}
        <div class="plist">${list.length ? list.map(d => cardHTML(d, { meta: drugMeta(p, key, d) })).join('') : notFound(q)}</div>
      </div>
    </div>${homebar}` };
}

/* ─── 3 · 3 · «Чем обработали» (232:18204, 3а.1–3а.3) ─── */

/* only — паразиты из пустой части шторки задачи: тогда только препараты от них */
export function markSheet(p, key, q, only) {
  const hits = d => !only || d.covers.some(c => only.includes(c));
  const all = drugsFor(p.species, key).filter(hits);
  const recent = recentDrugs(p, key).filter(x => hits(x.drug));
  const pick = d => ({ name: 'pick-drug', value: d.name });
  let body;
  if (q) {
    const pool = [...recent.map(x => x.drug), ...all.filter(d => !recent.some(x => x.drug.name === d.name))];
    const list = found(pool, q);
    const per = typicalPeriod(p.species, key);
    body = `${list.length ? list.map(d => cardHTML(d, { buy: false, act: pick(d), meta: d.custom ? OWN : drugMeta(p, key, d) })).join('') : notFound(q)}
      <button class="addrow" type="button" data-act="pick-own">
        <span class="addrow__ic"><img src="icons/plus-20.svg" alt=""></span>
        <span class="addrow__text"><b>Записать как «${esc(q)}»</b><span>${per ? `Обработка — ${perText(per)}` : 'Срок повтора считать не будем'}</span></span>
      </button>`;
  } else {
    const rest = all.filter(d => !recent.some(x => x.drug.name === d.name));
    body = `${recent.length ? `<p class="plabel">Ранее обрабатывали</p>
        ${recent.map(x => cardHTML(x.drug, { buy: false, act: pick(x.drug), meta: `обрабатывали ${fmtDay(x.last)}` })).join('')}` : ''}
      <p class="plabel${recent.length ? ' plabel--gap' : ''}">Препараты ${esc(only ? parasitesOf(only) : taskOf(p.species, key).of)}</p>
      ${rest.map(d => cardHTML(d, { buy: false, act: pick(d), meta: drugMeta(p, key, d) })).join('')}`;
  }
  return { html: `
    <div class="psheet__top">${grab}
      <div class="psheet__content">
        ${titleHTML('Чем обработали', 'panel-back')}
        ${searchHTML('Найти препарат', q)}
        <div class="plist">${body}</div>
      </div>
    </div>${homebar}` };
}

/* ─── 3 · 4 · дата обработки (232:20020), своё название — «От чего» (235:2) ─── */

const dmy = iso => iso.split('-').reverse().join('.');
export function dateResult(d, date) {
  const info = treatmentInfo({ date, periodDays: d.period });
  if (!info) return 'Срок повтора считать не будем';
  if (info.days < 0) return `Срок этой обработки уже вышел ${fmtDay(info.next)} — пора повторить`;
  if (info.days === 0) return 'Срок этой обработки подходит сегодня — пора повторить';
  return `Защита ${parasitesOf(d.covers)} будет действовать до ${fmtDay(info.next)}`;
}

/* Срок действия своего препарата — выбирает пользователь: у введённого вручную его взять неоткуда (ОС клиента 24.09) */
const PERIODS = [['30 дней', 30], ['90 дней', 90], ['180 дней', 180]];

export function dateSheet(p, key, d, date, per = { unit: 'дн', val: '', own: false }) {
  const pars = taskOf(p.species, key).parasites;
  const opts = [pars, ...pars.map(k => [k])];
  const same = o => o.length === d.covers.length && o.every(k => d.covers.includes(k));
  const quick = [['Сегодня', 0], ['Вчера', 1], ['Неделю назад', 7]];
  return { html: `
    <div class="psheet__top">${grab}
      <div class="psheet__content">
        ${titleHTML('Обработка', 'panel-back')}
        ${cardHTML(d, { buy: false, center: true, meta: d.custom ? OWN : '' })}
        ${d.custom && pars.length > 1 ? `<div class="dblock"><p class="dblock__label">От чего</p>
          <div class="chips">${opts.map(o => `<button class="chip" type="button" data-act="cover" data-value="${o.join(',')}"
            aria-pressed="${same(o)}">${esc(up(parasitesName(o)))}</button>`).join('')}</div></div>` : ''}
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
          <label class="dinput"><span class="dinput__text"><small>Дата обработки</small><b>${dmy(date)}</b></span>
            <img src="icons/calendar-24.svg" alt=""><input id="pdate" type="date" value="${date}" max="${todayISO()}"></label>
          <div class="chips chips--date">${quick.map(([t, n]) => `<button class="chip" type="button" data-act="quick-date"
            data-value="${ago(n)}" aria-pressed="${date === ago(n)}">${t}</button>`).join('')}</div>
        </div>
        <p class="psheet__line">${dateResult(d, date)}</p>
      </div>
    </div>
    ${bottomHTML(btnDark('save-mark', `Отметить ${fmtDay(date)}`))}` };
}

/* ─── 4 · 1а.1 · история (224:331), 1б — «Только разные препараты» ─── */

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
    const d = findDrug(p.species, t.drug) || { name: t.drug, custom: true };
    const meta = [parasitesOf(recCovers(p, t)), d.custom ? OWN.toLowerCase() : ''].filter(Boolean).join(' · ');
    return head + cardHTML(d, { date: fmtDayNoYear(t.date), del: log.indexOf(t), repeat: true, meta });
  }).join('');
  return { html: `
    <div class="psheet__top">${grab}
      <div class="psheet__content psheet__content--24">
        <div class="psheet__head">${titleHTML('История обработок', 'panel-back')}
          <p class="psheet__line">${esc(`${r.name} · ${p.name}`)}</p></div>
        <button class="hcheck checkbox-row" type="button" data-act="unique">
          <span class="checkbox" aria-checked="${!!unique}"><img src="icons/check-16.svg" alt=""></span>
          <span>Только разные препараты</span></button>
        <div class="plist">${body || '<p class="pempty">Записей пока нет</p>'}</div>
      </div>
    </div>${homebar}` };
}

/* Тост после отметки — «Отметили! Гельминты — до 15 декабря, осталось обработать от блох» (106:7935) */
export function markedToast(p, rec) {
  const covers = recCovers(p, rec);
  const touched = protRows(p.species).filter(t => t.parasites.some(c => covers.includes(c)));
  const pars = touched.flatMap(t => t.parasites.filter(c => covers.includes(c)));
  const info = treatmentInfo(rec);
  if (!info) return `Отметили обработку ${fmtDay(rec.date)}`;
  const left = touched.flatMap(t => taskRow(p, t).missing.map(x => x.par));
  const head = info.days <= 0 ? `${up(parasitesName(pars))} — срок уже вышел, пора повторить`
    : `${up(parasitesName(pars))} — до ${fmtDay(info.next)}`;
  return `Отметили! ${head}${left.length ? `, осталось обработать ${parasitesOf(left)}` : ''}`;
}

export { findDrug, drugsFor, typicalPeriod, taskOf, protRows, taskRow, logOf, todayISO, fmtDay };
