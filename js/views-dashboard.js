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
      return '<div class="bar"><div class="seg critical" style="height:' + Math.round(m.critical / 32 * 100) + '%" title="critical ' + m.critical + '"></div>' +
        '<div class="seg high" style="height:' + Math.round(m.high / 32 * 100) + '%" title="high ' + m.high + '"></div>' +
        '<div class="seg rest" style="height:' + Math.round(tot / 32 * 100) + '%" title="resto ' + tot + '"></div><b>' + m.date.slice(8) + '</b></div>';
    }).join('') + '</div>';
  }

  V.dashboard = function () {
    var S = SG_SEED;
    var total = S.DEVICES.length;
    var activos = S.DEVICES.filter(function (d) { return d.status === 'DEVICE_ACTIVE'; }).length;
    var offline = S.DEVICES.filter(function (d) { return d.status === 'DEVICE_OFFLINE'; }).length;
    var evHoy = S.EVENTS.filter(function (e) { return e.occurred_at.slice(0, 10) === '2026-09-09'; });
    var crit = S.EVENTS.filter(function (e) { return e.severity === 'critical'; }).length;
    var high = S.EVENTS.filter(function (e) { return e.severity === 'high'; }).length;
    var offPct = Math.round(S.EVENTS.filter(function (e) { return e.offline; }).length / S.EVENTS.length * 100);
    var fails = S.NOTIFICATIONS.filter(function (n) { return n.status === 'NOTIFICATION_FAILED'; }).length;
    var pendingNot = S.NOTIFICATIONS.filter(function (n) { return n.status === 'NOTIFICATION_PENDING'; }).length;
    var badLog = S.AUDIT_LOGIN.filter(function (a) { return a.outcome === 'INVALID_CREDENTIALS'; }).length;

    var deviceStatus = '<div class="kpi-status-row">' +
      '<span class="mini-status success"><i></i>' + activos + ' activos</span>' +
      '<span class="mini-status danger"><i></i>' + offline + ' offline</span>' +
      '</div>';

    var kpiHtml = '<section class="kpi-grid kpi-grid-clean kpi-grid-three">' +
      '<a class="kpi-card kpi-card-clean" href="#/admin/devices"><div class="kpi-top"><span class="kpi-label">Dispositivos</span><span class="kpi-icon teal">⌁</span></div><div class="kpi-value">' + total + '</div>' + deviceStatus + '<div class="kpi-foot"><span>Dispositivos registrados</span><strong>Ver dispositivos →</strong></div></a>' +
      '<a class="kpi-card kpi-card-clean" href="#/admin/events"><div class="kpi-top"><span class="kpi-label">Eventos</span><span class="kpi-icon blue">◷</span></div><div class="kpi-value">' + S.EVENTS.length + '</div><div class="kpi-detail"><b>' + crit + '</b> críticos · <b>' + high + '</b> altos · <b>' + evHoy.length + '</b> hoy · <b>' + offPct + '%</b> offline sync</div><div class="kpi-foot"><span>Incluye sus alertas</span><strong>Ver eventos →</strong></div></a>' +
      '<a class="kpi-card kpi-card-clean" href="#/admin/notifications"><div class="kpi-top"><span class="kpi-label">Notificaciones</span><span class="kpi-icon amber">↗</span></div><div class="kpi-value">' + S.NOTIFICATIONS.length + '</div><div class="kpi-detail"><b>2</b> entregadas · <b>1</b> enviado · <b>' + pendingNot + '</b> pendiente · <b>' + fails + '</b> fallida</div><div class="kpi-foot"><span class="trend-' + (fails ? 'down' : 'up') + '">' + (fails ? 'Entrega requiere atención' : 'Entrega estable') + '</span><strong>Ver cola →</strong></div></a>' +
      '</section>';

    var timeline = S.EVENTS.slice(0, 6).map(function (e) {
      var severity = e.severity === 'critical' ? 'critical' : (e.severity === 'high' ? 'high' : 'info');
      return '<a class="event-row" href="#/admin/events/' + e.id + '">' +
        '<span class="event-marker ' + severity + '"></span>' +
        '<span class="event-main"><strong>' + e.type + '</strong><span>' + SG.esc(e.type_name) + ' · <code>' + SG.esc(e.serial) + '</code></span></span>' +
        '<span class="event-status">' + SG.sevBadge(e.severity) + (e.offline ? '<span class="chip chip-soft">offline</span>' : '') + '</span>' +
        '<time>' + SG.fmtDT(e.occurred_at) + '</time>' +
        '</a>';
    }).join('');

    var security = S.AUDIT_LOGIN.filter(function (a) { return a.outcome !== 'SUCCESS'; }).slice(0, 4).map(function (a) {
      return '<div class="security-row"><div><span class="security-dot"></span><strong>' + SG.esc(a.email_attempted) + '</strong><span class="security-meta">' + SG.esc(a.ip) + '</span></div><div>' + SG.outcomeBadge(a.outcome) + '<span class="security-time">' + SG.fmtShort(a.attempted_at) + '</span></div></div>';
    }).join('');


    var categoryRows = [
      ['Somnolencia', 45, 'red'],
      ['Distracción', 30, 'amber'],
      ['Sistema', 18, 'blue'],
      ['Cinturón', 7, 'green']
    ].map(function (r) {
      return '<div class="distribution-row"><div class="distribution-head"><span>' + r[0] + '</span><strong>' + r[1] + '%</strong></div><div class="distribution-track"><i class="' + r[2] + '" style="width:' + r[1] + '%"></i></div></div>';
    }).join('');

    return SG.page('Dashboard', 'Dashboard', 'Resumen operativo de dispositivos, eventos y alertas.', '',
      (offline / total > 0.2 ? '<div class="alert alert-critical dashboard-alert"><span class="alert-dot"></span><div><strong>Conectividad degradada</strong><span>' + offline + ' de ' + total + ' dispositivos están offline.</span></div><a href="#/admin/devices?status=DEVICE_OFFLINE">Revisar dispositivos →</a></div>' : '') +
      kpiHtml +
      '<section class="dashboard-grid dashboard-grid-top">' +
        '<div class="chart-card dashboard-card chart-card-large"><div class="section-head"><div><h2>Actividad de eventos</h2><p>Eventos registrados durante los últimos 7 días.</p></div><a href="#/admin/analytics-metrics">Ver detalle →</a></div>' + bars30() + '<div class="chart-legend"><span><i class="legend-box critical"></i>Crítico</span><span><i class="legend-box high"></i>High</span><span><i class="legend-box rest"></i>Resto</span></div></div>' +
        '<div class="chart-card dashboard-card"><div class="section-head"><div><h2>Distribución</h2><p>Eventos por categoría.</p></div></div>' + categoryRows + '<div class="distribution-total"><span>Total analizado</span><strong>' + S.EVENTS.length + '</strong></div></div>' +
      '</section>' +
      '<section class="dashboard-grid dashboard-grid-middle">' +
        '<div class="panel dashboard-panel"><div class="panel-header dashboard-panel-header"><div><h2 class="panel-title">Eventos recientes</h2><p class="panel-subtitle">Últimos eventos registrados</p></div><a class="btn btn-secondary btn-sm" href="#/admin/events">Ver todos</a></div><div class="event-list">' + timeline + '</div></div>' +
        '<div class="panel dashboard-panel"><div class="panel-header dashboard-panel-header"><div><h2 class="panel-title">Seguridad · 24h</h2><p class="panel-subtitle">Intentos de acceso no exitosos</p></div><a class="btn btn-secondary btn-sm" href="#/admin/login-audit">Auditoría</a></div><div class="security-list">' + (security || '<div class="empty-inline">Sin eventos de seguridad.</div>') + '</div><div class="security-summary"><span><strong>' + badLog + '</strong> credenciales inválidas</span><span>IP con mayor actividad: <code>45.10.2.99</code></span></div></div>' +
      '</section>' +
      '<div class="dashboard-footnote"><span>Datos actualizados ' + SG.ago(SG.state.mvLast) + '</span><a href="#/admin/evidence">Gestionar evidencia →</a></div>');
  };
})();
