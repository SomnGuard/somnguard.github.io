/* SomnGuard Admin — §3 Seguridad: users, roles, permissions, sessions, resets, verifications, login-audit */
'use strict';
(function () {
  var V = window.SG_VIEWS;

  /* ---------- /admin/users ---------- */
  V.users = function () {
    var S = SG_SEED, st = SG.state, f = st.fUsers;
    var list = S.USERS.filter(function (u) {
      var q = (f.search || '').toLowerCase();
      if (q && (u.email + ' ' + u.first_name + ' ' + u.last_name + ' ' + (u.phone || '')).toLowerCase().indexOf(q) < 0) return false;
      if (f.status && u.status !== f.status) return false;
      if (f.role && u.roles.indexOf(f.role) < 0) return false;
      if (f.verified === 'si' && !u.email_verified_at) return false;
      if (f.verified === 'no' && u.email_verified_at) return false;
      if (f.locked === 'si' && !u.locked_until) return false;
      if (!f.deleted && u.status === 'USER_SOFT_DELETED') return false;
      return true;
    });
    var tp = Math.max(1, Math.ceil(list.length / st.usersPageSize));
    if (st.usersPage > tp) st.usersPage = tp;
    var rows = list.slice((st.usersPage - 1) * st.usersPageSize, st.usersPage * st.usersPageSize);
    var sel = st.usersSel;
    var body = rows.map(function (u) {
      return '<tr><td><input type="checkbox" ' + (sel.indexOf(u.id) >= 0 ? 'checked' : '') + ' onchange="SGV.toggleUserSel(\'' + u.id + '\')" /></td>' +
        '<td><a href="#/admin/users/' + u.id + '"><strong>' + SG.esc(u.first_name + ' ' + u.last_name) + '</strong></a></td>' +
        '<td style="white-space:nowrap">' + SG.esc(u.email) + '</td><td style="white-space:nowrap">' + SG.esc(u.phone || '—') + '</td><td>' + SG.userBadge(u.status) + '</td>' +
        '<td>' + (u.is_active ? '<span class="status-badge status-success">● TRUE</span>' : '<span class="status-badge status-neutral">● FALSE</span>') + '</td>' +
        '<td style="white-space:nowrap" title="' + SG.fmtDT(u.email_verified_at) + '">' + (u.email_verified_at ? '✅ ' + SG.fmtShort(u.email_verified_at) : '⏳ pendiente') + '</td>' +
        '<td style="white-space:nowrap">' + SG.ago(u.last_login_at) + '</td><td>' + u.failed_attempts + (u.locked_until ? ' 🔒' : '') + '</td>' +
        '<td>' + u.roles.map(function (r) { return '<span class="chip">' + r + '</span>'; }).join(' ') + '</td>' +
        '<td>' + u.devices + '</td><td style="white-space:nowrap">' + SG.fmtShort(u.created_at) + '</td>' +
        '<td><a class="btn btn-secondary btn-sm" href="#/admin/users/' + u.id + '">Ver</a></td></tr>';
    }).join('');

    return SG.page('Usuarios', 'Usuarios', 'Cuentas, perfiles y accesos. ' + SG.permChip('user.read / user.write'),
      (SG.can('user.write') ? '<button class="btn btn-primary" onclick="SGV.userCreate()">+ Nuevo usuario</button>' : '') +
      '<button class="btn btn-secondary btn-sm" onclick="SG.exportCSV(\'users.csv\',SG_SEED.USERS)">Export CSV</button>',
      SG.tech('Ficha técnica', 'Tabla <code>security."user"</code> · <code>email/phone</code> UNIQUE · status parametrizado · soft-delete con ventana 30d · paginación server <code>page/page_size 20·max100</code>.') +
      SG.strip('👥 <b>' + list.length + '</b> en vista · <b>5</b> activos · <b>1</b> suspendido · <b>1</b> pendiente · <b>1</b> bloqueado 🔒') +
      '<form class="card filters" onsubmit="return false" style="grid-template-columns:repeat(4,minmax(0,1fr)) auto auto">' +
      '<div class="form-field"><label>Buscar (email/nombre/phone LIKE)</label><div class="search-input"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input type="search" value="' + SG.esc(f.search) + '" oninput="SG.state.fUsers.search=this.value;SG.state.usersPage=1;SG.render();var i=this;setTimeout(function(){var x=document.querySelector(\'.filters input[type=search]\');if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length);}},0)" /></div></div>' +
      '<div class="form-field"><label>status (4)</label><select onchange="SG.state.fUsers.status=this.value;SG.state.usersPage=1;SG.render()"><option value="">Todos</option>' + ['USER_PENDING_VERIFICATION', 'USER_ACTIVE', 'USER_SUSPENDED', 'USER_SOFT_DELETED'].map(function (o) { return '<option ' + (f.status === o ? 'selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-field"><label>rol</label><select onchange="SG.state.fUsers.role=this.value;SG.state.usersPage=1;SG.render()"><option value="">Todos</option><option ' + (f.role === 'admin' ? 'selected' : '') + '>admin</option><option ' + (f.role === 'user' ? 'selected' : '') + '>user</option></select></div>' +
      '<div class="form-field"><label>verificado / bloqueo</label><select onchange="var v=this.value.split(\'/\');SG.state.fUsers.verified=v[0];SG.state.fUsers.locked=v[1];SG.render()"><option value="/">Todos</option><option value="no/">Sin verificar</option><option value="/si">Bloqueados</option><option value="si/">Verificados</option></select></div>' +
      '<label style="font-size:12.5px;color:var(--text-muted)"><input type="checkbox" ' + (f.deleted ? 'checked' : '') + ' onchange="SG.state.fUsers.deleted=this.checked;SG.render()" /> incluir SOFT_DELETED</label>' +
      '<button class="btn btn-secondary" onclick="SG.state.fUsers={search:\'\',status:\'\',role:\'\',verified:\'\',locked:\'\',deleted:false};SG.state.usersPage=1;SG.render()">Limpiar</button></form>' +
      (sel.length ? '<div class="bulk-bar"><b>' + sel.length + ' seleccionados</b><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Bulk suspender (simulado)\')">Suspender</button><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Bulk reactivar (simulado)\')">Reactivar</button><button class="btn btn-danger-subtle btn-sm" onclick="SG.toast(\'Bulk soft-delete (simulado)\')">Soft-delete</button><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Bulk desbloquear (simulado)\')">Desbloquear</button></div>' : '') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th></th><th>nombre</th><th>email</th><th>phone</th><th>status</th><th>is_active</th><th>verified</th><th>last_login</th><th>fails</th><th>roles</th><th>devs</th><th>created</th><th></th></tr></thead><tbody>' +
      (body || '<tr><td colspan="13" style="text-align:center">Sin resultados.</td></tr>') + '</tbody></table></div>' +
      '<div class="table-footer"><span>' + list.length + ' usuarios · page ' + st.usersPage + '/' + tp + ' (server page/page_size 20·max100)</span><nav class="pagination"><button class="btn btn-secondary btn-sm" ' + (st.usersPage <= 1 ? 'disabled' : '') + ' onclick="SG.state.usersPage--;SG.render()">‹</button><button class="btn btn-secondary btn-sm" ' + (st.usersPage >= tp ? 'disabled' : '') + ' onclick="SG.state.usersPage++;SG.render()">›</button></nav></div></div>');
  };

  /* ---------- /admin/users/:id drawer-page 7 tabs ---------- */
  V.userDetail = function (id) {
    var S = SG_SEED;
    var u = S.USERS.filter(function (x) { return x.id === id; })[0];
    if (!u) return SG.page('Usuarios', 'No encontrado', '', '', '', SG.emptyState('Usuario inexistente', 'ID ' + id, '<a class="btn btn-primary" href="#/admin/users">Volver</a>'));
    var t = SG.state.userTab;
    var tabs = ['Resumen', 'Roles', 'Dispositivos', 'Sesiones', 'Logins', 'Auditoría estado', 'Notificaciones'];
    var logins = S.AUDIT_LOGIN.filter(function (a) { return a.user === u.email; });
    var sess = S.SESSIONS.filter(function (s) { return s.user === u.email; });
    var nots = S.NOTIFICATIONS.filter(function (n) { return n.user === u.email; });
    var devs = S.DEVICES.filter(function (d) { return d.user === u.email; });
    var roles = S.USER_ROLES.filter(function (r) { return r.user === u.email; });
    var body = '';
    if (t === 0) body = '<dl class="detail-grid">' + [['email', u.email], ['first/last', u.first_name + ' ' + u.last_name], ['phone', u.phone || '—'], ['status/category', u.status + ' / ' + u.status_category], ['is_active', String(u.is_active)], ['email_verified_at', SG.fmtDT(u.email_verified_at)], ['last_login_at', SG.fmtDT(u.last_login_at)], ['failed/locked', u.failed_attempts + ' / ' + (u.locked_until ? SG.fmtDT(u.locked_until) : '—')], ['password_hash', '•••••••• (NUNCA visible)'], ['id', u.id], ['created_by/at', u.created_by + ' / ' + SG.fmtDT(u.created_at)], ['version', '7 (optimistic locking)']].map(function (r) { return '<div class="detail-item"><dt>' + r[0] + '</dt><dd>' + SG.esc(r[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="form-actions" style="justify-content:flex-start">' + (SG.can('user.write') ? '<button class="btn btn-secondary" onclick="SG.toast(\'Editar (PATCH + version, sim.)\')">Editar</button><button class="btn btn-danger-subtle" onclick="SGV.userSuspend(\'' + u.id + '\')">' + (u.status === 'USER_SUSPENDED' ? 'Reactivar' : 'Suspender') + '</button><button class="btn btn-danger-subtle" onclick="SGV.userDelete(\'' + u.id + '\')">Soft-delete</button><button class="btn btn-secondary" onclick="SG.toast(\'Desbloqueado: failed=0, locked=NULL (sim.)\')">Desbloquear</button><button class="btn btn-secondary" onclick="SG.toast(\'Reset creado (password_reset_request, sim.)\')">Reset password</button><button class="btn btn-secondary" onclick="SG.toast(\'Sesiones invalidadas (sim.)\')">Invalidar sesiones</button>' : '<span class="chip">solo lectura (user demo)</span>') + '</div>';
    else if (t === 1) body = '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>role</th><th>assigned_at</th><th>expires_at</th><th>assigned_by</th><th>is_active</th><th></th></tr></thead><tbody>' + roles.map(function (r) { return '<tr><td><span class="chip">' + r.role + '</span></td><td>' + SG.fmtDT(r.assigned_at) + '</td><td>' + (r.expires_at ? SG.fmtDT(r.expires_at) : '— NULL=indefinido') + '</td><td>' + SG.esc(r.assigned_by) + '</td><td>TRUE</td><td><button class="btn btn-danger-subtle btn-sm" onclick="SG.toast(\'Rol revocado (soft-delete, sim.)\')">Revocar</button></td></tr>'; }).join('') + '</tbody></table></div><p class="panel-subtitle" style="color:var(--text-muted)">UNIQUE parcial vigente (user+role). ' + (SG.can('role.write') ? '<button class="btn btn-primary btn-sm" onclick="SG.toast(\'Asignar rol (sim.)\')">Asignar rol</button>' : '') + '</p>';
    else if (t === 2) body = '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>serial</th><th>status</th><th>assigned_at</th><th>assigned_by</th></tr></thead><tbody>' + (devs.map(function (d) { return '<tr><td><a href="#/admin/devices/' + d.id + '"><code>' + d.serial + '</code></a></td><td>' + SG.deviceBadge(d.status) + '</td><td>' + SG.fmtDT(d.claimed_at) + '</td><td>admin@somnguard.com</td></tr>'; }).join('') || '<tr><td colspan="4" style="text-align:center">Sin dispositivos.</td></tr>') + '</tbody></table></div>';
    else if (t === 3) body = '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>token_hash</th><th>created</th><th>expires</th><th>revoked</th><th>cadena</th><th>IP/UA</th><th></th></tr></thead><tbody>' + (sess.map(function (s) { return '<tr><td><code>' + s.token_hash + '</code></td><td>' + SG.fmtDT(s.created_at) + '</td><td>' + SG.fmtDT(s.expires_at) + '</td><td>' + (s.revoked_at ? SG.fmtDT(s.revoked_at) : '— vigente') + '</td><td>' + SG.esc(s.replaced_by || '—') + '</td><td>' + s.ip + ' · ' + SG.esc(s.device) + '</td><td><button class="btn btn-danger-subtle btn-sm" onclick="SG.toast(\'Sesión revocada (sim.)\')">Revocar</button></td></tr>'; }).join('') || '<tr><td colspan="7" style="text-align:center">Sin sesiones.</td></tr>') + '</tbody></table></div>';
    else if (t === 4) body = '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>attempted_at</th><th>outcome</th><th>IP</th><th>UA</th></tr></thead><tbody>' + (logins.map(function (a) { return '<tr><td>' + SG.fmtDT(a.attempted_at) + '</td><td>' + SG.outcomeBadge(a.outcome) + '</td><td><code>' + a.ip + '</code></td><td>' + SG.esc(a.ua) + '</td></tr>'; }).join('') || '<tr><td colspan="4" style="text-align:center">Sin logins.</td></tr>') + '</tbody></table></div>';
    else if (t === 5) body = '<div class="timeline">' + SG_SEED.STATUS_AUDIT.filter(function (a) { return a.entity === 'user'; }).map(function (a) { return '<div class="timeline-item"><time>' + SG.fmtDT(a.at) + '</time><span><code>' + a.from + '</code> → <code>' + a.to + '</code> · ' + SG.esc(a.by) + ' · <i>' + SG.esc(a.reason) + '</i></span></div>'; }).join('') + '</div>';
    else body = '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>title</th><th>channel</th><th>status</th><th>sent</th></tr></thead><tbody>' + (nots.map(function (n) { return '<tr><td>' + SG.esc(n.title) + '</td><td><code>' + n.channel + '</code></td><td>' + SG.notBadge(n.status) + '</td><td>' + SG.fmtDT(n.sent_at) + '</td></tr>'; }).join('') || '<tr><td colspan="4" style="text-align:center">Sin notificaciones.</td></tr>') + '</tbody></table></div>';

    return '<a class="back-link" href="#/admin/users">← Volver a Usuarios</a>' + SG.page('Usuarios / detalle', u.first_name + ' ' + u.last_name, u.email + ' · ' + SG.userBadge(u.status), 'user.read',
      '', '<section class="panel"><div class="tabs">' + tabs.map(function (l, i) { return '<button class="tab ' + (t === i ? 'active' : '') + '" onclick="SG.state.userTab=' + i + ';SG.render()">' + l + '</button>'; }).join('') + '</div><div class="panel-body">' + body + '</div></section>');
  };

  /* ---------- /admin/roles ---------- */
  V.roles = function () {
    var S = SG_SEED;
    return SG.page('Roles', 'Roles', 'Solo 2 roles (seeds). ' + SG.permChip('role.read / role.write'),
      (SG.can('role.write') ? '<button class="btn btn-primary" onclick="SGV.roleCreate()">+ Crear rol</button>' : ''),
      SG.tech('Ficha técnica', '<code>security.role</code> · <code>code</code> UNIQUE e inmutable si referenciado (RESTRICT) · desactivar en vez de borrar si tiene usuarios.') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>code</th><th>name</th><th>description</th><th>users</th><th>features</th><th>is_active</th><th></th></tr></thead><tbody>' +
      S.ROLES.map(function (r) { return '<tr><td><strong><code>' + r.code + '</code></strong></td><td>' + SG.esc(r.name) + '</td><td>' + SG.esc(r.description) + '</td><td>' + r.users + '</td><td><span class="status-badge status-info">' + r.features + '</span></td><td>TRUE</td><td><div style="display:flex;gap:6px"><button class="btn btn-secondary btn-sm" onclick="SG.openDrawer(\'<h2>Rol ' + r.code + '</h2><p>users + features del rol (sim.)</p><button class=&quot;btn btn-secondary&quot; onclick=&quot;SG.closeDrawer()&quot;>Cerrar</button>\')">Ver</button>' + (SG.can('role.write') ? '<button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Editar rol (code inmutable si RESTRICT, sim.)\')">Editar</button>' : '') + '</div></td></tr>'; }).join('') +
      '</tbody></table></div><div class="table-footer"><span>2 roles · sin borrado físico</span></div></div>');
  };

  /* ---------- /admin/permissions matriz 2×19 ---------- */
  V.permissions = function () {
    var S = SG_SEED;
    var rows = S.FEATURES.map(function (f) {
      return '<tr><td><strong><code>' + f.module + '.' + f.code + '</code></strong><div style="font-size:11px;color:var(--text-muted)">' + SG.esc(f.name) + '</div></td>' +
        ['admin', 'user'].map(function (r) {
          var has = S.MATRIX[r].indexOf(f.code) >= 0;
          return '<td style="text-align:center">' + (has ? '<span class="matrix-check">✅</span>' : '<span class="matrix-dash">❌</span>') + '</td>';
        }).join('') + '<td><span class="chip">' + f.module + '</span></td></tr>';
    }).join('');
    return SG.page('Permisos', 'Matriz RBAC role × feature', 'Quién puede qué: admin 19 · user 6. Click celda = toggle + auditoría. ' + SG.permChip('role.read (+ role.write editar)'),
      '<button class="btn btn-secondary btn-sm" onclick="SG.exportCSV(\'role_feature.csv\',SG_SEED.FEATURES)">Export CSV</button>',
      SG.tech('Ficha técnica', 'JWT trae <code>roles[] + features[]</code> pre-calculados · sin feature → 403 <code>{"error":{"code":"FEATURE_REQUIRED"}}</code> · tablas: <code>module</code> (6) · <code>feature</code> (19, UNIQUE module+code) · <code>role_feature</code> · <code>user_role</code> (UNIQUE parcial vigente) · propuestas TODO (no en DB): <code>user.delete, role.assign, device.assign, notification.send</code>.') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>feature (module.code.code)</th><th>admin (19)</th><th>user (6)</th><th>módulo</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="table-footer"><span>Tablas: module (6) · feature (19, UNIQUE module+code) · role_feature (UNIQUE role+feature) · user_role (UNIQUE parcial vigente)</span></div></div>');
  };

  /* ---------- /admin/sessions / resets / verifications ---------- */
  V.sessions = function () {
    var S = SG_SEED;
    return SG.page('Sesiones', 'Sesiones activas', 'Refresh tokens y rotación. ' + SG.permChip('user.read'),
      '<button class="btn btn-secondary btn-sm" onclick="SG.exportCSV(\'sessions.csv\',SG_SEED.SESSIONS)">Export CSV</button>',
      SG.tech('Ficha técnica', '<code>security.refresh_token</code> · <code>token_hash</code> truncado, nunca completo · cadena de rotación <code>replaced_by</code>.') +
      SG.strip('🟢 <b>3</b> activas · ⏳ <b>0</b> expiran &lt;24h · ⛔ <b>1</b> revocada') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>user</th><th>token_hash</th><th>created</th><th>expires</th><th>revoked</th><th>replaced_by</th><th>IP/device</th><th></th></tr></thead><tbody>' +
      S.SESSIONS.map(function (s) { return '<tr><td><strong>' + s.user + '</strong></td><td><code>' + s.token_hash + '</code></td><td>' + SG.fmtDT(s.created_at) + '</td><td>' + SG.fmtDT(s.expires_at) + '</td><td>' + (s.revoked_at ? SG.fmtDT(s.revoked_at) : '— vigente') + '</td><td>' + SG.esc(s.replaced_by || '—') + '</td><td>' + s.ip + ' · ' + SG.esc(s.device) + '</td><td><button class="btn btn-danger-subtle btn-sm" onclick="SG.toast(\'Revocado is_active=FALSE (sim.)\')">Revocar</button></td></tr>'; }).join('') +
      '</tbody></table></div></div>');
  };
  V.resets = function () {
    return SG.page('Resets', 'Resets de password', 'Solicitudes de cambio (solo lectura). ' + SG.permChip('user.read'),
      '<button class="btn btn-primary btn-sm" onclick="SG.toast(\'Reset manual creado + email (sim.)\')">Crear reset manual</button>',
      SG.tech('Ficha técnica', 'Expiran en 1h · el token nunca es visible (hash) · invalidar = <code>is_active=FALSE</code>.') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>user</th><th>created</th><th>expires</th><th>is_used/used_at</th><th>is_active</th><th></th></tr></thead><tbody>' +
      SG_SEED.PASSWORD_RESETS.map(function (r) { return '<tr><td><strong>' + r.user + '</strong></td><td>' + SG.fmtDT(r.created_at) + '</td><td>' + SG.fmtDT(r.expires_at) + '</td><td>' + (r.is_used ? '✅ ' + SG.fmtDT(r.used_at) : '⏳ no usado') + '</td><td>' + (r.is_active ? 'TRUE' : 'FALSE') + '</td><td><button class="btn btn-danger-subtle btn-sm" onclick="SG.toast(\'Invalidado is_active=FALSE (sim.)\')">Invalidar</button></td></tr>'; }).join('') + '</tbody></table></div></div>');
  };
  V.verifications = function () {
    return SG.page('Verificaciones', 'Verificaciones de email', 'Confirmaciones de correo pendientes. ' + SG.permChip('user.read'), '',
      SG.tech('Ficha técnica', 'Al borrar un usuario se borran en cascada.') +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>user</th><th>created</th><th>expires</th><th>is_used/used_at</th><th>is_active</th><th></th></tr></thead><tbody>' +
      SG_SEED.EMAIL_VERIFICATIONS.map(function (r) { return '<tr><td><strong>' + r.user + '</strong></td><td>' + SG.fmtDT(r.created_at) + '</td><td>' + SG.fmtDT(r.expires_at) + '</td><td>' + (r.is_used ? '✅ ' + SG.fmtDT(r.used_at) : '⏳ pendiente') + '</td><td>' + (r.is_active ? 'TRUE' : 'FALSE') + '</td><td><div style="display:flex;gap:6px"><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Reenviado (sim.)\')">Reenviar</button><button class="btn btn-danger-subtle btn-sm" onclick="SG.toast(\'Invalidado (sim.)\')">Invalidar</button></div></td></tr>'; }).join('') + '</tbody></table></div></div>');
  };

  /* ---------- /admin/login-audit ---------- */
  V.loginAudit = function () {
    var S = SG_SEED;
    var ok = S.AUDIT_LOGIN.filter(function (a) { return a.outcome === 'SUCCESS'; }).length;
    var bad = S.AUDIT_LOGIN.length - ok;
    return SG.page('Login audit', 'Auditoría de login', 'Intentos de acceso (solo lectura). ' + SG.permChip('audit.read'),
      '<button class="btn btn-secondary btn-sm" onclick="SG.exportCSV(\'audit_login.csv\',SG_SEED.AUDIT_LOGIN)">Export CSV</button>',
      SG.tech('Ficha técnica', '<code>security.audit_login</code> append-only · retención 2 años (job mensual) · <code>user_id</code> NULL si el email no existe · rate 5 req/min/IP → 429 · 5 fallos → <code>locked_until</code> +15min.') +
      '<div class="alert alert-warning">Pico INVALID_CREDENTIALS desde <code>45.10.2.99</code> (2/h) → posible fuerza bruta. [Bloquear IP (propuesto)] [Suspender users]</div>' +
      '<div class="charts-grid"><div class="chart-card"><h3>Éxito vs fallo 24h</h3><div class="donut-row"><span style="min-width:80px">SUCCESS</span><span class="track"><i style="width:' + Math.round(ok / S.AUDIT_LOGIN.length * 100) + '%;background:#45c397"></i></span><b>' + ok + '</b></div><div class="donut-row"><span style="min-width:80px">Fallos</span><span class="track"><i style="width:' + Math.round(bad / S.AUDIT_LOGIN.length * 100) + '%;background:#ef5a6c"></i></span><b>' + bad + '</b></div></div>' +
      '<div class="chart-card"><h3>Top IPs / emails atacados</h3><p>45.10.2.99 ×2 · 192.168.1.30 ×1 · desconocido@ ×2</p><p>Rate login: 5 req/min/IP → 429 + Retry-After:60 · 5 fallos → locked_until +15min</p></div></div>' +
      '<div class="panel"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>attempted_at</th><th>email_attempted</th><th>user</th><th>outcome</th><th>IP</th><th>UA</th><th></th></tr></thead><tbody>' +
      S.AUDIT_LOGIN.map(function (a) { return '<tr><td>' + SG.fmtDT(a.attempted_at) + '</td><td><strong>' + SG.esc(a.email_attempted) + '</strong></td><td>' + SG.esc(a.user || 'NULL (SET NULL)') + '</td><td>' + SG.outcomeBadge(a.outcome) + '</td><td><code>' + a.ip + '</code></td><td>' + SG.esc(a.ua) + '</td><td><button class="btn btn-secondary btn-sm" onclick="SGV.auditPayload(' + a.id + ')">Ver payload</button></td></tr>'; }).join('') +
      '</tbody></table></div><div class="table-footer"><span>Sin edición (solo INSERT/lectura) · filtros email LIKE, outcome(5), IP, rango</span></div></div>');
  };

  /* ---------- acciones ---------- */
  var H = window.SGV = window.SGV || {};
  H.toggleUserSel = function (id) { var s = SG.state.usersSel; var i = s.indexOf(id); if (i >= 0) s.splice(i, 1); else s.push(id); SG.render(); };
  H.userCreate = function () {
    SG.openModal('<header class="modal-header"><h2>Nuevo usuario · POST /users</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header>' +
      '<div class="modal-body"><div class="alert alert-info">password bcrypt12 + política · 409 DUPLICATE_KEY si email/phone existe · NO devuelve password.</div>' +
      '<form id="uform" onsubmit="event.preventDefault();SG.closeModal();SG.toast(\'Usuario creado id=uuid (simulado)\')"><div class="form-grid"><div class="form-field full"><label>email* (UNIQUE)</label><input required type="email" placeholder="nombre@somnguard.com" /></div>' +
      '<div class="form-field"><label>first_name*</label><input required /></div><div class="form-field"><label>last_name*</label><input required /></div>' +
      '<div class="form-field"><label>password* (bcrypt12)</label><input required type="password" /></div><div class="form-field"><label>phone (UNIQUE opcional)</label><input placeholder="+57 300 000 0000" /></div>' +
      '<div class="form-field"><label>roles[]</label><select multiple><option selected>user</option><option>admin</option></select></div><div class="form-field"><label>status</label><select><option>USER_PENDING_VERIFICATION</option><option>USER_ACTIVE</option></select></div></div></form></div>' +
      '<footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="document.getElementById(\'uform\').requestSubmit()">Crear</button></footer>');
  };
  H.userSuspend = function (id) { SG.confirmModal('Cambiar estado usuario', 'USER_ACTIVE ↔ USER_SUSPENDED [admin] · registra user_status_audit + actor + motivo. Nunca DELETE físico.', 'Confirmar', 'SG.closeModal();SG.toast(\'Estado cambiado (simulado)\')'); };
  H.userDelete = function (id) { SG.confirmModal('Soft-delete usuario', 'is_active=FALSE · status=USER_SOFT_DELETED · deleted_at=NOW · ventana 30d recuperación · invalida sesiones.', 'Soft-delete', 'SG.closeModal();SG.toast(\'Soft-delete aplicado (simulado)\')'); };
  H.roleCreate = function () { SG.openModal('<header class="modal-header"><h2>Crear rol · Admin total</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header><div class="modal-body"><div class="form-field"><label>code* (snake, inmutable)</label><input placeholder="flota_manager" /></div><div class="form-field"><label>name*</label><input /></div><div class="form-field"><label>description</label><input /></div></div><footer class="modal-footer"><button class="btn btn-secondary" onclick="SG.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="SG.closeModal();SG.toast(\'Rol creado (simulado)\')">Crear</button></footer>'); };
  H.auditPayload = function (id) {
    var a = SG_SEED.AUDIT_LOGIN.filter(function (x) { return x.id === id; })[0]; if (!a) return;
    SG.openModal('<header class="modal-header"><h2>Detalle auditoría #' + a.id + ' (mock)</h2><button class="icon-btn" onclick="SG.closeModal()">✕</button></header><div class="modal-body"><div style="margin-bottom:10px">' + SG.outcomeBadge(a.outcome) + '</div><dl class="detail-grid"><div class="detail-item"><dt>email_attempted</dt><dd>' + SG.esc(a.email_attempted) + '</dd></div><div class="detail-item"><dt>user_id</dt><dd>' + SG.esc(a.user || 'NULL') + '</dd></div><div class="detail-item"><dt>IP / UA</dt><dd>' + a.ip + ' · ' + SG.esc(a.ua) + '</dd></div></dl><h3>Payload</h3><pre class="code-view">' + SG.esc(JSON.stringify(a)) + '</pre></div><footer class="modal-footer"><button class="btn btn-primary" onclick="SG.closeModal()">Cerrar</button></footer>', true);
  };
})();
