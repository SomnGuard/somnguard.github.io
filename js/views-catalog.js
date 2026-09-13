/* SomnGuard Admin — §4 Parametrización /admin/catalog/* (catalog.read/write admin) */
'use strict';
(function () {
  var V = window.SG_VIEWS, H = window.SGV;

  V.catSimple = function (key) {
    var S = SG_SEED, meta = {
      'event-categories': { t: 'Categorías de evento', s: 'Las 4 familias de eventos.', perm: 'catalog.read / catalog.write', tech: '<code>event_category</code> · <code>code</code> UNIQUE + <code>sort_order</code> ≥ 0 · inmutable si referenciado.' },
      'severities': { t: 'Severidades', s: 'De info a critical.', perm: 'catalog.read / catalog.write', tech: '<code>severity</code> · <code>code</code> + <code>priority</code> ≥ 1 · <code>critical</code> dispara notificación · alimenta <code>v_metrics_daily</code>.' },
      'media-types': { t: 'Tipos de media', s: 'Formatos de evidencia permitidos.', perm: 'catalog.read / catalog.write', tech: '<code>media_type</code> · <code>mime_type</code> + <code>max_size_mb</code> &gt; 0 · valida upload + <code>checksum</code> sha256 (64).' }
    }[key];
    var rows = '', cols = '';
    if (key === 'event-categories') { cols = '<th>code</th><th>name</th><th>description</th><th>sort_order</th><th>is_active</th><th></th>'; rows = S.CATEGORIES.map(function (r) { return '<tr><td><strong><code>' + r.code + '</code></strong></td><td><strong>' + SG.esc(r.name) + '</strong></td><td>' + SG.esc(r.description) + '</td><td>' + r.sort_order + '</td><td>TRUE</td><td>' + rowBtns(r.code, 'En uso por N event_types → 409 si FK RESTRICT') + '</td></tr>'; }).join(''); }
    if (key === 'severities') { cols = '<th>code</th><th>name</th><th>priority</th><th>is_active</th><th></th>'; rows = S.SEVERITIES.map(function (r) { return '<tr><td><strong><code>' + r.code + '</code></strong></td><td>' + SG.sevBadge(r.code) + ' ' + SG.esc(r.name) + '</td><td>' + r.priority + '</td><td>TRUE</td><td>' + rowBtns(r.code) + '</td></tr>'; }).join(''); }
    if (key === 'media-types') { cols = '<th>code</th><th>name</th><th>mime_type</th><th>max_size_mb</th><th>is_active</th><th></th>'; rows = S.MEDIA_TYPES.map(function (r) { return '<tr><td><strong><code>' + r.code + '</code></strong></td><td><strong>' + SG.esc(r.name) + '</strong></td><td><code>' + r.mime_type + '</code></td><td>' + r.max_size_mb + ' MB</td><td>TRUE</td><td>' + rowBtns(r.code) + '</td></tr>'; }).join(''); }
    return SG.page('Catálogos', meta.t, meta.s + ' ' + SG.permChip(meta.perm),
      (SG.can('catalog.write') ? '<button class="btn btn-primary" onclick="SGV.catNew(\'' + meta.t + '\')">+ Nuevo</button>' : '<span class="chip">solo lectura</span>') + '<button class="btn btn-secondary btn-sm" onclick="SG.exportCSV(\'' + key + '.csv\',[{code:1}])">Export CSV</button>',
      SG.tech('Ficha técnica', meta.tech + ' Patrón común: sin DELETE físico · FK RESTRICT → 409 si está en uso.') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr>' + cols + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>');
  };
  function rowBtns(code, warn) {
    if (!SG.can('catalog.write')) return '<span class="chip">lectura</span>';
    return '<div style="display:flex;gap:6px"><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Editar ' + code + ' (code inmutable, sim.)\')">Editar</button><button class="btn btn-danger-subtle btn-sm" onclick="SG.toast(\'' + SG.esc(warn || 'Activar/Desactivar (sim.)') + '\')">Activar/Desactivar</button></div>';
  }

  /* ---------- sound patterns + probar sonido WebAudio ---------- */
  V.sounds = function () {
    var S = SG_SEED;
    var rows = S.SOUNDS.map(function (r) {
      return '<tr><td><strong><code>' + r.code + '</code></strong></td><td>' + SG.esc(r.description) + '</td><td>' + r.frequency_hz + ' Hz</td><td>' + r.duration_ms + ' ms</td><td>' + (r.repetitions === 0 ? '0=continuo' : '×' + r.repetitions) + '</td><td><code>' + r.pattern_type + '</code></td><td>' + (r.interval_ms == null ? '—' : r.interval_ms + ' ms') + '</td>' +
        '<td><div style="display:flex;gap:6px"><button class="btn btn-secondary btn-sm" onclick="SGV.playSound(' + r.frequency_hz + ',' + r.duration_ms + ',' + r.repetitions + ')">▶ Probar</button>' + (SG.can('catalog.write') ? '<button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Editar ' + r.code + ' (sim.)\')">Editar</button>' : '') + '</div></td></tr>';
    }).join('');
    var used = S.EVENT_TYPES.map(function (e) { return e.sound; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
    return SG.page('Patrones sonido', 'Patrones de sonido', 'Los 9 sonidos del edge (AS-01…AS-09). ' + SG.permChip('catalog.read / catalog.write'),
      (SG.can('catalog.write') ? '<button class="btn btn-primary" onclick="SGV.catNew(\'Patrón de sonido\')">+ Nuevo</button>' : ''),
      SG.tech('Ficha técnica', '<code>sound_pattern</code> · uso por event_types: ' + used + ' · FK RESTRICT.') +
      '<div class="charts-grid"><div class="chart-card"><h3>freq vs duración</h3><p>AS-04 crítico 1200Hz/2000ms continuo · AS-07 intermitente 1000ms</p><div class="bars">' +
      S.SOUNDS.map(function (r) { return '<div class="bar"><div class="seg" style="height:' + Math.round(r.frequency_hz / 1200 * 90 + 10) + '%;background:rgba(0,200,200,.55)"></div><b>' + r.code + '</b></div>'; }).join('') + '</div></div>' +
      '<div class="chart-card"><h3>Uso por event_type</h3><p>Qué eventos disparan cada patrón (FK RESTRICT)</p>' + S.SOUNDS.map(function (r) { var n = S.EVENT_TYPES.filter(function (e) { return e.sound === r.code; }).length; return '<div class="donut-row"><span style="min-width:60px"><code>' + r.code + '</code></span><span class="track"><i style="width:' + n / 4 * 100 + '%;background:#00c8c8"></i></span><b>×' + n + '</b></div>'; }).join('') + '</div></div>' +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>code</th><th>description</th><th>frequency_hz&gt;0</th><th>duration_ms&gt;0</th><th>repetitions≥0</th><th>pattern_type</th><th>interval_ms</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>');
  };
  H.playSound = function (freq, dur, reps) {
    try {
      var C = window.AudioContext || window.webkitAudioContext; var ctx = new C();
      var n = reps === 0 ? 1 : Math.min(reps, 3); var t = ctx.currentTime;
      for (var i = 0; i < n; i++) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq; var s = t + i * (dur / 1000 + 0.25); g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.4, s + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, s + dur / 1000); o.connect(g); g.connect(ctx.destination); o.start(s); o.stop(s + dur / 1000 + 0.05); }
      SG.toast('Reproduciendo ' + freq + 'Hz ' + dur + 'ms ×' + (reps === 0 ? 'continuo' : reps));
      setTimeout(function () { ctx.close(); }, (dur + 400) * n);
    } catch (e) { SG.toast('WebAudio no disponible', false); }
  };

  /* ---------- event types 18 + detalle ---------- */
  V.eventTypes = function () {
    var S = SG_SEED;
    var rows = S.EVENT_TYPES.map(function (e) {
      return '<tr><td><a href="#/admin/catalog/event-types/' + e.code + '"><strong><code>' + e.code + '</code></strong></a></td><td><strong>' + SG.esc(e.name) + '</strong></td><td>' + SG.catChip(e.category) + '</td><td>' + SG.sevBadge(e.severity) + '</td><td><code>' + e.sound + '</code></td><td>' + SG.cfgBadge(e.status) + ' v' + e.version + '</td>' +
        '<td><div style="display:flex;gap:6px"><a class="btn btn-secondary btn-sm" href="#/admin/catalog/event-types/' + e.code + '">Ver</a>' + (SG.can('catalog.write') ? '<button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Publicar/archivar (DRAFT→PUBLISHED→DEPRECATED, sim.)\')">Publicar</button>' : '') + '</div></td></tr>';
    }).join('');
    return SG.page('Tipos evento', 'Tipos de evento (18)', 'Qué detecta el edge y cómo suena. ' + SG.permChip('catalog.read / catalog.write'),
      (SG.can('catalog.write') ? '<button class="btn btn-primary" onclick="SGV.catNew(\'Tipo de evento\')">+ Nuevo (DRAFT)</button>' : ''),
      SG.tech('Ficha técnica', '<code>event_type</code> · FKs RESTRICT a categoría/severidad/sonido · <code>threshold_config</code> JSONB · versionado v++ · flujo <code>DRAFT→PUBLISHED→DEPRECATED</code> [admin].') +
      '<div class="alert alert-warning">Alerta: <b>EV-SYS-06 en DRAFT</b> sin transiciones propias (revisar antes de publicar). Conteo: 17 PUBLISHED · 1 DRAFT.</div>' +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>code</th><th>name</th><th>categoría</th><th>severity</th><th>sound</th><th>status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>');
  };
  V.eventTypeDetail = function (code) {
    var S = SG_SEED;
    var e = S.EVENT_TYPES.filter(function (x) { return x.code === code; })[0];
    if (!e) return SG.page('Tipos evento', 'No encontrado', '', '', '', SG.emptyState('Event type inexistente', code, ''));
    var count30 = 3 + (code.charCodeAt(3) % 5), alerts = 1 + (code.charCodeAt(4) % 3);
    return '<a class="back-link" href="#/admin/catalog/event-types">← Volver a Tipos de evento</a>' + SG.page('Tipos evento / ' + code, e.code + ' · ' + e.name,
      'categoría ' + e.category + ' · severidad ' + e.severity + ' · sonido ' + e.sound + ' · v' + e.version + ' ' + SG.permChip('catalog.write'),
      (SG.can('catalog.write') ? '<button class="btn btn-primary" onclick="SG.toast(\'Guardado version++ (sim.)\')">Guardar (v' + (e.version + 1) + ')</button>' : ''),
      '<section class="panel"><div class="panel-body"><div class="alert alert-info">Si ocurre → suena <b>' + e.sound + '</b> + severidad <b>' + e.severity + '</b> · uso 30d: ' + count30 + ' eventos · ' + alerts + ' alertas.</div>' +
      '<div class="form-grid"><div class="form-field"><label>categoría (FK RESTRICT)</label><select><option>' + e.category + '</option></select></div>' +
      '<div class="form-field"><label>default_severity (FK)</label><select><option>' + e.severity + '</option></select></div>' +
      '<div class="form-field"><label>default_sound (FK NULL-able)</label><select><option>' + e.sound + '</option></select></div>' +
      '<div class="form-field"><label>status (DRAFT→PUBLISHED→DEPRECATED, allowed_roles=[admin])</label><select><option>' + e.status + '</option></select></div></div>' +
      '<div class="form-field full"><label>threshold_config JSONB (validación por categoría)</label><textarea class="json-editor" id="thJson">' + SG.esc(JSON.stringify(e.threshold, null, 2)) + '</textarea><span class="field-help">Ej: SOMNOLENCE requiere eye_closed_min_sec · schema validado + diff antes de guardar.</span></div>' +
      '<div class="form-actions" style="justify-content:flex-start"><button class="btn btn-secondary" onclick="SGV.playSound(950,400,2)">▶ Probar ' + e.sound + '</button><button class="btn btn-secondary" onclick="SG.copyTxt(document.getElementById(\'thJson\').value)">Copiar JSON</button></div>' +
      '</div></section>');
  };

  /* ---------- statuses (23) ---------- */
  V.statuses = function () {
    var S = SG_SEED;
    var cats = S.STATUS_CATEGORIES.map(function (c) { return '<tr><td><strong><code>' + c.code + '</code></strong></td><td>' + SG.esc(c.name) + '</td><td>' + SG.esc(c.description) + '</td><td>' + c.sort_order + '</td><td>' + (c.is_final ? 'TRUE (único final)' : 'FALSE') + '</td></tr>'; }).join('');
    var sts = S.STATUSES.map(function (s) { return '<tr><td><strong><code>' + s.code + '</code></strong></td><td><code>' + s.category + '</code></td><td>' + SG.esc(s.name) + '</td><td><code>' + s.entity + '</code></td><td>' + s.sort + '</td><td>' + (s.initial ? 'initial' : s.terminal ? 'terminal' : '—') + '</td></tr>'; }).join('');
    return SG.page('Estados', 'Estados y categorías (Admin total)', 'Los 23 estados posibles y sus 5 familias. ' + SG.permChip('catalog.write'),
      (SG.can('catalog.write') ? '<button class="btn btn-primary" onclick="SGV.catNew(\'Estado\')">+ Nuevo estado</button>' : ''),
      SG.tech('Ficha técnica', '<code>status</code> (PK <code>code</code>) + <code>status_category</code> (casi inmutable, ARCHIVED es final) · CHECK <code>NOT(initial AND terminal)</code>.') +
      '<div class="panel"><div class="panel-header"><div><h2 class="panel-title">status_category (5)</h2></div></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>code PK</th><th>name</th><th>desc</th><th>sort</th><th>is_final</th></tr></thead><tbody>' + cats + '</tbody></table></div></div>' +
      '<div class="panel" style="margin-top:14px"><div class="panel-header"><div><h2 class="panel-title">status (23)</h2><p class="panel-subtitle">device 6 · event 5 · user 4 · device_config 3 · notification 5</p></div></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>code PK</th><th>category FK</th><th>name</th><th>entity_type IDX</th><th>sort</th><th>marca</th></tr></thead><tbody>' + sts + '</tbody></table></div></div>');
  };

  /* ---------- transitions (25) grafo + matriz ---------- */
  V.transitions = function () {
    var S = SG_SEED;
    var groups = {};
    S.TRANSITIONS.forEach(function (t) {
      var ent = t.from.indexOf('DEVICE_CONFIG') === 0 ? 'CONFIG' : t.from.split('_')[0];
      (groups[ent] = groups[ent] || []).push(t);
    });
    var ghtml = Object.keys(groups).map(function (g) {
      var nodes = []; groups[g].forEach(function (t) { if (nodes.indexOf(t.from) < 0) nodes.push(t.from); if (nodes.indexOf(t.to) < 0) nodes.push(t.to); });
      var w = Math.max(560, nodes.length * 150), y = 60;
      var pos = {}; nodes.forEach(function (n, i) { pos[n] = { x: 90 + i * 150, y: y }; });
      var svg = '<svg width="' + w + '" height="130">' + groups[g].map(function (t) {
        var a = pos[t.from], b = pos[t.to]; if (!a || !b) return '';
        return '<line class="gedge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" marker-end="url(#arr)"/><text class="gedge-lbl" x="' + ((a.x + b.x) / 2 - 20) + '" y="' + (a.y - 12) + '">' + t.roles.join('+') + '</text>';
      }).join('') + nodes.map(function (n) {
        var st = S.STATUSES.filter(function (s) { return s.code === n; })[0];
        var cls = st && st.initial ? 'initial' : st && st.terminal ? 'terminal' : '';
        return '<g><rect class="gnode ' + cls + '" x="' + (pos[n].x - 70) + '" y="' + (pos[n].y - 20) + '" width="140" height="40" rx="10"/><text class="glabel" x="' + (pos[n].x - 62) + '" y="' + (pos[n].y + 4) + '">' + n.replace(/^(DEVICE|EVENT|USER|NOTIFICATION)_/, '') + '</text></g>';
      }).join('') + '<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="#93adbf"/></marker></defs></svg>';
      return '<div class="chart-card"><h3>' + g + ' (' + groups[g].length + ')</h3><div class="graph-wrap">' + svg + '</div></div>';
    }).join('');
    var mrows = S.TRANSITIONS.map(function (t, i) { return '<tr><td><code>' + t.from + '</code></td><td>→</td><td><code>' + t.to + '</code></td><td>' + t.roles.map(function (r) { return '<span class="chip">' + r + '</span>'; }).join(' ') + '</td><td>' + SG.esc(t.desc) + '</td></tr>'; }).join('');
    return SG.page('Transiciones', 'Transiciones de estado (25)', 'Qué cambios de estado permite cada rol. ' + SG.permChip('catalog.write'),
      (SG.can('catalog.write') ? '<button class="btn btn-primary" onclick="SGV.transNew()">+ Nueva transición</button>' : ''),
      SG.tech('Ficha técnica', 'PK <code>(from,to)</code> · <code>allowed_roles</code> usa literales <code>user/system/admin</code> (<code>system</code> no es rol, no es FK) · validación <code>from≠to</code> · eventos y notifs son [system], unassign es [user,admin].') +
      '<div class="charts-grid">' + ghtml + '</div>' +
      '<div class="panel"><div class="panel-header"><div><h2 class="panel-title">Matriz from × to</h2></div></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>from</th><th></th><th>to</th><th>allowed_roles</th><th>description</th></tr></thead><tbody>' + mrows + '</tbody></table></div></div>');
  };
  H.transNew = function () { SG.openModal('<header class="modal-header"><h2>Nueva transición</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header><div class="modal-body"><div class="form-field"><label>from_status</label><select><option>DEVICE_ACTIVE</option><option>EVENT_SYNCHRONIZED</option></select></div><div class="form-field"><label>to_status (!= from)</label><select><option>DEVICE_SUSPENDED</option><option>EVENT_ANALYZED</option></select></div><div class="form-field"><label>allowed_roles (multiselect admin/user/system)</label><select multiple><option>admin</option><option>user</option><option>system</option></select></div></div><footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="SG.closeModal();SG.toast(\'Transición creada (sim.)\')">Crear</button></footer>'); };
  H.catNew = function (t) {
    SG.openModal('<header class="modal-header"><h2>Nuevo — ' + SG.esc(t) + '</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header><div class="modal-body"><div class="alert alert-info">code UNIQUE e inmutable tras crear si referenciado (FK RESTRICT → 409 "En uso por N").</div><form id="cform" onsubmit="event.preventDefault();SG.closeModal();SG.toast(\'Registro creado (simulado)\')"><div class="form-field"><label>Código*</label><input required placeholder="NUEVO_CODIGO" /></div><div class="form-field"><label>Nombre*</label><input required /></div><div class="form-field"><label>Descripción</label><input /></div></form></div><footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="document.getElementById(\'cform\').requestSubmit()">Crear</button></footer>');
  };
})();
