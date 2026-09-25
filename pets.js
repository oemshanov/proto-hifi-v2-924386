/* Логика обработок — перенесена из лоу-фай прототипа (Прототип/app), где её проверили
   на всех случаях: журнал на питомца, задачи из частей, сроки по препарату.
   Каталог препаратов — реальные товары 4lapy.ru (сентябрь 2026). */

const T = (name, img, price, old, form, period, covers) => ({ name, img, price, old, form, period, covers });

export const DRUGS = {
  'Собака': [
    T('KRKA Милпразон Антигельминтные таблетки для собак и щенков весом до 5 кг, 2 таблетки', '494841.jpeg', 636, 795, 'таблетки', 90, ['worm']),
    T('Elanco Мильбемакс Таблетки от гельминтов для щенков и собак мелких пород весом 0,5-10 кг, 2 таблетки', '494740.jpeg', 882, 1037, 'таблетки', 90, ['worm']),
    T('KRKA Дехинел Плюс Антигельминтный препарат для собак 0,5–20 кг, со вкусом мяса, 2 таблетки', '494853.jpeg', 494, 617, 'таблетки', 90, ['worm']),
    T('Астрафарм Празител Суспензия от гельминтов для щенков и собак мелких пород, 20 мл', '424751.jpeg', 459, null, 'суспензия', 90, ['worm']),
    T('Гельминтал Сироп мини от гельминтов для щенков и котят, 10 мл', '422696.jpeg', 485, null, 'сироп', 90, ['worm']),
    T('БРАВЕКТО Таблетки от блох и клещей для собак весом от 10 до 20 кг , 1 таблетка', '494839.jpeg', 4599, null, 'таблетки', 84, ['flea', 'tick']),
    T('Zoetis Симпарика Таблетки от блох и клещей для собак весом от 1,3 до 2,5 кг, 3 таблетки', '494898.jpeg', 4535, null, 'таблетки', 35, ['flea', 'tick']),
    T('Elanco Адвантикс капли на холку для собак весом от 4 до 10 кг от блох, клещей и комаров, 1 пипетка, 1 мл', '494871.jpeg', 1425, null, 'капли на холку', 30, ['flea', 'tick']),
    T('KRKA Фиприст Спот Он капли на холку для собак весом от 2 до 10 кг от блох и клещей, 3 пипетки', '494821.jpeg', 2269, null, 'капли на холку', 30, ['flea', 'tick']),
    T('АВЗ Барс Капли от блох, иксодовых и чесоточных клещей для собак до 10 кг, 1 пипетка', '495160.jpeg', 374, 425, 'капли на холку', 30, ['flea', 'tick']),
    /* Ошейник — крайний случай периодичности: 8 месяцев против месяца у капель */
    T('Elanco Форесто Ошейник от блох и клещей для собак весом до 8 кг, 38 см', '494754.jpeg', 3959, null, 'ошейник', 240, ['flea', 'tick']),
    /* Фипронил внутри — клещи закрываются, в фасете «Клещи, блохи, гельминты» */
    T('Inspector Квадро С Капли на холку для собак 1-4 кг от блох, клещей и гельминтов, 1 пипетка', '495120.jpeg', 705, 829, 'капли на холку', 30, ['worm', 'flea', 'tick']),
    /* Селамектин: в фасете «Блохи, гельминты», от иксодовых клещей не защищает */
    T('Zoetis Стронгхолд Капли противопаразитарные для кошек и собак до 2,5 кг, 3 пипетки по 0,25 мл', '418551.jpeg', 2318, 2575, 'капли на холку', 30, ['worm', 'flea'])
  ],
  'Кошка': [
    T('KRKA Милпразон Антигельминтные таблетки для котят и кошек весом до 2 кг, 2 таблетки', '419454.jpeg', 652, 815, 'таблетки', 90, ['worm']),
    T('Elanco Мильбемакс Таблетки от гельминтов для крупных кошек весом более 2 кг, со вкусом говядины, 2 таблетки', '494742.jpeg', 1147, 1349, 'таблетки', 90, ['worm']),
    T('Астрафарм Празител Суспензия от гельминтов для кошек и котят, 15 мл', '419395.jpeg', 445, null, 'суспензия', 90, ['worm']),
    T('Apicenna Гельмимакс-4 Таблетки от глистов для кошек и котят от 0,5 кг, 2 таблетки', '427831.jpeg', 699, null, 'таблетки', 90, ['worm']),
    /* В фасете «Блохи»: имидаклоприд, клещей не берёт */
    T('Elanco Адвантейдж Капли на холку от блох для кошек и котят до 4 кг, 1 пипетка по 0,4 мл', '419433.jpeg', 547, null, 'капли на холку', 30, ['flea']),
    T('KRKA Фиприст Комбо Капли на холку для кошек от 1 кг и хорьков старше 6 месяцев от блох и клещей, 1 пипетка по 0,5 мл', '419442.jpeg', 999, null, 'капли на холку', 30, ['flea', 'tick']),
    T('Rolf Club Капли на холку для кошек весом до 4 кг от блох и клещей, 1 пипетка', '419437.jpeg', 399, 469, 'капли на холку', 30, ['flea', 'tick']),
    T('Elanco Форесто Ошейник для кошек от блох и клещей, 38 см', '494756.jpeg', 3959, null, 'ошейник', 240, ['flea', 'tick']),
    T('Zoetis Стронгхолд Капли на холку противопаразитарные для кошек весом от 2,6 до 7,5 кг, 3 пипетки по 0,75 мл', '426149.jpeg', 2687, 2985, 'капли на холку', 30, ['worm', 'flea']),
    T('Inspector Квадро К Капли на холку для кошек весом от 1 до 4 кг от блох, клещей и гельминтов, 1 пипетка', '419415.jpeg', 671, 789, 'капли на холку', 30, ['worm', 'flea', 'tick']),
    T('Elanco Адвокат Капли на холку от блох и глистов для кошек до 4 кг, 1 пипетка по 0,4 мл', '419407.jpeg', 889, 1045, 'капли на холку', 30, ['worm', 'flea']),
    T('KRKA Селафорт Капли на холку от блох, чесоточных клещей и гельминтов для кошек 2,6-7,5 кг, 1 пипетка', '497948.jpeg', 752, 939, 'капли на холку', 30, ['worm', 'flea'])
  ],
  /* Грызуны и хорьки: в каталоге всего 8 позиций, от гельминтов ровно одна паста */
  'Грызун': [
    T('Apicenna Дирофен Паста 20 Паста антигельминтная для котят, щенков, хорьков и декоративных грызунов, 10 мл', '427836.jpeg', 369, null, 'паста', 90, ['worm']),
    T('KRKA Фиприст Комбо Капли на холку для кошек от 1 кг и хорьков старше 6 месяцев от блох и клещей, 1 пипетка по 0,5 мл', '419442.jpeg', 999, null, 'капли на холку', 30, ['flea', 'tick']),
    T('Чистотел Спрей с маслом лаванды от блох и клещей для декоративных птиц и грызунов, 100 мл', '495097.jpeg', 485, null, 'спрей', 30, ['flea', 'tick'])
  ],
  /* Птицы: в каталоге ровно два товара, оба наружные и оба универсальные */
  'Птица': [
    T('Чистотел Спрей с маслом лаванды от блох и клещей для декоративных птиц и грызунов, 100 мл', '495097.jpeg', 485, null, 'спрей', 30, ['ext']),
    T('Чистотел Перметрин Пудра для кошек, собак всех пород, грызунов и птиц от блох и клещей, 100 гр.', '422714.jpeg', 263, null, 'пудра', 30, ['ext'])
  ],
  /* Рыбы: категории защиты в каталоге нет, ближайшее — «Аквариумная химия».
     Поэтому у рыбки задача одна и без графика. */
  'Рыбка': [
    /* настоящие средства из каталога 4lapy.ru (22.09): срок повтора у рыбок не считаем */
    T('АВЗ Антипар комплексный лекарственный препарат для рыб 20 мл', '494803.jpeg', 459, null, 'раствор', null, ['aqua']),
    T('Зоомир Лекарство для рыб Формамед от протозойных инфекций и червей, 50 мл', '401371.jpeg', 109, null, 'кондиционер', null, ['aqua']),
    T('Зоомир Лекарство для рыб Ихтиофор от протозойных инфекций, 50 мл', 'dbpim-8233.jpeg', 109, null, 'кондиционер', null, ['aqua'])
  ],
  /* «Прочее»: вид неизвестен, опираемся на универсальные препараты */
  'Прочее': [
    T('Чистотел Перметрин Пудра для кошек, собак всех пород, грызунов и птиц от блох и клещей, 100 гр.', '422714.jpeg', 263, null, 'пудра', 30, ['any']),
    T('GreenFort Био-спрей от эктопаразитов у кошек, собак и кроликов, 200 мл', '494904.jpeg', 965, null, 'спрей', 30, ['any'])
  ]
};

export const PARASITE = {
  worm: { name: 'гельминты', of: 'от гельминтов' },
  flea: { name: 'блохи',     of: 'от блох' },
  tick: { name: 'клещи',     of: 'от клещей' },
  ext:  { name: 'пухоеды и клещи', of: 'от пухоедов и клещей' },
  aqua: { name: 'паразиты в аквариуме', of: 'в аквариуме' },
  any:  { name: 'паразиты',  of: 'от паразитов' }
};

/* Задачи версии 2. Гельминты и блохи — одно дело: их закрывают либо одним
   комплексным средством, либо двумя разными, и делают это круглый год. Клещи —
   отдельное дело: сезонное (ESCCAP: пики март–июнь и август–ноябрь) и закрывается
   не всяким наружным средством. Внутри задачи может быть сколько угодно препаратов:
   `parasites` перечисляет, что она обязана закрыть. */
const ALL = { key:'all', name:'Гельминты, блохи и клещи', of:'от гельминтов, блох и клещей', parasites:['worm','flea','tick'] };
export const PROTECTION = {
  /* Итерация «один блок» (22.09, ОС клиента): все препараты — в одном месте. Одна задача
     на гельминтов, блох и клещей; что закрыто, а что нет — строками внутри неё */
  'Собака':   [ALL],
  'Кошка':    [ALL],
  'Грызун':   [ALL],
  'Птица':    [{ key:'ext',  name:'Пухоеды и клещи',   of:'от пухоедов и клещей', parasites:['ext'] }],
  /* У рыбки задача называется задачей, а не категорией каталога: «Аквариумная химия»
     под заголовком «Защита от паразитов» читается как диагноз, будто с рыбкой уже
     что-то не так. schedule:false — график не считаем и напоминать не обещаем. */
  'Рыбка':    [{ key:'aqua', name:'Паразиты в аквариуме', of:'в аквариуме', parasites:['aqua'], schedule:false }],
  /* У «Прочего» вид неизвестен: там и хорёк, и черепаха, и шиншилла. Черепахе
     блохи не грозят, хорьку грозят — угадывать нечем. Поэтому задача одна. */
  'Прочее':   [{ key:'any',  name:'Паразиты', of:'от паразитов', parasites:['any'] }]
};

export const protRows = kind => PROTECTION[kind] || PROTECTION['Прочее'];
export const taskOf = (kind, key) => protRows(kind).find(r => r.key === key) || protRows(kind)[0];
export const protName = (kind, key) => taskOf(kind, key).name;
/* Та же задача в предложении: «чем обработали от клещей», «средства от блох» */
export const protOf = (kind, key) => taskOf(kind, key).of;

/* Какие средства годятся для задачи: те, что закрывают хоть одного её паразита.
   Бравекто попадёт и в «Клещи», и в «Гельминты и блохи» — он и правда закрывает
   половину второй задачи. */
export const drugsFor = (kind, key) => {
  const task = taskOf(kind, key);
  return (DRUGS[kind] || []).filter(d => d.covers.some(c => task.parasites.includes(c)));
};
/* Товар по названию: карточка в шторке берёт отсюда картинку и цену.
   Старые записи с препаратом, которого в каталоге уже нет, остаются без карточки. */
export const findDrug = (kind, name) => (DRUGS[kind] || []).find(d => d.name === name) || null;
/* Картинки товаров лежат копиями в app/img: хранилище 4lapy не отдаёт их прототипу
   напрямую, а так карточки работают и на телефоне без доступа к их CDN. */
export const IMG = id => (id ? `img/${id}` : null);

/* Срок для отметки без названия. Раньше тут стояло жёсткое «30 дней» — и человек,
   отметивший глистогонное, получал повтор через месяц вместо квартала, без всякого
   объяснения. Берём самый частый срок среди средств этой задачи. */
export const typicalPeriod = (kind, key) => {
  const periods = drugsFor(kind, key).map(d => d.period).filter(Boolean);
  if (!periods.length) return null;
  const count = {};
  periods.forEach(n => (count[n] = (count[n] || 0) + 1));
  /* при равенстве — больший срок: так в кадрах 3а.2–3а.5 («раз в 90 дней», «до 15 декабря») */
  return +Object.keys(count).sort((a, b) => count[b] - count[a] || b - a)[0];
};


/* ─── сроки ─────────────────────────────────────────────────────────────── */

export const plural = (n, one, few, many) => {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
};
export const daysWord = n => `${n} ${plural(n, 'день', 'дня', 'дней')}`;

/* Местная дата, а не UTC: иначе ночью по Москве «сегодня» оказывалось вчерашним */
export const isoLocal = x => new Date(x.getTime() - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const todayISO = () => isoLocal(new Date());
export const ago = n => { const x = new Date(); x.setDate(x.getDate() - n); return isoLocal(x); };

export const fmtDayNoYear = d => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
/* «2 декабря», год — только если не нынешний */
export const fmtDay = d => {
  const dt = new Date(d);
  const opts = { day: 'numeric', month: 'long' };
  if (dt.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return dt.toLocaleDateString('ru-RU', opts).replace(' г.', '').replace(/^(\d+) /, '$1 ');
};

/* Дата повтора. Считаем в сутках: в день обработки она не «просрочена» */
export function treatmentInfo(t) {
  if (!t || !t.periodDays) return null;
  const midnight = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const next = midnight(t.date);
  next.setDate(next.getDate() + t.periodDays);
  const days = Math.round((next - midnight(new Date())) / 864e5);
  return { next, days, overdue: days < 0 };
}

/* ─── журнал и задачи ───────────────────────────────────────────────────── */

export const logOf = p => (Array.isArray(p.prot) ? p.prot : []);

/* Покрытие записи: из каталога по названию; у своего препарата — сохранённое при отметке */
export function recCovers(p, t) {
  if (t.covers && t.covers.length) return t.covers;
  const d = findDrug(p.species, t.drug);
  if (d) return d.covers;
  const other = Object.values(DRUGS).flat().find(x => x.name === t.drug);
  return other ? other.covers : protRows(p.species)[0].parasites;
}

/* Защита от одного паразита — запись, чья защита кончается позже */
function coverOf(p, par) {
  let best = null;
  logOf(p).forEach(t => {
    if (!recCovers(p, t).includes(par)) return;
    const info = treatmentInfo(t);
    if (!best) { best = { t, info, par }; return; }
    if (info && (!best.info || info.next > best.info.next)) best = { t, info, par };
  });
  return best;
}

/* Задача целиком: части, что закрыто, что нет, срок — по ближайшему окончанию */
export function taskRow(p, r) {
  const parts = r.parasites.map(par => coverOf(p, par) || { par, t: null, info: null });
  const covered = parts.filter(x => x.t);
  const missing = parts.filter(x => !x.t);
  const dated = covered.filter(x => x.info);
  const soonest = dated.length ? dated.reduce((a, b) => (b.info.next < a.info.next ? b : a)) : null;
  const log = logOf(p).filter(t => recCovers(p, t).some(c => r.parasites.includes(c)));
  return {
    ...r, parts, covered, missing, log,
    t: soonest ? soonest.t : (covered[0] ? covered[0].t : null),
    drugs: [...new Set(covered.map(x => x.t.drug))],
    empty: !covered.length,
    partial: !!(missing.length && covered.length),
    ...(soonest ? soonest.info : {})
  };
}

/* Препараты, которые держат задачу, и какие части каждый закрывает */
export function taskGroups(p, r) {
  const drugs = [...new Map(r.parts.filter(x => x.t).map(x => [x.t.drug, x.t])).values()];
  const order = par => r.parasites.indexOf(par);
  return drugs
    .map(t => ({ t, d: drugOfRecord(p, t), info: treatmentInfo(t),
                 pars: r.parts.filter(x => x.t === t).map(x => x.par) }))   /* что препарат держит сейчас, а не всё, что умеет */
    /* порядок — как строки на плитке: гельминты, блохи, клещи */
    .sort((a, b) => order(a.pars[0]) - order(b.pars[0]));
}

/* Препарат записи: из каталога, а если его там нет — как записан (свой) */
export const drugOfRecord = (p, t) =>
  findDrug(p.species, t.drug) || { name: t.drug, period: t.periodDays, covers: recCovers(p, t), custom: true };

/* Ранее обрабатывали: уникальные препараты журнала, свежие сверху */
export function recentDrugs(p, key) {
  const task = taskOf(p.species, key);
  const seen = new Set(), out = [];
  logOf(p).slice().reverse().forEach(t => {
    if (seen.has(t.drug)) return;
    if (!recCovers(p, t).some(c => task.parasites.includes(c))) return;
    seen.add(t.drug);
    out.push({ drug: drugOfRecord(p, t), last: t.date });
  });
  return out;
}

/* Что ещё закрывает препарат: «Закрывает и задачу «Клещи»» */
export function alsoNote(p, key, t) {
  const covers = recCovers(p, t);
  return protRows(p.species).filter(x => x.key !== key && x.parasites.some(c => covers.includes(c)))
    .map(x => x.parasites.every(c => covers.includes(c))
      ? `Закрывает и задачу «${x.name}»`
      : `Закрывает и ${parasitesList(x.parasites.filter(c => covers.includes(c)))} в задаче «${x.name}»`).join(' · ');
}

/* ─── слова ─────────────────────────────────────────────────────────────── */

export const listOf = names => names.length > 1
  ? `${names.slice(0, -1).join(', ')} и ${names[names.length - 1]}` : (names[0] || '');
export const parasitesList = keys => listOf(keys.map(k => PARASITE[k].of.replace(/^от /, '')));
export const parasitesOf = keys => keys.length === 1 ? PARASITE[keys[0]].of : `от ${parasitesList(keys)}`;
export const parasitesName = keys => listOf(keys.map(k => PARASITE[k].name));
export const up = s => s.charAt(0).toUpperCase() + s.slice(1);
export const perText = n => n ? `раз в ${n} ${plural(n, 'день', 'дня', 'дней')}` : 'без графика';
export const rubles = n => `${n.toLocaleString('ru-RU')} ₽`;
