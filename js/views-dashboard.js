/* SomnGuard Admin — §2 Dashboard Admin (/admin/dashboard, analytics.read) */
'use strict';
(function () {
  var V = window.SG_VIEWS;

  function spark(vals, hot) {
    var mx = Math.max.apply(null, vals.concat([1]));
    return '<div class="spark">' + vals.map(function (v) {
      return '<i class="' + (hot && v >= mx * 0.8 ? 'hot' : (v >= mx * 0.55 ? 'warm' : '')) + '" style="height:' + Math.max(8, Math.round(v / mx * 100)) + '%"></i>';
    }).join('') + '</div>';
  }
  function bars30() {
    var S = SG_SEED;
    return '<div class="bars">' + S.METRICS_DAILY.map(function (m) {
      var tot = Math.max(m.total - m.critical - m.high, 0);
      return '<div class="bar"><div class="seg" style="height:' + Math.round(m.critical / 32 * 100) + '%;background:#ef5a6c" title="critical ' + m.critical + '"></div>' +
        '<div class="seg" style="height:' + Math.round(m.high / 32 * 100) + '%;background:#f2a154" title="high ' + m.high + '"></div>' +
        '<div class="seg" style="height:' + Math.round(tot / 32 * 100) + '%;background:rgba(0,200,200,.55)" title="resto ' + tot + '"></div><b>' + m.date.slice(8) + '</b></div>';
    }).join('') + '</div>';
  }

  V.dashboard = function () {
    var S = SG_SEED, st = SG.state;
    var total = S.DEVICES.length;
    var activos = S.DEVICES.filter(function (d) { return d.status === 'DEVICE_ACTIVE'; }).length;
    var offline = S.DEVICES.filter(function (d) { return d.status === 'DEVICE_OFFLINE'; }).length;
    var susp = S.DEVICES.filter(function (d) { return d.status === 'DEVICE_SUSPENDED'; }).length;
    var stock = S.DEVICES.filter(function (d) { return !d.user; }).length;
    var evHoy = S.EVENTS.filter(function (e) { return e.occurred_at.slice(0, 10) === '2026-09-09'; });
    var crit = S.EVENTS.filter(function (e) { return e.severity === 'critical'; }).length;
    var high = S.EVENTS.filter(function (e) { return e.severity === 'high'; }).length;
    var offPct = Math.round(S.EVENTS.filter(function (e) { return e.offline; }).length / S.EVENTS.length * 100);
    var fails = S.NOTIFICATIONS.filter(function (n) { return n.status === 'NOTIFICATION_FAILED'; }).length;
    var usersAct = S.USERS.filter(function (u) { return u.status === 'USER_ACTIVE'; }).length;
    var pend = S.USERS.filter(function (u) { return u.status === 'USER_PENDING_VERIFICATION'; }).length;
    var locked = S.USERS.filter(function (u) { return u.locked_until; }).length;
    var badLog = S.AUDIT_LOGIN.filter(function (a) { return a.outcome === 'INVALID_CREDENTIALS'; }).length;
    var tokAct = S.PROV_TOKENS.filter(function (t) { return !t.revoked_at && t.uses < t.max; }).length;
    var noEv = S.EVENTS.filter(function (e) { return !e.evidence; }).length;
    var totals = S.METRICS_DAILY.map(function (m) { return m.total; });
    var crits = S.METRICS_DAILY.map(function (m) { return m.critical; });

    var kpis = [
      { t: 'Dispositivos', v: total, s: activos + ' activos · ' + offline + ' offline · ' + susp + ' susp · ' + stock + ' sin asignar', d: '↑ 12% vs ayer', up: true, sp: [4, 5, 5, 6, 6, 7, 8], h: '#/admin/devices?status=DEVICE_OFFLINE' },
      { t: 'Eventos hoy', v: evHoy.length, s: crit + ' críticos · ' + high + ' high · ' + offPct + '% offline_sync', d: '↑ 8% vs ayer', up: true, sp: totals, h: '#/admin/events' },
      { t: 'Alertas críticas 7d', v: crit, s: 'top EV-SOM-05 Microsueño · AS-04', d: '↓ 4% vs semana ant.', up: false, sp: crits, h: '#/admin/alerts' },
      { t: 'Notificaciones', v: S.NOTIFICATIONS.length, s: fails + ' FAILED + retry queue', d: fails ? '↓ entrega 96%' : 'entrega 100%', up: !fails, sp: [3, 4, 2, 5, 3, 4, 5], h: '#/admin/notifications' },
      { t: 'Usuarios', v: usersAct + ' activos', s: pend + ' pendientes · ' + locked + ' bloqueados · 1 soft-deleted', d: 'estable', up: true, sp: [6, 6, 7, 7, 8, 8, 8], h: '#/admin/users' },
      { t: 'Seguridad 24h', v: badLog + ' fallidos', s: 'INVALID_CREDENTIALS · 1 ACCOUNT_LOCKED', d: 'pico IP 45.10.2.99', up: false, sp: [0, 1, 1, 2, 1, 2, 3], h: '#/admin/login-audit' },
      { t: 'Provisioning', v: tokAct + ' tokens activos', s: '1 por expirar 48h · 1 revocado', d: 'cola ok', up: true, sp: [1, 2, 2, 3, 3, 2, 2], h: '#/admin/provisioning-tokens' },
      { t: 'Evidencia / MinIO', v: noEv + ' sin evidencia', s: 'bucket somnguard-evidence · 0 errores checksum', d: 'retención 90d/5a', up: true, sp: [2, 3, 2, 4, 3, 4, 3], h: '#/admin/evidence' }
    ];
    var kpiHtml = '<div class="kpi-grid">' + kpis.map(function (k) {
      return '<div class="kpi-card" onclick="location.href=\'' + k.h + '\'"><h4>' + k.t + '</h4><div class="kpi-val">' + k.v + '</div>' +
        '<div class="kpi-sub">' + k.s + '</div><div class="kpi-sub kpi-delta ' + (k.up ? 'up' : 'down') + '">' + k.d + ' · Ver →</div>' + spark(k.sp, true) + '</div>';
    }).join('') + '</div>';

    var tl = S.EVENTS.slice(0, 8).map(function (e) {
      return '<div class="timeline-item"><time>' + SG.fmtDT(e.occurred_at) + '</time><span class="dot ' + e.severity + '"></span>' +
        '<span><strong>' + e.type + '</strong> ' + SG.esc(e.type_name) + ' · <code>' + e.serial + '</code> ' + SG.sevBadge(e.severity) +
        (e.offline ? ' <span class="chip">offline</span>' : '') + (e.evidence ? ' <span class="ev-thumb">🖼</span>' : ' <span class="chip">sin evidencia</span>') +
        ' <a href="#/admin/events/' + e.id + '">ver</a></span></div>';
    }).join('');

    var need = S.DEVICES.filter(function (d) { return d.status === 'DEVICE_OFFLINE' || d.status === 'DEVICE_SUSPENDED' || !d.user; })
      .map(function (d) {
        return '<tr><td><strong><code>' + d.serial + '</code></strong></td><td>' + SG.deviceBadge(d.status) + '</td><td>' + (d.heartbeat ? SG.ago(d.heartbeat) : 'nunca') + '</td><td>' + SG.esc(d.firmware) + '</td><td>' + SG.esc(d.user || '—') + '</td>' +
          '<td><div style="display:flex;gap:6px"><a class="btn btn-secondary btn-sm" href="#/admin/devices/' + d.id + '">Ver</a>' +
          (SG.can('device.write') ? '<button class="btn btn-danger-subtle btn-sm" onclick="SG.confirmModal(\'Suspender ' + d.serial + '\',\'DEVICE_ACTIVE→DEVICE_SUSPENDED [admin] + motivo auditado.\',\'Suspender\',\'SG.closeModal();SG.toast(\\\'Device suspendido (simulado)\\\')\')">Suspender</button>' : '') + '</div></td></tr>';
      }).join('');

    var failsHtml = S.NOTIFICATIONS.filter(function (n) { return n.status === 'NOTIFICATION_FAILED' || n.retry > 0; })
      .map(function (n) { return '<tr><td>' + SG.esc(n.title) + '</td><td>' + SG.esc(n.user) + '</td><td><code>' + n.channel + '</code></td><td>retry ' + n.retry + '/3</td><td style="color:#ffa9b3">' + SG.esc(n.error || '—') + '</td><td><button class="btn btn-secondary btn-sm" onclick="SG.toast(\'Reintento ' + n.id + ' (retry++ exponencial, sim.)\')">Reintentar</button></td></tr>'; }).join('');

    var suspHtml = S.AUDIT_LOGIN.filter(function (a) { return a.outcome !== 'SUCCESS'; }).slice(0, 4)
      .map(function (a) { return '<tr><td><strong>' + SG.esc(a.email_attempted) + '</strong></td><td><code>' + a.ip + '</code></td><td>' + SG.outcomeBadge(a.outcome) + '</td><td>' + SG.fmtDT(a.attempted_at) + '</td><td><a class="btn btn-secondary btn-sm" href="#/admin/login-audit">Ver audit</a></td></tr>'; }).join('');

    return SG.page('Dashboard', 'Dashboard Admin', 'Salud de flota, riesgo y fallos en 10 segundos. ' + SG.permChip('analytics.read'),
      '<select onchange="SG.state.dashRange=this.value;SG.render()" title="Rango"><option>Hoy</option><option selected>7d</option><option>30d</option><option>90d</option></select>' +
      '<button class="btn btn-secondary btn-sm" onclick="SG.refreshMVs()">⟳ Actualizar</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="SG.exportCSV(\'dashboard-kpis.csv\',SG_SEED.METRICS_DAILY)">Exportar CSV</button>',
      SG.tech('Ficha técnica', 'Fuentes: <code>v_metrics_daily</code> + <code>v_event_timeline</code> + heartbeat + notification + audit_login · pg_cron 5min/1h · p95 &lt;500ms @10k.') +
      (offline / total > 0.2 ? '<div class="alert alert-critical">Se detectó una caída masiva de conectividad: más del 20% de la flota está sin heartbeat.</div>' : '') +
      kpiHtml +
      '<div class="charts-grid"><div class="chart-card"><h3>Serie 7d apilada por severity</h3><p>v_metrics_daily · tooltip fecha/total/critical/high · Export PNG/CSV</p>' + bars30() +
      '<div style="display:flex;gap:8px;font-size:12px;color:var(--text-muted)"><span>■ critical</span><span>■ high</span><span>■ resto</span></div></div>' +
      '<div class="chart-card"><h3>Donut por categoría</h3><p>SOMNOLENCE / DISTRACTION / SEATBELT / SYSTEM</p>' +
      [['SOMNOLENCE', 45, '#ef5a6c'], ['DISTRACTION', 30, '#f2a154'], ['SYSTEM', 18, '#6c90f0'], ['SEATBELT', 7, '#45c397']].map(function (r) {
        return '<div class="donut-row"><span style="min-width:110px">' + r[0] + '</span><span class="track"><i style="width:' + r[1] + '%;background:' + r[2] + '"></i></span><b>' + r[1] + '%</b></div>';
      }).join('') + '<h3 style="margin-top:12px">Top event_types</h3><p>EV-SOM-05 ×4 · EV-DIS-02 ×2 · EV-SOM-02 ×2</p></div></div>' +
      '<div class="panel"><div class="panel-header"><div><h2 class="panel-title">Timeline reciente (v_event_timeline)</h2><p class="panel-subtitle">Últimos eventos occurred_at DESC · click abre drawer</p></div><a class="btn btn-secondary btn-sm" href="#/admin/events">Ver todos</a></div><div class="timeline">' + tl + '</div></div>' +
      '<div class="charts-grid" style="margin-top:14px"><div class="chart-card"><h3>Devices que necesitan atención</h3><p>offline &gt;5min · stock sin reclamar · firmware desactualizado</p><div class="data-table-wrap"><table class="data-table"><thead><tr><th>serial</th><th>status</th><th>heartbeat</th><th>fw</th><th>user</th><th></th></tr></thead><tbody>' + need + '</tbody></table></div></div>' +
      '<div class="chart-card"><h3>Notificaciones fallidas</h3><p>FAILED + retry queue</p><div class="data-table-wrap"><table class="data-table"><thead><tr><th>título</th><th>user</th><th>ch</th><th>retry</th><th>error</th><th></th></tr></thead><tbody>' + (failsHtml || '<tr><td colspan="6">Sin fallos 🎉</td></tr>') + '</tbody></table></div>' +
      '<h3 style="margin-top:12px">Logins sospechosos</h3><div class="data-table-wrap"><table class="data-table"><thead><tr><th>email</th><th>IP</th><th>outcome</th><th>cuándo</th><th></th></tr></thead><tbody>' + suspHtml + '</tbody></table></div>' +
      '<div class="alert alert-warning" style="margin:10px 0 0">Aumento de intentos de acceso fallidos desde <code>45.10.2.99</code> — posible ataque de fuerza bruta. <button class="btn btn-secondary btn-sm" style="margin-left:6px" onclick="SG.toast(\'IP bloqueada\')">Bloquear IP</button></div></div></div>');
  };
})();
