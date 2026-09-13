/* SomnGuard Admin — §5 Device Management */
'use strict';
(function () {
  var V = window.SG_VIEWS, H = window.SGV;

  V.devices = function () {
    var S = SG_SEED, st = SG.state;
    var list = S.DEVICES.filter(function (d) {
      var q = (st.devQ || '').toLowerCase();
      if (st.devStatus && d.status !== st.devStatus) return false;
      if (q && (d.serial + ' ' + d.claim_code + ' ' + (d.user || '') + ' ' + d.firmware).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var rows = list.map(function (d) {
      var claimShort = d.claim_code.length > 14 ? d.claim_code.slice(0, 8) + '…' + d.claim_code.slice(-4) : d.claim_code;
      return '<tr><td style="white-space:nowrap"><a href="#/admin/devices/' + d.id + '"><strong><code>' + d.serial + '</code></strong></a><div style="font-size:11px"><code title="' + d.claim_code + '">' + claimShort + '</code> <a href="javascript:SG.copyTxt(\'' + d.claim_code + '\')" title="Copiar claim_code">⧉</a></div></td>' +
        '<td>' + SG.deviceBadge(d.status) + '</td>' +
        '<td>' + (d.is_active ? 'TRUE' : 'FALSE') + '</td><td>' + SG.esc(d.firmware) + '</td><td>' + SG.esc(d.user || '—') + '</td>' +
        '<td style="white-space:nowrap">' + (d.heartbeat ? SG.ago(d.heartbeat) : 'nunca') + '</td><td style="white-space:nowrap">' + SG.fmtShort(d.sync) + '</td><td style="white-space:nowrap">' + SG.fmtShort(d.config_pull) + '</td><td><code>' + SG.esc(d.ip || '—') + '</code></td>' +
        '<td style="white-space:nowrap">' + (d.claimed_at ? '✅ ' + SG.fmtShort(d.claimed_at) : '⏳ —') + '</td><td>' + (d.prov ? '<code>' + d.prov + '</code>' : 'manual') + '</td><td style="white-space:nowrap">' + SG.fmtShort(d.created_at) + '</td>' +
        '<td><div style="display:flex;gap:6px"><a class="btn btn-secondary btn-sm" href="#/admin/devices/' + d.id + '">Ver</a>' +
        (SG.can('device.write') ? '<button class="btn btn-secondary btn-sm" onclick="SGV.devRotate(\'' + d.serial + '\')">Rotar key</button>' : '') + '</div></td></tr>';
    }).join('');
    var off = S.DEVICES.filter(function (d) { return d.status === 'DEVICE_OFFLINE'; }).length;
    return SG.page('Dispositivos', 'Dispositivos', 'Cámaras, asignación y estado de flota. ' + SG.permChip('device.read / device.write'),
      (SG.can('device.write') ? '<button class="btn btn-primary" onclick="SGV.devCreate()">+ Alta manual</button>' : '') + '<button class="btn btn-secondary btn-sm" onclick="SG.exportCSV(\'devices.csv\',SG_SEED.DEVICES)">Export CSV</button>',
      SG.tech('Ficha técnica', '<code>device</code> · <code>serial</code> UNIQUE + <code>claim_code</code> CLM-… · <code>api_key_hash</code> HMAC-SHA256 (nunca visible) · bulk: suspender / reactivar / retirar / rotar / exportar.') +
      (off / S.DEVICES.length > 0.2 ? '<div class="alert alert-critical">OFFLINE masivo (&gt;20% flota).</div>' : '<div class="alert alert-warning">Stock REGISTERED sin reclamar &gt;30d: SG-2026-0007/0008 · firmware 2.3.0 desactualizado: SG-2026-0003.</div>') +
      '<form class="card filters" onsubmit="return false" style="grid-template-columns:1fr 1fr 1fr auto"><div class="form-field"><label>status (6)</label><select onchange="SG.state.devStatus=this.value;SG.render()"><option value="">Todos</option>' + ['DEVICE_REGISTERED', 'DEVICE_ASSIGNED', 'DEVICE_ACTIVE', 'DEVICE_OFFLINE', 'DEVICE_SUSPENDED', 'DEVICE_RETIRED'].map(function (o) { return '<option ' + (st.devStatus === o ? 'selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-field"><label>offline / sin asignación / sin reclamar</label><select onchange="SG.toast(\'Filtro rapido (sim.): \'+this.value)"><option>Todos</option><option>offline heartbeat&lt;NOW-5min</option><option>sin assignment vigente</option><option>claimed_at NULL</option><option>firmware desactualizado</option></select></div>' +
      '<div class="form-field"><label>Buscar serial/claim/fw/IP</label><div class="search-input"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input type="search" value="' + SG.esc(st.devQ) + '" oninput="SG.state.devQ=this.value;SG.render()" /></div></div>' +
      '<button class="btn btn-secondary" onclick="SG.state.devQ=\'\';SG.state.devStatus=\'\';SG.render()">Limpiar</button></form>' +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>serial + claim</th><th>status</th><th>active</th><th>fw</th><th>user</th><th>heartbeat</th><th>sync</th><th>config_pull</th><th>IP</th><th>claimed</th><th>prov</th><th>created</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="13" style="text-align:center">Sin equipos.</td></tr>') + '</tbody></table></div><div class="table-footer"><span>' + list.length + ' equipos · bulk: Suspender / Reactivar / Retirar / Rotar keys / Export</span></div></div>');
  };

  V.deviceDetail = function (id) {
    var S = SG_SEED;
    var d = S.DEVICES.filter(function (x) { return x.id === id; })[0];
    if (!d) return SG.page('Dispositivos', 'No encontrado', '', '', '', SG.emptyState('Device inexistente', id, ''));
    var t = SG.state.devId === id ? (SG.state.devTab || 0) : 0; SG.state.devId = id; SG.state.devTab = t;
    var tabs = ['Resumen', 'Asignación', 'Config', 'Eventos', 'Auditoría'];
    var steps = ['DEVICE_REGISTERED', 'DEVICE_ASSIGNED', 'DEVICE_ACTIVE', 'DEVICE_OFFLINE'];
    var stepHtml = '<div class="stepper">' + steps.map(function (s, i) {
      var cls = (s === d.status) ? 'now' : (['DEVICE_REGISTERED', 'DEVICE_ASSIGNED', 'DEVICE_ACTIVE'].indexOf(s) < ['DEVICE_REGISTERED', 'DEVICE_ASSIGNED', 'DEVICE_ACTIVE', 'DEVICE_OFFLINE', 'DEVICE_SUSPENDED', 'DEVICE_RETIRED'].indexOf(d.status) ? 'done' : '');
      return (i ? '<span class="step-arrow">→</span>' : '') + '<span class="step ' + cls + '">' + s.replace('DEVICE_', '') + '</span>';
    }).join('') + '<span class="step-arrow">·</span><span class="step">SUSPENDED/RETIRED ramas</span></div>';
    var cfg = S.DEVICE_CONFIGS.filter(function (c) { return c.serial === d.serial; })[0];
    var evs = S.EVENTS.filter(function (e) { return e.serial === d.serial; });
    var body = '';
    if (t === 0) body = '<dl class="detail-grid">' + [['serial_number', d.serial], ['claim_code', d.claim_code + ' (UNIQUE, copiar)'], ['status/category', d.status + ' / ' + d.category], ['is_active', String(d.is_active)], ['firmware_version', d.firmware], ['api_key_hash', '•••• HMAC-SHA256 NUNCA + [Rotar]'], ['provisioning_token', d.prov || 'manual NULL'], ['claimed_at', SG.fmtDT(d.claimed_at)], ['last_seen_ip', d.ip || '—'], ['heartbeats', 'hb ' + SG.fmtDT(d.heartbeat) + ' · sync ' + SG.fmtDT(d.sync) + ' · pull ' + SG.fmtDT(d.config_pull)], ['created_by', d.created_by], ['version', 'v' + d.version]].map(function (r) { return '<div class="detail-item"><dt>' + r[0] + '</dt><dd>' + SG.esc(r[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="form-actions" style="justify-content:flex-start">' + (SG.can('device.write') ? '<button class="btn btn-secondary" onclick="SG.toast(\'Editar firmware/is_active (serial inmutable con eventos, sim.)\')">Editar</button><button class="btn btn-danger-subtle" onclick="SGV.devTransition(\'' + d.serial + '\',\'SUSPENDED\')">Suspender [admin]</button><button class="btn btn-secondary" onclick="SGV.devTransition(\'' + d.serial + '\',\'ACTIVE\')">Reactivar [admin]</button><button class="btn btn-danger-subtle" onclick="SGV.devTransition(\'' + d.serial + '\',\'RETIRED\')">Retirar [admin terminal]</button><button class="btn btn-secondary" onclick="SGV.devRotate(\'' + d.serial + '\')">Rotar API key</button>' : '') + '</div>';
    else if (t === 1) { var a = S.ASSIGNMENTS.filter(function (x) { return x.serial === d.serial && x.is_active; })[0]; body = a ? '<div class="alert alert-info">Vigente: <b>' + a.user + '</b> desde ' + SG.fmtDT(a.assigned_at) + ' por ' + a.assigned_by + ' (regla 1×1 vigente).</div><button class="btn btn-danger-subtle" onclick="SGV.devTransition(\'' + d.serial + '\',\'REGISTERED\')">Desasignar → REGISTERED (claimed_at=NULL + audit)</button>' : '<div class="alert alert-warning">Sin asignación vigente (stock).</div>'; body += '<h3>Historial</h3><div class="data-table-wrap"><table class="data-table"><thead><tr><th>user</th><th>assigned</th><th>unassigned</th><th>by</th></tr></thead><tbody>' + S.ASSIGNMENTS.filter(function (x) { return x.serial === d.serial; }).map(function (x) { return '<tr><td>' + x.user + '</td><td>' + SG.fmtDT(x.assigned_at) + '</td><td>' + (x.unassigned_at ? SG.fmtDT(x.unassigned_at) : '— vigente') + '</td><td>' + x.assigned_by + '</td></tr>'; }).join('') + '</tbody></table></div>'; }
    else if (t === 2) body = cfg ? '<p>Config vigente: ' + SG.cfgBadge(cfg.status) + ' v' + cfg.version + ' · published ' + SG.fmtDT(cfg.published_at) + '</p><pre class="code-view">' + SG.esc(JSON.stringify(cfg.configuration, null, 2)) + '</pre><div class="form-actions" style="justify-content:flex-start"><button class="btn btn-secondary" onclick="SG.toast(\'Editar JSON validado vs event_type+sound (sim.)\')">Editar JSON</button><button class="btn btn-secondary" onclick="SG.toast(\'DRAFT→PUBLISHED [admin] published_at=NOW (sim.)\')">Publicar</button><a class="btn btn-secondary" href="#/admin/device-configs">Historial + diff</a></div>' : '<p>Sin config.</p>';
    else if (t === 3) body = '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>occurred_at</th><th>type</th><th>sev</th><th>evidencia</th></tr></thead><tbody>' + (evs.map(function (e) { return '<tr><td>' + SG.fmtDT(e.occurred_at) + '</td><td><a href="#/admin/events/' + e.id + '"><code>' + e.type + '</code></a></td><td>' + SG.sevBadge(e.severity) + '</td><td>' + (e.evidence ? '✅' : '—') + '</td></tr>'; }).join('') || '<tr><td colspan="4" style="text-align:center">Sin eventos.</td></tr>') + '</tbody></table></div><a class="btn btn-link" href="#/admin/events">Ver en /admin/events?device=' + d.serial + ' →</a>';
    else body = '<div class="timeline">' + S.STATUS_AUDIT.filter(function (a) { return a.entity === 'device'; }).map(function (a) { return '<div class="timeline-item"><time>' + SG.fmtDT(a.at) + '</time><span><code>' + a.from + '</code> → <code>' + a.to + '</code> · ' + SG.esc(a.by) + ' · <i>' + SG.esc(a.reason) + '</i></span></div>'; }).join('') + '</div>';

    return '<a class="back-link" href="#/admin/devices">← Volver a Dispositivos</a>' + SG.page('Dispositivos / ' + d.serial, d.serial, d.claim_code + ' · ' + SG.deviceBadge(d.status) + ' · heartbeat ' + SG.ago(d.heartbeat), 'device.read',
      '', stepHtml + '<section class="panel"><div class="tabs">' + tabs.map(function (l, i) { return '<button class="tab ' + (t === i ? 'active' : '') + '" onclick="SG.state.devTab=' + i + ';SG.render()">' + l + '</button>'; }).join('') + '</div><div class="panel-body">' + body + '</div></section>');
  };

  V.assignments = function () {
    var S = SG_SEED;
    return SG.page('Asignaciones', 'Asignaciones', 'Qué conductor usa cada equipo. ' + SG.permChip('device.read'),
      (SG.can('device.write') ? '<button class="btn btn-primary" onclick="SG.toast(\'Asignar: device REGISTERED + user + assigned_by=yo (sim.)\')">+ Asignar</button>' : ''),
      SG.tech('Ficha técnica', '<code>device_assignment</code> · regla 1×1 vigente · doble asignación → 409 · al liberar, el device vuelve a REGISTERED.') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>device</th><th>user</th><th>assigned_at</th><th>unassigned_at</th><th>assigned_by</th><th>is_active</th><th></th></tr></thead><tbody>' +
      S.ASSIGNMENTS.map(function (a) { return '<tr><td><strong><code>' + a.serial + '</code></strong></td><td><strong>' + a.user + '</strong></td><td>' + SG.fmtDT(a.assigned_at) + '</td><td>' + (a.unassigned_at ? SG.fmtDT(a.unassigned_at) : '— NULL=vigente') + '</td><td>' + a.assigned_by + '</td><td>' + (a.is_active ? '<span class="status-badge status-success">● vigente</span>' : 'histórica') + '</td><td>' + (a.is_active && SG.can('device.write') ? '<button class="btn btn-danger-subtle btn-sm" onclick="SGV.devTransition(\'' + a.serial + '\',\'REGISTERED\')">Desasignar</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div></div>');
  };

  V.configs = function () {
    var S = SG_SEED;
    return SG.page('Configs', 'Configuraciones de device', 'Umbrales y sonido por equipo, con historial. ' + SG.permChip('device.config'),
      '', SG.tech('Ficha técnica', '<code>device_config</code> (1 por device) · JSONB + versión + <code>published_at</code> · historial append-only 3 años · [Restaurar] crea nueva versión.') + '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>serial</th><th>status</th><th>version</th><th>published_at</th><th>volume/sync</th><th>thresholds</th><th></th></tr></thead><tbody>' +
      S.DEVICE_CONFIGS.map(function (c) { return '<tr><td><strong><code>' + c.serial + '</code></strong></td><td>' + SG.cfgBadge(c.status) + '</td><td>v' + c.version + '</td><td>' + SG.fmtDT(c.published_at) + '</td><td>' + c.configuration.volume_pct + '% · ' + c.configuration.sync_interval_sec + 's</td><td>blink_max ' + c.configuration.thresholds.blink_rate_max + ' · eye ' + c.configuration.thresholds.eye_closed_sec + 's</td><td><div style="display:flex;gap:6px"><button class="btn btn-secondary btn-sm" onclick="SGV.cfgEdit(\'' + c.serial + '\')">Editar</button><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Comparar versiones diff (sim.)\')">Diff</button></div></td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div class="panel" style="margin-top:14px"><div class="panel-header"><div><h2 class="panel-title">Historial (device_config_history)</h2><p class="panel-subtitle">snapshot + changed_by admin + change_reason · [Restaurar] crea nueva versión</p></div></div><div class="timeline">' +
      S.CONFIG_HISTORY.map(function (h) { return '<div class="timeline-item"><time>' + SG.fmtDT(h.created_at) + '</time><span><code>' + h.serial + ' v' + h.version + '</code> · ' + SG.esc(h.changed_by) + ' · <i>' + SG.esc(h.change_reason) + '</i> <button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Restaurada como nueva versión (sim.)\')">Restaurar</button></span></div>'; }).join('') + '</div></div>');
  };

  V.tokens = function () {
    if (!SG.can('device.provision')) return SG.guardBlock('device.provision');
    var S = SG_SEED;
    return SG.page('Provisioning', 'Tokens de provisioning', 'Claves de alta para equipos nuevos (solo admin). ' + SG.permChip('device.provision (solo admin)'),
      '<button class="btn btn-primary" onclick="SGV.tokCreate()">+ Generar token</button>',
      SG.tech('Ficha técnica', 'Flujo: admin genera → device <code>POST /devices/self-register</code> → user reclama con <code>claim_code</code> → assignment · <code>token_hash</code> SHA256, no recuperable · solo revocar, no eliminar.') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>id</th><th>serial (NULL=genérico)</th><th>usos</th><th>expires</th><th>revoked</th><th>device tras usar</th><th>created_by</th><th></th></tr></thead><tbody>' +
      S.PROV_TOKENS.map(function (t) { return '<tr><td><code>' + t.id + '</code></td><td>' + (t.serial ? '<span class="chip">atado</span> ' + t.serial : '<span class="chip">genérico</span> NULL') + '</td><td>' + t.uses + '/' + t.max + '</td><td>' + SG.fmtDT(t.expires_at) + '</td><td>' + (t.revoked_at ? SG.fmtDT(t.revoked_at) : '— vigente') + '</td><td>' + SG.esc(t.device || '—') + '</td><td>' + t.created_by + '</td><td>' + (t.revoked_at ? '' : '<button class="btn btn-danger-subtle btn-sm" onclick="SG.toast(\'Revocado revoked_at=NOW (sim.)\')">Revocar</button>') + '</td></tr>'; }).join('') + '</tbody></table></div></div>');
  };

  V.provAudit = function () {
    return SG.page('Prov audit', 'Auditoría de provisioning', 'Historial de tokens (solo lectura). ' + SG.permChip('audit.read'), '',
      SG.tech('Ficha técnica', 'Append-only · acciones CREATED / USED / REVOKED / CLAIMED · filtros por token, device, fecha e IP.') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>created_at</th><th>token</th><th>action</th><th>device</th><th>actor</th><th>IP</th></tr></thead><tbody>' +
      SG_SEED.PROV_AUDIT.map(function (a) { return '<tr><td>' + SG.fmtDT(a.created_at) + '</td><td><code>' + a.token + '</code></td><td><span class="chip">' + a.action + '</span></td><td>' + SG.esc(a.device || '—') + '</td><td>' + SG.esc(a.actor || 'device (system)') + '</td><td><code>' + a.ip + '</code></td></tr>'; }).join('') + '</tbody></table></div><div class="table-footer"><span>Sin edición · filtros token/device/action(4)/fecha/IP</span></div></div>');
  };

  H.devCreate = function () {
    SG.openModal('<header class="modal-header"><h2>Alta manual · POST /devices</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header>' +
      '<div class="modal-body"><form id="dform" onsubmit="event.preventDefault();SGV.devCreated()"><div class="form-field"><label>serial_number* UNIQUE</label><input required id="dserial" placeholder="SG-2026-0009" /></div><div class="form-field"><label>firmware_version</label><input value="2.4.1" /></div><div class="form-field"><label>provisioning_token_id (opcional)</label><input placeholder="tok-003" /></div><div class="alert alert-info">Crea en REGISTERED · claim_code CLM-… auto · api_key se muestra <b>1 sola vez</b>.</div></form></div>' +
      '<footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="document.getElementById(\'dform\').requestSubmit()">Crear</button></footer>');
  };
  H.devCreated = function () {
    var s = (document.getElementById('dserial') || {}).value || 'SG-2026-0009';
    var key = 'sg_live_' + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 10);
    SG.openModal('<header class="modal-header"><h2>Device creado · copia la key 1 vez</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header>' +
      '<div class="modal-body"><div class="alert alert-warning">En BD solo queda <code>api_key_hash HMAC-SHA256</code>. Si la pierdes, rota. La vieja → 401 inmediato. Estado no cambia.</div>' +
      '<div class="secret-box"><span>' + key + '</span><button class="btn btn-secondary btn-sm" onclick="SG.copyTxt(\'' + key + '\')">[Copiar]</button></div>' +
      '<p style="color:var(--text-muted);font-size:13px">serial ' + SG.esc(s) + ' · claim CLM-' + Math.random().toString(36).slice(2, 14).toUpperCase() + ' · <a href="javascript:SG.toast(\'Descargado .txt (sim.)\') tse">descargar .txt</a></p></div>' +
      '<footer class="modal-footer"><button class="btn btn-primary" onclick="SG.closeModal()">Entendido</button></footer>');
  };
  H.devRotate = function (serial) { SG.confirmModal('Rotar API key ' + serial, 'PATCH /devices/:id/rotate-key [admin] · invalida inmediato (vieja→401) · devuelve key <b>1 vez</b> con [Copiar]. Estado no cambia.', 'Rotar', 'SG.closeModal();SG.toast(\'Key rotada, copia la nueva (sim.)\')'); };
  H.cfgEdit = function (serial) {
    var c = SG_SEED.DEVICE_CONFIGS.filter(function (x) { return x.serial === serial; })[0]; if (!c) return;
    SG.openModal('<header class="modal-header"><h2>Editar ' + SG.esc(serial) + ' v' + c.version + ' · JSON validado</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header><div class="modal-body"><div class="alert alert-info">Valida contra event_type.threshold_config + sound_pattern existentes · diff antes de guardar.</div><textarea class="json-editor" id="cfgJson">' + SG.esc(JSON.stringify(c.configuration, null, 2)) + '</textarea></div><footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="SG.closeModal();SG.toast(\'Config guardada (sim.)\')">Guardar</button></footer>', true);
  };
  H.devTransition = function (serial, to) { SG.confirmModal('Transición ' + serial + ' → ' + to, 'Valida status_transition + allowed_roles · registra device_status_audit + motivo. Terminal RETIRED pide confirmación extra.', 'Confirmar', 'SG.closeModal();SG.toast(\'Transición aplicada (sim.)\')'); };
  H.tokCreate = function () {
    SG.openModal('<header class="modal-header"><h2>Generar token · POST /devices/provisioning-tokens</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header>' +
      '<div class="modal-body"><form id="tform" onsubmit="event.preventDefault();SGV.tokCreated()"><div class="form-field"><label>serial_number (vacío = genérico)</label><input placeholder="(genérico multi-uso)" /></div><div class="form-field"><label>max_uses (default 1)</label><input type="number" value="1" min="1" /></div><div class="form-field"><label>expires_at (default NOW()+7d)</label><input type="date" /></div></form></div>' +
      '<footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="document.getElementById(\'tform\').requestSubmit()">Generar</button></footer>');
  };
  H.tokCreated = function () {
    var tok = 'ptok_' + Math.random().toString(36).slice(2, 18);
    SG.openModal('<header class="modal-header"><h2>Token creado · cópialo 1 SOLA VEZ</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header>' +
      '<div class="modal-body"><div class="alert alert-warning">En BD solo <code>token_hash SHA256</code>, nunca recuperable. No se reexpone (re-GET → 200 sin key).</div>' +
      '<div class="secret-box"><span>' + tok + '</span><button class="btn btn-secondary btn-sm" onclick="SG.copyTxt(\'' + tok + '\')">[Copiar]</button><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Descargado .txt (sim.)\')">.txt</button></div></div>' +
      '<footer class="modal-footer"><button class="btn btn-primary" onclick="SG.closeModal()">Entendido</button></footer>');
  };
})();
