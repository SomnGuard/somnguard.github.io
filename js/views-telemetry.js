/* SomnGuard Admin — §6 Telemetría: events, evidence, alerts */
'use strict';
(function () {
  var V = window.SG_VIEWS;

  V.events = function () {
    var S = SG_SEED, st = SG.state;
    var list = S.EVENTS.filter(function (e) {
      var q = (st.evQ || '').toLowerCase();
      if (st.evSev && e.severity !== st.evSev) return false;
      if (st.evCat && e.category !== st.evCat) return false;
      if (st.evStatus && e.status !== st.evStatus) return false;
      if (st.evOffline === 'sí' && !e.offline) return false;
      if (st.evOffline === 'no' && e.offline) return false;
      if (q && (e.id + ' ' + e.serial + ' ' + e.type + ' ' + e.type_name).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var rows = list.map(function (e) {
      return '<tr><td>' + SG.fmtDT(e.occurred_at) + '<div style="font-size:11px;color:var(--text-faint)">' + SG.ago(e.occurred_at) + '</div></td>' +
        '<td><code>' + e.id.slice(0, 8) + '…</code> <a href="javascript:SG.copyTxt(\'' + e.id + '\')">⧉</a></td><td style="white-space:nowrap"><strong><code>' + e.serial + '</code></strong></td>' +
        '<td><a href="#/admin/events/' + e.id + '"><strong><code>' + e.type + '</code></strong></a><div style="font-size:11px">' + SG.esc(e.type_name) + '</div></td>' +
        '<td>' + SG.catChip(e.category) + '</td><td>' + SG.sevBadge(e.severity) + '</td><td style="white-space:nowrap"><code>' + (e.sound || '—') + '</code></td>' +
        '<td>' + (e.offline ? '<span class="status-badge status-warning">● offline</span>' : '<span class="status-badge status-neutral">● online</span>') + '</td>' +
        '<td>' + SG.evBadge(e.status) + '</td><td>' + (e.evidence ? '<span class="ev-thumb">🖼</span>' : '—') + '</td></tr>';
    }).join('');
    return SG.page('Eventos', 'Eventos', 'Lo que detectaron los equipos. ' + SG.permChip('event.read'),
      '<button class="btn btn-secondary btn-sm" onclick="SG.exportCSV(\'events.csv\',SG_SEED.EVENTS)">Export CSV</button>',
      SG.tech('Ficha técnica', '<code>telemetry.event</code> · orden <code>occurred_at DESC</code> · respuesta <code>{data, pagination}</code> · la ingesta (<code>event.write</code>) es solo del device.') +
      SG.strip('🔴 <b>2</b> critical · 🟠 <b>3</b> high · 🔁 <b>17%</b> offline_sync · 🏆 <b>SG-2026-0001</b>') +
      '<div class="alert alert-warning">Spike crítico/high: <b>2 critical + 3 high en 24h</b> (&gt;3σ en SG-2026-0001 madrugada) → revisar.</div>' +
      '<form class="card filters" onsubmit="return false" style="grid-template-columns:repeat(5,minmax(0,1fr)) auto"><div class="form-field"><label>severity</label><select onchange="SG.state.evSev=this.value;SG.render()"><option value="">Todas</option>' + ['info', 'warning', 'high', 'critical'].map(function (o) { return '<option ' + (st.evSev === o ? 'selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-field"><label>categoría</label><select onchange="SG.state.evCat=this.value;SG.render()"><option value="">Todas</option>' + ['SOMNOLENCE', 'DISTRACTION', 'SEATBELT', 'SYSTEM'].map(function (o) { return '<option ' + (st.evCat === o ? 'selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-field"><label>status</label><select onchange="SG.state.evStatus=this.value;SG.render()"><option value="">Todos</option>' + ['EVENT_DETECTED', 'EVENT_REGISTERED', 'EVENT_SYNCHRONIZED', 'EVENT_ANALYZED', 'EVENT_ARCHIVED'].map(function (o) { return '<option ' + (st.evStatus === o ? 'selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-field"><label>offline</label><select onchange="SG.state.evOffline=this.value;SG.render()"><option value="">Todos</option><option' + (st.evOffline === 'sí' ? ' selected' : '') + '>sí</option><option' + (st.evOffline === 'no' ? ' selected' : '') + '>no</option></select></div>' +
      '<div class="form-field"><label>Buscar (ID exacto / metadata JSONB)</label><div class="search-input"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input type="search" value="' + SG.esc(st.evQ) + '" oninput="SG.state.evQ=this.value;SG.render()" /></div></div>' +
      '<button class="btn btn-secondary" onclick="SG.state.evQ=\'\';SG.state.evSev=\'\';SG.state.evCat=\'\';SG.state.evStatus=\'\';SG.state.evOffline=\'\';SG.render()">Limpiar</button></form>' +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>occurred_at DESC</th><th>event_id UUIDv7</th><th>device</th><th>type</th><th>cat</th><th>sev</th><th>sound</th><th>offline</th><th>status</th><th>evid</th></tr></thead><tbody>' + (rows || '<tr><td colspan="10" style="text-align:center">Sin eventos.</td></tr>') + '</tbody></table></div><div class="table-footer"><span>' + list.length + ' eventos · sort occurred_at:desc</span></div></div>');
  };

  V.eventDetail = function (id) {
    var S = SG_SEED;
    var e = S.EVENTS.filter(function (x) { return x.id === id; })[0];
    if (!e) return SG.page('Eventos', 'No encontrado', '', '', '', SG.emptyState('Evento inexistente', id, ''));
    var ev = S.EVIDENCES.filter(function (x) { return x.event === id; });
    var als = S.ALERTS.filter(function (x) { return x.event === id; });
    var nots = S.NOTIFICATIONS.filter(function (x) { return x.event === id; });
    return '<a class="back-link" href="#/admin/events">← Volver a Eventos</a>' + SG.page('Eventos / detalle', e.type + ' · ' + e.type_name,
      SG.sevBadge(e.severity) + ' ' + SG.fmtDT(e.occurred_at) + ' · <a href="#/admin/devices">device ' + e.serial + '</a> · ' + SG.evBadge(e.status) + ' ' + SG.permChip('event.read'),
      (SG.can('event.read') ? '<button class="btn btn-secondary btn-sm" onclick="SG.confirmModal(\'Override estado\',\'Override [system] auditado + motivo context_json (ej. forzar SYNCHRONIZED→ANALYZED). occurred_at/device/type inmutables (idempotencia).\',\'Aplicar\',\'SG.closeModal();SG.toast(\\\'Estado override (sim.)\\\')\')">Cambiar estado</button><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Marcado ANALYZED (sim.)\')">Marcar analizado</button><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Archivado (sim.)\')">Archivar</button>' : ''),
      '<section class="panel"><div class="panel-body"><dl class="detail-grid">' +
      [['id (UUIDv7)', e.id], ['device_id', e.serial], ['event_type_id', e.type], ['severity_id', e.severity + ' (puede diferir default)'], ['sound_pattern_id', e.sound + ' NULL-able'], ['is_offline_sync', String(e.offline)], ['status', e.status], ['created_by', 'device ' + e.serial]].map(function (r) { return '<div class="detail-item"><dt>' + r[0] + '</dt><dd>' + SG.esc(r[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<h3>metadata JSONB</h3><pre class="code-view">' + SG.esc(JSON.stringify(e.meta, null, 2)) + '</pre>' +
      '<div class="tabs" style="margin-top:14px"><button class="tab active">Evidencia (' + ev.length + ')</button><button class="tab" onclick="SG.toast(\'Tab alertas: ' + als.length + ' (sim.)\')">Alertas (' + als.length + ')</button><button class="tab" onclick="SG.toast(\'Tab notifs: ' + nots.length + ' (sim.)\')">Notificaciones (' + nots.length + ')</button><button class="tab" onclick="SG.toast(\'Tab auditoría event_status_audit (sim.)\')">Auditoría</button></div>' +
      '<div style="padding:14px 4px">' + (ev.map(function (v) { return '<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><span class="ev-thumb">🖼</span><code>' + v.key + '</code><span>' + Math.round(v.size / 1024) + ' KB</span><code>' + v.sha + '</code><a class="btn btn-secondary btn-sm" href="#/admin/evidence">Abrir viewer</a></div>'; }).join('') || '<p style="color:var(--text-muted)">Sin evidencia (LEFT JOIN NULL).</p>') + '</div>' +
      '<div class="timeline">' + S.STATUS_AUDIT.filter(function (a) { return a.entity === 'event'; }).map(function (a) { return '<div class="timeline-item"><time>' + SG.fmtDT(a.at) + '</time><span><code>' + a.from + '</code> → <code>' + a.to + '</code> · ' + SG.esc(a.by) + '</span></div>'; }).join('') + '</div>' +
      '</div></section>');
  };

  V.evidence = function () {
    var S = SG_SEED;
    return SG.page('Evidencias', 'Evidencias', 'Fotos y videos de los eventos (MinIO). ' + SG.permChip('event.read'),
      '', SG.tech('Ficha técnica', '1 evidencia por evento (MVP) · retención 90 días normal / 5 años critical · JPG 50–200KB.') + '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>event + occurred</th><th>device</th><th>media</th><th>preview</th><th>minio_key</th><th>size (vs max)</th><th>sha256</th><th>retención</th><th></th></tr></thead><tbody>' +
      S.EVIDENCES.map(function (v) {
        var e = S.EVENTS.filter(function (x) { return x.id === v.event; })[0] || {};
        var max = v.media === 'video_mp4' ? 50 : 10, mb = (v.size / 1048576).toFixed(2);
        return '<tr><td><a href="#/admin/events/' + v.event + '"><code>' + v.event.slice(0, 8) + '…</code></a><div style="font-size:11px">' + SG.fmtDT(v.created_at) + '</div></td><td><code>' + SG.esc(e.serial || '—') + '</code></td><td><code>' + v.media + '</code></td><td><span class="ev-thumb">' + (v.media === 'video_mp4' ? '▶' : '🖼') + '</span></td>' +
          '<td style="max-width:220px;overflow:hidden;text-overflow:ellipsis"><code>' + v.key + '</code></td><td>' + mb + ' MB / ' + max + ' MB ' + (v.size > max * 1048576 ? '❌' : '✅') + '</td><td><code>' + v.sha + '</code> <a href="javascript:SG.toast(\'Checksum verificado ✅ (sim.)\')">Verificar</a></td>' +
          '<td><span class="chip">Expira en ' + (e.severity === 'critical' ? '5a' : '90d') + '</span></td>' +
          '<td><button class="btn btn-secondary btn-sm" onclick="SGV.evViewer(\'' + v.event + '\')">Viewer</button></td></tr>';
      }).join('') + '</tbody></table></div></div>');
  };

  V.alerts = function () {
    var S = SG_SEED;
    return SG.page('Alertas', 'Alertas edge (alert_log)', 'Sonidos emitidos por los equipos. ' + SG.permChip('alert.read'),
      '', SG.tech('Ficha técnica', 'Append-only · retención 5 años · 0…N por evento · cada fila enlaza a su evento y notificación.') +
      SG.strip('📢 <b>6</b> alarmas · 🔊 top <b>AS-04</b> críticos · ♻️ <b>0</b> duplicados') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>triggered_at DESC</th><th>event</th><th>device</th><th>sound</th><th>severity</th><th>notif</th></tr></thead><tbody>' +
      S.ALERTS.map(function (a) { var n = S.NOTIFICATIONS.filter(function (x) { return x.event === a.event; })[0]; return '<tr><td>' + SG.fmtDT(a.triggered_at) + '</td><td><a href="#/admin/events/' + a.event + '"><code>' + a.event.slice(0, 8) + '…</code></a></td><td><code>' + a.serial + '</code></td><td><code>' + a.sound + '</code></td><td>' + SG.sevBadge(a.severity) + '</td><td>' + (n ? '<a href="#/admin/notifications">' + n.id + '</a>' : '—') + '</td></tr>'; }).join('') + '</tbody></table></div></div>');
  };

  var H = window.SGV;
  H.evViewer = function (eventId) {
    var S = SG_SEED;
    var v = S.EVIDENCES.filter(function (x) { return x.event === eventId; })[0];
    if (!v) return;
    var idx = S.EVIDENCES.indexOf(v);
    var prev = S.EVIDENCES[idx - 1], next = S.EVIDENCES[idx + 1];
    SG.openModal('<header class="modal-header"><h2>Evidence viewer · ' + v.event.slice(0, 8) + '…</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header>' +
      '<div class="modal-body"><div style="height:220px;border-radius:12px;display:grid;place-items:center;font-size:64px;background:linear-gradient(135deg,#0c2b3a,#1b1035);border:1px solid var(--border)">' + (v.media === 'video_mp4' ? '▶' : '🖼') + '</div>' +
      '<dl class="detail-grid" style="margin-top:12px"><div class="detail-item"><dt>minio_key</dt><dd><code>' + v.key + '</code></dd></div><div class="detail-item"><dt>size</dt><dd>' + Math.round(v.size / 1024) + ' KB</dd></div><div class="detail-item"><dt>sha256</dt><dd>' + v.sha + ' ✅</dd></div><div class="detail-item"><dt>media_type</dt><dd>' + v.media + '</dd></div></dl>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-secondary btn-sm" ' + (prev ? 'onclick="SGV.evViewer(\'' + prev.event + '\')"' : 'disabled') + '>← anterior</button><button class="btn btn-secondary btn-sm" ' + (next ? 'onclick="SGV.evViewer(\'' + next.event + '\')"' : 'disabled') + '>siguiente →</button><button class="btn btn-secondary btn-sm" onclick="SG.copyTxt(\'' + v.key + '\')">Copiar key</button><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Descarga URL firmada RBAC Owner+Admin (sim.)\')">Descargar</button><a class="btn btn-secondary btn-sm" href="#/admin/events/' + v.event + '" onclick="SG.closeModal()">Ver evento</a></div></div>', true);
  };
})();
