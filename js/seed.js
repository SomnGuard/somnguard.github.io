/* ============================================================================
 * SomnGuard Admin — seed.js
 * Datos literales 1:1 de somnguard-db (02_dml/00_inserts 001..012) + API + docs.
 * Corrige errores del mockup v1:
 *  - v1 tenia 17 features y matriz user incorrecta -> aqui 19 + user correcto (6).
 *  - v1 media video 10MB -> aqui 50MB (003).
 *  - v1 solo 6 sonidos / 6 tipos evento -> aqui 9 AS + 18 EV completos.
 *  - v1 sin claim_code / provisioning tokens -> aqui CLM- + tokens + audit.
 *  - v1 sin notifications / analytics MVs / status_transition -> aqui incluidos.
 * Todo es estatico (sin backend). Los "secretos" solo se muestran 1 vez al crear.
 * ========================================================================== */
'use strict';

var SG_SEED = (function () {
  var SYS = '00000000-0000-0000-0000-000000000000';

  /* ---- 010 modules (6) ---- */
  var MODULES = [
    { code: 'security', name: 'Seguridad', description: 'Autenticacion, autorizacion y auditoria' },
    { code: 'device_management', name: 'Gestion de Dispositivos', description: 'Registro, asignacion y configuracion de dispositivos' },
    { code: 'telemetry', name: 'Telemetria', description: 'Ingesta y procesamiento de eventos' },
    { code: 'monitoring', name: 'Monitoreo', description: 'Notificaciones y alertas' },
    { code: 'analytics', name: 'Analitica', description: 'Reportes, metricas y dashboards' },
    { code: 'parameterization', name: 'Parametrizacion', description: 'Catalogos configurables del sistema' }
  ];

  /* ---- 011 features (19) formato module.code.code ---- */
  var FEATURES = [
    { module: 'security', code: 'user.read', name: 'Leer usuarios', desc: 'Ver lista y detalles de usuarios' },
    { module: 'security', code: 'user.write', name: 'Escribir usuarios', desc: 'Crear, actualizar, eliminar usuarios' },
    { module: 'security', code: 'role.read', name: 'Leer roles', desc: 'Ver roles y permisos' },
    { module: 'security', code: 'role.write', name: 'Escribir roles', desc: 'Gestionar roles y asignaciones' },
    { module: 'security', code: 'audit.read', name: 'Leer auditoria', desc: 'Ver logs de auditoria y login' },
    { module: 'device_management', code: 'device.read', name: 'Leer dispositivos', desc: 'Ver dispositivos y asignaciones' },
    { module: 'device_management', code: 'device.write', name: 'Escribir dispositivos', desc: 'Registrar, asignar, configurar dispositivos' },
    { module: 'device_management', code: 'device.config', name: 'Configurar dispositivos', desc: 'Gestionar configuracion remota' },
    { module: 'device_management', code: 'device.provision', name: 'Aprovisionar dispositivos', desc: 'Crear tokens de aprovisionamiento (solo admin)' },
    { module: 'device_management', code: 'device.claim', name: 'Reclamar dispositivos', desc: 'Reclamar dispositivo con claim_code (admin+user)' },
    { module: 'telemetry', code: 'event.read', name: 'Leer eventos', desc: 'Consultar eventos y evidencias' },
    { module: 'telemetry', code: 'event.write', name: 'Escribir eventos', desc: 'Ingestar eventos (device)' },
    { module: 'telemetry', code: 'alert.read', name: 'Leer alarmas', desc: 'Ver historico de alarmas' },
    { module: 'monitoring', code: 'notification.read', name: 'Leer notificaciones', desc: 'Ver notificaciones propias' },
    { module: 'monitoring', code: 'notification.write', name: 'Escribir notificaciones', desc: 'Enviar notificaciones (sistema)' },
    { module: 'analytics', code: 'analytics.read', name: 'Leer analiticas', desc: 'Ver reportes y metricas' },
    { module: 'analytics', code: 'analytics.report', name: 'Generar reportes', desc: 'Crear y exportar reportes' },
    { module: 'parameterization', code: 'catalog.read', name: 'Leer catalogos', desc: 'Ver catalogos de parametrizacion' },
    { module: 'parameterization', code: 'catalog.write', name: 'Escribir catalogos', desc: 'Gestionar catalogos (admin)' }
  ];

  var ALL_19 = FEATURES.map(function (f) { return f.code; });
  /* 012: admin = CROSS JOIN (19). user = 6 exactos. */
  var USER_6 = ['user.read', 'device.read', 'device.claim', 'event.read', 'notification.read', 'analytics.read'];
  var MATRIX = { admin: ALL_19.slice(), user: USER_6.slice() };

  var ROLES = [
    { code: 'admin', name: 'Administrador', description: 'Acceso completo al sistema', features: 19, users: 2 },
    { code: 'user', name: 'Usuario', description: 'Acceso estandar al sistema', features: 6, users: 6 }
  ];

  /* ---- 009 roles + usuarios demo (8) ---- */
  var USERS = [
    { id: 'a1b2c3d4-0001-4001-8001-000000000001', first_name: 'Admin', last_name: 'SomnGuard', email: 'admin@somnguard.com', phone: '+57 601 555 0100', roles: ['admin'], status: 'USER_ACTIVE', status_category: 'ACTIVE', is_active: true, email_verified_at: '2026-01-10T10:00:00', last_login_at: '2026-09-08T08:42:00', failed_attempts: 0, locked_until: null, devices: 0, created_at: '2026-01-10T10:00:00', created_by: SYS },
    { id: 'a1b2c3d4-0002-4002-8002-000000000002', first_name: 'Carolina', last_name: 'Mendoza', email: 'carolina.mendoza@somnguard.com', phone: '+57 310 555 0101', roles: ['user'], status: 'USER_ACTIVE', status_category: 'ACTIVE', is_active: true, email_verified_at: '2026-02-14T09:30:00', last_login_at: '2026-09-07T22:10:00', failed_attempts: 0, locked_until: null, devices: 1, created_at: '2026-02-14T09:30:00', created_by: SYS },
    { id: 'a1b2c3d4-0003-4003-8003-000000000003', first_name: 'Diego', last_name: 'Torres', email: 'diego.torres@somnguard.com', phone: '+57 311 555 0102', roles: ['admin'], status: 'USER_ACTIVE', status_category: 'ACTIVE', is_active: true, email_verified_at: '2026-03-01T11:20:00', last_login_at: '2026-09-07T17:05:00', failed_attempts: 1, locked_until: null, devices: 0, created_at: '2026-03-01T11:20:00', created_by: SYS },
    { id: 'a1b2c3d4-0004-4004-8004-000000000004', first_name: 'Laura', last_name: 'Pineda', email: 'laura.pineda@somnguard.com', phone: '+57 312 555 0103', roles: ['user'], status: 'USER_ACTIVE', status_category: 'ACTIVE', is_active: true, email_verified_at: '2026-03-20T08:00:00', last_login_at: '2026-09-08T06:55:00', failed_attempts: 0, locked_until: null, devices: 1, created_at: '2026-03-20T08:00:00', created_by: SYS },
    { id: 'a1b2c3d4-0005-4005-8005-000000000005', first_name: 'Andres', last_name: 'Rios', email: 'andres.rios@somnguard.com', phone: '+57 313 555 0104', roles: ['user'], status: 'USER_ACTIVE', status_category: 'ACTIVE', is_active: true, email_verified_at: '2026-04-02T14:10:00', last_login_at: '2026-09-06T21:33:00', failed_attempts: 3, locked_until: null, devices: 1, created_at: '2026-04-02T14:10:00', created_by: SYS },
    { id: 'a1b2c3d4-0006-4006-8006-000000000006', first_name: 'Sofia', last_name: 'Herrera', email: 'sofia.herrera@somnguard.com', phone: '+57 314 555 0105', roles: ['user'], status: 'USER_SUSPENDED', status_category: 'INACTIVE', is_active: true, email_verified_at: null, last_login_at: '2026-08-28T19:00:00', failed_attempts: 5, locked_until: '2026-09-09T10:00:00', devices: 0, created_at: '2026-04-18T10:40:00', created_by: SYS },
    { id: 'a1b2c3d4-0007-4007-8007-000000000007', first_name: 'Felipe', last_name: 'Gomez', email: 'felipe.gomez@somnguard.com', phone: '+57 315 555 0106', roles: ['user'], status: 'USER_PENDING_VERIFICATION', status_category: 'PENDING', is_active: true, email_verified_at: null, last_login_at: '2026-08-30T09:12:00', failed_attempts: 0, locked_until: null, devices: 1, created_at: '2026-05-05T16:00:00', created_by: SYS },
    { id: 'a1b2c3d4-0008-4008-8008-000000000008', first_name: 'Valentina', last_name: 'Castro', email: 'valentina.castro@somnguard.com', phone: null, roles: ['user'], status: 'USER_SOFT_DELETED', status_category: 'ARCHIVED', is_active: false, email_verified_at: '2026-05-22T09:15:00', last_login_at: '2026-08-29T07:45:00', failed_attempts: 0, locked_until: null, devices: 0, created_at: '2026-05-22T09:15:00', created_by: SYS, deleted_at: '2026-09-01T10:00:00' }
  ];

  var USER_ROLES = [
    { user: 'admin@somnguard.com', role: 'admin', assigned_at: '2026-01-10T10:00:00', expires_at: null, is_active: true, assigned_by: 'system' },
    { user: 'carolina.mendoza@somnguard.com', role: 'user', assigned_at: '2026-02-14T09:30:00', expires_at: null, is_active: true, assigned_by: 'admin@somnguard.com' },
    { user: 'diego.torres@somnguard.com', role: 'admin', assigned_at: '2026-03-01T11:20:00', expires_at: null, is_active: true, assigned_by: 'admin@somnguard.com' },
    { user: 'laura.pineda@somnguard.com', role: 'user', assigned_at: '2026-03-20T08:00:00', expires_at: null, is_active: true, assigned_by: 'admin@somnguard.com' },
    { user: 'andres.rios@somnguard.com', role: 'user', assigned_at: '2026-04-02T14:10:00', expires_at: null, is_active: true, assigned_by: 'admin@somnguard.com' },
    { user: 'sofia.herrera@somnguard.com', role: 'user', assigned_at: '2026-04-18T10:40:00', expires_at: null, is_active: true, assigned_by: 'admin@somnguard.com' },
    { user: 'felipe.gomez@somnguard.com', role: 'user', assigned_at: '2026-05-05T16:00:00', expires_at: '2026-12-31T23:59:00', is_active: true, assigned_by: 'admin@somnguard.com' }
  ];

  var SESSIONS = [
    { user: 'admin@somnguard.com', token_hash: 'a3f1…9c02', created_at: '2026-09-08T08:42:00', expires_at: '2026-09-15T08:42:00', revoked_at: null, replaced_by: null, is_active: true, ip: '192.168.1.10', device: 'Chrome 126 / Windows' },
    { user: 'laura.pineda@somnguard.com', token_hash: '71be…4402', created_at: '2026-09-07T22:00:00', expires_at: '2026-09-14T22:00:00', revoked_at: null, replaced_by: null, is_active: true, ip: '192.168.1.22', device: 'SomnGuard App / Android 14' },
    { user: 'andres.rios@somnguard.com', token_hash: 'c8d0…77aa', created_at: '2026-09-06T21:00:00', expires_at: '2026-09-13T21:00:00', revoked_at: null, replaced_by: 'd4e5…11bb (rotado)', is_active: true, ip: '192.168.1.30', device: 'Chrome 126 / Windows' },
    { user: 'sofia.herrera@somnguard.com', token_hash: 'e5aa…90cc', created_at: '2026-08-28T10:00:00', expires_at: '2026-09-04T10:00:00', revoked_at: '2026-09-02T10:15:00', replaced_by: null, is_active: false, ip: '192.168.1.31', device: 'Firefox 127 / Windows' }
  ];

  var PASSWORD_RESETS = [
    { user: 'andres.rios@somnguard.com', created_at: '2026-09-07T09:00:00', expires_at: '2026-09-07T10:00:00', is_used: true, used_at: '2026-09-07T09:20:00', is_active: true },
    { user: 'felipe.gomez@somnguard.com', created_at: '2026-09-08T07:00:00', expires_at: '2026-09-08T08:00:00', is_used: false, used_at: null, is_active: true },
    { user: 'sofia.herrera@somnguard.com', created_at: '2026-09-01T12:00:00', expires_at: '2026-09-01T13:00:00', is_used: false, used_at: null, is_active: false }
  ];

  var EMAIL_VERIFICATIONS = [
    { user: 'felipe.gomez@somnguard.com', created_at: '2026-09-08T06:00:00', expires_at: '2026-09-09T06:00:00', is_used: false, used_at: null, is_active: true },
    { user: 'sofia.herrera@somnguard.com', created_at: '2026-04-18T10:40:00', expires_at: '2026-04-19T10:40:00', is_used: false, used_at: null, is_active: false },
    { user: 'carolina.mendoza@somnguard.com', created_at: '2026-02-14T09:30:00', expires_at: '2026-02-15T09:30:00', is_used: true, used_at: '2026-02-14T10:00:00', is_active: true }
  ];

  var AUDIT_LOGIN = [
    { id: 101, attempted_at: '2026-09-08T08:42:11', email_attempted: 'admin@somnguard.com', user: 'admin@somnguard.com', outcome: 'SUCCESS', ip: '192.168.1.10', ua: 'Chrome 126 / Windows' },
    { id: 102, attempted_at: '2026-09-08T05:20:03', email_attempted: 'laura.pineda@somnguard.com', user: 'laura.pineda@somnguard.com', outcome: 'SUCCESS', ip: '192.168.1.22', ua: 'SomnGuard App Android 14' },
    { id: 103, attempted_at: '2026-09-07T23:11:00', email_attempted: 'desconocido@somnguard.com', user: null, outcome: 'INVALID_CREDENTIALS', ip: '45.10.2.99', ua: 'curl/8.0' },
    { id: 104, attempted_at: '2026-09-07T23:12:00', email_attempted: 'desconocido@somnguard.com', user: null, outcome: 'INVALID_CREDENTIALS', ip: '45.10.2.99', ua: 'curl/8.0' },
    { id: 105, attempted_at: '2026-09-07T15:00:12', email_attempted: 'andres.rios@somnguard.com', user: 'andres.rios@somnguard.com', outcome: 'INVALID_CREDENTIALS', ip: '192.168.1.30', ua: 'Chrome 126 / Windows' },
    { id: 106, attempted_at: '2026-09-06T10:14:55', email_attempted: 'sofia.herrera@somnguard.com', user: 'sofia.herrera@somnguard.com', outcome: 'ACCOUNT_LOCKED', ip: '192.168.1.31', ua: 'Firefox 127 / Windows' },
    { id: 107, attempted_at: '2026-09-05T21:00:00', email_attempted: 'felipe.gomez@somnguard.com', user: 'felipe.gomez@somnguard.com', outcome: 'EMAIL_NOT_VERIFIED', ip: '192.168.1.12', ua: 'Edge 126 / Windows' },
    { id: 108, attempted_at: '2026-09-04T09:00:00', email_attempted: 'valentina.castro@somnguard.com', user: 'valentina.castro@somnguard.com', outcome: 'ACCOUNT_SUSPENDED', ip: '192.168.1.10', ua: 'Chrome 126 / Windows' },
    { id: 109, attempted_at: '2026-09-08T08:00:00', email_attempted: 'admin@somnguard.com', user: 'admin@somnguard.com', outcome: 'SUCCESS', ip: '192.168.1.10', ua: 'Chrome 126 / Windows' },
    { id: 110, attempted_at: '2026-09-08T07:30:00', email_attempted: 'carolina.mendoza@somnguard.com', user: 'carolina.mendoza@somnguard.com', outcome: 'SUCCESS', ip: '192.168.1.23', ua: 'SomnGuard App Android 13' }
  ];

  /* ---- 001..004 catalogos ---- */
  var CATEGORIES = [
    { code: 'SOMNOLENCE', name: 'Somnolencia', description: 'Eventos relacionados con somnolencia y fatiga del conductor', sort_order: 10, is_active: true },
    { code: 'DISTRACTION', name: 'Distraccion', description: 'Eventos relacionados con distraccion del conductor', sort_order: 20, is_active: true },
    { code: 'SEATBELT', name: 'Cinturon de Seguridad', description: 'Eventos relacionados con el uso del cinturon de seguridad', sort_order: 30, is_active: true },
    { code: 'SYSTEM', name: 'Sistema', description: 'Eventos operativos del sistema', sort_order: 40, is_active: true }
  ];
  var SEVERITIES = [
    { code: 'info', name: 'Informativo', priority: 1, is_active: true },
    { code: 'warning', name: 'Advertencia', priority: 2, is_active: true },
    { code: 'high', name: 'Alta', priority: 3, is_active: true },
    { code: 'critical', name: 'Critica', priority: 4, is_active: true }
  ];
  var MEDIA_TYPES = [
    { code: 'image_jpeg', name: 'Imagen JPEG', mime_type: 'image/jpeg', max_size_mb: 10, is_active: true },
    { code: 'video_mp4', name: 'Video MP4', mime_type: 'video/mp4', max_size_mb: 50, is_active: true }
  ];
  var SOUNDS = [
    { code: 'AS-01', description: 'Somnolencia leve', frequency_hz: 800, duration_ms: 500, repetitions: 1, pattern_type: 'beep', interval_ms: null, is_active: true },
    { code: 'AS-02', description: 'Somnolencia moderada', frequency_hz: 950, duration_ms: 400, repetitions: 2, pattern_type: 'beep', interval_ms: 200, is_active: true },
    { code: 'AS-03', description: 'Somnolencia severa', frequency_hz: 1100, duration_ms: 300, repetitions: 3, pattern_type: 'beep', interval_ms: 200, is_active: true },
    { code: 'AS-04', description: 'Estado critico', frequency_hz: 1200, duration_ms: 2000, repetitions: 0, pattern_type: 'continuous', interval_ms: null, is_active: true },
    { code: 'AS-05', description: 'Distraccion telefono', frequency_hz: 900, duration_ms: 700, repetitions: 2, pattern_type: 'beep', interval_ms: 300, is_active: true },
    { code: 'AS-06', description: 'Mirada fuera via', frequency_hz: 950, duration_ms: 500, repetitions: 2, pattern_type: 'beep', interval_ms: 200, is_active: true },
    { code: 'AS-07', description: 'Cinturon no detectado', frequency_hz: 700, duration_ms: 1000, repetitions: 0, pattern_type: 'intermittent', interval_ms: 1000, is_active: true },
    { code: 'AS-08', description: 'Confirmacion inicio', frequency_hz: 600, duration_ms: 300, repetitions: 1, pattern_type: 'beep', interval_ms: null, is_active: true },
    { code: 'AS-09', description: 'Error sistema', frequency_hz: 1000, duration_ms: 500, repetitions: 2, pattern_type: 'escalating', interval_ms: 200, is_active: true }
  ];
  /* ---- 005 event types (18) ---- */
  var EVENT_TYPES = [
    { code: 'EV-SOM-01', name: 'Parpadeo anomalo', category: 'SOMNOLENCE', severity: 'info', sound: 'AS-01', threshold: { blink_rate_max: 25, blink_rate_min: 5, window_sec: 15 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 3, is_active: true },
    { code: 'EV-SOM-02', name: 'Cierre prolongado ojos', category: 'SOMNOLENCE', severity: 'warning', sound: 'AS-02', threshold: { eye_closed_min_sec: 2 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 5, is_active: true },
    { code: 'EV-SOM-03', name: 'Bostezo detectado', category: 'SOMNOLENCE', severity: 'warning', sound: 'AS-02', threshold: { yawn_count_min: 2, window_min: 5 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 2, is_active: true },
    { code: 'EV-SOM-04', name: 'Cabeceo/inclinacion', category: 'SOMNOLENCE', severity: 'high', sound: 'AS-03', threshold: { head_tilt_deg_min: 20, duration_sec_min: 3 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 4, is_active: true },
    { code: 'EV-SOM-05', name: 'Microsueno detectado', category: 'SOMNOLENCE', severity: 'critical', sound: 'AS-04', threshold: { eye_closed_min_sec: 3, head_tilt_deg_min: 20, simultaneous: true }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 6, is_active: true },
    { code: 'EV-DIS-01', name: 'Uso telefono movil', category: 'DISTRACTION', severity: 'info', sound: 'AS-05', threshold: { detection_confidence_min: 0.7, duration_sec_min: 2 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 2, is_active: true },
    { code: 'EV-DIS-02', name: 'Uso prolongado telefono', category: 'DISTRACTION', severity: 'high', sound: 'AS-05', threshold: { duration_sec_min: 5 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 3, is_active: true },
    { code: 'EV-DIS-03', name: 'Mirada fuera via', category: 'DISTRACTION', severity: 'info', sound: 'AS-06', threshold: { duration_sec_min: 3 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 2, is_active: true },
    { code: 'EV-DIS-04', name: 'Mirada prolongada fuera', category: 'DISTRACTION', severity: 'high', sound: 'AS-06', threshold: { duration_sec_min: 5 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 2, is_active: true },
    { code: 'EV-DIS-05', name: 'Movimiento anomalo', category: 'DISTRACTION', severity: 'info', sound: 'AS-05', threshold: { duration_sec_min: 3 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 1, is_active: true },
    { code: 'EV-CIN-01', name: 'Cinturon no detectado', category: 'SEATBELT', severity: 'info', sound: 'AS-07', threshold: { no_detection_sec_min: 10 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 2, is_active: true },
    { code: 'EV-CIN-02', name: 'Cinturon mal colocado', category: 'SEATBELT', severity: 'info', sound: 'AS-07', threshold: { incorrect_position_sec_min: 10 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 1, is_active: true },
    { code: 'EV-SYS-01', name: 'Inicializacion exitosa', category: 'SYSTEM', severity: 'info', sound: 'AS-08', threshold: {}, status: 'PUBLISHED', category_status: 'ACTIVE', version: 1, is_active: true },
    { code: 'EV-SYS-02', name: 'Error camara/obstruccion', category: 'SYSTEM', severity: 'warning', sound: 'AS-09', threshold: { invalid_image_sec_min: 10 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 2, is_active: true },
    { code: 'EV-SYS-03', name: 'Rostro no detectado', category: 'SYSTEM', severity: 'info', sound: 'AS-09', threshold: { no_face_sec_min: 30 }, status: 'PUBLISHED', category_status: 'ACTIVE', version: 1, is_active: true },
    { code: 'EV-SYS-04', name: 'Conectividad perdida', category: 'SYSTEM', severity: 'info', sound: 'AS-09', threshold: {}, status: 'PUBLISHED', category_status: 'ACTIVE', version: 1, is_active: true },
    { code: 'EV-SYS-05', name: 'Conectividad restaurada', category: 'SYSTEM', severity: 'info', sound: 'AS-08', threshold: {}, status: 'PUBLISHED', category_status: 'ACTIVE', version: 1, is_active: true },
    { code: 'EV-SYS-06', name: 'Almacenamiento casi lleno', category: 'SYSTEM', severity: 'warning', sound: 'AS-09', threshold: { usage_pct_min: 90 }, status: 'DRAFT', category_status: 'PENDING', version: 1, is_active: true }
  ];

  /* ---- 006/007/008 status ---- */
  var STATUS_CATEGORIES = [
    { code: 'ACTIVE', name: 'Activo', description: 'Entidad operativa y funcional', sort_order: 10, is_final: false },
    { code: 'INACTIVE', name: 'Inactivo', description: 'Entidad existente pero no operativa', sort_order: 20, is_final: false },
    { code: 'PENDING', name: 'Pendiente', description: 'Entidad en proceso de activacion', sort_order: 30, is_final: false },
    { code: 'ERROR', name: 'Error', description: 'Entidad en estado de fallo', sort_order: 40, is_final: false },
    { code: 'ARCHIVED', name: 'Archivado', description: 'Entidad finalizada, solo lectura', sort_order: 50, is_final: true }
  ];
  var STATUSES = [
    { code: 'DEVICE_REGISTERED', category: 'PENDING', name: 'Registrado', entity: 'device', sort: 10, initial: true, terminal: false },
    { code: 'DEVICE_ASSIGNED', category: 'PENDING', name: 'Asignado', entity: 'device', sort: 20, initial: false, terminal: false },
    { code: 'DEVICE_ACTIVE', category: 'ACTIVE', name: 'Activo', entity: 'device', sort: 30, initial: false, terminal: false },
    { code: 'DEVICE_OFFLINE', category: 'INACTIVE', name: 'Offline', entity: 'device', sort: 40, initial: false, terminal: false },
    { code: 'DEVICE_SUSPENDED', category: 'INACTIVE', name: 'Suspendido', entity: 'device', sort: 50, initial: false, terminal: false },
    { code: 'DEVICE_RETIRED', category: 'ARCHIVED', name: 'Retirado', entity: 'device', sort: 60, initial: false, terminal: true },
    { code: 'EVENT_DETECTED', category: 'PENDING', name: 'Detectado', entity: 'event', sort: 10, initial: true, terminal: false },
    { code: 'EVENT_REGISTERED', category: 'PENDING', name: 'Registrado', entity: 'event', sort: 20, initial: false, terminal: false },
    { code: 'EVENT_SYNCHRONIZED', category: 'ACTIVE', name: 'Sincronizado', entity: 'event', sort: 30, initial: false, terminal: false },
    { code: 'EVENT_ANALYZED', category: 'ACTIVE', name: 'Analizado', entity: 'event', sort: 40, initial: false, terminal: false },
    { code: 'EVENT_ARCHIVED', category: 'ARCHIVED', name: 'Archivado', entity: 'event', sort: 50, initial: false, terminal: true },
    { code: 'USER_PENDING_VERIFICATION', category: 'PENDING', name: 'Pendiente verificacion', entity: 'user', sort: 10, initial: true, terminal: false },
    { code: 'USER_ACTIVE', category: 'ACTIVE', name: 'Activo', entity: 'user', sort: 20, initial: false, terminal: false },
    { code: 'USER_SUSPENDED', category: 'INACTIVE', name: 'Suspendido', entity: 'user', sort: 30, initial: false, terminal: false },
    { code: 'USER_SOFT_DELETED', category: 'ARCHIVED', name: 'Eliminado (soft)', entity: 'user', sort: 40, initial: false, terminal: true },
    { code: 'DEVICE_CONFIG_DRAFT', category: 'PENDING', name: 'Borrador', entity: 'device_config', sort: 10, initial: true, terminal: false },
    { code: 'DEVICE_CONFIG_PUBLISHED', category: 'ACTIVE', name: 'Publicado', entity: 'device_config', sort: 20, initial: false, terminal: false },
    { code: 'DEVICE_CONFIG_DEPRECATED', category: 'INACTIVE', name: 'Deprecado', entity: 'device_config', sort: 30, initial: false, terminal: false },
    { code: 'NOTIFICATION_PENDING', category: 'PENDING', name: 'Pendiente', entity: 'notification', sort: 10, initial: true, terminal: false },
    { code: 'NOTIFICATION_SENT', category: 'ACTIVE', name: 'Enviado', entity: 'notification', sort: 20, initial: false, terminal: false },
    { code: 'NOTIFICATION_DELIVERED', category: 'ACTIVE', name: 'Entregado', entity: 'notification', sort: 30, initial: false, terminal: false },
    { code: 'NOTIFICATION_READ', category: 'ACTIVE', name: 'Leido', entity: 'notification', sort: 40, initial: false, terminal: false },
    { code: 'NOTIFICATION_FAILED', category: 'ERROR', name: 'Fallido', entity: 'notification', sort: 50, initial: false, terminal: true }
  ];
  var TRANSITIONS = [
    { from: 'DEVICE_REGISTERED', to: 'DEVICE_ASSIGNED', roles: ['user'], desc: 'Usuario asocia device a su cuenta' },
    { from: 'DEVICE_ASSIGNED', to: 'DEVICE_ACTIVE', roles: ['system'], desc: 'Primer heartbeat recibido' },
    { from: 'DEVICE_ACTIVE', to: 'DEVICE_OFFLINE', roles: ['system'], desc: 'Sin heartbeat > 5 min' },
    { from: 'DEVICE_OFFLINE', to: 'DEVICE_ACTIVE', roles: ['system'], desc: 'Heartbeat recibido' },
    { from: 'DEVICE_ACTIVE', to: 'DEVICE_SUSPENDED', roles: ['admin'], desc: 'Admin suspende device' },
    { from: 'DEVICE_SUSPENDED', to: 'DEVICE_ACTIVE', roles: ['admin'], desc: 'Admin reactiva' },
    { from: 'DEVICE_SUSPENDED', to: 'DEVICE_RETIRED', roles: ['admin'], desc: 'Admin retira device' },
    { from: 'DEVICE_REGISTERED', to: 'DEVICE_RETIRED', roles: ['admin'], desc: 'Admin cancela alta' },
    { from: 'DEVICE_ACTIVE', to: 'DEVICE_REGISTERED', roles: ['user', 'admin'], desc: 'Desasociacion (unassign): libera device activo' },
    { from: 'DEVICE_ASSIGNED', to: 'DEVICE_REGISTERED', roles: ['user', 'admin'], desc: 'Desasociacion (unassign): libera device asignado' },
    { from: 'EVENT_DETECTED', to: 'EVENT_REGISTERED', roles: ['system'], desc: 'Persistido en buffer local' },
    { from: 'EVENT_REGISTERED', to: 'EVENT_SYNCHRONIZED', roles: ['system'], desc: 'ACK recibido de API' },
    { from: 'EVENT_SYNCHRONIZED', to: 'EVENT_ANALYZED', roles: ['system'], desc: 'Procesado por analytics' },
    { from: 'EVENT_ANALYZED', to: 'EVENT_ARCHIVED', roles: ['system'], desc: 'Retencion cumplida' },
    { from: 'USER_PENDING_VERIFICATION', to: 'USER_ACTIVE', roles: ['user'], desc: 'Usuario verifica correo' },
    { from: 'USER_ACTIVE', to: 'USER_SUSPENDED', roles: ['admin'], desc: 'Admin suspende usuario' },
    { from: 'USER_SUSPENDED', to: 'USER_ACTIVE', roles: ['admin'], desc: 'Admin reactiva usuario' },
    { from: 'USER_ACTIVE', to: 'USER_SOFT_DELETED', roles: ['user', 'admin'], desc: 'Usuario solicita eliminacion' },
    { from: 'DEVICE_CONFIG_DRAFT', to: 'DEVICE_CONFIG_PUBLISHED', roles: ['admin'], desc: 'Admin publica configuracion' },
    { from: 'DEVICE_CONFIG_PUBLISHED', to: 'DEVICE_CONFIG_DEPRECATED', roles: ['admin'], desc: 'Nueva version publicada' },
    { from: 'NOTIFICATION_PENDING', to: 'NOTIFICATION_SENT', roles: ['system'], desc: 'Sistema envia notificacion' },
    { from: 'NOTIFICATION_SENT', to: 'NOTIFICATION_DELIVERED', roles: ['system'], desc: 'Proveedor confirma entrega' },
    { from: 'NOTIFICATION_DELIVERED', to: 'NOTIFICATION_READ', roles: ['user'], desc: 'Usuario abre notificacion' },
    { from: 'NOTIFICATION_SENT', to: 'NOTIFICATION_FAILED', roles: ['system'], desc: 'Error en entrega' },
    { from: 'NOTIFICATION_PENDING', to: 'NOTIFICATION_FAILED', roles: ['system'], desc: 'Error antes de enviar' }
  ];

  /* ---- devices (con claim_code CLM- + provisioning) ---- */
  var DEVICES = [
    { id: 'd-001', serial: 'SG-2026-0001', claim_code: 'CLM-A1B2C3D4E5F6', status: 'DEVICE_ACTIVE', category: 'ACTIVE', is_active: true, firmware: '2.4.1', user: 'laura.pineda@somnguard.com', heartbeat: '2026-09-09T02:18:00', sync: '2026-09-09T02:17:00', config_pull: '2026-09-09T02:00:00', ip: '192.168.10.21', claimed_at: '2026-08-01T08:05:00', prov: 'manual', created_at: '2026-07-20T10:00:00', created_by: 'admin@somnguard.com', version: 4 },
    { id: 'd-002', serial: 'SG-2026-0002', claim_code: 'CLM-B2C3D4E5F6A7', status: 'DEVICE_ACTIVE', category: 'ACTIVE', is_active: true, firmware: '2.4.1', user: 'andres.rios@somnguard.com', heartbeat: '2026-09-09T02:15:00', sync: '2026-09-09T02:14:00', config_pull: '2026-09-08T22:00:00', ip: '192.168.10.22', claimed_at: '2026-08-10T09:05:00', prov: 'tok-001', created_at: '2026-07-21T10:00:00', created_by: 'admin@somnguard.com', version: 3 },
    { id: 'd-003', serial: 'SG-2026-0003', claim_code: 'CLM-C3D4E5F6A7B8', status: 'DEVICE_OFFLINE', category: 'INACTIVE', is_active: true, firmware: '2.3.0', user: 'carolina.mendoza@somnguard.com', heartbeat: '2026-09-08T21:12:00', sync: '2026-09-08T21:10:00', config_pull: '2026-09-08T18:00:00', ip: '192.168.10.23', claimed_at: '2026-07-16T08:05:00', prov: 'manual', created_at: '2026-07-15T08:00:00', created_by: 'admin@somnguard.com', version: 5 },
    { id: 'd-004', serial: 'SG-2026-0004', claim_code: 'CLM-D4E5F6A7B8C9', status: 'DEVICE_SUSPENDED', category: 'INACTIVE', is_active: true, firmware: '2.4.0', user: null, heartbeat: '2026-09-07T18:40:00', sync: '2026-09-07T18:35:00', config_pull: '2026-09-07T12:00:00', ip: '192.168.10.24', claimed_at: null, prov: 'manual', created_at: '2026-07-22T10:00:00', created_by: 'admin@somnguard.com', version: 2 },
    { id: 'd-005', serial: 'SG-2026-0005', claim_code: 'CLM-E5F6A7B8C9D0', status: 'DEVICE_ASSIGNED', category: 'PENDING', is_active: true, firmware: '2.4.1', user: 'felipe.gomez@somnguard.com', heartbeat: null, sync: null, config_pull: null, ip: null, claimed_at: '2026-08-20T08:05:00', prov: 'tok-002', created_at: '2026-08-01T10:00:00', created_by: 'admin@somnguard.com', version: 1 },
    { id: 'd-006', serial: 'SG-2026-0006', claim_code: 'CLM-F6A7B8C9D0E1', status: 'DEVICE_RETIRED', category: 'ARCHIVED', is_active: false, firmware: '2.2.5', user: null, heartbeat: '2026-08-28T10:00:00', sync: '2026-08-28T09:58:00', config_pull: '2026-08-27T10:00:00', ip: '192.168.10.26', claimed_at: null, prov: 'manual', created_at: '2026-06-01T10:00:00', created_by: 'admin@somnguard.com', version: 1, deleted_at: '2026-08-28T10:00:00' },
    { id: 'd-007', serial: 'SG-2026-0007', claim_code: 'CLM-A7B8C9D0E1F2', status: 'DEVICE_REGISTERED', category: 'PENDING', is_active: true, firmware: '2.4.1', user: null, heartbeat: null, sync: null, config_pull: null, ip: null, claimed_at: null, prov: null, created_at: '2026-09-05T10:00:00', created_by: 'admin@somnguard.com', version: 1 },
    { id: 'd-008', serial: 'SG-2026-0008', claim_code: 'CLM-B8C9D0E1F2A3', status: 'DEVICE_REGISTERED', category: 'PENDING', is_active: true, firmware: '2.4.1', user: null, heartbeat: null, sync: null, config_pull: null, ip: null, claimed_at: null, prov: null, created_at: '2026-09-06T10:00:00', created_by: 'admin@somnguard.com', version: 1 }
  ];
  var ASSIGNMENTS = [
    { id: 'as-01', serial: 'SG-2026-0001', user: 'laura.pineda@somnguard.com', assigned_at: '2026-08-01T08:00:00', unassigned_at: null, assigned_by: 'admin@somnguard.com', is_active: true },
    { id: 'as-02', serial: 'SG-2026-0002', user: 'andres.rios@somnguard.com', assigned_at: '2026-08-10T09:00:00', unassigned_at: null, assigned_by: 'admin@somnguard.com', is_active: true },
    { id: 'as-03', serial: 'SG-2026-0003', user: 'carolina.mendoza@somnguard.com', assigned_at: '2026-07-15T08:00:00', unassigned_at: null, assigned_by: 'admin@somnguard.com', is_active: true },
    { id: 'as-04', serial: 'SG-2026-0005', user: 'felipe.gomez@somnguard.com', assigned_at: '2026-08-20T08:00:00', unassigned_at: null, assigned_by: 'admin@somnguard.com', is_active: true },
    { id: 'as-00', serial: 'SG-2026-0003', user: 'paula.jimenez@somnguard.com', assigned_at: '2026-07-01T08:00:00', unassigned_at: '2026-07-14T18:00:00', assigned_by: 'admin@somnguard.com', is_active: false }
  ];
  var DEVICE_CONFIGS = [
    { serial: 'SG-2026-0001', status: 'DEVICE_CONFIG_PUBLISHED', version: 4, published_at: '2026-09-08T22:00:00', updated_by: 'admin@somnguard.com', configuration: { thresholds: { blink_rate_max: 25, eye_closed_sec: 2, head_tilt_deg: 20 }, sound_patterns: { 'EV-SOM-05': 'AS-04', 'EV-DIS-02': 'AS-05' }, volume_pct: 80, sync_interval_sec: 30, retention_days: 7 } },
    { serial: 'SG-2026-0002', status: 'DEVICE_CONFIG_PUBLISHED', version: 3, published_at: '2026-09-07T22:00:00', updated_by: 'admin@somnguard.com', configuration: { thresholds: { blink_rate_max: 25, eye_closed_sec: 2, head_tilt_deg: 20 }, sound_patterns: { 'EV-SOM-05': 'AS-04' }, volume_pct: 80, sync_interval_sec: 30, retention_days: 7 } },
    { serial: 'SG-2026-0003', status: 'DEVICE_CONFIG_DRAFT', version: 2, published_at: null, updated_by: 'admin@somnguard.com', configuration: { thresholds: { blink_rate_max: 30, eye_closed_sec: 3 }, sound_patterns: {}, volume_pct: 70, sync_interval_sec: 60, retention_days: 7 } }
  ];
  var CONFIG_HISTORY = [
    { serial: 'SG-2026-0001', version: 4, changed_by: 'admin@somnguard.com', change_reason: 'Subir volumen a 80% flota nocturna', created_at: '2026-09-08T22:00:00' },
    { serial: 'SG-2026-0001', version: 3, changed_by: 'admin@somnguard.com', change_reason: 'Ajuste eye_closed_sec 3->2', created_at: '2026-09-05T22:00:00' },
    { serial: 'SG-2026-0001', version: 2, changed_by: 'admin@somnguard.com', change_reason: 'Config inicial QA', created_at: '2026-08-20T10:00:00' }
  ];
  var PROV_TOKENS = [
    { id: 'tok-001', serial: 'SG-2026-0002', uses: 1, max: 1, expires_at: '2026-09-16T10:00:00', revoked_at: null, device: 'SG-2026-0002', created_by: 'admin@somnguard.com', created_at: '2026-09-08T10:00:00' },
    { id: 'tok-002', serial: null, uses: 1, max: 5, expires_at: '2026-09-16T10:00:00', revoked_at: null, device: 'SG-2026-0005', created_by: 'admin@somnguard.com', created_at: '2026-09-08T10:05:00' },
    { id: 'tok-003', serial: null, uses: 0, max: 5, expires_at: '2026-09-11T10:00:00', revoked_at: null, device: null, created_by: 'admin@somnguard.com', created_at: '2026-09-08T11:00:00' },
    { id: 'tok-000', serial: 'SG-2026-0009', uses: 0, max: 1, expires_at: '2026-09-02T10:00:00', revoked_at: '2026-09-01T10:00:00', device: null, created_by: 'admin@somnguard.com', created_at: '2026-08-25T10:00:00' }
  ];
  var PROV_AUDIT = [
    { created_at: '2026-09-08T11:00:00', token: 'tok-003', action: 'CREATED', device: null, actor: 'admin@somnguard.com', ip: '192.168.1.10' },
    { created_at: '2026-09-08T10:05:00', token: 'tok-002', action: 'CREATED', device: null, actor: 'admin@somnguard.com', ip: '192.168.1.10' },
    { created_at: '2026-09-08T10:06:00', token: 'tok-002', action: 'USED', device: 'SG-2026-0005', actor: null, ip: '192.168.10.25' },
    { created_at: '2026-09-08T10:07:00', token: 'tok-002', action: 'CLAIMED', device: 'SG-2026-0005', actor: 'felipe.gomez@somnguard.com', ip: '192.168.1.12' },
    { created_at: '2026-09-01T10:00:00', token: 'tok-000', action: 'REVOKED', device: null, actor: 'admin@somnguard.com', ip: '192.168.1.10' }
  ];

  /* ---- telemetry ---- */
  var EVENTS = [
    { id: '0193f5a1-0001-7001-8001-000000000001', serial: 'SG-2026-0001', type: 'EV-SOM-05', type_name: 'Microsueno detectado', category: 'SOMNOLENCE', severity: 'critical', sound: 'AS-04', occurred_at: '2026-09-09T02:11:03', offline: false, status: 'EVENT_ANALYZED', evidence: true, meta: { confidence: 0.94, eye_closed_sec: 3.4 } },
    { id: '0193f5a1-0002-7002-8002-000000000002', serial: 'SG-2026-0001', type: 'EV-SOM-02', type_name: 'Cierre prolongado ojos', category: 'SOMNOLENCE', severity: 'warning', sound: 'AS-02', occurred_at: '2026-09-09T01:58:11', offline: false, status: 'EVENT_SYNCHRONIZED', evidence: true, meta: { confidence: 0.88, eye_closed_sec: 2.2 } },
    { id: '0193f5a1-0003-7003-8003-000000000003', serial: 'SG-2026-0002', type: 'EV-DIS-02', type_name: 'Uso prolongado telefono', category: 'DISTRACTION', severity: 'high', sound: 'AS-05', occurred_at: '2026-09-09T01:35:44', offline: false, status: 'EVENT_SYNCHRONIZED', evidence: true, meta: { confidence: 0.91, duration_sec: 6 } },
    { id: '0193f5a1-0004-7004-8004-000000000004', serial: 'SG-2026-0002', type: 'EV-SOM-01', type_name: 'Parpadeo anomalo', category: 'SOMNOLENCE', severity: 'info', sound: 'AS-01', occurred_at: '2026-09-09T00:58:20', offline: true, status: 'EVENT_REGISTERED', evidence: false, meta: { blink_rate: 28 } },
    { id: '0193f5a1-0005-7005-8005-000000000005', serial: 'SG-2026-0003', type: 'EV-SYS-02', type_name: 'Error camara/obstruccion', category: 'SYSTEM', severity: 'warning', sound: 'AS-09', occurred_at: '2026-09-08T21:11:02', offline: false, status: 'EVENT_DETECTED', evidence: true, meta: { invalid_image_sec: 12 } },
    { id: '0193f5a1-0006-7006-8006-000000000006', serial: 'SG-2026-0001', type: 'EV-DIS-04', type_name: 'Mirada prolongada fuera', category: 'DISTRACTION', severity: 'high', sound: 'AS-06', occurred_at: '2026-09-08T18:22:37', offline: false, status: 'EVENT_ANALYZED', evidence: true, meta: { duration_sec: 5.5 } },
    { id: '0193f5a1-0007-7007-8007-000000000007', serial: 'SG-2026-0001', type: 'EV-CIN-01', type_name: 'Cinturon no detectado', category: 'SEATBELT', severity: 'info', sound: 'AS-07', occurred_at: '2026-09-08T18:20:10', offline: true, status: 'EVENT_REGISTERED', evidence: false, meta: { no_detection_sec: 11 } },
    { id: '0193f5a1-0008-7008-8008-000000000008', serial: 'SG-2026-0001', type: 'EV-SYS-04', type_name: 'Conectividad perdida', category: 'SYSTEM', severity: 'info', sound: 'AS-09', occurred_at: '2026-09-08T17:59:59', offline: false, status: 'EVENT_ARCHIVED', evidence: false, meta: {} },
    { id: '0193f5a1-0009-7009-8009-000000000009', serial: 'SG-2026-0002', type: 'EV-SOM-03', type_name: 'Bostezo detectado', category: 'SOMNOLENCE', severity: 'warning', sound: 'AS-02', occurred_at: '2026-09-08T06:40:00', offline: false, status: 'EVENT_ANALYZED', evidence: true, meta: { yawns: 3 } },
    { id: '0193f5a1-0010-7010-8010-000000000010', serial: 'SG-2026-0003', type: 'EV-SOM-04', type_name: 'Cabeceo/inclinacion', category: 'SOMNOLENCE', severity: 'high', sound: 'AS-03', occurred_at: '2026-09-08T05:10:00', offline: false, status: 'EVENT_ANALYZED', evidence: true, meta: { tilt_deg: 24 } },
    { id: '0193f5a1-0011-7011-8011-000000000011', serial: 'SG-2026-0001', type: 'EV-SYS-01', type_name: 'Inicializacion exitosa', category: 'SYSTEM', severity: 'info', sound: 'AS-08', occurred_at: '2026-09-08T05:00:00', offline: false, status: 'EVENT_ARCHIVED', evidence: false, meta: {} },
    { id: '0193f5a1-0012-7012-8012-000000000012', serial: 'SG-2026-0002', type: 'EV-DIS-01', type_name: 'Uso telefono movil', category: 'DISTRACTION', severity: 'info', sound: 'AS-05', occurred_at: '2026-09-07T22:05:00', offline: false, status: 'EVENT_ANALYZED', evidence: true, meta: { confidence: 0.77 } }
  ];
  var EVIDENCES = [
    { event: '0193f5a1-0001-7001-8001-000000000001', media: 'image_jpeg', key: 'd-001/2026/09/09/0193f5a1-0001.jpg', size: 184320, sha: 'a3f1…9c02', created_at: '2026-09-09T02:11:05' },
    { event: '0193f5a1-0002-7002-8002-000000000002', media: 'image_jpeg', key: 'd-001/2026/09/09/0193f5a1-0002.jpg', size: 172044, sha: '71be…4402', created_at: '2026-09-09T01:58:13' },
    { event: '0193f5a1-0003-7003-8003-000000000003', media: 'video_mp4', key: 'd-002/2026/09/09/0193f5a1-0003.mp4', size: 2457600, sha: 'c8d0…77aa', created_at: '2026-09-09T01:35:46' },
    { event: '0193f5a1-0005-7005-8005-000000000005', media: 'image_jpeg', key: 'd-003/2026/09/08/0193f5a1-0005.jpg', size: 158900, sha: 'e5aa…90cc', created_at: '2026-09-08T21:11:04' },
    { event: '0193f5a1-0006-7006-8006-000000000006', media: 'image_jpeg', key: 'd-001/2026/09/08/0193f5a1-0006.jpg', size: 190100, sha: 'f1aa…12de', created_at: '2026-09-08T18:22:39' }
  ];
  var ALERTS = [
    { id: 'al-0001', event: '0193f5a1-0001-7001-8001-000000000001', serial: 'SG-2026-0001', severity: 'critical', sound: 'AS-04', triggered_at: '2026-09-09T02:11:04' },
    { id: 'al-0002', event: '0193f5a1-0002-7002-8002-000000000002', serial: 'SG-2026-0001', severity: 'warning', sound: 'AS-02', triggered_at: '2026-09-09T01:58:12' },
    { id: 'al-0003', event: '0193f5a1-0003-7003-8003-000000000003', serial: 'SG-2026-0002', severity: 'high', sound: 'AS-05', triggered_at: '2026-09-09T01:35:45' },
    { id: 'al-0004', event: '0193f5a1-0005-7005-8005-000000000005', serial: 'SG-2026-0003', severity: 'warning', sound: 'AS-09', triggered_at: '2026-09-08T21:11:03' },
    { id: 'al-0005', event: '0193f5a1-0006-7006-8006-000000000006', serial: 'SG-2026-0001', severity: 'high', sound: 'AS-06', triggered_at: '2026-09-08T18:22:38' },
    { id: 'al-0006', event: '0193f5a1-0010-7010-8010-000000000010', serial: 'SG-2026-0003', severity: 'high', sound: 'AS-03', triggered_at: '2026-09-08T05:10:01' }
  ];

  /* ---- monitoring notifications ---- */
  var NOTIFICATIONS = [
    { id: 'n-001', user: 'laura.pineda@somnguard.com', event: '0193f5a1-0001-7001-8001-000000000001', title: 'Microsueno detectado (critico)', message: 'SG-2026-0001 detecto microsueno a las 02:11. Revise al conductor.', channel: 'push', status: 'NOTIFICATION_DELIVERED', sent_at: '2026-09-09T02:11:05', delivered_at: '2026-09-09T02:11:08', read_at: null, retry: 0, error: null },
    { id: 'n-002', user: 'andres.rios@somnguard.com', event: '0193f5a1-0003-7003-8003-000000000003', title: 'Uso prolongado de telefono', message: 'SG-2026-0002: telefono > 5s.', channel: 'push', status: 'NOTIFICATION_READ', sent_at: '2026-09-09T01:35:46', delivered_at: '2026-09-09T01:35:50', read_at: '2026-09-09T01:40:00', retry: 0, error: null },
    { id: 'n-003', user: 'carolina.mendoza@somnguard.com', event: '0193f5a1-0005-7005-8005-000000000005', title: 'Error de camara', message: 'SG-2026-0003 reporta obstruccion.', channel: 'email', status: 'NOTIFICATION_FAILED', sent_at: '2026-09-08T21:11:05', delivered_at: null, read_at: null, retry: 3, error: 'SMTP 550 mailbox unavailable' },
    { id: 'n-004', user: 'laura.pineda@somnguard.com', event: '0193f5a1-0006-7006-8006-000000000006', title: 'Mirada prolongada fuera de via', message: 'SG-2026-0001: mirada > 5s.', channel: 'in_app', status: 'NOTIFICATION_SENT', sent_at: '2026-09-08T18:22:40', delivered_at: null, read_at: null, retry: 1, error: null },
    { id: 'n-005', user: 'andres.rios@somnguard.com', event: '0193f5a1-0012-7012-8012-000000000012', title: 'Uso de telefono', message: 'SG-2026-0002: telefono detectado.', channel: 'push', status: 'NOTIFICATION_PENDING', sent_at: null, delivered_at: null, read_at: null, retry: 0, error: null }
  ];
  var NOTIF_TEMPLATES = [
    { event: 'EV-SOM-05 + critical', title: '{serial} microsueno critico', channel: 'push+email' },
    { event: 'EV-DIS-02/04 + high', title: '{serial} distraccion alta', channel: 'push' },
    { event: 'EV-CIN-01/02', title: '{serial} cinturon', channel: 'in_app' }
  ];

  /* ---- analytics MVs (muestra 7d) ---- */
  var METRICS_DAILY = [
    { date: '2026-09-03', total: 18, critical: 1, high: 3 },
    { date: '2026-09-04', total: 22, critical: 0, high: 4 },
    { date: '2026-09-05', total: 15, critical: 0, high: 2 },
    { date: '2026-09-06', total: 27, critical: 2, high: 5 },
    { date: '2026-09-07', total: 20, critical: 1, high: 3 },
    { date: '2026-09-08', total: 31, critical: 2, high: 6 },
    { date: '2026-09-09', total: 9, critical: 1, high: 1 }
  ];
  var REPORTS = [
    { id: 'rep-001', title: 'Riesgo flota 7d', period: '2026-09-02..2026-09-09', status: 'Listo', by: 'admin@somnguard.com', created_at: '2026-09-09T01:00:00', size: '1.2 MB' },
    { id: 'rep-002', title: 'Criticos por conductor', period: '2026-08-09..2026-09-09', status: 'Generando', by: 'admin@somnguard.com', created_at: '2026-09-09T02:00:00', size: '—' }
  ];

  /* ---- auditoria transversal ---- */
  var STATUS_AUDIT = [
    { entity: 'device', ref: 'SG-2026-0001', from: 'DEVICE_OFFLINE', to: 'DEVICE_ACTIVE', by: 'system', at: '2026-09-09T02:00:00', reason: 'Heartbeat recibido' },
    { entity: 'device', ref: 'SG-2026-0004', from: 'DEVICE_ACTIVE', to: 'DEVICE_SUSPENDED', by: 'admin@somnguard.com', at: '2026-09-07T18:45:00', reason: 'Manipulacion reportada' },
    { entity: 'user', ref: 'sofia.herrera@somnguard.com', from: 'USER_ACTIVE', to: 'USER_SUSPENDED', by: 'admin@somnguard.com', at: '2026-09-02T10:15:00', reason: '5 intentos fallidos' },
    { entity: 'event', ref: '0193f5a1-0001…000001', from: 'EVENT_SYNCHRONIZED', to: 'EVENT_ANALYZED', by: 'system', at: '2026-09-09T02:12:00', reason: 'Incluido en metricas' },
    { entity: 'config', ref: 'SG-2026-0001 v4', from: 'DEVICE_CONFIG_DRAFT', to: 'DEVICE_CONFIG_PUBLISHED', by: 'admin@somnguard.com', at: '2026-09-08T22:00:00', reason: 'Publicacion nocturna' },
    { entity: 'notification', ref: 'n-003', from: 'NOTIFICATION_SENT', to: 'NOTIFICATION_FAILED', by: 'system', at: '2026-09-08T21:12:00', reason: 'SMTP 550' }
  ];

  return {
    SYS: SYS, MODULES: MODULES, FEATURES: FEATURES, ALL_19: ALL_19, USER_6: USER_6,
    MATRIX: MATRIX, ROLES: ROLES, USERS: USERS, USER_ROLES: USER_ROLES,
    SESSIONS: SESSIONS, PASSWORD_RESETS: PASSWORD_RESETS, EMAIL_VERIFICATIONS: EMAIL_VERIFICATIONS,
    AUDIT_LOGIN: AUDIT_LOGIN, CATEGORIES: CATEGORIES, SEVERITIES: SEVERITIES,
    MEDIA_TYPES: MEDIA_TYPES, SOUNDS: SOUNDS, EVENT_TYPES: EVENT_TYPES,
    STATUS_CATEGORIES: STATUS_CATEGORIES, STATUSES: STATUSES, TRANSITIONS: TRANSITIONS,
    DEVICES: DEVICES, ASSIGNMENTS: ASSIGNMENTS, DEVICE_CONFIGS: DEVICE_CONFIGS,
    CONFIG_HISTORY: CONFIG_HISTORY, PROV_TOKENS: PROV_TOKENS, PROV_AUDIT: PROV_AUDIT,
    EVENTS: EVENTS, EVIDENCES: EVIDENCES, ALERTS: ALERTS,
    NOTIFICATIONS: NOTIFICATIONS, NOTIF_TEMPLATES: NOTIF_TEMPLATES,
    METRICS_DAILY: METRICS_DAILY, REPORTS: REPORTS, STATUS_AUDIT: STATUS_AUDIT,
    LAST_MV_REFRESH: '2026-09-09T02:15:00'
  };
})();
