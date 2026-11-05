/* Cotizador El Trébol — origen/destino, bultos, retiro, revisión y estados de envío */
(function () {
  const form = document.getElementById('quoteForm');
  if (!form) return;

  /* ---------- Datos: localidades habilitadas ----------
     Regla (a confirmar con el cliente): los envíos conectan la zona
     "Buenos Aires y Rosario" con la zona "Sur de Córdoba" y viceversa. */
  const ZONES = {
    metro: { label: 'Buenos Aires y Rosario', items: [
      ['caba', 'Buenos Aires (CABA)', 'Ciudad Autónoma de Buenos Aires'],
      ['rosario', 'Rosario', 'Santa Fe']
    ]},
    sur: { label: 'Sur de Córdoba', items: [
      ['jovita', 'Jovita', 'Córdoba'], ['rio_cuarto', 'Río Cuarto', 'Córdoba'], ['la_cautiva', 'La Cautiva', 'Córdoba'],
      ['v_mackenna', 'Vicuña Mackenna', 'Córdoba'], ['gral_levalle', 'General Levalle', 'Córdoba'], ['laboulaye', 'Laboulaye', 'Córdoba'],
      ['melo', 'Melo', 'Córdoba'], ['v_valeria', 'Villa Valeria', 'Córdoba'], ['del_campillo', 'Del Campillo', 'Córdoba'],
      ['n_bruzone', 'Nicolás Bruzone', 'Córdoba'], ['mattaldi', 'Mattaldi', 'Córdoba'], ['san_joaquin', 'San Joaquín', 'Córdoba'],
      ['serrano', 'Serrano', 'Córdoba'], ['charlone', 'Charlone', 'Buenos Aires'], ['buchardo', 'Buchardo', 'Córdoba'],
      ['onagoity', 'Onagoity', 'Córdoba'], ['italo', 'Italó', 'Córdoba'], ['pincen', 'Pincén', 'Córdoba'],
      ['v_huidobro', 'Villa Huidobro', 'Córdoba'], ['huinca', 'Huinca Renancó', 'Córdoba']
    ]}
  };
  const LOC = {};
  Object.entries(ZONES).forEach(([z, g]) => g.items.forEach(([v, l, p]) => { LOC[v] = { value: v, label: l, prov: p, zone: z }; }));
  const otherZone = z => (z === 'metro' ? 'sur' : 'metro');
  const groupsFor = zones => zones.map(z => ({ label: ZONES[z].label, items: ZONES[z].items.map(([v]) => LOC[v]) }));

  const $ = (s, r = form) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
  const WA = 'https://wa.me/5493385442979?text=' + encodeURIComponent('Hola! Quería consultar por un envío a una localidad que no figura en el cotizador.');
  const ICON = {
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12.5 11 15.5 16 9.5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.5" r=".6" fill="currentColor"/></svg>',
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>'
  };

  /* ---------- Combobox con búsqueda ---------- */
  const combos = [];
  function Combo(root, opt) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'qf-combo-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    if (opt.labelId) btn.setAttribute('aria-labelledby', opt.labelId);
    btn.innerHTML = '<span class="qf-combo-val is-ph"></span>' + ICON.chev;
    const pop = document.createElement('div');
    pop.className = 'qf-pop'; pop.hidden = true;
    pop.innerHTML = '<div class="qf-pop-search">' + ICON.search + '<input type="text" autocomplete="off" placeholder="Buscar localidad…" aria-label="Buscar localidad"/></div><ul class="qf-list" role="listbox"></ul>';
    root.append(btn, pop);
    const input = pop.querySelector('input'), list = pop.querySelector('ul'), valEl = btn.querySelector('.qf-combo-val');
    let value = null, active = -1, flat = [];
    const api = {
      root,
      get value() { return value; },
      set(v, silent) {
        value = v || null;
        valEl.textContent = value ? LOC[value].label : (btn.disabled ? opt.disabledText : opt.placeholder);
        valEl.classList.toggle('is-ph', !value);
        if (!silent && opt.onChange) opt.onChange(value);
      },
      disable(on) { btn.disabled = on; if (on) api.set(null, true); else api.set(value, true); },
      close() { root.classList.remove('open'); pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); },
      open() {
        combos.forEach(c => c !== api && c.close());
        root.classList.add('open'); pop.hidden = false; btn.setAttribute('aria-expanded', 'true');
        input.value = ''; render(); input.focus();
      }
    };
    function render() {
      const q = norm(input.value);
      flat = []; let html = '';
      opt.groups().forEach(g => {
        const items = g.items.filter(it => !q || norm(it.label).includes(q));
        if (!items.length) return;
        html += '<li class="qf-group" role="presentation">' + esc(g.label) + '</li>';
        items.forEach(it => {
          const i = flat.push(it) - 1;
          html += '<li class="qf-opt" role="option" data-i="' + i + '" aria-selected="' + (it.value === value) + '"><span>' + esc(it.label) + '</span><small>' + esc(it.prov) + '</small></li>';
        });
      });
      if (!flat.length) {
        html = '<li class="qf-empty" role="presentation"><strong>Sin resultados para “' + esc(input.value) + '”</strong>' +
          (opt.emptyText || 'Solo mostramos localidades habilitadas.') +
          ' <a href="' + WA + '" target="_blank" rel="noopener">Consultanos por WhatsApp</a></li>';
      }
      list.innerHTML = html;
      active = flat.findIndex(it => it.value === value);
      if (active < 0 && flat.length) active = 0;
      paint();
    }
    function paint() {
      list.querySelectorAll('.qf-opt').forEach(li => li.classList.toggle('active', +li.dataset.i === active));
      const a = list.querySelector('.qf-opt.active');
      if (a) { const t = a.offsetTop, b = t + a.offsetHeight; if (t < list.scrollTop) list.scrollTop = t - 6; else if (b > list.scrollTop + list.clientHeight) list.scrollTop = b - list.clientHeight + 6; }
    }
    function pick(i) { const it = flat[i]; if (!it) return; api.set(it.value); api.close(); btn.focus(); }
    btn.addEventListener('click', () => (root.classList.contains('open') ? api.close() : api.open()));
    btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); api.open(); } });
    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(flat.length - 1, active + 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(active); }
      else if (e.key === 'Escape') { e.preventDefault(); api.close(); btn.focus(); }
      else if (e.key === 'Tab') api.close();
    });
    list.addEventListener('mousedown', e => { const li = e.target.closest('.qf-opt'); if (li) { e.preventDefault(); pick(+li.dataset.i); } });
    combos.push(api);
    api.set(null, true);
    return api;
  }
  document.addEventListener('mousedown', e => combos.forEach(c => { if (!c.root.contains(e.target)) c.close(); }));

  /* ---------- Origen / destino ---------- */
  const origen = Combo($('[data-combo="origen"]'), {
    labelId: 'qfLblOrigen', placeholder: 'Elegí la localidad de origen',
    groups: () => groupsFor(['metro', 'sur']),
    onChange: v => {
      const d = destino.value;
      destino.disable(!v);
      if (v && d && LOC[d].zone === otherZone(LOC[v].zone)) destino.set(d, true);
      else destino.set(null, true);
      if (v && !locRetiro.value) locRetiro.set(v);
      else if (v && locRetiro.value && LOC[locRetiro.value].zone !== LOC[v].zone) locRetiro.set(v);
      clearErr('origen'); refresh();
    }
  });
  const destino = Combo($('[data-combo="destino"]'), {
    labelId: 'qfLblDestino', placeholder: 'Elegí la localidad de destino', disabledText: 'Primero elegí el origen',
    emptyText: 'Desde este origen solo llegamos a las localidades listadas.',
    groups: () => origen.value ? groupsFor([otherZone(LOC[origen.value].zone)]) : [],
    onChange: () => { clearErr('destino'); refresh(); }
  });
  destino.disable(true);

  /* ---------- Bultos (filas compactas, siempre editables) ---------- */
  let bultos = [], seq = 0, triedB = false;
  const bWrap = $('#qfBultos'), bSummary = $('#qfSummary');
  const DIMS = [['cant', 'Cantidad', '1'], ['largo', 'Largo (cm)', '0'], ['ancho', 'Ancho (cm)', '0'], ['alto', 'Alto (cm)', '0'], ['peso', 'Peso (kg)', '0']];
  const newBulto = () => ({ id: ++seq, cant: '1', peso: '', largo: '', ancho: '', alto: '' });
  const okVal = (k, v) => +v > 0 && (k !== 'cant' || Number.isInteger(+v));
  const bValid = b => DIMS.every(([k]) => okVal(k, b[k]));
  const bText = b => b.cant + ' × ' + nf.format(+b.largo) + ' × ' + nf.format(+b.ancho) + ' × ' + nf.format(+b.alto) + ' cm · ' + nf.format(+b.peso) + ' kg c/u';
  function renderBultos() {
    bWrap.innerHTML = '<div class="qf-brow qf-bhead" aria-hidden="true">' + DIMS.map(d => '<span>' + d[1] + '</span>').join('') + '<span></span></div>' +
      bultos.map((b, i) => '<div class="qf-brow" role="group" aria-label="Bulto ' + (i + 1) + '">' + DIMS.map(([k, l, ph]) =>
        '<label class="qf-bcell' + (triedB && !okVal(k, b[k]) ? ' is-error' : '') + '"><span>' + l + '</span><input type="number" inputmode="decimal" min="' + (k === 'cant' ? 1 : 0) + '" step="' + (k === 'cant' ? 1 : 'any') + '" placeholder="' + ph + '" value="' + esc(b[k]) + '" data-id="' + b.id + '" data-k="' + k + '" aria-label="' + l + ' bulto ' + (i + 1) + '"/></label>').join('') +
        '<button type="button" class="qf-bdel" data-act="del" data-id="' + b.id + '" aria-label="Eliminar bulto ' + (i + 1) + '"' + (bultos.length < 2 ? ' disabled' : '') + '>' + ICON.trash + '</button></div>').join('');
    renderSummary();
  }
  function renderSummary() {
    const ok = bultos.filter(bValid);
    const u = ok.reduce((s, b) => s + +b.cant, 0), kg = ok.reduce((s, b) => s + b.cant * b.peso, 0), m3 = ok.reduce((s, b) => s + b.cant * b.largo * b.ancho * b.alto / 1e6, 0);
    bSummary.innerHTML = '<span>Bultos: <strong>' + u + '</strong></span><span>Volumen total: <strong>' + nf.format(m3) + ' m³</strong></span><span>Peso total: <strong>' + nf.format(kg) + ' kg</strong></span>';
  }
  bWrap.addEventListener('input', e => {
    const t = e.target; if (!t.dataset.k) return;
    const b = bultos.find(x => x.id === +t.dataset.id); b[t.dataset.k] = t.value;
    if (triedB) t.closest('.qf-bcell').classList.toggle('is-error', !okVal(t.dataset.k, t.value));
    { const f = fieldOf('bultos'); if (f) { f.classList.remove('is-error'); if (bultos.every(bValid)) { const s = f.querySelector(':scope > .field-msg'); if (s) s.textContent = ''; } } }
    renderSummary(); refresh();
  });
  bWrap.addEventListener('click', e => {
    const a = e.target.closest('[data-act="del"]'); if (!a || a.disabled) return;
    bultos = bultos.filter(x => x.id !== +a.dataset.id); renderBultos(); clearErr('bultos'); refresh();
  });
  $('#qfAddBulto').addEventListener('click', () => {
    bultos.push(newBulto()); renderBultos();
    const f = bWrap.querySelector('.qf-brow:last-child input[data-k="largo"]'); f && f.focus();
    clearErr('bultos'); refresh();
  });

  /* ---------- Retiro a domicilio + autocompletado (propuesta Google Places) ---------- */
  const addrBox = $('#qfAddress'), calle = $('#qfCalle'), placesPop = $('#qfPlacesPop'), addrStatus = $('#qfAddrStatus'), prov = $('#qfProv');
  let addrState = 'empty'; // empty | pending | selected | invalid
  const locRetiro = Combo($('[data-combo="localidad"]'), {
    labelId: 'qfLblLoc', placeholder: 'Buscá y seleccioná una localidad…',
    emptyText: 'Solo retiramos en localidades habilitadas de la zona de origen.',
    groups: () => origen.value ? groupsFor([LOC[origen.value].zone]) : groupsFor(['metro', 'sur']),
    onChange: v => {
      prov.value = v ? LOC[v].prov : '';
      if (addrState === 'selected' || addrState === 'invalid') setAddr(calle.value.trim() ? 'pending' : 'empty');
      clearErr('localidad'); refresh();
    }
  });
  const modo = () => form.querySelector('input[name="modo"]:checked').value;
  form.querySelectorAll('input[name="modo"]').forEach(r => r.addEventListener('change', () => { addrBox.hidden = modo() !== 'domicilio'; refresh(); }));

  function setAddr(s, msg) {
    addrState = s;
    addrStatus.hidden = s === 'empty';
    addrStatus.className = 'qf-addr-status ' + ({ pending: 'is-pending', selected: 'is-ok', invalid: 'is-invalid' }[s] || '');
    const txt = {
      pending: [ICON.warn, '<strong>Dirección pendiente de verificar.</strong> Elegí una sugerencia de la lista para confirmarla en el mapa.'],
      selected: [ICON.ok, '<strong>Dirección verificada.</strong> ' + esc(msg || '')],
      invalid: [ICON.err, '<strong>Dirección fuera de cobertura.</strong> ' + esc(msg || 'No retiramos en esa localidad. Elegí una dirección en una localidad habilitada.')]
    }[s];
    if (txt) addrStatus.innerHTML = txt[0] + '<span>' + txt[1] + '</span>';
    refresh();
  }
  let sugg = [], sActive = 0;
  function renderPlaces() {
    const q = calle.value.trim();
    if (q.length < 3) { placesPop.hidden = true; return; }
    const zone = origen.value ? LOC[origen.value].zone : 'sur';
    const base = locRetiro.value ? [LOC[locRetiro.value]] : [];
    const pool = base.concat(ZONES[zone].items.map(([v]) => LOC[v]).filter(l => l.value !== locRetiro.value)).slice(0, 3);
    const street = q.replace(/\s+\d+.*$/, '');
    sugg = pool.map(l => ({ street, loc: l, ok: true }));
    sugg.push({ street, loc: { label: 'Córdoba Capital', prov: 'Córdoba' }, ok: false });
    sActive = 0;
    placesPop.innerHTML = '<ul class="qf-list" role="listbox">' + sugg.map((s, i) => '<li class="qf-opt' + (i === sActive ? ' active' : '') + '" role="option" data-i="' + i + '">' + ICON.pin + '<span><b>' + esc(s.street) + '</b><small>' + esc(s.loc.label) + ', ' + esc(s.loc.prov) + ', Argentina</small></span></li>').join('') + '</ul><div class="qf-pop-foot"><span class="qf-gfoot">con tecnología de <b>Google</b></span></div>';
    placesPop.hidden = false;
  }
  function pickPlace(i) {
    const s = sugg[i]; if (!s) return;
    placesPop.hidden = true; calle.value = s.street; clearErr('calle');
    if (!s.ok) { setAddr('invalid', s.loc.label + ' no es una localidad habilitada para retiro.'); return; }
    locRetiro.set(s.loc.value, true); prov.value = s.loc.prov; clearErr('localidad');
    setAddr('selected', s.street + ', ' + s.loc.label + ', ' + s.loc.prov + '.');
    $('#qfNumero').focus();
  }
  calle.addEventListener('input', () => { renderPlaces(); setAddr(calle.value.trim() ? 'pending' : 'empty'); clearErr('calle'); });
  calle.addEventListener('keydown', e => {
    if (placesPop.hidden) return;
    const lis = placesPop.querySelectorAll('.qf-opt');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sActive = (sActive + (e.key === 'ArrowDown' ? 1 : -1) + sugg.length) % sugg.length; lis.forEach((li, i) => li.classList.toggle('active', i === sActive)); }
    else if (e.key === 'Enter') { e.preventDefault(); pickPlace(sActive); }
    else if (e.key === 'Escape') placesPop.hidden = true;
  });
  calle.addEventListener('blur', () => setTimeout(() => { placesPop.hidden = true; }, 120));
  placesPop.addEventListener('mousedown', e => { const li = e.target.closest('.qf-opt'); if (li) { e.preventDefault(); pickPlace(+li.dataset.i); } });

  /* ---------- Validación ---------- */
  const val = id => ($('#' + id) ? $('#' + id).value.trim() : '');
  function errors() {
    const e = {};
    if (!origen.value) e.origen = 'Elegí la localidad de origen.';
    if (!destino.value) e.destino = origen.value ? 'Elegí la localidad de destino.' : 'Primero elegí el origen.';
    if (!bultos.length || !bultos.every(bValid)) e.bultos = 'Completá cantidad, medidas y peso de cada bulto (valores mayores a 0).';
    if (!val('qfMerca')) e.merca = 'Contanos brevemente qué mercadería enviás.';
    if (modo() === 'domicilio') {
      if (!val('qfCalle')) e.calle = 'Ingresá la calle.';
      else if (addrState === 'invalid') e.calle = 'La dirección está fuera de cobertura.';
      else if (addrState !== 'selected') e.calle = 'Elegí una sugerencia para verificar la dirección.';
      if (!val('qfNumero')) e.numero = 'Ingresá la altura.';
      if (!locRetiro.value) e.localidad = 'Elegí la localidad de retiro.';
    }
    if (!val('qfNombre')) e.nombre = 'Ingresá tu nombre y apellido.';
    const dni = val('qfDni').replace(/[\s.-]/g, '');
    if (!dni) e.dni = 'Ingresá tu DNI o CUIT.';
    else if (!/^\d{7,11}$/.test(dni)) e.dni = 'Revisá el número: DNI de 7–8 dígitos o CUIT de 11.';
    const mail = val('qfMail'), tel = val('qfTel');
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) e.mail = 'El mail no parece válido.';
    if (!tel) e.tel = 'Ingresá un teléfono o WhatsApp de contacto.';
    else if (tel.replace(/\D/g, '').length < 8) e.tel = 'Revisá el número de teléfono.';
    if (!val('qfEntrega')) e.entrega = 'Ingresá la dirección de entrega en destino.';
    return e;
  }
  let showErrs = false;
  function fieldOf(k) { return form.querySelector('[data-f="' + k + '"]'); }
  function clearErr(k) { const f = fieldOf(k); if (f) f.classList.remove('is-error'); }
  function paintErrs(e) {
    form.querySelectorAll('[data-f]').forEach(f => {
      const m = e[f.dataset.f];
      f.classList.toggle('is-error', !!m);
      const s = f.querySelector(':scope > .field-msg'); if (s) s.textContent = m || '';
    });
  }
  const pendingEl = $('#qfPending'), alertEl = $('#qfAlert');
  function refresh() {
    const n = Object.keys(errors()).length;
    pendingEl.hidden = !showErrs || !n;
    pendingEl.classList.toggle('is-ready', !n);
    pendingEl.innerHTML = '<i></i>' + (n ? 'Faltan ' + n + (n === 1 ? ' dato obligatorio' : ' datos obligatorios') : '');
    if (showErrs && !n) alertEl.hidden = true;
  }
  form.addEventListener('input', e => { const f = e.target.closest('[data-f]'); if (f && !e.target.dataset.k) f.classList.remove('is-error'); refresh(); });

  /* ---------- Vistas: edición → revisión → envío ---------- */
  const vEdit = $('#qfEdit'), vReview = $('#qfReview'), vResult = $('#qfResult');
  const scrollToEl = el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' });
  function show(v) { [vEdit, vReview, vResult].forEach(x => { x.hidden = x !== v; }); }

  $('#qfToReview').addEventListener('click', () => {
    triedB = true; renderBultos();
    const e = errors(), keys = Object.keys(e);
    showErrs = true; paintErrs(e); refresh();
    if (keys.length) {
      alertEl.hidden = false;
      alertEl.innerHTML = ICON.warn + '<span><strong>Revisá ' + keys.length + (keys.length === 1 ? ' campo' : ' campos') + ' antes de continuar.</strong>Los marcamos en rojo.</span>';
      const first = form.querySelector('.is-error');
      if (first) { scrollToEl(first); const i = first.querySelector('input, button'); i && setTimeout(() => i.focus({ preventScroll: true }), 300); }
      return;
    }
    alertEl.hidden = true;
    renderReview(); show(vReview); scrollToEl(form);
  });

  function renderReview() {
    const o = LOC[origen.value], d = LOC[destino.value];
    const ok = bultos.filter(bValid);
    const u = ok.reduce((s, b) => s + +b.cant, 0), kg = ok.reduce((s, b) => s + b.cant * b.peso, 0), m3 = ok.reduce((s, b) => s + b.cant * b.largo * b.ancho * b.alto / 1e6, 0);
    const edit = sec => '<button type="button" class="qf-link" data-goto="' + sec + '">' + ICON.edit + 'Editar</button>';
    const dl = rows => '<dl class="qf-dl">' + rows.filter(r => r[1]).map(r => '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl>';
    const dom = modo() === 'domicilio';
    $('#qfReviewBody').innerHTML =
      '<div class="qf-rblock"><div class="qf-rhead"><h5>Origen y destino</h5>' + edit('qfSecRuta') + '</div><div class="qf-route"><span>' + esc(o.label) + '</span>' + ICON.arrow + '<span>' + esc(d.label) + '</span></div></div>' +
      '<div class="qf-rblock"><div class="qf-rhead"><h5>Bultos y mercadería</h5>' + edit('qfSecBultos') + '</div><ul class="qf-rlist">' + ok.map((b, i) => '<li><span>Bulto ' + (i + 1) + '</span><span>' + esc(bText(b)) + '</span></li>').join('') + '</ul>' +
      dl([['Total', u + (u === 1 ? ' bulto' : ' bultos') + ' · ' + nf.format(kg) + ' kg · ' + nf.format(m3) + ' m³'], ['Mercadería', val('qfMerca')], ['Valor declarado', val('qfValor')]]) + '</div>' +
      '<div class="qf-rblock"><div class="qf-rhead"><h5>Modalidad de retiro</h5>' + edit('qfSecModo') + '</div>' +
      dl(dom ? [['Modalidad', 'Retiro en domicilio'], ['Dirección', val('qfCalle') + ' ' + val('qfNumero') + (val('qfPiso') ? ', ' + val('qfPiso') : '')], ['Localidad', LOC[locRetiro.value].label + ', ' + prov.value]] : [['Modalidad', 'Entrega en depósito'], ['Depósito', 'El Trébol · ' + o.label]]) + '</div>' +
      '<div class="qf-rblock"><div class="qf-rhead"><h5>Datos del cliente</h5>' + edit('qfSecCliente') + '</div>' +
      dl([['Nombre', val('qfNombre')], ['DNI / CUIT', val('qfDni')], ['Teléfono', val('qfTel')], ['Mail', val('qfMail')], ['Entrega en destino', val('qfEntrega')]]) + '</div>';
  }
  form.addEventListener('click', e => {
    const g = e.target.closest('[data-goto]'); if (!g) return;
    show(vEdit); const sec = document.getElementById(g.dataset.goto); scrollToEl(sec);
  });
  $('#qfBack').addEventListener('click', () => { show(vEdit); scrollToEl(form); });

  /* Envío: el éxito se muestra SOLO cuando el servidor confirma.
     Reemplazar enviarSolicitud() por el fetch real al backend.
     Demo: agregar ?simular=error a la URL para ver el estado de error (el reintento funciona). */
  let failNext = /[?&]simular=error/.test(location.search);
  function enviarSolicitud(payload) {
    return new Promise((res, rej) => setTimeout(() => {
      if (failNext) { failNext = false; rej(new Error('network')); }
      else res({ id: 'ET-' + String(Date.now()).slice(-6) });
    }, 1600));
  }
  function payload() {
    return {
      origen: origen.value, destino: destino.value,
      bultos: bultos.map(({ cant, peso, largo, ancho, alto }) => ({ cantidad: +cant, pesoKg: +peso, largoCm: +largo, anchoCm: +ancho, altoCm: +alto })),
      mercaderia: val('qfMerca'), valorDeclarado: val('qfValor'),
      modalidad: modo(),
      retiro: modo() === 'domicilio' ? { calle: val('qfCalle'), numero: val('qfNumero'), piso: val('qfPiso'), localidad: locRetiro.value, provincia: prov.value } : null,
      cliente: { nombre: val('qfNombre'), dniCuit: val('qfDni'), telefono: val('qfTel'), mail: val('qfMail'), direccionEntrega: val('qfEntrega') }
    };
  }
  const sendBtn = $('#qfSend'), sendHTML = sendBtn.innerHTML;
  function setSending(on) {
    sendBtn.disabled = on; $('#qfBack').disabled = on;
    form.querySelectorAll('#qfReview [data-goto]').forEach(b => { b.disabled = on; });
    sendBtn.innerHTML = on ? '<span class="qf-spin" aria-hidden="true"></span>Enviando solicitud…' : sendHTML;
    form.setAttribute('aria-busy', on ? 'true' : 'false');
  }
  async function send() {
    show(vReview); setSending(true);
    try {
      const r = await enviarSolicitud(payload());
      setSending(false);
      vResult.className = 'qf-view qf-result is-ok';
      vResult.innerHTML = '<span class="qf-result-ico">' + ICON.check + '</span><h4>Solicitud enviada</h4><p>Recibimos tu pedido de cotización. Te contestamos por mail o WhatsApp en el día.</p><span class="qf-result-id">N.º ' + esc(r.id) + '</span><div class="qf-result-actions"><button type="button" class="btn btn-ghost-qf" id="qfNew">Hacer otra cotización</button></div>';
      show(vResult); scrollToEl(form);
      $('#qfNew').addEventListener('click', resetAll);
    } catch (err) {
      setSending(false);
      vResult.className = 'qf-view qf-result is-err';
      vResult.innerHTML = '<span class="qf-result-ico">' + ICON.err + '</span><h4>No pudimos enviar tu solicitud</h4><p>Hubo un problema de conexión. Tus datos siguen cargados: podés reintentar o escribirnos por WhatsApp.</p><div class="qf-result-actions"><button type="button" class="btn btn-green" id="qfRetry">Reintentar envío</button><button type="button" class="btn btn-ghost-qf" id="qfErrEdit">Revisar datos</button><a class="qf-link" style="justify-content:center" href="' + WA + '" target="_blank" rel="noopener">Escribir por WhatsApp</a></div>';
      show(vResult); scrollToEl(form);
      $('#qfRetry').addEventListener('click', send);
      $('#qfErrEdit').addEventListener('click', () => { show(vReview); scrollToEl(form); });
    }
  }
  sendBtn.addEventListener('click', send);
  form.addEventListener('submit', e => e.preventDefault());

  function resetAll() {
    form.reset(); origen.set(null, true); destino.disable(true); locRetiro.set(null, true); prov.value = '';
    bultos = [newBulto()]; renderBultos(); setAddr('empty'); addrBox.hidden = modo() !== 'domicilio';
    showErrs = false; paintErrs({}); alertEl.hidden = true; show(vEdit); refresh(); scrollToEl(form);
  }

  bultos = [newBulto()]; renderBultos(); refresh();
})();
