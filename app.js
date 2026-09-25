import { TAB_ICONS } from './tab-icons.js';
import { DRUGS, ago } from './pets.js';
import { SERVICE_TILES, SERVICE_ROWS, GOOD_DEEDS, TABS, SPECIES, BREEDS, NO_BREED, PHOTO_ACTIONS,
         TASKS, SHELF } from './data.js';
import { tileHTML as taskTileHTML, taskSheet, catalogSheet, markSheet, dateSheet, historySheet, markedToast,
         findDrug, typicalPeriod, taskOf, protRows, taskRow, logOf, todayISO, fmtDay } from './treat.js';

/* ═══ состояние ═══════════════════════════════════════════════════════════ */

const KEY = '4lapy-hifi-v1';
const BLANK = { photo: '', name: '', species: '', breed: '', birth: '', age: '', ageUnit: 'лет', unknownDate: false };

const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const state = { screen: 'empty', pets: [], draft: { ...BLANK }, ...load() };
state.draft = { ...BLANK, ...state.draft };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
/* Питомцев может быть несколько — на главном они листаются каруселью; всё, что
   открывается с главного (карточка, шторки, отметки), относится к текущему */
state.cur = Math.min(state.cur || 0, Math.max(0, (state.pets || []).length - 1));
const pet = () => state.pets[state.cur];

/* Сценарий открывается с нуля по ?state=empty — так короткая ссылка всегда
   показывает первый шаг, а не то, до чего дошёл предыдущий смотрящий. */
/* Телефон: масштаб под ширину экрана, как Figma Mirror растягивает кадр 375.
   Высоту ставим сами: 100dvh внутри zoom Safari и Chrome считают по-разному. */
function fitScale() {
  const app = document.querySelector('.app');
  const phone = !matchMedia('(min-width: 520px) and (min-height: 600px)').matches;
  const z = phone ? innerWidth / 375 : 1;
  document.documentElement.style.setProperty('--z', String(z));
  app.style.height = phone ? (innerHeight / z) + 'px' : '';
  document.body.style.height = phone ? innerHeight + 'px' : '';
}
fitScale(); addEventListener('resize', fitScale);

if (new URLSearchParams(location.search).get('frame') === '1') {
  document.querySelector('.app').classList.add('app--frame');   /* режим сверки с кадром */
  const c = document.querySelector('#clock'); if (c) c.textContent = '12:48';
}
if (new URLSearchParams(location.search).get('state') === 'empty') {
  state.screen = 'empty'; state.pets = []; state.cur = 0; state.draft = { ...BLANK }; save();
}
/* ?state=demo — Чарли с журналом из кадров секции 4: пять обработок за два года */
const MIL = 'KRKA Милпразон Антигельминтные таблетки для собак и щенков весом до 5 кг, 2 таблетки';
const ADV = 'Elanco Адвантикс капли на холку для собак весом от 4 до 10 кг от блох, клещей и комаров, 1 пипетка, 1 мл';
const MBX = 'Elanco Мильбемакс Таблетки от гельминтов для щенков и собак мелких пород весом 0,5-10 кг, 2 таблетки';
if (new URLSearchParams(location.search).get('state') === 'demo') {
  state.screen = 'added'; state.draft = { ...BLANK }; state.cur = 0;
  state.pets = [{ ...BLANK, photo: 'img/pet-charlie.png', name: 'Чарли', species: 'Собака',
    breed: 'Бивер-йоркширский терьер', birth: '2023-05-07',
    prot: [{ drug: MBX, date: '2025-04-14', periodDays: 90 }, { drug: ADV, date: '2025-08-20', periodDays: 30 },
           { drug: MIL, date: '2026-03-05', periodDays: 90 }, { drug: MIL, date: '2026-06-11', periodDays: 90 },
           { drug: ADV, date: '2026-09-13', periodDays: 30 }] }];
  save();
}

/* «Профиль» в таббаре — набор готовых питомцев для показа: после того как
   первого питомца завели сами, здесь сразу видны история и разные состояния плиток.
   Чарли — пора повторить от гельминтов, блохи и клещи под защитой, история из 5 записей;
   Мурка — без фото, закрыта только половина задачи, клещи не отмечены;
   Кеша — защита скоро кончится; Буль — средство без срока повтора. */
const drugOf = (sp, start) => DRUGS[sp].find(d => d.name.startsWith(start)).name;
/* Живой набор для показа: у каждого питомца своя ситуация с обработкой — все
   конфигурации плитки из qa/configs.mjs, но как у настоящих людей */
const mockPets = () => {
  const r = (sp, start, days, period) => ({ drug: drugOf(sp, start), date: ago(days), periodDays: period });
  return [
    /* гельминты — пора повторить, блохи и клещи под защитой; история из пяти записей */
    { ...BLANK, photo: 'img/pet-charlie.png', name: 'Чарли', species: 'Собака', breed: 'Бивер-йоркширский терьер', birth: '2023-05-07',
      prot: [{ drug: MBX, date: '2025-04-14', periodDays: 90 }, { drug: ADV, date: '2025-08-20', periodDays: 30 },
             { drug: MIL, date: '2026-03-05', periodDays: 90 }, { drug: MIL, date: ago(100), periodDays: 90 },
             r('Собака', 'Elanco Адвантикс', 8, 30)] },
    /* закрыты только гельминты, блохи и клещи не отмечены */
    { ...BLANK, name: 'Мурка', species: 'Кошка', breed: 'Британская короткошёрстная', birth: '2021-11-02',
      prot: [r('Кошка', 'KRKA Милпразон', 20, 90)] },
    /* Инспектор закрыл всё — всё под защитой */
    { ...BLANK, name: 'Лаки', species: 'Собака', breed: 'Джек-рассел-терьер', birth: '2022-03-15',
      prot: [r('Собака', 'Inspector', 5, 30)] },
    /* три разных статуса: блохи скоро, гельминты под защитой, клещи не отмечены */
    { ...BLANK, name: 'Бусинка', species: 'Кошка', breed: 'Мейн-кун', birth: '2020-06-01',
      prot: [r('Кошка', 'KRKA Милпразон', 20, 90), r('Кошка', 'Elanco Адвантейдж', 25, 30)] },
    /* все три закрыты разными препаратами: в шторке три отдельные части */
    { ...BLANK, name: 'Ася', species: 'Кошка', breed: 'Абиссинская', birth: '2022-08-12',
      prot: [r('Кошка', 'KRKA Милпразон', 30, 90), r('Кошка', 'Rolf Club', 20, 30), r('Кошка', 'Elanco Адвантейдж', 3, 30)] },
    /* Инспектор давно — пора повторить всё */
    { ...BLANK, name: 'Рекс', species: 'Собака', breed: 'Бигль', birth: '2019-09-09',
      prot: [r('Собака', 'Inspector', 40, 30)] },
    /* гельминты и клещи пора, блохи ещё держатся */
    { ...BLANK, name: 'Симба', species: 'Кошка', breed: 'Бенгальская', birth: '2024-02-20',
      prot: [r('Кошка', 'Inspector', 40, 30), r('Кошка', 'Elanco Адвантейдж', 10, 30)] },
    /* защита кончается через 3 дня */
    { ...BLANK, name: 'Кеша', species: 'Птица', breed: 'Волнистый попугай', unknownDate: true, age: '2', ageUnit: 'лет',
      prot: [r('Птица', 'Чистотел Спрей', 27, 30)] },
    /* средство без срока повтора */
    { ...BLANK, name: 'Буль', species: 'Рыбка', breed: 'Гуппи', birth: '2025-07-10',
      prot: [r('Рыбка', 'АВЗ Антипар', 24, null)] },
    /* только завели — ещё ничего не отмечали */
    { ...BLANK, name: 'Пушок', species: 'Грызун', breed: 'Морская свинка', birth: '2026-05-01', prot: [] },
  ];
};

/* ?state=configs — доска конфигураций плитки (qa/configs.mjs) питомцами в карусели:
   листаешь и смотришь каждое сочетание статусов вживую */
const configPets = () => {
  const rec = (sp, start, days, period) => ({ drug: drugOf(sp, start), date: ago(days), periodDays: period });
  const P = (name, species, breed, prot) => ({ ...BLANK, name, species, breed, birth: '2023-01-01', prot });
  return [
    P('Всё пора повторить', 'Собака', 'Без породы', [rec('Собака', 'Inspector', 40, 30)]),
    P('Одно пора, остальное ок', 'Собака', 'Без породы', [rec('Собака', 'KRKA Милпразон', 100, 90), rec('Собака', 'Elanco Адвантикс', 8, 30)]),
    P('Под защитой + не отмечено', 'Собака', 'Без породы', [rec('Собака', 'KRKA Милпразон', 20, 90)]),
    P('Два пора, один ок', 'Кошка', 'Без породы', [rec('Кошка', 'Inspector', 40, 30), rec('Кошка', 'Elanco Адвантейдж', 10, 30)]),
    P('Три разных статуса', 'Кошка', 'Без породы', [rec('Кошка', 'KRKA Милпразон', 20, 90), rec('Кошка', 'Elanco Адвантейдж', 25, 30)]),
    P('Всё под защитой', 'Собака', 'Без породы', [rec('Собака', 'Inspector', 5, 30)]),
    P('Пусто', 'Собака', 'Без породы', []),
    P('Птица, скоро кончится', 'Птица', 'Волнистый попугай', [rec('Птица', 'Чистотел Спрей', 27, 30)]),
    P('Рыбка, без срока', 'Рыбка', 'Гуппи', [rec('Рыбка', 'АВЗ Антипар', 24, null)]),
  ];
};
if (new URLSearchParams(location.search).get('state') === 'mocks') {
  state.screen = 'added'; state.draft = { ...BLANK }; state.cur = 0; state.pets = mockPets(); save();
}
if (new URLSearchParams(location.search).get('state') === 'configs') {
  state.screen = 'added'; state.draft = { ...BLANK }; state.cur = 0; state.pets = configPets(); save();
}

let sheet = null;          // 'species' | 'breed'
let alert_ = null;         // 'exit'
let breedQuery = '';
let crop = null;           // { zoom, x, y } — экран кадрирования фото
let pending = '';          // выбранный в шторке пункт до нажатия «Выбрать»

/* ═══ помощники ═══════════════════════════════════════════════════════════ */

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nl = s => esc(s).replace(/\n/g, '<br>');
const el = sel => document.querySelector(sel);
const REQUIRED = [['name', 'Кличка'], ['species', 'Вид'], ['breed', 'Порода']];
/* Кадр 9 «Порода выбрана» — кнопка ещё серая, кадр 10 «Всё заполнено» — чёрная:
   нужна ещё дата рождения или примерный возраст */
const missing = () => {
  const d = state.draft;
  const m = REQUIRED.filter(([k]) => !d[k]).map(([k]) => k);
  if (!(d.unknownDate ? parseInt(d.age, 10) > 0 : d.birth)) m.push('birth');
  return m;
};
const dirty = () => Object.keys(BLANK).some(k => state.draft[k] !== (state.screen === 'edit' ? (pet() || {})[k] ?? BLANK[k] : BLANK[k]));
/* Редактирование: «Сохранить изменения» активна, только когда что-то поменяли и всё обязательное на месте */
const changed = () => dirty() && !missing().length;

const plural = (n, a) => a[n % 10 === 1 && n % 100 !== 11 ? 0
  : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 1 : 2];

/* Возраст в месяцах — из даты рождения. Формат чипа взят с кадра: «3 года » + «4 мес» */
const monthsFrom = iso => {
  if (!iso) return null;
  const b = new Date(iso), n = new Date();
  if (isNaN(b)) return null;
  let m = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  if (n.getDate() < b.getDate()) m--;
  return m < 0 ? null : m;
};
const ageFrom = iso => {
  const m = monthsFrom(iso);
  if (m === null) return '';
  const y = Math.floor(m / 12), mm = m % 12;
  const ys = y ? `${y} ${plural(y, ['год', 'года', 'лет'])}` : '';
  const ms = mm ? `${mm} мес` : '';
  return [ys, ms].filter(Boolean).join(' ') || 'меньше месяца';
};
const fmtDate = iso => iso ? iso.split('-').reverse().join('.') : '';

/* ═══ общие куски ═════════════════════════════════════════════════════════ */

const tileHTML = (t, short) => `
  <button class="tile${short ? ' tile--short' : ''}" type="button" data-stub="1">
    <img src="${t.icon}" alt="" loading="lazy">
    <span class="tile__cap">
      <span class="tile__name">${nl(t.name)}</span>
      <span class="tile__note">${esc(t.note)}</span>
    </span>
  </button>`;

const rowHTML = r => `
  <button class="row" type="button" data-stub="1">
    <img src="${r.icon}" alt="" loading="lazy">
    <span class="row__text">
      <span class="row__name">${esc(r.name)}</span>
      <span class="row__note">${esc(r.note)}</span>
    </span>
  </button>`;

const sectionsHTML = () => `
  <div class="sections">
    <section class="section">
      <div class="section__head"><img src="icons/sec-views.svg" alt=""><h2>Услуги</h2></div>
      <div class="tiles">
        <div class="tiles__row">${tileHTML(SERVICE_TILES[0])}${tileHTML(SERVICE_TILES[1])}</div>
        <div class="tiles__row">${tileHTML(SERVICE_TILES[2])}${tileHTML(SERVICE_TILES[3])}</div>
      </div>
      <div class="rows">${SERVICE_ROWS.map(rowHTML).join('')}</div>
    </section>
    <section class="section">
      <div class="section__head"><img src="icons/sec-like.svg" alt=""><h2>Добрые дела</h2></div>
      <div class="tiles__row">${GOOD_DEEDS.map(g => tileHTML(g, true)).join('')}</div>
    </section>
  </div>`;

/* ═══ экран 1 · питомцев нет · кадр 75:6710 ══════════════════════════════ */

const screenEmpty = () => `
  <div class="empty">
    <div class="empty__inner">
      <div class="empty__art">
        <img src="img/empty-pets.png" width="292" height="250" fetchpriority="high"
             alt="Кот, собака, кролик и морская свинка">
      </div>
      <div class="empty__text">
        <p class="empty__title">Расскажите о питомце</p>
        <p class="empty__sub">Запомним всё о питомце, а ещё подскажем,
          когда пора защитить его от паразитов</p>
      </div>
      <button class="btn-primary" type="button" data-act="open-form">Добавить питомца</button>
    </div>
  </div>
  ${sectionsHTML()}`;

/* ═══ экран 2 · форма · кадры 79:9305, 91:6482, 97:6980, 79:9196 ═════════ */

const fieldHTML = ({ key, label, req, value, icon, act, disabled }) => {
  const filled = !!value;
  const cls = ['field', filled && 'field--filled', disabled && 'field--disabled'].filter(Boolean).join(' ');
  return `
    <button class="${cls}" type="button" ${disabled ? 'disabled' : ''}
            ${act ? `data-act="${act}"` : ''} data-field="${key}">
      <span class="field__body">
        <span class="field__label">${esc(label)}${req ? '<i>*</i>' : ''}</span>
        ${filled ? `<span class="field__value">${esc(value)}</span>` : ''}
      </span>
      ${icon ? `<img src="icons/${icon}.svg" alt="">` : ''}
    </button>`;
};

const screenForm = () => {
  const d = state.draft;
  const edit = state.screen === 'edit';
  return `
    <div class="form">
      <button class="avatar" type="button" data-act="open-photo" aria-label="Добавить фото">
        <img class="avatar__blob" src="icons/avatar-blob.svg" alt="">
        ${d.photo
          ? `<img class="avatar__photo" src="${esc(d.photo)}" alt="Фото питомца">`
          : '<span class="avatar__label">Добавить<br>фото</span>'}
        ${edit && d.photo ? '<span class="avatar__edit"><img src="icons/edit-20.svg" alt=""></span>' : ''}
      </button>

      <div class="form__card">
        <div class="form__fields">
          ${fieldHTML({ key: 'name', label: 'Кличка', req: true, value: d.name, act: 'edit-name' })}
          ${fieldHTML({ key: 'species', label: 'Вид', req: true, value: d.species,
                        icon: 'arrow-down', act: 'open-species' })}
          ${fieldHTML({ key: 'breed', label: 'Порода', req: true, value: d.breed,
                        icon: 'arrow-down', act: 'open-breed' })}
          ${edit ? (d.unknownDate
              ? fieldHTML({ key: 'age', label: 'Примерный возраст', value: d.age, act: 'edit-age' })
              : fieldHTML({ key: 'birth', label: 'Дата рождения', value: fmtDate(d.birth), icon: 'calendar', act: 'edit-birth' })) : `
          <div class="unknown-block">
            <div class="unknown-row">
              <button class="checkbox-row" type="button" data-act="toggle-unknown">
                <span class="checkbox" aria-checked="${d.unknownDate}">
                  <img src="icons/check-16.svg" alt=""></span>
                <span>Незнаю точную дату</span>
              </button>
              ${d.unknownDate ? `<span class="seg" role="radiogroup">
                <button type="button" data-act="unit" data-value="лет" aria-checked="${d.ageUnit !== 'мес'}">лет</button>
                <button type="button" data-act="unit" data-value="мес" aria-checked="${d.ageUnit === 'мес'}">мес</button>
              </span>` : ''}
            </div>
            ${d.unknownDate
              ? fieldHTML({ key: 'age', label: 'Примерный возраст', value: d.age, act: 'edit-age' })
              : fieldHTML({ key: 'birth', label: 'Дата рождения', value: fmtDate(d.birth), icon: 'calendar', act: 'edit-birth' })}
          </div>`}
        </div>
      </div>
    </div>

    <div class="footer${edit ? ' footer--notab' : ''}">
      ${edit
        ? `<button class="btn-primary" type="button" data-act="save-edit" aria-disabled="${!changed()}">Сохранить изменения</button>`
        : `<button class="btn-primary" type="button" data-act="submit"
              aria-disabled="${missing().length > 0}">Добавить питомца</button>`}
    </div>`;
};

/* ═══ экран 3 · питомец добавлен · кадр 22:9599 ══════════════════════════ */

const ageTagHTML = p => {
  if (p.unknownDate) {
    const n = parseInt(p.age, 10);
    if (!n) return '';
    const s = p.ageUnit === 'мес' ? `${n} мес` : `${n} ${plural(n, ['год', 'года', 'лет'])}`;
    return `<span class="age-tag"><b>${esc(s)}</b></span>`;
  }
  const m = monthsFrom(p.birth);
  if (m === null) return '';
  const y = Math.floor(m / 12), mm = m % 12;
  if (!y && !mm) return '<span class="age-tag"><b>меньше месяца</b></span>';
  return `<span class="age-tag">${
    y ? `<b>${y} ${plural(y, ['год', 'года', 'лет'])}</b>` : ''}${
    mm ? `<span>${mm} мес</span>` : ''}</span>`;
};

const taskHTML = t => `
  <button class="task" type="button">
    <svg class="task__dash" aria-hidden="true"><rect x="0.5" y="0.5" rx="20" ry="20" width="100%" height="100%"
      fill="none" stroke="#C7D6E1" stroke-dasharray="4 4"/></svg>
    <span class="task__title">${nl(t.title)}</span>
    <span class="task__foot">
      <span class="task__note">${esc(t.note)}</span>
      <span class="task__btn"><img src="icons/plus-20.svg" alt="">Отметить</span>
    </span>
  </button>`;

const prodHTML = p => `
  <button class="prod" type="button" data-stub="1">
    <span class="prod__top">
      <span class="prod__photo">
        <img class="prod__img" src="${p.img}" alt="" loading="lazy">
        <img class="prod__fav" src="icons/favorite-off.svg" alt="">
        ${p.sale ? `<span class="prod__sale">${esc(p.sale)}<img src="icons/percent.svg" alt="%"></span>` : ''}
      </span>
      ${p.isNew ? '<span class="prod__new">Новинка</span>' : ''}
      <span class="prod__name">${esc(p.name)}</span>
    </span>
    <span class="prod__btn">
      <span class="prod__price">${esc(p.price)}</span>
      ${p.old ? `<span class="prod__old">${esc(p.old)}</span>` : ''}
    </span>
  </button>`;

/* Аватар на главном и в карточке: фото в «цветке», а без фото — силуэт вида
   (pet-avatar в UI kit, 267:26552). Фото добавляют только в редактировании данных */
const SPECIES_AVA = { 'Собака': 'dog', 'Кошка': 'cat', 'Птица': 'bird', 'Грызун': 'rabbit', 'Рыбка': 'fish', 'Прочее': 'other' };
const petAvaHTML = (p, cls, act) =>
  `<img class="${cls}" src="${esc(p.photo || `img/ava-${SPECIES_AVA[p.species] || 'other'}.svg`)}" alt="" ${act ? `data-act="${act}"` : ''}>`;

/* Слайд карусели — питомец вместе с его обработками: свайп меняет и то, и другое */
const petSlideHTML = p => `
    <div class="pet-block">
      ${petAvaHTML(p, 'pet-avatar', 'open-pet')}
      <div class="pet-card">
        ${ageTagHTML(p)}
        <div class="pet-name-block">
          <span class="pet-name" data-act="open-pet"><span>${esc(p.name)}</span>
            <img src="icons/arrow-right-16.svg" alt=""></span>
          <span class="pet-breed">${esc(p.breed)}</span>
        </div>
        <div class="tasks-head">
          <span class="treat-icon">
            <img class="l" src="icons/treat-l.svg" alt="">
            <img class="r" src="icons/treat-r.svg" alt="">
            <img class="t" src="icons/treat-top.svg" alt="">
          </span>
          <h2>Обработка от паразитов</h2>
        </div>
        <div class="tasks">${protRows(p.species).map(r => taskTileHTML(p, taskRow(p, r))).join('')}</div>
      </div>
    </div>`;

const screenAdded = () => {
  const p = pet() || {};
  const many = state.pets.length > 1;
  return `
    <div class="pet-deck${many ? ' pet-deck--many' : ''}" id="deck">${state.pets.map(petSlideHTML).join('')}</div>
    <div class="dots${many ? ' dots--on' : ''}"><div id="dots">${state.pets.map((x, i) =>
      `<i${i === state.cur ? ' class="on"' : ''}></i>`).join('')}</div></div>
    ${sectionsHTML()}
    <section class="shelf">
      <div class="shelf__head"><img src="icons/sec-views.svg" alt="">
        <h2 id="shelf-name">Подобрали для ${esc(p.name)}</h2></div>
      <div class="shelf__list">${SHELF.map(prodHTML).join('')}</div>
    </section>`;
};

/* Текущий питомец — по положению прокрутки карусели */
let deckDrag = null;
addEventListener('mousemove', e => deckDrag?.move(e.clientX));
addEventListener('mouseup', e => { deckDrag?.end(e.clientX); deckDrag = null; });
function bindDeck() {
  const deck = el('#deck');
  if (!deck) return;
  const step = () => deck.clientWidth || 1;
  deck.scrollLeft = state.cur * step();
  let raf;
  deck.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const i = Math.max(0, Math.min(state.pets.length - 1, Math.round(deck.scrollLeft / step())));
      [...el('#dots').children].forEach((d, n) => d.classList.toggle('on', n === i));
      if (i === state.cur) return;
      state.cur = i; save();
      el('#shelf-name').textContent = `Подобрали для ${pet().name}`;
    });
  }, { passive: true });
  el('#dots').addEventListener('click', e => {
    const i = [...el('#dots').children].indexOf(e.target);
    if (i >= 0) deck.scrollTo({ left: i * step(), behavior: 'smooth' });
  });
  /* мышь на компьютере: тянем слайд, отпускаем — доводим до ближайшего; клик после перетаскивания гасим */
  let moved = false;
  deck.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    e.preventDefault();   /* иначе мышь выделяет текст вместо перетаскивания */
    const x0 = e.clientX, s0 = deck.scrollLeft; moved = false;
    deckDrag = {
      move(x) {
        if (!moved && Math.abs(x - x0) < 8) return;
        moved = true; deck.style.scrollSnapType = 'none'; deck.scrollLeft = s0 - (x - x0);
      },
      end(x) {
        if (!moved) return;
        const dx = x - x0;
        const i = Math.max(0, Math.min(state.pets.length - 1, Math.round(s0 / step()) + (dx < -40 ? 1 : dx > 40 ? -1 : 0)));
        deck.style.scrollSnapType = '';
        deck.scrollTo({ left: i * step(), behavior: 'smooth' });
      } };
  });
  deck.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
}

/* ═══ секция 2 · шаг 2 · «Данные питомца» · кадр 201:11564 ═══════════════ */

const screenPet = () => {
  const p = pet() || {};
  const born = p.unknownDate ? (p.age ? `${p.age} ${p.ageUnit}` : '') : fmtDate(p.birth);
  const items = [['Кличка', p.name], ['Вид', p.species], ['Порода', p.breed],
    [p.unknownDate ? 'Примерный возраст' : 'Дата рождения', born]].filter(x => x[1]);
  return `
    <div class="petview">
      <div class="petview__ava">${petAvaHTML(p, 'ph')}</div>
      <div class="pdata">
        <div class="pdata__head"><b>Данные питомца</b>
          <button type="button" data-act="edit-pet">Редактировать</button></div>
        <div class="plist-items">${items.map(([k, v]) => `
          <div class="pitem"><span class="pitem__t"><small>${esc(k)}</small><b>${esc(v)}</b></span></div>`).join('')}</div>
      </div>
    </div>`;
};

const SCREENS = { empty: screenEmpty, form: screenForm, added: screenAdded, pet: screenPet, edit: () => screenForm() };

/* ═══ шторки ══════════════════════════════════════════════════════════════ */

/* Совпадение с запросом выделяется жирным — кадр 100:17994 */
const mark = (label, q) => {
  if (!q) return esc(label);
  const i = label.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(label);
  return esc(label.slice(0, i)) + '<b>' + esc(label.slice(i, i + q.length)) + '</b>' + esc(label.slice(i + q.length));
};
const optHTML = (label, checked, q) => `
  <button class="opt" type="button" role="radio" aria-checked="${checked}"
          data-act="pick" data-value="${esc(label)}">
    <span class="opt__radio"></span><span>${mark(label, q)}</span>
  </button>`;

const SHEETS = {
  /* кадр 91:6482: на 8 ниже шапки, без своей кнопки — применяется кнопкой формы (97:6980) */
  species: () => ({
    title: 'Вид', under: true, footer: 'Выбрать',
    body: `<div class="sheet__list" role="radiogroup">
      ${SPECIES.map(x => optHTML(x, pending === x)).join('')}
    </div>`,
  }),
  /* кадр 100:16658: верх у статус-бара, поиск, кнопка «Выбрать» в нижнем контейнере формы */
  breed: () => {
    const all = BREEDS[state.draft.species] || [NO_BREED];
    const q = breedQuery.trim();
    const list = q ? all.filter(b => b.toLowerCase().includes(q.toLowerCase())) : all;
    return {
      title: 'Порода', under: true, top: true, footer: 'Выбрать', search: true,
      body: `<div class="sheet__list" role="radiogroup">
        ${list.length
          ? list.map(b => optHTML(b, pending === b, q)).join('')
          : `<div class="sheet__empty">
               <p class="sheet__empty-title">Ничего не найдено</p>
               <p class="sheet__empty-text">Такой породы нет в справочнике.<br>Можно выбрать «Без породы».</p>
             </div>`}
      </div>`,
    };
  }
};

const searchHTML = () => `
  <div class="sheet__search">
    <img src="icons/search-20.svg" alt="">
    <input type="text" id="breed-q" placeholder="Начните вводить породу"
           value="${esc(breedQuery)}" autocomplete="off" autocorrect="off" spellcheck="false">
    ${breedQuery ? '<button type="button" class="sheet__clear" data-act="clear-q" aria-label="Очистить"><img src="icons/close-20.svg" alt=""></button>' : ''}
  </div>`;

function renderSheet() {
  const bg = el('#sheetbg'), box = el('#sheet');
  /* пока открыта шторка «Вид»/«Порода», кнопка формы — «Выбрать»: и при добавлении, и в редактировании */
  const submit = el('[data-act="submit"]'), saveBtn = el('[data-act="save-edit"]');
  if (!sheet) {
    bg.removeAttribute('data-open'); box.removeAttribute('data-open'); box.innerHTML = '';
    box.style.top = ''; box.className = 'sheet';
    if (submit) { submit.setAttribute('aria-disabled', String(missing().length > 0)); submit.textContent = 'Добавить питомца'; }
    if (saveBtn) { saveBtn.setAttribute('aria-disabled', String(!changed())); saveBtn.textContent = 'Сохранить изменения'; }
    return;
  }
  const { title, body, button, search, under, top, footer } = SHEETS[sheet]();
  box.className = 'sheet' + (under ? ' sheet--under' : '')
    + (top ? ' sheet--top' : '') + (search ? ' sheet--search' : '');
  box.style.top = under && !top ? el('#top').offsetHeight + 'px' : '';
  for (const b of [submit, saveBtn]) if (b && under) { b.setAttribute('aria-disabled', String(!pending)); b.textContent = footer; }
  const wasOpen = box.hasAttribute('data-open');
  const keep = box.querySelector('.sheet__list')?.scrollTop || 0;
  box.innerHTML = `
    <span class="sheet__grabber"></span>
    <h2 class="sheet__title">${title}</h2>
    ${search ? searchHTML() : ''}
    ${body}
    ${button ? `<div class="sheet__foot">
      <button class="btn-primary" type="button" data-act="apply" aria-disabled="${!pending}">${button}</button>
    </div>` : ''}`;
  box.dataset.n = String(box.querySelectorAll('.opt').length);
  if (wasOpen) { const l = box.querySelector('.sheet__list'); if (l) l.scrollTop = keep; }
  requestAnimationFrame(() => { bg.setAttribute('data-open', ''); box.setAttribute('data-open', ''); });
  if (!wasOpen) bindSheetDrag(box);
}

/* Шторку можно смахнуть вниз — так она и ведёт себя в приложении.
   Тянем только когда список прокручен в самый верх, иначе жест отбирает прокрутку. */
function bindSheetDrag(box) {
  let id = null, y0 = 0, dy = 0, list = null, dragging = false;
  const start = e => {
    list = box.querySelector('.sheet__list');
    if (list && list.scrollTop > 0 && list.contains(e.target)) return;
    if (e.target.closest('input')) return;
    id = e.pointerId; y0 = e.clientY; dy = 0; dragging = false;
  };
  const move = e => {
    if (id === null || e.pointerId !== id) return;
    /* Мёртвая зона 8 px: тап с лёгким дрожанием пальца не должен дёргать шторку и глотать нажатие */
    if (!dragging) { if (Math.abs(e.clientY - y0) < 8) return; dragging = true; box.style.transition = 'none'; }
    dy = e.clientY - y0;
    if (dy < 0) dy = 0;
    if (dy > 0 && e.cancelable) e.preventDefault();
    box.style.transform = `translateY(${dy}px)`;
    el('#sheetbg').style.opacity = String(Math.max(0, 1 - dy / 400));
  };
  const end = e => {
    if (id === null || e.pointerId !== id) return;
    id = null;
    if (!dragging) return;
    box.style.transition = '';
    box.style.transform = '';
    el('#sheetbg').style.opacity = '';
    if (dy > 90) { sheet = null; pending = ''; renderSheet(); }
  };
  box.addEventListener('pointerdown', start);
  box.addEventListener('pointermove', move);
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);
}

/* ═══ кадрирование фото · экран 2б.2 карты юзкейсов ══════════════════════
   Шапка формы остаётся, фото во всю ширину, область кадра — «цветок» аватара,
   снизу «Отмена» и «✓ Выбрать». Зум — щипком двумя пальцами (на десктопе колесом),
   сдвиг — одним пальцем.                                                  */

const SRC = 'img/gallery-photo.jpg';   // демо-фото для сверки с кадром (?frame=1)
let photoSrc = SRC;                     // что кадрируем сейчас: демо или снимок с телефона
const BLOB = 335;                 // сторона «цветка» на экране — кадр 2б.2

function renderCrop() {
  const host = el('#crop');
  if (!crop) { host.innerHTML = ''; host.hidden = true; return; }
  host.hidden = false;
  host.style.top = el('#top').offsetHeight + 'px';
  host.innerHTML = `
    <div class="crop">
      <div class="crop__dim"></div>
      <div class="crop__stage" id="crop-frame">
        <img id="crop-img" src="${photoSrc}" alt="" draggable="false">
        <!-- затемнение вокруг «цветка» — SVG-маской: CSS mask-composite iOS Safari считает иначе -->
        <svg class="crop__mask" width="100%" height="100%" aria-hidden="true">
          <defs><mask id="crop-m"><rect width="100%" height="100%" fill="#fff"/>
            <svg x="50%" y="50%" overflow="visible"><path fill="#000" fill-rule="evenodd"
              transform="translate(-167.5 -167.5) scale(2.91304)" d="M16.8413 16.8413C11.0778 22.6049 8.99633 30.6561 10.5969 38.0721C4.22126 42.1842 0 49.3491 0 57.5C-1.0014e-06 65.6506 4.22126 72.8157 10.5969 76.9281C8.99633 84.3439 11.0778 92.395 16.8413 98.1588C22.6049 103.922 30.6561 106.004 38.0721 104.403C42.1842 110.779 49.3491 115 57.5 115C65.6506 115 72.8157 110.779 76.9281 104.403C84.3439 106.004 92.395 103.922 98.1588 98.1588C103.922 92.395 106.004 84.3439 104.403 76.9281C110.779 72.8157 115 65.6506 115 57.5C115 49.3491 110.779 42.1842 104.403 38.0721C106.004 30.6561 103.922 22.6049 98.1588 16.8413C92.395 11.0778 84.3439 8.99633 76.9281 10.5969C72.8157 4.22126 65.6506 0 57.5 0C49.3491 0 42.1842 4.22125 38.0721 10.5968C30.6561 8.99633 22.6049 11.0778 16.8413 16.8413Z"/></svg></mask></defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,.55)" mask="url(#crop-m)"/>
          <!-- контур рамки: на тёмных снимках одного затемнения мало (просьба дизайнера 21.09) -->
          <svg x="50%" y="50%" overflow="visible"><path fill="none" stroke="#fff" stroke-opacity=".9" stroke-width=".7" transform="translate(-167.5 -167.5) scale(2.91304)" d="M16.8413 16.8413C11.0778 22.6049 8.99633 30.6561 10.5969 38.0721C4.22126 42.1842 0 49.3491 0 57.5C-1.0014e-06 65.6506 4.22126 72.8157 10.5969 76.9281C8.99633 84.3439 11.0778 92.395 16.8413 98.1588C22.6049 103.922 30.6561 106.004 38.0721 104.403C42.1842 110.779 49.3491 115 57.5 115C65.6506 115 72.8157 110.779 76.9281 104.403C84.3439 106.004 92.395 103.922 98.1588 98.1588C103.922 92.395 106.004 84.3439 104.403 76.9281C110.779 72.8157 115 65.6506 115 57.5C115 49.3491 110.779 42.1842 104.403 38.0721C106.004 30.6561 103.922 22.6049 98.1588 16.8413C92.395 11.0778 84.3439 8.99633 76.9281 10.5969C72.8157 4.22126 65.6506 0 57.5 0C49.3491 0 42.1842 4.22125 38.0721 10.5968C30.6561 8.99633 22.6049 11.0778 16.8413 16.8413Z"/></svg>
        </svg>
      </div>
      <div class="crop__foot">
        <button class="btn-secondary" type="button" data-act="crop-cancel">Отмена</button>
        <button class="btn-primary" type="button" data-act="crop-done">
          <img src="icons/check-16-white.svg" alt="">Выбрать</button>
        <i class="crop__home"></i>
      </div>
    </div>`;
  positionCrop();
  bindCropGestures();
}

function positionCrop() {
  const img = el('#crop-img');
  if (!img) return;
  img.style.transform = `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px)) scale(${crop.zoom})`;
}

/* Фото не может уйти так, чтобы в «цветке» показалась пустота */
function clampCrop() {
  const img = el('#crop-img'), stage = el('#crop-frame');
  if (!img || !stage || !img.naturalWidth) return;
  const base = Math.max(stage.clientHeight / img.naturalHeight, stage.clientWidth / img.naturalWidth); // заполняет сцену
  const w = img.naturalWidth * base * crop.zoom, h = img.naturalHeight * base * crop.zoom;
  const mx = Math.max(0, (w - BLOB) / 2), my = Math.max(0, (h - BLOB) / 2);
  crop.zoom = Math.min(4, Math.max(1, crop.zoom));
  crop.x = Math.min(mx, Math.max(-mx, crop.x));
  crop.y = Math.min(my, Math.max(-my, crop.y));
}

function bindCropGestures() {
  const stage = el('#crop-frame');
  if (!stage) return;
  const pts = new Map();                 // активные пальцы
  let start = null;                      // снимок в начале жеста
  const snap = () => {
    const p = [...pts.values()];
    const c = { x: p.reduce((a, q) => a + q.x, 0) / p.length, y: p.reduce((a, q) => a + q.y, 0) / p.length };
    const d = p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
    start = { c, d, x: crop.x, y: crop.y, zoom: crop.zoom };
  };
  stage.addEventListener('pointerdown', e => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); snap();
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pts.values()];
    const c = { x: p.reduce((a, q) => a + q.x, 0) / p.length, y: p.reduce((a, q) => a + q.y, 0) / p.length };
    if (p.length > 1 && start.d) {
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      crop.zoom = start.zoom * d / start.d;                      // щипок
    }
    crop.x = start.x + (c.x - start.c.x); crop.y = start.y + (c.y - start.c.y);
    clampCrop(); positionCrop();
  });
  const up = e => { if (pts.delete(e.pointerId) && pts.size) snap(); };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', e => {                           // десктоп: колесо
    e.preventDefault();
    crop.zoom *= e.deltaY < 0 ? 1.08 : 1 / 1.08;
    clampCrop(); positionCrop();
  }, { passive: false });
}

/* Вырезаем квадрат под «цветком»: аватар 115 на экране, берём 2x */
function cropToDataURL() {
  const img = el('#crop-img'), stage = el('#crop-frame');
  if (!img || !stage || !img.naturalWidth) return photoSrc;
  const out = 230, k = out / BLOB;
  const base = Math.max(stage.clientHeight / img.naturalHeight, stage.clientWidth / img.naturalWidth);
  const w = img.naturalWidth * base * crop.zoom * k, h = img.naturalHeight * base * crop.zoom * k;
  const c = document.createElement('canvas'); c.width = out; c.height = out;
  c.getContext('2d').drawImage(img, out / 2 - w / 2 + crop.x * k, out / 2 - h / 2 + crop.y * k, w, h);
  try { return c.toDataURL('image/jpeg', .92); } catch { return photoSrc; }
}

/* Настоящий выбор фото: системная галерея или камера телефона через <input type=file>.
   На телефоне «Снять новое фото» открывает камеру (capture), «Выбрать из галереи» — галерею;
   на десктопе оба — диалог выбора файла. */
function openPicker(camera) {
  let input = el('#photo-input');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file'; input.id = 'photo-input'; input.accept = 'image/*'; input.hidden = true;
    document.body.appendChild(input);
    input.addEventListener('change', () => { const f = input.files[0]; input.value = ''; if (f) loadPhoto(f); });
  }
  if (camera) input.setAttribute('capture', 'environment'); else input.removeAttribute('capture');
  input.click();
}

/* Снимок с телефона бывает 4000 px — уменьшаем до 1600 по большей стороне, иначе жесты тормозят */
function loadPhoto(file) {
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    URL.revokeObjectURL(url);
    const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    photoSrc = c.toDataURL('image/jpeg', .9);
    crop = { zoom: 1, x: 0, y: 0 }; render();
  };
  im.onerror = () => URL.revokeObjectURL(url);
  im.src = url;
}

/* ═══ алерт ═══════════════════════════════════════════════════════════════ */

function renderAlert() {
  const host = el('#alert');
  if (!alert_) { host.innerHTML = ''; host.hidden = true; return; }
  host.hidden = false;
  /* Шторка выхода — кадр 3а.1 (100:22684): иллюстрация 200, заголовок 19/24,
     текст 14/20, «Продолжить» чёрная и «Выйти» светлая по 56, снизу home indicator */
  host.innerHTML = `
    <div class="exit-bg" data-act="alert-close"></div>
    <div class="exit" role="dialog" aria-modal="true">
      <span class="sheet__grabber"></span>
      <img class="exit__art" src="img/exit-dog.png" alt="">
      <p class="exit__title">Выйти без сохранения?</p>
      <p class="exit__text">Введенные данные не сохранятся</p>
      <div class="exit__btns">
        <button class="btn-primary" type="button" data-act="alert-close">Продолжить</button>
        <button class="btn-primary btn-primary--light" type="button" data-act="exit-confirm">Выйти</button>
      </div>
      <div class="homebar"><i></i></div>
    </div>`;
}

/* ═══ большая шторка: задача, каталог, «Чем обработали», дата, история ════ */

let panel = null;          // { type, key, q, drug, date, perVal, perUnit }
/* свой срок: число + единица (как «примерный возраст» в форме питомца) */
const periodDays = (val, unit) => +val ? (unit === 'мес' ? +val * 30 : +val) : null;
let histUnique = false;    // «Только разные препараты» в истории

function panelView() {
  const p = pet();
  const { type, key } = panel;
  if (type === 'task') return taskSheet(p, key);
  if (type === 'catalog') return catalogSheet(p, key, panel.q || '');
  if (type === 'mark') return markSheet(p, key, panel.q || '', panel.only);
  if (type === 'date') return dateSheet(p, key, panel.drug, panel.date,
    { unit: panel.perUnit || 'дн', val: panel.perVal || '', own: !!panel.perOwn });
  if (type === 'history') return historySheet(p, key, histUnique);
}

let panelShown = '';
function renderPanel() {
  const host = el('#panel');
  if (!panel || !pet()) {
    host.removeAttribute('data-open'); panelShown = '';
    setTimeout(() => { if (!panel) { host.hidden = true; host.innerHTML = ''; } }, 280);
    return;
  }
  const same = panelShown === panel.type + panel.key;
  const keep = same ? (host.querySelector('.psheet__top')?.scrollTop || 0) : 0;
  const hadFocus = document.activeElement?.id;
  /* шторка обработки на всю высоту; по содержимому — только когда показывать нечего (ОС клиента 24.09) */
  const { html, hug } = panelView();
  host.hidden = false;
  host.innerHTML = `<div class="pbg" data-act="panel-close"></div>
    <div class="psheet ${hug ? 'psheet--hug' : 'psheet--full'}" role="dialog" aria-modal="true">${html}</div>`;
  const top = host.querySelector('.psheet__top'); if (top) top.scrollTop = keep;
  if (hadFocus === 'pq') { const q = el('#pq'); if (q) { q.focus({ preventScroll: true }); q.setSelectionRange(q.value.length, q.value.length); } }
  if (hadFocus === 'pper') { const n = el('#pper'); if (n) n.focus({ preventScroll: true }); }
  if (panelShown) host.setAttribute('data-open', '');
  else requestAnimationFrame(() => requestAnimationFrame(() => host.setAttribute('data-open', '')));
  panelShown = panel.type + panel.key;
  bindPanelDrag(host.querySelector('.psheet'));
}

/* Шторку смахивают вниз за любое место, как в приложениях, а не только за полоску:
   с экрана «Домой» верхняя зона у iOS занята системой. Тянем, только когда список
   прокручен в самый верх, иначе жест отбирает прокрутку; поля ввода не трогаем. */
function bindPanelDrag(box) {
  if (!box) return;
  const bg = el('#panel .pbg');
  const top = () => box.querySelector('.psheet__top');
  let active = false, y0 = 0, dy = 0, dragging = false, dragEnd = 0;
  const start = (y, target) => {
    if (target.closest('input')) return;
    const t = top();
    if (t && t.scrollTop > 0 && t.contains(target)) return;   /* список прокручен — это прокрутка */
    active = true; y0 = y; dy = 0; dragging = false;
  };
  /* true — жест наш, прокрутку глушим */
  const move = y => {
    if (!active) return false;
    if (!dragging) {
      if (y - y0 < 8) { if (y0 - y > 8) active = false; return false; }   /* вверх — это прокрутка */
      dragging = true; box.style.transition = 'none';
    }
    dy = Math.max(0, y - y0);
    box.style.transform = `translateY(${dy}px)`;
    if (bg) bg.style.opacity = String(Math.max(0, 1 - dy / 500));
    return true;
  };
  const end = () => {
    if (!active) return;
    active = false;
    if (!dragging) return;
    box.style.transition = ''; box.style.transform = ''; if (bg) bg.style.opacity = '';
    dragEnd = Date.now();
    if (dy > 90) { panel = null; renderPanel(); }
  };
  /* палец — touch-события: у pointer-событий iOS забирает вертикальный жест себе */
  /* после перетаскивания мышью придёт click — не даём ему нажать кнопку под курсором */
  box.addEventListener('click', ev => { if (Date.now() - dragEnd < 350) { ev.stopPropagation(); ev.preventDefault(); } }, true);
  box.addEventListener('touchstart', e => start(e.touches[0].clientY, e.target), { passive: true });
  box.addEventListener('touchmove', e => { if (move(e.touches[0].clientY) && e.cancelable) e.preventDefault(); }, { passive: false });
  box.addEventListener('touchend', end);
  box.addEventListener('touchcancel', end);
  /* мышь на десктопе */
  box.addEventListener('mousedown', e => { start(e.clientY, e.target); panelDrag = { move, end }; });
}
/* мышь ведут по всему окну; обработчик один на все шторки */
let panelDrag = null;
addEventListener('mousemove', e => panelDrag?.move(e.clientY));
addEventListener('mouseup', () => { panelDrag?.end(); panelDrag = null; });

/* ═══ нативные меню и алерт iOS · кадры 201:11595, 204:12446 ═══════════════ */

let ios = null;            // { kind: 'alert' | 'sheet', ... }

function photoMenu(has) {
  ios = { kind: 'sheet', items: [...PHOTO_ACTIONS.map(a => ({ t: a.label, act: 'pick-photo', v: a.id })),
    ...(has ? [{ t: 'Убрать фото', act: 'drop-photo' }] : [])] };
  renderIOS();
}

function renderIOS() {
  const host = el('#ios');
  if (!ios) { host.hidden = true; host.innerHTML = ''; return; }
  host.hidden = false;
  host.innerHTML = ios.kind === 'sheet'
    ? `<div class="ios-dim ios-dim--sheet" data-act="ios-close"></div>
       <div class="ios-sheet">
         <div class="ios-sheet__card">${ios.items.map(i => `<button type="button" data-act="${i.act}"${i.v ? ` data-value="${i.v}"` : ''}>${esc(i.t)}</button>`).join('')}</div>
         <button class="ios-sheet__cancel" type="button" data-act="ios-close">Отмена</button>
         <div class="homebar" aria-hidden="true"><i></i></div>
       </div>`
    : `<div class="ios-dim"></div>
       <div class="ios-alert" role="alertdialog" aria-modal="true">
         <div class="ios-alert__c"><b>${esc(ios.title)}</b><p>${esc(ios.text)}</p></div>
         ${ios.actions.map(a => `<button type="button" class="${a.bold ? 'bold' : ''}" data-act="${a.act}">${esc(a.t)}</button>`).join('')}
       </div>`;
}

/* ═══ уведомление сверху · кадр 106:7935 ═══════════════════════════════════ */

let toastTimer;
function toast(text) {
  const t = el('#toast');
  /* Статус-бар системный: не едет вместе с уведомлением, а стоит поверх него.
     Под ним у уведомления пустой отступ той же высоты */
  t.innerHTML = `<div class="toast__sb"></div>
    <div class="toast__msg"><img src="icons/notif-dog.svg" alt=""><p>${esc(text)}</p></div>`;
  const app = el('.app');
  app.classList.add('app--toast');
  t.setAttribute('data-open', '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.removeAttribute('data-open');
    toastTimer = setTimeout(() => app.classList.remove('app--toast'), 250);
  }, 3200);
}

/* ═══ отрисовка ═══════════════════════════════════════════════════════════ */

function renderChrome() {
  const form = state.screen === 'form' || state.screen === 'edit';
  const pet = state.screen === 'pet';
  el('#topbar').innerHTML = form
    ? `<div class="navbar">
         <button class="navbar__back" type="button" data-act="back" aria-label="Назад">
           <img src="icons/arrow-back.svg" alt=""></button>
         <h1>${state.screen === 'edit' ? 'Данные питомца' : 'Добавление питомца'}</h1>
       </div>`
    : pet
    ? `<div class="navbar navbar--pet">
         <button class="navbar__back" type="button" data-act="pet-back" aria-label="Назад">
           <img src="icons/arrow-back.svg" alt=""></button>
         <h1>Питомец</h1>
         <button class="navbar__more" type="button" data-act="pet-menu" aria-label="Ещё"><img src="icons/more-24.svg" alt=""></button>
       </div>`
    : `<h1>Питомец</h1>${state.screen === 'added'
        ? '<button class="topbar__btn" type="button" data-act="open-form" aria-label="Добавить питомца"><img src="icons/plus-20-header.svg" alt=""></button>' : ''}`;
  el('#topbar').className = 'topbar' + (form || pet ? ' topbar--form' : '');
  el('#top').className = 'top' + (form || pet ? ' top--form' : '');
  el('.app').classList.toggle('app--notab', state.screen === 'edit');

  el('#tabbar').className = 'tabbar' + (form || pet ? '' : ' tabbar--light') + (state.screen === 'edit' ? ' tabbar--bare' : '');
  el('#tabbar').innerHTML = `
    <div class="tabbar__tabs">
      ${TABS.map(t => `
        <button class="tab tab--${t.id}" type="button" data-act="tab" data-value="${t.id}"${t.active ? ' aria-current="page"' : ''}>
          <span class="tab__icon">${TAB_ICONS[t.icon.replace('icons/', '').replace('.svg', '') + (!form && t.id === 'favorite' ? '-light' : '')]}</span><span>${t.label}</span>
        </button>`).join('')}
    </div>
    <div class="homebar" aria-hidden="true"><i></i></div>`;
}

function render() {
  const screen = SCREENS[state.screen] || SCREENS.empty;
  const view = el('#view');
  const keepScroll = view.scrollTop;
  renderChrome();
  view.innerHTML = screen();
  /* Нижний контейнер с кнопкой выносим из прокручиваемой области: iOS Safari делает
     из скроллера отдельный слой, и абсолютный контейнер с z-index 12 внутри него
     оказывался под шторкой (z-index 11) — на телефоне пропадала кнопка «Выбрать» */
  const slot = el('#footer'); slot.innerHTML = '';
  const foot = view.querySelector('.footer'); if (foot) slot.appendChild(foot);
  view.scrollTop = state.screen === 'form' ? keepScroll : 0;
  bindDeck();
  renderSheet();
  renderCrop();
  renderAlert();
  renderPanel();
  renderIOS();
  save();
}
/* статус-бар белый поверх затемнения большой шторки и меню */
const dimObserver = new MutationObserver(() =>
  el('.app').classList.toggle('app--dim', !el('#panel').hidden || !el('#ios').hidden));
dimObserver.observe(el('#panel'), { attributes: true, attributeFilter: ['hidden'] });
dimObserver.observe(el('#ios'), { attributes: true, attributeFilter: ['hidden'] });

/* ═══ действия ════════════════════════════════════════════════════════════ */

const ACTIONS = {
  'open-form'() { state.screen = 'form'; render(); },
  /* «Профиль» в таббаре — служебная кнопка для показа: подставляет готовых питомцев
     (mockPets). С нуля сценарий открывается ссылкой ?state=empty. Остальные вкладки без дизайна */
  tab(btn) {
    if (btn.dataset.value !== 'profile') return;
    sheet = null; pending = ''; breedQuery = ''; crop = null; alert_ = null; photoSrc = SRC; panel = null; ios = null;
    state.screen = 'added'; state.pets = mockPets(); state.cur = 0; state.draft = { ...BLANK };
    el('#view').scrollTop = 0; render();
  },

  back() { if (dirty()) { alert_ = 'exit'; renderAlert(); } else ACTIONS['exit-confirm'](); },
  'alert-close'() { alert_ = null; renderAlert(); },
  'exit-confirm'() {
    alert_ = null;
    const wasEdit = state.screen === 'edit';
    state.draft = { ...BLANK };
    state.screen = wasEdit ? 'pet' : state.pets.length ? 'added' : 'empty'; render();
  },

  /* ─── секции 3–4: задача и обработки ─── */
  task(btn) { panel = { type: 'task', key: btn.dataset.value }; renderPanel(); },
  'panel-close'() { panel = null; renderPanel(); },
  'panel-back'() {
    if (panel.type === 'date') panel = { ...panel, type: panel.backTo || 'mark' };
    else panel = { type: 'task', key: panel.key };
    renderPanel();
  },
  catalog() { panel = { type: 'catalog', key: panel.key, q: '' }; renderPanel(); },
  /* кнопка на плитке — сразу «Чем обработали», минуя шторку задачи */
  'quick-mark'(btn) { panel = { type: 'mark', key: btn.dataset.value, q: '', only: null }; renderPanel(); },
  mark(btn) { panel = { type: 'mark', key: panel.key, q: '', only: btn.dataset.value ? btn.dataset.value.split(',') : null }; renderPanel(); },
  history() { panel = { type: 'history', key: panel.key }; renderPanel(); },
  'q-clear'() { panel.q = ''; renderPanel(); },
  'pick-drug'(btn) {
    const p = pet();
    const d = findDrug(p.species, btn.dataset.value)
      || { name: btn.dataset.value, period: (logOf(p).find(t => t.drug === btn.dataset.value) || {}).periodDays,
           covers: taskOf(p.species, panel.key).parasites.slice(), custom: true };
    panel = { ...panel, type: 'date', backTo: panel.type === 'task' ? 'task' : 'mark', perVal: '', perUnit: 'дн', perOwn: false,
      drug: { ...d, covers: d.covers.slice() }, date: todayISO() };
    panel.preset = panel.drug.period || null;
    renderPanel();
  },
  /* своё название — «Записать как «…»» (3а.2–3а.4) */
  'pick-own'() {
    const p = pet();
    panel = { ...panel, type: 'date', date: todayISO(), perVal: '', perUnit: 'дн', perOwn: false,
      drug: { name: panel.q.trim(), period: typicalPeriod(p.species, panel.key),
              covers: (panel.only || taskOf(p.species, panel.key).parasites).slice(), custom: true } };
    panel.preset = panel.drug.period || null;
    renderPanel();
  },
  cover(btn) { panel.drug.covers = btn.dataset.value.split(','); renderPanel(); },
  period(btn) { panel.preset = +btn.dataset.value || null; panel.drug.period = panel.preset; renderPanel(); },
  'per-own'() {
    panel.perOwn = !panel.perOwn;
    panel.drug.period = panel.perOwn ? periodDays(panel.perVal, panel.perUnit) : (panel.preset || null);
    renderPanel();
  },
  'per-unit'(btn) {
    panel.perUnit = btn.dataset.value;
    if (panel.perVal) panel.drug.period = periodDays(panel.perVal, panel.perUnit);
    renderPanel();
  },
  'quick-date'(btn) { panel.date = btn.dataset.value; renderPanel(); },
  'save-mark'() {
    const p = pet(); const d = panel.drug;
    const rec = { drug: d.name, date: panel.date, periodDays: d.period || null };
    if (d.custom) rec.covers = d.covers.slice();
    p.prot = logOf(p).slice();
    if (!p.prot.some(t => t.drug === rec.drug && t.date === rec.date)) {
      p.prot.push(rec); p.prot.sort((a, b) => (a.date < b.date ? -1 : 1));
    }
    /* сразу на главный: плитка уже обновилась, итог — в уведомлении (шаг 6, 106:7824) */
    panel = null; render();
    toast(markedToast(p, rec));
  },
  unique() { histUnique = !histUnique; renderPanel(); },
  cart() { toast('Добавили в корзину'); },
  /* корзина у записи — в шторке и в истории (1а.2) */
  'del-rec'(btn) {
    const t = logOf(pet())[+btn.dataset.value];
    if (!t) return;
    ios = { kind: 'alert', idx: +btn.dataset.value, title: 'Убрать отметку?',
      text: `Отметка от ${fmtDay(t.date)} пропадёт из истории`,
      actions: [{ t: 'Убрать', act: 'del-rec-ok' }, { t: 'Оставить', act: 'ios-close', bold: true }] };
    renderIOS();
  },
  'del-rec-ok'() {
    const p = pet();
    p.prot = logOf(p).filter((_, i) => i !== ios.idx);
    ios = null;
    if (panel && panel.type === 'history' && !taskRow(p, taskOf(p.species, panel.key)).log.length) panel = { type: 'task', key: panel.key };
    render(); toast('Убрали отметку');
  },
  'ios-close'() { ios = null; renderIOS(); },

  /* ─── секция 2: карточка питомца ─── */
  'open-pet'() { panel = null; state.screen = 'pet'; render(); },
  'pet-back'() { state.screen = 'added'; render(); },
  'pet-menu'() { ios = { kind: 'sheet', items: [{ t: 'Удалить карточку', act: 'del-pet' }] }; renderIOS(); },
  'del-pet'() {
    const p = pet() || {};
    ios = { kind: 'alert', title: 'Удалить карточку?',
      text: `Данные ${p.name} и история обработок пропадут — вернуть их будет нельзя`,
      actions: [{ t: 'Удалить', act: 'del-pet-ok' }, { t: 'Отмена', act: 'ios-close', bold: true }] };
    renderIOS();
  },
  'del-pet-ok'() {
    ios = null;
    state.pets = state.pets.filter((_, i) => i !== state.cur);
    state.cur = Math.max(0, Math.min(state.cur, state.pets.length - 1));
    state.screen = state.pets.length ? 'added' : 'empty'; render();
  },
  'edit-pet'() { state.draft = { ...BLANK, ...pet() }; state.screen = 'edit'; render(); },
  'save-edit'() {
    if (sheet === 'species' || sheet === 'breed') { ACTIONS.apply(); return; }
    if (!changed()) return;
    const { prot } = pet();
    state.pets[state.cur] = { ...pet(), ...state.draft, prot };
    state.draft = { ...BLANK }; state.screen = 'pet'; render();
  },

  'open-species'() { pending = state.draft.species; sheet = 'species'; renderSheet(); },
  'open-breed'() {
    if (!state.draft.species) return;            /* в макете порода без вида не выбирается */
    pending = state.draft.breed; breedQuery = ''; sheet = 'breed'; renderSheet();
  },
  pick(btn) { pending = btn.dataset.value; renderSheet(); },
  /* пока открыта шторка «Вид», кнопка формы применяет выбор (кадры 97:6980 → 6) */
  apply() {
    if (!pending) return;
    if (sheet === 'species') {
      if (state.draft.species !== pending) state.draft.breed = '';
      state.draft.species = pending;
    } else if (sheet === 'breed') state.draft.breed = pending;
    sheet = null; pending = ''; breedQuery = ''; render();
  },
  'clear-q'() { breedQuery = ''; renderSheet(); el('#breed-q')?.focus(); },

  /* Фото — системное меню снизу, как «⋯ → Удалить карточку» (201:11595): простых шторок-меню в приложении нет */
  'open-photo'() { photoMenu(!!state.draft.photo); },
  /* Начальный кадр — как в 2б.2: калибровка по кадру дала фото 765×1048 с левым верхом
     (−174, −33) в координатах экрана, т.е. масштаб 0.85 к исходнику 900px и центр (208.5, 491).
     При сцене 375×617 под шапкой 108 это zoom 1.699 и сдвиг (21, 74.5). */
  'pick-photo'(btn) {
    sheet = null; ios = null;
    if (el('.app').classList.contains('app--frame')) { photoSrc = SRC; crop = { zoom: 1.699, x: 21, y: 74.5 }; render(); return; }
    render(); openPicker(btn.dataset.value === 'camera');
  },
  'crop-cancel'() { crop = null; render(); },
  'crop-done'() {
    const box = el('#crop-frame');
    state.draft.photo = box ? cropToDataURL() : 'img/pet-photo.png';
    crop = null; render();
  },
  'drop-photo'() { state.draft.photo = ''; ios = null; render(); },

  'edit-name'(btn) { inlineEdit(btn, 'name', 'Кличка', 'text'); },
  'edit-age'(btn) { inlineEdit(btn, 'age', 'Примерный возраст', 'text'); },
  'edit-birth'(btn) { inlineEdit(btn, 'birth', 'Дата рождения', 'date'); },

  unit(btn) { state.draft.ageUnit = btn.dataset.value; render(); },
  'toggle-unknown'() {
    const d = state.draft;
    d.unknownDate = !d.unknownDate;
    if (d.unknownDate) d.birth = ''; else d.age = '';
    render();
  },

  submit() {
    if (sheet === 'species' || sheet === 'breed') { ACTIONS.apply(); return; }
    if (missing().length) return;
    state.pets = [...state.pets, { ...state.draft, prot: [] }];
    state.cur = state.pets.length - 1;   /* новый питомец — сразу его слайд */
    state.draft = { ...BLANK }; state.screen = 'added';
    render();
  },
};

/* Поля правятся на месте: кнопка превращается во ввод, значение пишется в черновик.
   Так кнопка не «мёртвая» и ничего не уводит с экрана. */
/* Как собрать поле обратно после правки — те же параметры, что в screenForm */
const FIELD_SPEC = {
  name:  () => ({ key: 'name', label: 'Кличка', req: true, value: state.draft.name, act: 'edit-name' }),
  age:   () => ({ key: 'age', label: 'Примерный возраст', value: state.draft.age, act: 'edit-age' }),
  birth: () => ({ key: 'birth', label: 'Дата рождения', value: fmtDate(state.draft.birth),
                  icon: 'calendar', act: 'edit-birth' }),
};

function inlineEdit(btn, key, label, type) {
  const box = document.createElement('label');
  box.className = 'field field--filled';
  box.innerHTML = `
    <span class="field__body">
      <span class="field__label">${label}</span>
      <input class="field__value" type="${type}" value="${esc(state.draft[key])}"
             style="border:0;outline:0;background:none;width:100%;font:var(--t-14-med)">
    </span>`;
  btn.replaceWith(box);
  const input = box.querySelector('input');
  input.focus({ preventScroll: true });
  let done = false;
  /* Возвращаем на место только это поле, без перерисовки экрана: иначе тап,
     который увёл фокус (например, по чекбоксу), попадает в уже удалённый элемент
     и теряется. Заодно возвращаем прокрутку, которую сдвинула клавиатура. */
  const commit = () => {
    if (done) return; done = true;
    state.draft[key] = input.value.trim();
    const tmp = document.createElement('div');
    tmp.innerHTML = fieldHTML(FIELD_SPEC[key]());
    box.replaceWith(tmp.firstElementChild);
    const submit = el('[data-act="submit"]');
    if (submit) submit.setAttribute('aria-disabled', String(missing().length > 0));
    const saveBtn = el('[data-act="save-edit"]');
    if (saveBtn) saveBtn.setAttribute('aria-disabled', String(!changed()));
    save();
  };
  input.addEventListener('blur', commit);
  input.addEventListener('change', commit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
}

document.addEventListener('click', e => {
  const hit = e.target.closest('[data-act]');
  if (hit) { const fn = ACTIONS[hit.dataset.act]; if (fn) { fn(hit); return; } }
  if (e.target === el('#sheetbg')) { sheet = null; pending = ''; renderSheet(); return; }
});

document.addEventListener('input', e => {
  if (e.target.id === 'pq' && panel) { panel.q = e.target.value; renderPanel(); return; }
  if (e.target.id === 'pper' && panel) {
    panel.perVal = e.target.value;
    panel.drug.period = periodDays(e.target.value, panel.perUnit);
    renderPanel();
    return;
  }
  if (e.target.id !== 'breed-q') return;
  breedQuery = e.target.value;
  const pos = e.target.selectionStart;
  renderSheet();
  const q = el('#breed-q');
  if (q) { q.focus({ preventScroll: true }); q.setSelectionRange(pos, pos); }
});

document.addEventListener('change', e => {
  if (e.target.id === 'pdate' && panel && e.target.value && e.target.value <= todayISO()) {
    panel.date = e.target.value; renderPanel();
  }
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (ios) { ios = null; renderIOS(); return; }
  if (panel) { panel = null; renderPanel(); return; }
  if (alert_) ACTIONS['alert-close']();
  else if (crop) { crop = null; renderCrop(); }
  else if (sheet) { sheet = null; pending = ''; renderSheet(); }
});

/* ═══ подсказка «на весь экран» ═══════════════════════════════════════════
   Ссылку открывают из Telegram и браузера телефона — там рамки браузера съедают
   экран, и прототип не похож на приложение. Показываем один раз, как добавить
   его на экран «Домой». Не показываем: уже с экрана «Домой», на компьютере, в сверке. */
function installHint() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const phone = !matchMedia('(min-width: 520px) and (min-height: 600px)').matches;
  let seen = false; try { seen = localStorage.getItem('4lapy-hifi-install') === '1'; } catch {}
  if (standalone || !phone || seen || location.search.includes('frame=1')) return;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const tg = /Telegram/i.test(ua) || !!window.TelegramWebviewProxy;
  const share = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  const dots = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
  const steps = ios ? [
      tg ? 'В Telegram нажмите «⋯» вверху и «Открыть в Safari»' : null,
      `Внизу Safari нажмите «Поделиться» <span class="ih__ic">${share}</span>`,
      'Прокрутите меню и выберите «На экран «Домой»»',
      'Нажмите «Добавить» и откройте «Питомец» с экрана «Домой»']
    : [
      tg ? 'В Telegram нажмите «⋮» вверху и «Открыть в браузере»' : null,
      `В Chrome нажмите меню <span class="ih__ic">${dots}</span> справа вверху`,
      'Выберите «Добавить на главный экран» или «Установить приложение»',
      'Откройте «Питомец» с главного экрана'];
  const host = el('#install');
  host.hidden = false;
  host.innerHTML = `
    <div class="ih-bg"></div>
    <div class="ih" role="dialog" aria-modal="true">
      <span class="sheet__grabber"></span>
      <img class="ih__app" src="icons/app-180.png" alt="">
      <p class="ih__title">Откройте на весь экран</p>
      <p class="ih__text">Так прототип выглядит как приложение — без адресной строки и рамок браузера.</p>
      <ol class="ih__steps">${steps.filter(Boolean).map(x => `<li>${x}</li>`).join('')}</ol>
      <button class="btn-primary" type="button" data-act="install-ok">Понятно</button>
      <button class="ih__skip" type="button" data-act="install-ok">Смотреть в браузере</button>
    </div>`;
}
ACTIONS['install-ok'] = () => {
  try { localStorage.setItem('4lapy-hifi-install', '1'); } catch {}
  const host = el('#install'); host.hidden = true; host.innerHTML = '';
};

const tick = () => { if (location.search.includes('frame=1')) return; const c = el('#clock');
  if (c) c.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); };
tick(); setInterval(tick, 10_000);

render();
installHint();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
