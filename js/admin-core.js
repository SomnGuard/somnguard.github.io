/* ============================================================================
 * SomnGuard Admin — admin-core.js
 * §1 Shell global: guards, sesiones demo, errores envelope, componentes UI.
 * Convencion: security.module.code nunca kebab (telemetry, device_management…).
 * ========================================================================== */
'use strict';

var SG = (function () {
  var S = SG_SEED;
  var TRACE = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6';
  var T0 = Date.now();

  var state = {
    role: 'admin', // switcher demo §0: admin (todo) > user (propios)
    mvLast: S.LAST_MV_REFRESH,
    usersPage: 1, usersPageSize: 8, usersSel: [],
    fUsers: { search: '', status: '', role: '', verified: '', locked: '', deleted: false },
    auditTab: 'logins', auditQ: '',
    userTab: 0, userId: null,
    catTab: '', evType: null, devId: null, evId: null,
    devQ: '', devStatus: '', assignQ: '', tokQ: '',
    evQ: '', evSev: '', evCat: '', evStatus: '', evOffline: '',
    notQ: '', notStatus: '', repTab: 0, setTab: 0,
    dashRange: '7d', dashSev: ''
  };

  function feats() { return S.MATRIX[state.role] || []; }
  function can(f) { return feats().indexOf(f) >= 0; }

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDT(iso) { if (!iso) return '—'; var d = new Date(iso); if (isNaN(d)) return '—'; return d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  function fmtShort(iso) { if (!iso) return '—'; var d = new Date(iso); if (isNaN(d)) return '—'; function p(n) { return (n < 10 ? '0' : '') + n; } return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function ago(iso) { if (!iso) return 'nunca'; var m = Math.round((Date.now() - new Date(iso)) / 60000); if (m < 1) return 'ahora'; if (m < 60) return 'hace ' + m + ' min'; var h = Math.round(m / 60); if (h < 48) return 'hace ' + h + ' h'; return 'hace ' + Math.round(h / 24) + ' d'; }
  function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function latency() { return (18 + Math.round(Math.random() * 40)) + ' ms'; }
  function errEnvelope(code, msg, status) {
    return { error: { code: code, message: msg, details: [], trace_id: TRACE } , _http: status || 400};
  }
  function toast(msg, ok) {
    var r = document.getElementById('toast-root');
    r.innerHTML = '<div class="toast" role="status">' + (ok === false ? '⚠ ' : '✓ ') + esc(msg) + '</div>';
    clearTimeout(toast._t); toast._t = setTimeout(function () { r.innerHTML = ''; }, 3600);
  }
  function openModal(html, lg) {
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop" onclick="if(event.target===this)SG.closeModal()"><section class="modal' + (lg ? ' modal-lg' : '') + '" role="dialog" aria-modal="true">' + html + '</section></div>';
  }
  function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
  function openDrawer(html) {
    document.getElementById('drawer-root').innerHTML =
      '<div class="drawer-backdrop" onclick="SG.closeDrawer()"></div><aside class="drawer" role="dialog" aria-modal="true">' + html + '</aside>';
  }
  function closeDrawer() { document.getElementById('drawer-root').innerHTML = ''; }
  function confirmModal(title, body, cta, fn) {
    openModal('<header class="modal-header"><h2>' + esc(title) + '</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header>' +
      '<div class="modal-body"><div class="alert alert-warning">' + body + '</div>' +
      '<div class="form-field"><label>Motivo (change_reason / context_json) — auditoría</label><input id="cfReason" placeholder="Ej: solicitud soporte #123" /></div>' +
      '<label style="display:flex;gap:8px;font-size:13px;color:var(--text-muted)"><input type="checkbox" id="cfCheck" /> Entiendo las consecuencias</label></div>' +
      '<footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cancelar</button>' +
      '<button class="btn btn-danger" onclick="if(!document.getElementById(\'cfCheck\').checked){SG.toast(\'Confirma con el checkbox\',false)}else{' + fn + '}">' + esc(cta) + '</button></footer>');
  }
  function exportCSV(name, rows) {
    if (!rows.length) { toast('Sin filas para exportar', false); return; }
    var cols = Object.keys(rows[0]);
    var csv = cols.join(',') + '\n' + rows.map(function (r) { return cols.map(function (c) { return '"' + String(r[c] == null ? '' : r[c]).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    toast('Exportado ' + name + ' (' + rows.length + ' filas)');
  }
  function copyTxt(t) {
    function done() { toast('Copiado al portapapeles'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, done);
    else { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
  }

  /* ---------- badges §1.5 (colores fijos) ---------- */
  function deviceBadge(s) {
    var m = { DEVICE_REGISTERED: ['status-neutral', 'REGISTERED'], DEVICE_ASSIGNED: ['status-info', 'ASSIGNED'], DEVICE_ACTIVE: ['status-success', 'ACTIVE'], DEVICE_OFFLINE: ['status-warning', 'OFFLINE'], DEVICE_SUSPENDED: ['status-danger', 'SUSPENDED'], DEVICE_RETIRED: ['status-neutral', 'RETIRED'] };
    var v = m[s] || ['status-neutral', s]; return '<span class="status-badge ' + v[0] + '">● ' + v[1] + '</span>';
  }
  function evBadge(s) {
    var m = { EVENT_DETECTED: 'status-neutral', EVENT_REGISTERED: 'status-info', EVENT_SYNCHRONIZED: 'status-success', EVENT_ANALYZED: 'status-success', EVENT_ARCHIVED: 'status-neutral' };
    return '<span class="status-badge ' + (m[s] || 'status-neutral') + '">● ' + esc(s.replace('EVENT_', '')) + '</span>';
  }
  function userBadge(s) {
    var m = { USER_PENDING_VERIFICATION: ['status-warning', 'PENDING_VERIFICATION'], USER_ACTIVE: ['status-success', 'ACTIVE'], USER_SUSPENDED: ['status-danger', 'SUSPENDED'], USER_SOFT_DELETED: ['status-neutral', 'SOFT_DELETED'] };
    var v = m[s] || ['status-neutral', s]; return '<span class="status-badge ' + v[0] + '">● ' + v[1] + '</span>';
  }
  function cfgBadge(s) {
    var m = { DEVICE_CONFIG_DRAFT: 'status-neutral', DEVICE_CONFIG_PUBLISHED: 'status-success', DEVICE_CONFIG_DEPRECATED: 'status-warning', DRAFT: 'status-neutral', PUBLISHED: 'status-success', DEPRECATED: 'status-warning' };
    return '<span class="status-badge ' + (m[s] || 'status-neutral') + '">● ' + esc(s.replace('DEVICE_CONFIG_', '')) + '</span>';
  }
  function notBadge(s) {
    var m = { NOTIFICATION_PENDING: 'status-neutral', PENDING: 'status-neutral', NOTIFICATION_SENT: 'status-info', SENT: 'status-info', NOTIFICATION_DELIVERED: 'status-info', DELIVERED: 'status-info', NOTIFICATION_READ: 'status-success', READ: 'status-success', NOTIFICATION_FAILED: 'status-danger', FAILED: 'status-danger' };
    return '<span class="status-badge ' + (m[s] || 'status-neutral') + '">● ' + esc(s.replace('NOTIFICATION_', '')) + '</span>';
  }
  function sevBadge(s) {
    var m = { info: ['status-info', 'info'], warning: ['status-warning', 'warning'], high: ['status-danger', 'high'], critical: ['status-danger', 'critical ●'] };
    var v = m[s] || ['status-neutral', s]; return '<span class="status-badge ' + v[0] + '">● ' + v[1] + '</span>';
  }
  function outcomeBadge(o) {
    var m = { SUCCESS: ['status-success', 'SUCCESS'], INVALID_CREDENTIALS: ['status-danger', 'INVALID_CREDENTIALS'], ACCOUNT_LOCKED: ['status-warning', 'ACCOUNT_LOCKED'], ACCOUNT_SUSPENDED: ['status-neutral', 'ACCOUNT_SUSPENDED'], EMAIL_NOT_VERIFIED: ['status-warning', 'EMAIL_NOT_VERIFIED'] };
    var v = m[o] || ['status-neutral', o]; return '<span class="status-badge ' + v[0] + '">● ' + v[1] + '</span>';
  }
  function catChip(c) { return '<span class="chip">' + esc(c) + '</span>'; }
  /* v2-clean: se retiran los chips de permiso (@RequireFeature) y las fichas técnicas
     de cada vista para una interfaz menos recargada; las funciones se mantienen (devuelven
     vacío) para no romper las llamadas existentes en las vistas. */
  function permChip() { return ''; }
  function tech() { return ''; }
  function strip(html) { return '<div class="stat-strip">' + html + '</div>'; }

  /* ---------- page frame ---------- */
  function breadcrumbForPath(path, fallback) {
    var entries = [
      ['/admin/dashboard', 'dashboard', 'dashboard'],
      ['/admin/users', 'seguridad', 'usuarios'],
      ['/admin/roles', 'seguridad', 'roles'],
      ['/admin/permissions', 'seguridad', 'permisos'],
      ['/admin/sessions', 'seguridad', 'sesiones'],
      ['/admin/password-resets', 'seguridad', 'resets-password'],
      ['/admin/email-verifications', 'seguridad', 'verificaciones-email'],
      ['/admin/login-audit', 'seguridad', 'auditoría-login'],
      ['/admin/catalog/event-categories', 'parametrización', 'categorías'],
      ['/admin/catalog/severities', 'parametrización', 'severidades'],
      ['/admin/catalog/media-types', 'parametrización', 'tipos-media'],
      ['/admin/catalog/sound-patterns', 'parametrización', 'patrones-sonido'],
      ['/admin/catalog/event-types', 'parametrización', 'tipos-evento'],
      ['/admin/catalog/statuses', 'parametrización', 'estados'],
      ['/admin/catalog/transitions', 'parametrización', 'transiciones'],
      ['/admin/devices', 'dispositivos', 'dispositivos'],
      ['/admin/assignments', 'dispositivos', 'asignaciones'],
      ['/admin/device-configs', 'dispositivos', 'configs'],
      ['/admin/provisioning-tokens', 'dispositivos', 'tokens-provisioning'],
      ['/admin/provisioning-audit', 'dispositivos', 'auditoría-provisioning'],
      ['/admin/events', 'telemetría', 'eventos'],
      ['/admin/evidence', 'telemetría', 'evidencias'],
      ['/admin/alerts', 'telemetría', 'alertas-edge'],
      ['/admin/notifications', 'monitoreo', 'notificaciones'],
      ['/admin/analytics-timeline', 'analítica', 'timeline'],
      ['/admin/analytics-metrics', 'analítica', 'métricas'],
      ['/admin/reports', 'analítica', 'reportes'],
      ['/admin/audit', 'auditoría-ops', 'auditoría-global'],
      ['/admin/observability', 'auditoría-ops', 'observabilidad'],
      ['/admin/settings', 'auditoría-ops', 'configuración']
    ];
    for (var i = 0; i < entries.length; i++) {
      if (path === entries[i][0] || path.indexOf(entries[i][0] + '/') === 0) {
        return entries[i][1] + ' / ' + entries[i][2];
      }
    }
    return 'dashboard / ' + String(fallback || 'dashboard').toLowerCase();
  }

  function page(crumb, title, sub, actions, bodyHtml) {
    var path = parseHash();
    var bc = breadcrumbForPath(path, title);
    var parts = bc.split(' / ');
    return '<nav class="breadcrumb">' + esc(parts[0]) + ' / <b>' + esc(parts.slice(1).join(' / ')) + '</b></nav>' +
      '<header class="page-header"><div><h1>' + esc(title) + '</h1><p>' + sub + '</p></div>' +
      '<div class="page-actions">' + (actions || '') + '</div></header>' + (bodyHtml || '');
  }
  function guardBlock(feat) {
    var e = errEnvelope('FEATURE_REQUIRED', 'Requiere feature ' + feat, 403);
    return '<section class="panel"><div class="error-state"><div><div class="state-icon">403</div><h2>403 — FEATURE_REQUIRED</h2>' +
      '<p>Tu rol <b>' + esc(state.role) + '</b> no tiene <code>' + esc(feat) + '</code>. Cambia a Admin con el switcher.</p>' +
      '<pre class="code-view" style="text-align:left;max-width:560px;margin:12px auto">' + esc(JSON.stringify(e, null, 2)) + '</pre>' +
      '<button class="btn btn-primary" onclick="SG.setRole(\'admin\')">Cambiar a Admin</button></div></div></section>';
  }
  function emptyState(t, s, cta) {
    return '<div class="panel"><div class="empty-state"><div><div class="state-icon">◌</div><h2>' + esc(t) + '</h2><p>' + esc(s) + '</p>' + (cta || '') + '</div></div></div>';
  }

  /* ---------- topbar: search ⌘K ---------- */
  function openSearch() {
    var root = document.getElementById('cmdk-root');
    root.innerHTML = '<div class="cmdk-backdrop" onclick="if(event.target===this)SG.closeSearch()"><div class="cmdk" role="dialog" aria-label="Busqueda global">' +
      '<input id="cmdkInput" placeholder="email, serial_number, claim_code, event_id, CLM-… (mismo tiempo/respuesta, sin oraculo)" oninput="SG.searchGo(this.value)" />' +
      '<div class="cmdk-list" id="cmdkList"><div class="cmdk-item"><span>Escribe para buscar…</span><small>⌘K</small></div></div></div></div>';
    setTimeout(function () { var i = document.getElementById('cmdkInput'); if (i) i.focus(); }, 30);
  }
  function closeSearch() { document.getElementById('cmdk-root').innerHTML = ''; }
  function searchGo(q) {
    q = (q || '').trim().toLowerCase(); var out = [];
    if (q) {
      S.USERS.forEach(function (u) { if ((u.email + ' ' + u.first_name + ' ' + u.last_name).toLowerCase().indexOf(q) >= 0) out.push({ t: u.email, s: 'user · ' + u.status, h: '#/admin/users/' + u.id }); });
      S.DEVICES.forEach(function (d) { if ((d.serial + ' ' + d.claim_code).toLowerCase().indexOf(q) >= 0) out.push({ t: d.serial, s: 'device · ' + d.status, h: '#/admin/devices/' + d.id }); });
      S.EVENTS.forEach(function (e) { if ((e.id + ' ' + e.type).toLowerCase().indexOf(q) >= 0) out.push({ t: e.type + ' · ' + e.serial, s: 'event · ' + e.severity, h: '#/admin/events/' + e.id }); });
      S.PROV_TOKENS.forEach(function (t) { if (t.id.toLowerCase().indexOf(q) >= 0) out.push({ t: t.id, s: 'provisioning token', h: '#/admin/provisioning-tokens' }); });
    }
    var el = document.getElementById('cmdkList');
    el.innerHTML = out.length ? out.slice(0, 12).map(function (r) { return '<a class="cmdk-item" href="' + r.h + '" onclick="SG.closeSearch()"><strong>' + esc(r.t) + '</strong><small>' + esc(r.s) + '</small></a>'; }).join('')
      : '<div class="cmdk-item"><span>Sin resultados (respuesta constante, sin oráculo de claim).</span><small>0</small></div>';
  }

  /* ---------- shell behaviors ---------- */
  function closeNavGroups() { document.querySelectorAll('.sidebar .nav-group.open').forEach(function (g) { g.classList.remove('open'); }); }
  function toggleNavGroup(btn) {
    var group = btn.closest('.nav-group');
    var wasOpen = group.classList.contains('open');
    closeNavGroups();
    if (!wasOpen) group.classList.add('open');
  }
  function toggleCollapse() { document.body.classList.toggle('nav-collapsed'); closeNavGroups(); }
  function toggleMobileNav(o) { document.body.classList.toggle('mobile-nav-open', o); }
  function toggleTheme() { document.body.classList.toggle('light'); toast('Tema ' + (document.body.classList.contains('light') ? 'claro' : 'oscuro')); }
  function toggleUserMenu(e) { if (e) e.stopPropagation(); renderUserMenu(); document.getElementById('userMenu').classList.toggle('hidden'); document.getElementById('notifPanel').classList.add('hidden'); }
  function toggleNotif(e) { if (e) e.stopPropagation(); renderNotif(); document.getElementById('notifPanel').classList.toggle('hidden'); document.getElementById('userMenu').classList.add('hidden'); }
  function renderUserMenu() {
    var isAdmin = state.role === 'admin';
    var name = isAdmin ? 'Admin SomnGuard' : 'Laura Pineda';
    var email = isAdmin ? 'admin@somnguard.com' : 'laura.pineda@somnguard.com';
    var role = isAdmin ? 'Administrador' : 'Usuario';
    document.getElementById('userMenu').innerHTML =
      '<div class="account-summary"><strong>' + name + '</strong>' +
      '<div class="account-email">' + email + '</div>' +
      '<div class="account-role">' + role + '</div></div>' +
      '<div class="dropdown-separator"></div>' +
      '<button class="dropdown-item" onclick="SG.openAccount()"><span class="dropdown-item-icon">◉</span>Mi cuenta</button>' +
      '<button class="dropdown-item dropdown-item-danger" onclick="SG.logout()"><span class="dropdown-item-icon">↪</span>Cerrar sesión</button>';
    document.getElementById('userName').textContent = name;
    document.getElementById('userMeta').textContent = role;
    document.getElementById('userAvatar').textContent = isAdmin ? 'AD' : 'LP';
  }

  function openAccount() {
    var isAdmin = state.role === 'admin';
    var name = isAdmin ? 'Admin SomnGuard' : 'Laura Pineda';
    var email = isAdmin ? 'admin@somnguard.com' : 'laura.pineda@somnguard.com';
    var role = isAdmin ? 'Administrador' : 'Usuario';
    document.getElementById('userMenu').classList.add('hidden');
    openModal(
      '<header class="modal-header account-modal-header"><div><h2>Mi cuenta</h2><p>Información de la cuenta actual</p></div><button class="icon-btn" onclick="SG.closeModal()" aria-label="Cerrar">✕</button></header>' +
      '<div class="modal-body account-modal-body"><div class="account-hero"><span class="user-avatar account-avatar">' + (isAdmin ? 'AD' : 'LP') + '</span><div><h3>' + name + '</h3><span>' + role + '</span></div></div>' +
      '<dl class="account-details"><div><dt>Correo electrónico</dt><dd>' + email + '</dd></div><div><dt>Rol</dt><dd>' + role + '</dd></div></dl></div>' +
      '<footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cerrar</button></footer>'
    );
  }

  function logout() {
    document.getElementById('userMenu').classList.add('hidden');
    openModal(
      '<header class="modal-header logout-modal-header"><div><h2>Cerrar sesión</h2><p>Vas a salir del panel de administración.</p></div><button class="icon-btn" onclick="SG.closeModal()" aria-label="Cerrar">✕</button></header>' +
      '<div class="modal-body logout-modal-body"><div class="logout-icon">↪</div><p>¿Seguro que deseas cerrar sesión?</p><span>Volverás a la pantalla de inicio.</span></div>' +
      '<footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cancelar</button><button class="btn btn-logout" onclick="location.href=\'./index.html\'">Cerrar sesión</button></footer>'
    );
  }
  function renderNotif() {
    var fails = S.NOTIFICATIONS.filter(function (n) { return n.status === 'NOTIFICATION_FAILED'; }).length;
    var pend = S.NOTIFICATIONS.filter(function (n) { return n.status === 'NOTIFICATION_PENDING'; }).length;
    document.getElementById('bellDot').textContent = String(fails + pend);
    document.getElementById('notifPanel').innerHTML = '<div style="padding:10px 12px"><strong>Notificaciones</strong><div style="font-size:12px;color:var(--text-muted)">FAILED ' + fails + ' + PENDING ' + pend + ' (últimas 10)</div></div><div class="dropdown-separator"></div>' +
      S.NOTIFICATIONS.slice(0, 5).map(function (n) { return '<a class="dropdown-item" href="#/admin/notifications"><span>' + notBadge(n.status) + '</span><span style="font-size:12.5px">' + esc(n.title) + '</span></a>'; }).join('') +
      '<div class="dropdown-separator"></div><a class="dropdown-item" href="#/admin/notifications">Ver todas →</a>';
  }
  function setRole(r) {
    state.role = r;
    document.getElementById('roleAdmin').classList.toggle('active', r === 'admin');
    document.getElementById('roleUser').classList.toggle('active', r === 'user');
    renderUserMenu(); renderNotif(); render();
    toast(r === 'admin' ? 'Modo administrador: acceso completo' : 'Modo usuario: acceso limitado a tus propios recursos');
  }
  function refreshMVs() {
    var b = document.getElementById('mvBtn');
    if (b) { b.textContent = '⟳ refrescando…'; b.disabled = true; }
    setTimeout(function () {
      state.mvLast = new Date().toISOString();
      if (b) { b.textContent = '⟳ Actualizar'; b.disabled = false; }
      renderFoot(); render();
      toast('Datos actualizados');
    }, 900);
  }
  function renderFoot() {
    document.getElementById('appFoot').innerHTML =
      '<span>© 2026 SomnGuard</span>' +
      '<span>Última actualización: ' + ago(state.mvLast) + '</span>' +
      '<a href="#" onclick="event.preventDefault()">Privacidad</a>' +
      '<a href="#" onclick="event.preventDefault()">Términos</a>' +
      '<a href="#" onclick="event.preventDefault()">Contacto</a>';
  }

  /* ---------- router §11 ---------- */
  var ROUTES = [
    ['/admin/dashboard', 'analytics.read'], ['/admin/users', 'user.read'], ['/admin/roles', 'role.read'],
    ['/admin/permissions', 'role.read'], ['/admin/sessions', 'user.read'], ['/admin/password-resets', 'user.read'],
    ['/admin/email-verifications', 'user.read'], ['/admin/login-audit', 'audit.read'],
    ['/admin/catalog/event-categories', 'catalog.read'], ['/admin/catalog/severities', 'catalog.read'],
    ['/admin/catalog/media-types', 'catalog.read'], ['/admin/catalog/sound-patterns', 'catalog.read'],
    ['/admin/catalog/event-types', 'catalog.read'], ['/admin/catalog/statuses', 'catalog.read'],
    ['/admin/catalog/transitions', 'catalog.read'], ['/admin/devices', 'device.read'],
    ['/admin/assignments', 'device.read'], ['/admin/device-configs', 'device.config'],
    ['/admin/provisioning-tokens', 'device.provision'], ['/admin/provisioning-audit', 'audit.read'],
    ['/admin/events', 'event.read'], ['/admin/evidence', 'event.read'], ['/admin/alerts', 'alert.read'],
    ['/admin/notifications', 'notification.read'], ['/admin/analytics-timeline', 'analytics.read'],
    ['/admin/analytics-metrics', 'analytics.read'], ['/admin/reports', 'analytics.report'],
    ['/admin/audit', 'audit.read'], ['/admin/observability', 'audit.read'], ['/admin/settings', 'catalog.read']
  ];
  function matchRoute(path) {
    for (var i = 0; i < ROUTES.length; i++) {
      var base = ROUTES[i][0];
      if (path === base || path.indexOf(base + '/') === 0) return ROUTES[i];
    }
    return null;
  }
  function parseHash() { var raw = (location.hash || '').slice(1); return (raw.split('?')[0] || '/admin/dashboard'); }

  function render() {
    var path = parseHash();
    document.querySelectorAll('.sidebar .nav-link').forEach(function (a) {
      var base = a.getAttribute('data-nav');
      var active = path === base || path.indexOf(base + '/') === 0;
      a.classList.toggle('active', active);
    });
    var app = document.getElementById('app');
    var m = matchRoute(path);
    if (!m) { app.innerHTML = VNotFound(path); }
    else if (!can(m[1])) { app.innerHTML = guardBlock(m[1]); }
    else app.innerHTML = dispatch(path);
    document.body.classList.remove('mobile-nav-open');
    closeNavGroups();
    renderFoot();
    var mc = document.getElementById('main-content'); if (mc && mc.scrollTo) mc.scrollTo(0, 0); window.scrollTo(0, 0);
  }

  function dispatch(path) {
    var V = window.SG_VIEWS || {};
    if (path === '/admin/dashboard' || path === '/') return V.dashboard();
    if (path === '/admin/users') return V.users();
    if (path.indexOf('/admin/users/') === 0) return V.userDetail(path.split('/')[3]);
    if (path === '/admin/roles') return V.roles();
    if (path === '/admin/permissions') return V.permissions();
    if (path === '/admin/sessions') return V.sessions();
    if (path === '/admin/password-resets') return V.resets();
    if (path === '/admin/email-verifications') return V.verifications();
    if (path === '/admin/login-audit') return V.loginAudit();
    if (path === '/admin/catalog/event-categories') return V.catSimple('event-categories');
    if (path === '/admin/catalog/severities') return V.catSimple('severities');
    if (path === '/admin/catalog/media-types') return V.catSimple('media-types');
    if (path === '/admin/catalog/sound-patterns') return V.sounds();
    if (path === '/admin/catalog/event-types') return V.eventTypes();
    if (path.indexOf('/admin/catalog/event-types/') === 0) return V.eventTypeDetail(decodeURIComponent(path.split('/')[4]));
    if (path === '/admin/catalog/statuses') return V.statuses();
    if (path === '/admin/catalog/transitions') return V.transitions();
    if (path === '/admin/devices') return V.devices();
    if (path.indexOf('/admin/devices/') === 0) return V.deviceDetail(path.split('/')[3]);
    if (path === '/admin/assignments') return V.assignments();
    if (path === '/admin/device-configs') return V.configs();
    if (path === '/admin/provisioning-tokens') return V.tokens();
    if (path === '/admin/provisioning-audit') return V.provAudit();
    if (path === '/admin/events') return V.events();
    if (path.indexOf('/admin/events/') === 0) return V.eventDetail(path.split('/')[3]);
    if (path === '/admin/evidence') return V.evidence();
    if (path === '/admin/alerts') return V.alerts();
    if (path === '/admin/notifications') return V.notifications();
    if (path === '/admin/analytics-timeline') return V.timeline();
    if (path === '/admin/analytics-metrics') return V.metrics();
    if (path === '/admin/reports') return V.reports();
    if (path === '/admin/audit') return V.audit();
    if (path === '/admin/observability') return V.observability();
    if (path === '/admin/settings') return V.settings();
    return VNotFound(path);
  }

  function VNotFound(path) {
    if (path === '/403') return '<section class="panel"><div class="error-state"><div><div class="state-icon">403</div><h2>FEATURE_REQUIRED</h2><pre class="code-view">' + esc(JSON.stringify(errEnvelope('FEATURE_REQUIRED', 'Falta feature en JWT', 403), null, 2)) + '</pre></div></div></section>';
    if (path === '/429') return '<section class="panel"><div class="error-state"><div><div class="state-icon">429</div><h2>TOO_MANY_REQUESTS — Retry-After: 60</h2><pre class="code-view">' + esc(JSON.stringify(errEnvelope('TOO_MANY_REQUESTS', '5 req/min/IP. Reintente en 60s.', 429), null, 2)) + '</pre></div></div></section>';
    if (path === '/500') return '<section class="panel"><div class="error-state"><div><div class="state-icon">500</div><h2>DOWNSTREAM_FAILED</h2><pre class="code-view">' + esc(JSON.stringify(errEnvelope('DOWNSTREAM_FAILED', 'Fallo downstream (MinIO/LLM).', 503), null, 2)) + '</pre></div></div></section>';
    return '<section class="panel"><div class="empty-state"><div><div class="state-icon">404</div><h2>Página no encontrada</h2><p>La ruta ' + esc(path) + ' no existe.</p><a class="btn btn-primary" href="#/admin/dashboard">Volver al Dashboard</a></div></div></section>';
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') { closeModal(); closeDrawer(); closeSearch(); toggleMobileNav(false); closeNavGroups(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.user-menu-wrap')) { var u = document.getElementById('userMenu'); if (u) u.classList.add('hidden'); }
    if (!e.target.closest || (!e.target.closest('#notifBtn') && !e.target.closest('#notifPanel'))) { var n = document.getElementById('notifPanel'); if (n) n.classList.add('hidden'); }
    if (!e.target.closest || !e.target.closest('.nav-group')) { closeNavGroups(); }
  });
  window.addEventListener('hashchange', render);

  window.SG = {
    state: state, esc: esc, fmtDT: fmtDT, fmtShort: fmtShort, ago: ago, trunc: trunc, can: can, feats: feats,
    toast: toast, openModal: openModal, closeModal: closeModal, openDrawer: openDrawer, closeDrawer: closeDrawer,
    confirmModal: confirmModal, exportCSV: exportCSV, copyTxt: copyTxt, errEnvelope: errEnvelope,
    deviceBadge: deviceBadge, evBadge: evBadge, userBadge: userBadge, cfgBadge: cfgBadge,
    notBadge: notBadge, sevBadge: sevBadge, outcomeBadge: outcomeBadge, catChip: catChip, permChip: permChip, tech: tech, strip: strip,
    page: page, guardBlock: guardBlock, emptyState: emptyState,
    openSearch: openSearch, closeSearch: closeSearch, searchGo: searchGo,
    toggleCollapse: toggleCollapse, toggleNavGroup: toggleNavGroup, toggleMobileNav: toggleMobileNav, toggleTheme: toggleTheme,
    toggleUserMenu: toggleUserMenu, toggleNotif: toggleNotif, renderUserMenu: renderUserMenu, renderNotif: renderNotif, openAccount: openAccount, logout: logout,
    setRole: setRole, refreshMVs: refreshMVs, renderFoot: renderFoot, render: render, parseHash: parseHash, VIEWS: {}
  };
  window.SG_VIEWS = window.SG_VIEWS || {};
  return window.SG;
})();

/* boot (defer: los views-*.js deben estar cargados antes del primer render) */
window.addEventListener('DOMContentLoaded', function () {
  if (!location.hash || location.hash === '#/') location.hash = '#/admin/dashboard';
  SG.renderUserMenu(); SG.renderNotif(); SG.render();
});
