# SomnGuard — Especificación Ultra-Detallada de Vista Admin (para Mockup/Page)

> **Aclaración de rol:** en SomnGuard `Admin == Superadmin`. Es UNO SOLO: el más de los más, con acceso a TODO. No hay dos roles distintos. En este documento `Admin` = acceso total omnipotente.
> **Propósito de este documento:** describir ABSOLUTAMENTE TODO lo que ve y puede hacer el `Admin` en el frontend web (portal React), derivado 1:1 de `somnguard-docs` + `somnguard-db` (33 tablas, 6 schemas, 19 features seed, 23 estados, 25 transiciones, 18 tipos de evento, 9 patrones de sonido, 2 vistas materializadas).
> **Uso:** con este .md se debe poder construir una page mockup navegable (sidebar, dashboard, CRUDs, auditoría, métricas) sin volver a leer docs/DB.
> **Stack real:** Backend Java 21 + Spring Boot 4.1.1 + Spring Security JWT RS256, PostgreSQL 16 + Liquibase, MinIO bucket `somnguard-evidence`, Portal React 18 SPA, App React Native, Edge Raspberry Pi Python/OpenCV.
> **Convención de códigos:** `security.module.code` = `security, device_management, telemetry, monitoring, analytics, parameterization` (nunca kebab en código). Tabla física `telemetry_service.*` ↔ módulo lógico `telemetry`.

---

## 0. Rol único: Admin omnipotente (Admin == Superadmin)

- Búsqueda exhaustiva en docs + DB: **0 resultados para `superadmin` como rol separado**.
- Modelo real: `security.role.code ∈ {admin, user}` (`09_insert_security_roles.sql`, `features-analysis SEC-003: "Mantener solo admin y user"`).
  - `admin` = el más de los más, TODAS las 19 features (CROSS JOIN). Acceso completo a todo lo descrito en este doc: usuarios, roles, permisos, sesiones, catálogos, estados/transiciones, devices, provisioning, telemetría, monitoreo, analítica, auditoría, observabilidad.
  - `user` = solo 6: `user.read, device.read, device.claim, event.read, notification.read, analytics.read`.
- **Decisión para mockup (según pedido): UN SOLO ADMIN.** No hay Admin vs Superadmin. Todo lo de este doc lo ve/hace el `Admin`.
  - Incluye lo "sensible": editar `status / status_category / status_transition`, crear/editar `module / feature` y matriz `role_feature`, crear nuevos roles, suspender/reactivar/soft-delete, rotar API keys, generar provisioning tokens, publicar configs, reintentar/reenviar notifs, refrescar MVs, exportar auditoría.
  - Única restricción que se mantiene (por seguridad, no por rol): secrets (`api_key` plano, `provisioning token` plano, `token_hash`, `password_hash`) NUNCA se muestran, solo 1 vez al crear con [Copiar].
- En cada vista abajo se marca `Permiso requerido: feature.code` (el Admin los tiene todos).
- Si el mockup necesita switcher para demo: `Admin (todo) > User (solo propios)`.

### 0.1 Matriz RBAC real (seed `012_insert_security_role_feature.sql`)

19 features seed (formato `module.code.code — name`):

```
security.user.read (Leer usuarios)
security.user.write (Escribir usuarios)
security.role.read / security.role.write
security.audit.read (Leer auditoría)
device_management.device.read / device.write / device.config / device.provision (solo admin) / device.claim (admin+user)
telemetry.event.read / telemetry.event.write (ingesta device) / telemetry.alert.read
monitoring.notification.read (Ver propias) / monitoring.notification.write (Enviar - sistema)
analytics.analytics.read / analytics.analytics.report (Crear y exportar)
parameterization.catalog.read / catalog.write (Gestionar - admin)
```

Asignación:
- `admin`: las 19.
- `user`: 6 (`user.read, device.read, device.claim, event.read, notification.read, analytics.read`). Denegados explícitamente: `user.write, role.read/write, audit.read, device.write, device.config, device.provision, event.write, alert.read, notification.write, analytics.report, catalog.read/write`.

> Mockup: todo lo que diga `Permiso: audit.read / role.write / catalog.write / device.provision` etc. debe ocultarse/deshabilitarse con 403 `{"error":{"code":"FORBIDDEN"}}` si el JWT no lo trae. El JWT trae `roles[] + features[]` pre-calculados.

### 0.2 Actores y alcance SomnGuard (resumen)

- **Sistema:** monitoreo somnolencia/fatiga al volante. Edge detecta (PERCLOS, parpadeo, cierre ojos, bostezo, cabeceo, teléfono, mirada, cinturón), emite alerta sonora local AS-01..AS-09, guarda evento + evidencia (JPG 50-200KB) + alert_log, sincroniza offline (buffer 7d, backoff, idempotencia por `event.id` UUIDv7 generado en device).
- **Backend monolito modular hexagonal:** `security → parameterization → device_management → telemetry_service → monitoring → analytics (solo lectura)`.
- **Portal web (este mockup):** `/login, /register, /reset-password, /dashboard, /devices, /events, /events/:id, /analytics, /reports, /notifications, /admin/*`.
- **Fuera de MVP:** video tiempo real WebRTC, FMS/aseguradoras, facturación, analítica avanzada.

---

## 1. Shell Global Admin (layout que envuelve TODAS las vistas)

Construir una vez y reutilizar. Es lo primero que se mockea.

### 1.1 Layout / Estructura

```
+------------------------------------------------------------------+
| Topbar: [Logo SomnGuard] [Search global ⌘K] [Env: QA] [Refresh MV] [Notifs bell (3)] [Avatar Admin ▼] |
+----------+-------------------------------------------------------+
| Sidebar  | Breadcrumb: Administración / Usuarios                   |
|          | Título vista + subtítulo + [Acción primaria]             |
| Dashboard| KPI cards (4)                                           |
| Seguridad| Filtros colapsables + [Limpiar] [Export CSV]            |
| Disposit.| Tabla + paginación + bulk bar                             |
| Telemetría|                                                       |
| Monitoreo| Drawer detalle lateral (al hacer click fila)             |
| Analítica|                                                       |
| Paramet. |                                                       |
| Auditoría|                                                       |
| Reportes | Footer: version, trace_id, latency                      |
+----------+-------------------------------------------------------+
```

### 1.2 Sidebar (navegación lateral, desktop 240px colapsable a 64px, móvil drawer)

Secciones y rutas (todas bajo guard `@RequireFeature`):

```
DASHBOARD
  /admin/dashboard            [analytics.read]              badge: críticos hoy

SEGURIDAD [security.*]
  /admin/users                [user.read]                   contador: activos
  /admin/roles                [role.read]
  /admin/permissions          [role.read] (matriz role×feature)
  /admin/sessions             [user.read] (refresh_token)
  /admin/password-resets      [user.read]
  /admin/email-verifications  [user.read]
  /admin/login-audit          [audit.read]                  badge: fallidos 24h

PARAMETRIZACIÓN [catalog.*]
  /admin/catalog/event-categories    [catalog.read]
  /admin/catalog/severities
  /admin/catalog/media-types
  /admin/catalog/sound-patterns
  /admin/catalog/event-types         badge: DRAFT count
  /admin/catalog/statuses            [catalog.write, Admin total]
  /admin/catalog/transitions         [catalog.write, Admin total]

DISPOSITIVOS [device.*]
  /admin/devices              [device.read]                 badge: offline
  /admin/assignments          [device.read]
  /admin/device-configs       [device.config]
  /admin/provisioning-tokens  [device.provision]            badge: activos
  /admin/provisioning-audit   [audit.read]

TELEMETRÍA [event.read / alert.read]
  /admin/events               [event.read]
  /admin/evidence             [event.read]
  /admin/alerts               [alert.read]

MONITOREO
  /admin/notifications        [notification.read]

ANALÍTICA
  /admin/analytics-timeline   [analytics.read]
  /admin/analytics-metrics    [analytics.read]
  /admin/reports              [analytics.report]

AUDITORÍA & OPS [audit.read]
  /admin/audit                (tabs: logins, user/device/event/config/notification status_audit, config_history, provisioning_audit)
  /admin/observability        (RED, Grafana links, health, alertas técnicas)
  /admin/settings             (retenciones, rate limits - solo lectura + propuesta)
```

Comportamiento sidebar:
- Resalta sección activa, muestra dot si hay alerta (offline masivo, FAILED alto, fallidos login pico).
- Colapsable, tooltips en modo iconos.
- Footer sidebar: `Admin: nombre (admin) | v1.x | Env`.

### 1.3 Topbar

- Logo + nombre entorno (`DEV/QA/PROD` chip color).
- Search global `⌘K`: busca por `email, serial_number, claim_code, event_id, CLM-...`. Enter va al detalle. Sin oráculo en claim (mismo tiempo/respuesta).
- Botón `Refrescar MVs` (`REFRESH MATERIALIZED VIEW analytics.v_*`) con `last_refresh` (no existe en BD → mockup debe mostrar `Último refresh: hace X min (pg_cron 5min/1h)` + spinner).
- Campana notificaciones: `FAILED + PENDING` count, dropdown últimos 10, link a `/admin/notifications`.
- Avatar: `nombre, email, roles:[admin], features count, [Mi perfil] [Cerrar sesión (blocklist + revoca refresh)]`.
- `X-Request-ID` visible en footer/devtools para correlación.

### 1.4 Guards, sesiones, errores globales

- Login: `POST /auth/login` → `access 15min + refresh 7d rotación`. Rate `5 req/min/IP` → `429 + Retry-After:60`. Tras 5 fallos `locked_until NOW()+15min`, `outcome=ACCOUNT_LOCKED`.
- Guard ruta: si no JWT → `/login`; si JWT sin feature → `403 Page` con `{"error":{"code":"FEATURE_REQUIRED"}}`.
- Refresh silencioso, logout limpia httpOnly/secure + blocklist `jti`.
- Envelope error global: `{"error":{"code":"...","message":"español","details":[],"trace_id":"uuid"}}`. Códigos: `INVALID_TOKEN/API_KEY, FEATURE_REQUIRED 403, DUPLICATE_KEY/STATE_TRANSITION_INVALID 409, FIELD_VALIDATION 422, TOO_MANY_REQUESTS 429, DOWNSTREAM_FAILED 503`.
- Tablas: skeleton loading, empty state con CTA, error state con Reintentar, paginación server (`page/page_size 20 max100` o cursor `?cursor&limit 50`), ordenamiento por columna indexada.
- Auditoría: toda acción mutante pide `motivo (change_reason/context_json)` opcional y registra `created_by/updated_by = admin.id`, nunca DELETE físico.

### 1.5 Componentes UI reutilizables (definir una vez en mockup)

- `KpiCard`: título, valor grande, delta vs ayer, sparkline, link drill-down.
- `StatusBadge`: colores fijos:
  - Device: `REGISTERED gris, ASSIGNED azul, ACTIVE verde, OFFLINE ámbar, SUSPENDED rojo, RETIRED negro`.
  - Event: `DETECTED gris, REGISTERED azul, SYNCHRONIZED verde claro, ANALYZED verde, ARCHIVED negro`.
  - User: `PENDING_VERIFICATION ámbar, ACTIVE verde, SUSPENDED rojo, SOFT_DELETED gris tachado`.
  - Config: `DRAFT gris, PUBLISHED verde, DEPRECATED ámbar`.
  - Notification: `PENDING gris, SENT azul, DELIVERED celeste, READ verde, FAILED rojo`.
  - Severity: `info gris-azul, warning ámbar, high naranja, critical rojo pulsante`.
- `FilterBar`: selects + date-range + search + chips activos + [Limpiar].
- `DataTable`: checkbox bulk, sort, densidad, columnas congeladas (ID), acciones fila `⋯`.
- `DetailDrawer`: header con badge + timeline + tabs + auditoría inline + acciones.
- `JsonEditor`: para `threshold_config` y `configuration` con validación schema + diff.
- `AuditTimeline`: lista `from → to + actor + fecha + context_json`.
- `EvidenceViewer`: preview JPG/MP4 + `minio_key, size, sha256, media_type`.
- `ConfirmModal`: para suspender/eliminar/rotar/revocar con checkbox `Entiendo` + motivo.

---

## 2. Módulo Dashboard Admin — `/admin/dashboard`

**Permiso:** `analytics.read` (admin ve TODO, user solo propio — admin sin filtro propietario).
**Objetivo:** en 10 segundos saber salud flota, riesgo, fallos.
**Fuentes:** `analytics.v_metrics_daily`, `v_event_timeline`, `device (heartbeat)`, `notification (FAILED)`, `audit_login (fallidos)`.

### 2.1 KPI Cards superiores (4-8, click drill-down)

1. **Dispositivos:** `Total X | Activos Y verde | Offline Z ámbar (>5min sin heartbeat) | Suspendidos W rojo | Sin asignar V gris (claimed_at NULL)` → click `/admin/devices?status=DEVICE_OFFLINE`.
2. **Eventos hoy:** `Total N | Críticos C rojo | High H naranja | % offline_sync` → `/admin/events?occurred_at_gte=today`.
3. **Alertas críticas 7d:** `count severity=critical` + sparkline 7d + top event_type (ej. `EV-SOM-05 Microsueño`) → `/admin/alerts?severity=critical`.
4. **Notificaciones:** `SENT x / DELIVERED y / READ z / FAILED w rojo + retry queue` → `/admin/notifications?status=FAILED`.
5. **Usuarios:** `Activos A | Pendientes verificación B | Suspendidos C | Bloqueados D (locked_until>NOW) | Soft-deleted E` → `/admin/users`.
6. **Seguridad:** `Logins fallidos 24h F (INVALID_CREDENTIALS) | ACCOUNT_LOCKED G` → `/admin/login-audit?outcome=INVALID_CREDENTIALS`.
7. **Provisioning:** `Tokens activos T | Expirados | Revocados | Agotados (uses_count>=max_uses)` → `/admin/provisioning-tokens`.
8. **Evidencia/MinIO:** `Eventos sin evidencia (LEFT JOIN NULL) | tamaño total hoy | errores checksum` → `/admin/evidence`.

Cada card: `valor, delta vs ayer (↑↓ %), subtítulo, mini sparkline 7d, link Ver`.

### 2.2 Gráficos principales (segunda fila)

- **Serie temporal 7/30/90d** (selector): `event_count por día apilado por severity (info/warning/high/critical)` desde `v_metrics_daily`. Tooltip: `fecha, total, critical, high, first/last`. Export PNG/CSV. <500ms p95 10k.
- **Heatmap hora×día** (opcional): picos somnolencia madrugada.
- **Donut por categoría:** `SOMNOLENCE/DISTRACTION/SEATBELT/SYSTEM` counts.
- **Barras por event_type top 10:** `EV-SOM-01..EV-SYS-06` con color severity default.
- **Ranking devices/usuarios:** top 10 `device_id/serial + user email + event_count + critical_count` (JOIN assignment vigente). Click va a device/user.
- **Timeline reciente:** últimos 20 eventos (`v_event_timeline` orden `occurred_at DESC`): `hora, serial, event_type_code+name, severity badge, mini thumb evidencia, offline badge`. Click abre drawer evento.

### 2.3 Paneles operativos (tercera fila)

- **Devices que necesitan atención:** tabla `serial, status, last_heartbeat_at (hace X min), firmware, user asignado, [Suspender][Rotar key][Ver]`. Filtro `offline>5min, claimed_at NULL stock, firmware desactualizado`.
- **Notificaciones fallidas:** `title, user, channel, retry_count, error_message, sent_at, [Reintentar]`.
- **Logins sospechosos:** `email_attempted, IP, outcome, count 1h, [Bloquear user][Ver audit]`. Alerta si `INVALID_CREDENTIALS` pico por IP.
- **Cola provisioning:** tokens por expirar 48h, sin usar.

### 2.4 Filtros globales dashboard

- Rango fecha (Hoy, 7d, 30d, 90d, custom), `device_id/serial, user_id/email, event_category, severity, event_type`. Todo filtra KPIs+gráficos (query a MVs con `metric_date, device_id, user_id` índices).
- Botón `Refrescar MVs` + `Último refresh hace X` + `Auto-refresh 60s toggle`.

---

## 3. Módulo Seguridad — `/admin/*` (núcleo IAM)

Tablas: `security."user", role, module, feature, role_feature, user_role, refresh_token, email_verification, password_reset_request, audit_login, user_status_audit`.

### 3.1 Usuarios — `/admin/users` — `Permiso: user.read / user.write`

**Tabla columnas:**
`Avatar+nombre (first+last) | email (link, UNIQUE) | phone (UNIQUE, NULL) | status badge (USER_*) + category | is_active toggle | email_verified (✅/⏳ email_verified_at) | last_login_at (hace X) | failed_attempts + locked_until (🔒 si >NOW) | roles chips (admin/user) | devices count | created_at | ⋯`

**Filtros:** search `email/nombre/phone LIKE`, `status (4)`, `status_category`, `is_active`, `verified (NULL/NOT NULL)`, `locked (locked_until>NOW)`, `role`, `last_login rango`, `deleted (incluir SOFT_DELETED toggle)`, `failed_attempts>3`.

**Bulk:** Suspender, Reactivar, Soft-delete, Desbloquear, Forzar verificación, Asignar rol.

**Acciones fila:** Ver (drawer), Editar, Suspender/Reactiva, Soft-delete/Recuperar, Desbloquear (`failed=0, locked_until=NULL`), Forzar `email_verified_at=NOW`, Reset password (crea `password_reset_request`), Asignar rol, Ver logins/auditoría/devices/notifs, Invalidar sesiones (revoca refresh_tokens).

**Drawer detalle `/admin/users/:id`:**
- Header: avatar, nombre, email, badges status/is_active/verified/locked, `id UUID copy`.
- Tabs:
  - `Resumen`: todos los campos (`password_hash` NUNCA mostrado, solo `••••`), `created_by/at, updated_by/at, deleted_by/at, version`.
  - `Roles`: lista `user_role` (`role code, assigned_at, expires_at, is_active, assigned_by`) + [Asignar rol] modal (`role select, expires_at date NULL=indefinido`) + [Revocar] (soft-delete `deleted_at`) + [Expirar ahora].
  - `Dispositivos`: assignments vigentes+históricas (`serial, assigned_at, unassigned_at, assigned_by`).
  - `Sesiones`: refresh_tokens (`created_at, expires_at, revoked_at, replaced_by cadena, is_active`) + [Revocar].
  - `Logins`: últimos 20 `audit_login` (`attempted_at, outcome badge, IP, UA`).
  - `Auditoría estado`: `user_status_audit` timeline (`from→to, changed_by, changed_at, context_json`).
  - `Notificaciones`: últimas vinculadas.
- **Modal Crear (`POST /users`, `user.write`):** `email* (único, validación), password* (bcrypt12, política), first_name*, last_name*, phone (único opcional), roles[] multiselect, is_active default TRUE, status default USER_PENDING_VERIFICATION`. Error `409 DUPLICATE_KEY` si email/phone existe. Muestra `id` creado, NO password.
- **Modal Editar (`PATCH /users/:id`):** mismos campos menos password, unicidad check, `version` optimistic locking.
- **Modal Soft-delete (`DELETE /users/:id`):** explica `is_active=FALSE, status=USER_SOFT_DELETED, deleted_at=NOW, ventana 30d recuperación, invalida sesiones`, pide motivo + confirmación. Botón `Recuperar` si ya borrado (`deleted_at=NULL, status=USER_ACTIVE`).
- **Métricas vista:** cards `Activos/Suspendidos/Pendientes/Bloqueados/Soft-deleted, logins fallidos 24h`.
- **Alertas:** banner si `failed_attempts>5` o `locked` masivo.

### 3.2 Roles — `/admin/roles` — `Permiso: role.read / role.write`

Tabla: `code (admin/user UNIQUE) | name | description | is_active toggle | users count | features count | created_at | ⋯`
Filtros: `code, is_active`.
Acciones: Ver (drawer con users + features), Editar (name/desc/is_active, `code` inmutable si referenciado RESTRICT), Crear rol (Admin total: `code* snake, name*, desc`), Desactivar (no borrar si tiene users).
Seeds a mostrar: `admin "Acceso completo", user "Acceso estándar"`.

### 3.3 Permisos / Matriz RBAC — `/admin/permissions` — `Permiso: role.read (+ role.write para editar)`

Vista matriz (la más importante para Admin):

```
            | user.read | user.write | role.read | role.write | audit.read | device.read | device.write | device.config | device.provision | device.claim | event.read | event.write | alert.read | notif.read | notif.write | analytics.read | analytics.report | catalog.read | catalog.write |
admin (19)  |    ✅     |     ✅     |    ✅     |     ✅     |     ✅     |      ✅     |      ✅      |       ✅        |        ✅          |      ✅      |     ✅     |      ✅       |     ✅     |     ✅     |      ✅       |       ✅       |        ✅        |      ✅      |       ✅      |
user (6)    |    ✅     |     ❌     |    ❌     |     ❌     |     ❌     |      ✅     |      ❌      |       ❌        |        ❌          |      ✅      |     ✅     |      ❌       |     ❌     |     ✅     |      ❌       |       ✅       |        ❌        |      ❌      |       ❌      |
```

- Filas `role`, columnas `feature` agrupadas por `module` (`security, device_management, telemetry, monitoring, analytics, parameterization`).
- Click celda toggle `role_feature.is_active / soft-delete` (con confirmación + auditoría `created_by`).
- Filtros: por módulo, solo diferencias, solo activos.
- Drawer feature: `module_id, code (module_id,code UNIQUE), name, desc, roles que la tienen`.
- Tablas subyacentes: `module (6 seeds), feature (19), role_feature (UNIQUE role+feature), user_role (UNIQUE parcial vigente, expires_at)`.
- Propuesta 23 features (renombrar/crear `user.delete, user.own_read/write, role.assign, device.assign, device.config_read, event.ingest`): mostrar sección `Propuestas (no en DB aún)` con badge `TODO`.

### 3.4 Sesiones activas — `/admin/sessions` — `Permiso: user.read`

Tabla `refresh_token`: `user email | token_hash (truncado `abc…xyz`, nunca completo) | created_at | expires_at (countdown) | revoked_at (NULL=vigente) | replaced_by (link cadena rotación) | is_active | ⋯`
Filtros: `user, vigentes (revoked NULL + expires>NOW + is_active), expirados, revocados, expira en <24h`.
Acciones: Revocar (`is_active=FALSE, revoked_at=NOW`), Revocar todas de un user, Ver cadena rotación.
Métricas: `Sesiones activas totales, por user top, tokens vencidos sin usar`.

### 3.5 Resets password — `/admin/password-resets` — `Permiso: user.read` (solo lectura)

Tabla `password_reset_request`: `user email | created_at | expires_at (NOW()+1h) | is_used + used_at | is_active | ⋯`
Filtros: `user, usados/no, vigentes/vencidos, últimos 7d`.
Acciones: Invalidar (`is_active=FALSE`), Crear reset manual (envía email). `token_hash` SHA256 nunca visible.
CHECKs: `expires>created, NOT is_used OR used_at NOT NULL`.

### 3.6 Verificaciones email — `/admin/email-verifications` — `Permiso: user.read`

Tabla `email_verification`: `user | created_at | expires_at | is_used/used_at | is_active | ⋯` + filtros `pendientes (NOT used + NOT expired), vencidos, usados`.
Acciones: Reenviar, Invalidar. `CASCADE` al borrar user.

### 3.7 Auditoría login — `/admin/login-audit` — `Permiso: audit.read`

Tabla `audit_login` (append-only, retención 2 años, job mensual):
`attempted_at (DESC, IDX) | email_attempted | user link (NULL si no existe, FK SET NULL) | outcome badge (SUCCESS verde, INVALID_CREDENTIALS rojo, ACCOUNT_LOCKED naranja, ACCOUNT_SUSPENDED gris, EMAIL_NOT_VERIFIED ámbar) | IP | UA (truncado, tooltip full) | ⋯`
Filtros: `email LIKE, outcome (5), IP, user_id, rango fecha, solo fallidos toggle`.
Métricas: `éxito vs fallo 24h donut, top IPs fallidas, top emails atacados, serie hora`.
Alertas: banner `pico INVALID_CREDENTIALS por IP >20/h = posible fuerza bruta → [Bloquear IP (propuesto)] [Suspender users]`.
Export CSV. Sin edición (solo INSERT/lectura).

---

## 4. Módulo Parametrización (Catálogos) — `/admin/catalog/*` — `Permiso: catalog.read / catalog.write (admin)`

Tablas: `event_category (4), severity (4), media_type (2), sound_pattern (9), event_type (18), status_category (5), status (23), status_transition (25)`.

Patrón común cada catálogo simple: tabla `code UNIQUE | name | extras | sort/priority | is_active toggle | created_by/at | updated_by/at | ⋯` + [Nuevo] + Editar + Activar/Desactivar (no DELETE físico si FK RESTRICT → error `409` con mensaje `En uso por N event_types`). `code` inmutable tras crear si referenciado.

### 4.1 Categorías evento — `event_category`

Seeds: `SOMNOLENCE (10), DISTRACTION (20), SEATBELT (30), SYSTEM (40)` (`code, name, description, sort_order>=0`).
Columnas: `code | name | description | sort_order (drag) | is_active | ⋯`. Filtro `is_active`.

### 4.2 Severidades — `severities`

Seeds: `info (1 gris), warning (2 ámbar), high (3 naranja), critical (4 rojo)` (`code, name, priority>=1`).
Uso: ordena alertas, dispara notif si `critical`, cuenta en `v_metrics_daily.critical/high_count`.

### 4.3 Tipos media — `media-types`

Seeds: `image_jpeg (image/jpeg, 10MB), video_mp4 (video/mp4, 50MB)` (`code, name, mime_type, max_size_mb>0`).
Uso: valida upload evidencia (`size_bytes vs max_size_mb`, `checksum_sha256 LENGTH 64`).

### 4.4 Patrones sonido — `sound-patterns` — exclusivo admin técnico

Seeds 9 (`code, description, frequency_hz>0, duration_ms>0, repetitions>=0 0=continuo, pattern_type beep/continuous/intermittent/escalating, interval_ms NULL/>0`):

```
AS-01 Somnolencia leve 800Hz 500ms x1 beep —
AS-02 moderada 950Hz 400ms x2 beep 200ms
AS-03 severa 1100Hz 300ms x3 beep 200ms
AS-04 crítico 1200Hz 2000ms x0 continuous —
AS-05 distracción 900Hz 700ms x2 beep 300ms
AS-06 mirada 950Hz 500ms x2 beep 200ms
AS-07 cinturón 700Hz 1000ms x0 intermittent 1000ms
AS-08 ok 600Hz 300ms x1 beep —
AS-09 error 1000Hz 500ms x2 escalating 200ms
```

Vista: tabla + [Probar sonido] (play WebAudio con freq/dur/reps) + gráfico `freq vs dur` + uso (qué event_types lo usan).

### 4.5 Tipos evento — `event-types` — CRUD central

Tabla `event_type`: `code UNIQUE (EV-SOM-01..EV-SYS-06) | name | category FK | default_severity FK | default_sound FK | threshold_config JSONB | status (DRAFT/PUBLISHED/DEPRECATED) | status_category | version | is_active | ⋯`
18 seeds (todos `PUBLISHED/ACTIVE`):

```
EV-SOM-01 Parpadeo anómalo | SOMNOLENCE | info | AS-01 | {"blink_rate_max":25,"blink_rate_min":5,"window_sec":15}
EV-SOM-02 Cierre prolongado | SOMNOLENCE | warning | AS-02 | {"eye_closed_min_sec":2}
EV-SOM-03 Bostezo | SOMNOLENCE | warning | AS-02 | {"yawn_count_min":2,"window_min":5}
EV-SOM-04 Cabeceo | SOMNOLENCE | high | AS-03 | {"head_tilt_deg_min":20,"duration_sec_min":3}
EV-SOM-05 Microsueño | SOMNOLENCE | critical | AS-04 | {"eye_closed_min_sec":3,"head_tilt_deg_min":20,"simultaneous":true}
EV-DIS-01 Teléfono | DISTRACTION | info | AS-05 | {"detection_confidence_min":0.7,"duration_sec_min":2}
EV-DIS-02 Teléfono prolongado | DISTRACTION | high | AS-05 | {"duration_sec_min":5}
EV-DIS-03 Mirada fuera | DISTRACTION | info | AS-06 | {"duration_sec_min":3}
EV-DIS-04 Mirada prolongada | DISTRACTION | high | AS-06 | {"duration_sec_min":5}
EV-DIS-05 Movimiento anómalo | DISTRACTION | info | AS-05 | {"duration_sec_min":3}
EV-CIN-01 Cinturón no detectado | SEATBELT | info | AS-07 | {"no_detection_sec_min":10}
EV-CIN-02 Cinturón mal colocado | SEATBELT | info | AS-07 | {"incorrect_position_sec_min":10}
EV-SYS-01 Init ok | SYSTEM | info | AS-08 | {}
EV-SYS-02 Error cámara | SYSTEM | warning | AS-09 | {"invalid_image_sec_min":10}
EV-SYS-03 Rostro no detectado | SYSTEM | info | AS-09 | {"no_face_sec_min":30}
EV-SYS-04 Conect perdida | SYSTEM | info | AS-09 | {}
EV-SYS-05 Conect restaurada | SYSTEM | info | AS-08 | {}
EV-SYS-06 Disco lleno | SYSTEM | warning | AS-09 | {"usage_pct_min":90}
```

Detalle drawer: selects categoría/severidad/sonido (FKs RESTRICT), `JsonEditor threshold_config` con validación por categoría (ej. `eye_closed_min_sec` required si SOMNOLENCE), preview `Si ocurre → suena AS-XX + severidad Y`, uso (`event count 30d`, `alert count`), versionado (`version++` cada update), publicar/archivar (transición DRAFT→PUBLISHED→DEPRECATED, `allowed_roles=[admin]`).
Filtros: `code/name LIKE, category, severity, sound, status, is_active`.
Alerta si `event_type DRAFT sin transiciones definidas`.

### 4.6 Estados y transiciones — `statuses / transitions` — Admin total

- `status_category` (5, casi inmutable): `ACTIVE(10), INACTIVE(20), PENDING(30), ERROR(40), ARCHIVED(50, is_final TRUE único)` (`code PK, name, desc, sort_order, is_final`).
- `status` (23): `code PK | category FK | name | entity_type (device/event/user/device_config/notification) IDX | sort_order | is_initial | is_terminal | ⋯` (CHECK `NOT (initial AND terminal)`).
  ```
  device: DEVICE_REGISTERED PENDING initial, ASSIGNED PENDING, ACTIVE ACTIVE, OFFLINE INACTIVE, SUSPENDED INACTIVE, RETIRED ARCHIVED terminal
  event: EVENT_DETECTED PENDING initial, REGISTERED PENDING, SYNCHRONIZED ACTIVE, ANALYZED ACTIVE, ARCHIVED ARCHIVED terminal
  user: USER_PENDING_VERIFICATION PENDING initial, ACTIVE ACTIVE, SUSPENDED INACTIVE, SOFT_DELETED ARCHIVED terminal
  device_config: DEVICE_CONFIG_DRAFT PENDING initial, PUBLISHED ACTIVE, DEPRECATED INACTIVE
  notification: NOTIFICATION_PENDING PENDING initial, SENT ACTIVE, DELIVERED ACTIVE, READ ACTIVE, FAILED ERROR terminal
  ```
- `status_transition` (25, PK `from,to`): tabla/grafo `from → to + allowed_roles chips (admin/user/system NULL=system/any) + description`.
  ```
  Device(10): REGISTERED→ASSIGNED [user], ASSIGNED→ACTIVE [system], ACTIVE→OFFLINE [system], OFFLINE→ACTIVE [system], ACTIVE→SUSPENDED [admin], SUSPENDED→ACTIVE [admin], SUSPENDED→RETIRED [admin], REGISTERED→RETIRED [admin], ACTIVE→REGISTERED [user,admin] (unassign), ASSIGNED→REGISTERED [user,admin] (unassign)
  Event(4)[system]: DETECTED→REGISTERED, REGISTERED→SYNCHRONIZED, SYNCHRONIZED→ANALYZED, ANALYZED→ARCHIVED
  User: PENDING→ACTIVE [user], ACTIVE→SUSPENDED [admin], SUSPENDED→ACTIVE [admin], ACTIVE→SOFT_DELETED [user,admin]
  Config(2)[admin]: DRAFT→PUBLISHED, PUBLISHED→DEPRECATED
  Notification: PENDING→SENT [system], SENT→DELIVERED [system], DELIVERED→READ [user], SENT→FAILED [system], PENDING→FAILED [system]
  ```
- Vista mockup: grafo visual (nodos estados, aristas transiciones con label rol), matriz `from×to`, modal crear (`from select, to select !=from, allowed_roles multiselect admin/user/system, desc`), validación `from!=to`.
- Nota: `allowed_roles` usa literales `user/system/admin` (no FK a role.code; `system` no es rol).

---

## 5. Módulo Device Management — `/admin/devices*` — `Permiso: device.read / device.write / device.config / device.provision`

Tablas: `device, device_assignment, device_config, device_config_history, device_provisioning_token, device_provisioning_audit, device_status_audit, device_config_status_audit`.

Máquina device (mostrar como stepper en detalle):
`[*] → REGISTERED (alta manual/self-register) → ASSIGNED (assign admin o claim) → ACTIVE (primer heartbeat) ↔ OFFLINE (>5min sin heartbeat / heartbeat) → REGISTERED (unassign libera) ; ACTIVE→SUSPENDED (admin) →ACTIVE (reactiva) →RETIRED (fin vida) →[*] ; REGISTERED→RETIRED (alta cancelada)`.

### 5.1 Dispositivos — `/admin/devices` — `Permiso: device.read / device.write`

**Tabla columnas:**
`serial_number (UNIQUE, copy, link) | claim_code (UNIQUE CLM-..., copy) | status badge + category | is_active | firmware_version | user asignado (email o —) | last_heartbeat_at (hace X, rojo si >5min) | last_sync_at | last_config_pull_at | last_seen_ip | claimed (✅ claimed_at / ⏳ NULL) | provisioning (Manual/token link) | created_at | ⋯`

**Filtros:** search `serial/claim_code LIKE`, `status (6)`, `is_active`, `firmware_version`, `offline (heartbeat<NOW-5min)`, `sin asignación (no assignment vigente)`, `sin reclamar (claimed_at NULL)`, `provisioning (NULL=manual / NOT NULL=token)`, `last_heartbeat rango`, `deleted toggle`.

**Bulk:** Suspender, Reactivar, Retirar, Rotar keys (peligroso), Export CSV.

**Acciones fila:** Ver, Editar (`firmware_version, is_active`, `serial` inmutable si tiene eventos), Suspender (`ACTIVE→SUSPENDED [admin]` + motivo), Reactivar (`SUSPENDED→ACTIVE [admin]`), Retirar (`→RETIRED [admin]` terminal + confirmación), Rotar API Key (`PATCH /rotate-key` solo admin: invalida inmediato, devuelve key 1 vez, `vieja→401`, estado no cambia), Asignar/Desasignar, Editar config, Ver eventos/alertas/notifs, Copiar claim_code.

**Drawer `/admin/devices/:id`:**
- Header: `serial, claim_code copy, status stepper (Registered→Assigned→Active↔Offline + Suspended/Retired ramas), is_active, firmware, heartbeat hace X`.
- Tabs:
  - `Resumen`: todos los campos (`api_key_hash` NUNCA, solo `••••` + [Rotar]), `provisioning_token_id link, claimed_at, last_seen_ip, created_by (admin que registró), version, deleted_*`.
  - `Asignación`: vigente (`user email, assigned_at, assigned_by`) + [Desasignar → REGISTERED, claimed_at=NULL] + historial tabla (`assigned/unassigned_at`).
  - `Config`: config vigente (`status, version, published_at, configuration JSON pretty`) + [Editar] + [Historial].
  - `Eventos`: últimos 20 (`occurred_at, event_type, severity, evidence thumb`) + link `/admin/events?device_id=`.
  - `Auditoría`: `device_status_audit` timeline + `device_config_status_audit`.
- **Modal Alta manual (`POST /devices`, admin):** `serial_number* UNIQUE, firmware_version, provisioning_token_id opcional, claim_code auto-generado CLM-... (UNIQUE)`. Crea en `REGISTERED`, genera `api_key` (muestra 1 vez con [Copiar] + warning `No podrás verla de nuevo, rota si la pierdes`), `api_key_hash HMAC-SHA256` en BD.
- **Métricas vista:** `Total/Activos/Offline/Suspendidos/Retirados/Sin asignar/Stock sin reclamar, firmware top, sin heartbeat>24h`.
- **Alertas:** banner `OFFLINE masivo (>20% flota)`, `stock REGISTERED sin reclamar >30d`.

### 5.2 Asignaciones — `/admin/assignments`

Tabla `device_assignment`: `device serial | user email | assigned_at | unassigned_at (NULL=vigente verde) | assigned_by (admin/user email) | is_active | ⋯`
Regla 1×1 vigente: `UNIQUE(device_id) WHERE vigente + UNIQUE(user_id) WHERE vigente` (007 + cleanup a REGISTERED). Intentar doble → `409`.
Filtros: `device, user, vigentes toggle, históricas, assigned_by, rango fechas`.
Acciones: Asignar (modal `device select REGISTERED + user select + assigned_by=yo`), Desasignar/Forzar unassign (`unassigned_at=NOW, device→REGISTERED, claimed_at=NULL, audit`), Ver historial por device/user.

### 5.3 Configuraciones — `/admin/device-configs` — `Permiso: device.config`

Tabla `device_config`: `device serial | status (DRAFT/PUBLISHED/DEPRECATED) | version | published_at | updated_at/by | ⋯` (UNIQUE 1 config por device).
Ejemplo `configuration` JSONB a mostrar pretty + editor:
```json
{
  "thresholds": {"blink_rate_max": 25, "eye_closed_sec": 2, "head_tilt_deg": 20},
  "sound_patterns": {"EV-SOM-05": "AS-04", "EV-DIS-02": "AS-05"},
  "volume_pct": 80,
  "sync_interval_sec": 30,
  "retention_days": 7
}
```
Acciones: Editar JSON (valida contra `event_type.threshold_config` + `sound_pattern` existentes), Publicar (`DRAFT→PUBLISHED [admin]`, `published_at=NOW`), Deprecar (`→DEPRECATED`), Comparar versiones (diff), Restaurar versión (crea nueva desde snapshot).
Historial `device_config_history` (append-only, retención 3 años): `device_config_id | configuration snapshot | changed_by admin | change_reason | created_at DESC` + [Restaurar].

### 5.4 Tokens provisioning — `/admin/provisioning-tokens` — `Permiso: device.provision (solo admin)`

Tabla `device_provisioning_token`: `id truncado | serial_number (NULL=genérico gris / valor=atado azul) | uses_count/max_uses (barra 0/1) | expires_at (countdown, rojo si <48h) | revoked_at (NULL=vigente) | device_id link (tras usar) | created_by admin | created_at | ⋯`
Filtros: `serial, activos (NOT revoked + NOT expired + uses<max), agotados, expirados, revocados, creados por mí`.
**Modal Generar:** `serial_number opcional (vacío=genérico), max_uses default 1, expires_at default NOW()+7d`. Al crear muestra `token plano 1 SOLA VEZ` (copiar + descargar .txt) + warning `En BD solo hash SHA256, nunca recuperable`. `token_hash UNIQUE, CHECK uses<=max, expires>created`.
Acciones: Copiar (no reexponer, solo al crear), Revocar (`revoked_at=NOW`), Ver usos/auditoría, Eliminar NO (solo revocar).
Flujo a dibujar en mockup: `Admin genera → Device POST /self-register X-Provision-Token (idempotente serial, crea device+api_key+claim_code) → USED ata device_id → User POST /claim claim_code → assignment`.

### 5.5 Auditoría provisioning — `/admin/provisioning-audit` — `Permiso: audit.read`

Tabla `device_provisioning_audit` (append-only): `created_at DESC | token link | action badge (CREATED azul, USED verde, REVOKED rojo, CLAIMED celeste) | device link | actor (user email o device NULL=system) | IP | ⋯`
Filtros: `token_id, device_id, action (4), rango fecha, IP`.
Sin edición.

---

## 6. Módulo Telemetría — `/admin/events*` — `Permiso: event.read / alert.read` (ingesta `event.write` solo device)

Tablas: `event, evidence, alert_log, event_status_audit`. Alta escritura, índices `(device_id,occurred_at DESC), (type,severity), occurred_at DESC`.

Máquina evento: `DETECTED → REGISTERED → SYNCHRONIZED (ACK) → ANALYZED (consultado/reporte) → ARCHIVED (retención)`.

### 6.1 Eventos — `/admin/events`

**Tabla columnas:**
`occurred_at (DESC, hace X) | event_id (UUIDv7 truncado, copy) | device serial | event_type code+name (EV-SOM-05 Microsueño) | category chip | severity badge | sound (AS-04) | offline badge (is_offline_sync TRUE ámbar) | status badge | evidence thumb (✅/—) | ⋯`

**Filtros (todos con índice):** `device_id/serial, event_type_id/code, severity_id/code, event_category, occurred_at rango (hoy/7d/custom), status, is_offline_sync, con/sin evidencia, metadata search (JSONB), ID exacto`.
Paginación server `page/page_size` o cursor `?cursor&limit 50`, sort `occurred_at:desc`, respuesta `{data, pagination:{page,page_size,total_items,total_pages}}` + JOIN nombres legibles.

**Drawer `/admin/events/:id`:**
- Header: `event_type name, severity badge, occurred_at, device serial link, status`.
- Campos: `id, device_id, event_type_id, severity_id (puede diferir default), sound_pattern_id NULL-able, is_offline_sync, metadata JSONB pretty (confianza, coords), created_by device, version, deleted_*`.
- Tabs: `Evidencia` (viewer), `Alertas` (alert_logs del evento), `Notificaciones` (derivadas), `Auditoría` (`event_status_audit` timeline).
- Acciones admin: Cambiar estado (override `[system]` auditado + motivo `context_json`, ej. forzar `SYNCHRONIZED→ANALYZED`), Marcar analizado, Archivar. NO editar `occurred_at/device/type` (inmutables, idempotencia).
- **Métricas vista:** `conteo por severity/tipo (barras), % offline_sync, serie hora, top devices`.
- **Alertas:** banner `spike critical/high (>3σ o >X/h)`.

### 6.2 Evidencias — `/admin/evidence`

Tabla `evidence`: `event link + occurred_at | device | media_type (image_jpeg/video_mp4) | preview thumb | minio_key (copy, `{device_id}/{YYYY}/{MM}/{DD}/{event_id}.jpg`) | size_bytes (KB/MB, valida vs media_type.max_size_mb) | checksum_sha256 (truncado + [Verificar] ✅) | created_at/by device | ⋯`
Filtros: `media_type, device, event_type, tamaño rango, sin checksum válido, rango fecha`.
**Viewer modal:** imagen/video grande + `anterior/siguiente evento`, metadatos, [Descargar (URL firmada RBAC Owner+Admin)], [Copiar minio_key], [Ver evento], [Ver device].
Reglas: `UNIQUE(event_id)` 1:1 MVP, `FK event CASCADE` (si borra evento borra evidencia), `409 si ya existe, 404 si no evento`. Retención `90d normal / 5a critical` (ILM MinIO, mostrar badge `Expira en Xd`).
Fase1 lote JSON → fase2 `POST /events/:id/evidence multipart 1 JPG 50-200KB`.

### 6.3 Alertas edge — `/admin/alerts` — `Permiso: alert.read`

Tabla `alert_log` (append-only, retención 5 años): `triggered_at DESC | event link | device (denormalizado) | sound_pattern (AS-XX + desc) | severity | ⋯`
Filtros: `device, severity, event_id, triggered_at rango`.
Muestra 0..N por evento. Cada fila link a evento + notificación derivada.
Métrica: `alertas/sec, por sound_pattern (AS-04 críticos), duplicados`.

---

## 7. Módulo Monitoreo (Notificaciones) — `/admin/notifications` — `Permiso: notification.read (+ notification.send propuesto para envío manual)`

Tabla `notification`: `id | user email | alert/event link (alert_log_id FK CASCADE) | title | message (truncado, tooltip) | channel badge (push/email/in_app) | status badge (PENDING→SENT→DELIVERED→READ / FAILED terminal) | sent_at/delivered_at/read_at (timeline) | retry_count (0..3, rojo si >0) | error_message (rojo, tooltip) | created_at/by system | ⋯`

**Filtros:** `user, channel (push/email/in_app CHECK), status (5), sent_at rango, retry>0, con error, alert_id`.
**Acciones:** Ver (drawer con timeline `sent→delivered→read` + `retry_count` + `error_message`), Reintentar (`retry_count++ max3 exponencial`), Reenviar (cambia channel), Marcar leída (admin override), Enviar manual (propuesto `notification.send`: modal `user select, title*, message*, channel*` para pruebas).
**Métricas:** `donut status, tasa entrega (delivered/sent), lectura (read/delivered), FAILED count + top errores, queue depth, serie hora`.
**Alertas:** banner `FAILED alto (>5% o >X/h)`, `retry queue >N`.
Trigger auto: si `severity=critical` (EV-SOM-05, EV-DIS-02/04, EV-CIN-01/02) → crea notificación al propietario (via assignment vigente). Plantillas por `event_type+severity` (Should, admin gestiona — mockup sección `Plantillas (propuesto)`).
Preferencias user (canales/horario silencio/severidad mínima) — admin solo lectura (respeta + ve).

---

## 8. Módulo Analítica — `/admin/analytics*` — `Permiso: analytics.read / analytics.report`

Fuentes: `analytics.v_event_timeline` (grain 1 fila/evento vigente) + `v_metrics_daily` (grain día Bogotá × device × user vigente × event_type × category × severity). Refresh trigger + pg_cron 5min/1h (mockup botón Refresh + `last_refresh`).

### 8.1 Timeline — `/admin/analytics-timeline`

Tabla denormalizada `v_event_timeline`: `event_id | device_id+serial_number | event_type_id/code/name | event_category_code | severity_id/code/priority | occurred_at | is_offline_sync | status/category | evidence_key (NULL=sin evidencia) + media_type_id/code | ⋯`
Filtros: `device, event_type, severity_code, category, fecha, offline, con evidencia, status`.
Vista: tabla tiempo real + export CSV + link a evento/device.
Índices: `(device_id,occurred_at DESC), (event_type_id), (severity_code)`.

### 8.2 Métricas — `/admin/analytics-metrics`

Columnas `v_metrics_daily`: `metric_date (DATE_TRUNC day America/Bogota) | device_id | user_id (assignment vigente) | event_type_id | event_category_id | severity_id | event_count | critical_count (FILTER critical) | high_count | first_event_at | last_event_at`.
Vistas mockup:
- KPIs: `event_count total periodo, critical_count, high_count, promedio/día, día pico (first/last)`.
- Gráficos: `barras apiladas día×severity, serie critical/high, ranking device/user (event/critical), heatmap category×severity, tabla día×device×tipo`.
- Filtros: `metric_date rango (7/30/90d/custom), device, user, event_type, category, severity`. Índices `(metric_date,device_id), (user_id,metric_date)`.
- Export PNG/CSV, <500ms p95 10k (nota técnica).

### 8.3 Reportes + Resumen IA — `/admin/reports` — `Permiso: analytics.report`

- **Resumen IA (`POST /analytics/summary`):** modal `periodo (7/30/90d), device/user/opcional` → prompt métricas+eventos → LLM (modelo por definir Q-015) → texto en modal (patrones/tendencia/conclusiones) + cache 1h user+periodo + [Copiar] [Regenerar] [Incluir en reporte].
- **Reporte PDF/HTML (`POST /reports 202 Accepted async + GET descarga`):** modal `título, periodo, devices, incluye (timeline+métricas+IA+thumbnails evidencia checkbox), formato PDF/HTML` → tabla reportes (`id, título, periodo, estado Generando/Listo/Error, created_by admin, created_at, tamaño, [Descargar attachment/inline] [Eliminar]`) + MinIO PDFs + thumbnails.
- App offline muestra cache (nota).
- Video WebRTC a demanda (`POST /devices/:id/stream/start|stop`, SFU H.264, auto-stop 30s, solo Activo+asociado) — Could post-MVP, mockup badge `POST-MVP`.

---

## 9. Auditoría Global + Observabilidad — `/admin/audit*` — `Permiso: audit.read`

### 9.1 Auditoría global (tabs en una sola vista)

Tabs + filtros comunes (`entidad_id, actor changed_by, rango fecha, to_status/action, IP, search context_json`) + Export CSV + Sin edición (solo INSERT/lectura):

1. **Logins** (`audit_login`): ver §3.7.
2. **Usuarios** (`user_status_audit`), **Devices** (`device_status_audit`), **Eventos** (`event_status_audit`), **Configs** (`device_config_status_audit`), **Notifs** (`notification_status_audit`): esquema idéntico `id BIGSERIAL | {padre}_id FK RESTRICT | from_status NULL (creación) | to_status NOT NULL | from_category NULL | to_category NOT NULL | changed_by (user/device NULL=system) | changed_at NOW | context_json (motivo)` + índice `(padre,changed_at DESC)` + timeline visual `from→to`.
3. **Versiones config** (`device_config_history`): `config_id | snapshot JSONB | changed_by NOT NULL admin | change_reason | created_at DESC` + diff/rollback.
4. **Provisioning** (`device_provisioning_audit`): `CREATED/USED/REVOKED/CLAIMED + token/device/actor/IP`.
5. **Transversal:** `created_by/at, updated_by/at, deleted_by/at, version, is_active` en casi todas + `assigned_by, claimed_at, provisioning_token_id`. Soft-delete nunca DELETE físico; cascada suave; sin triggers en repo (app inserta explícito).

Vista mockup: selector entidad + `timeline vertical` + filtro actor + [Ver objeto] link.

### 9.2 Observabilidad técnica (para Admin ops) — `/admin/observability`

No es negocio, pero el Admin técnico la necesita (ADR-007 OTel+LGTM):

- **Logs JSON Lines:** `timestamp/level/service/module/trace_id/span_id/user_id/device_id/event/message` (nunca PII/secrets), correlación `trace_id + X-Request-ID + traceparent W3C`, sampling 10% (100% errores/críticos), OTLP→Tempo, `/actuator/prometheus` Micrometer.
- **Dashboards Grafana (links embed):** API Global (RED,JVM heap/GC/threads,DB/Redis pool), Auth (login success/failed, refresh,401/403), Telemetry (ingested/sec,batch,MinIO latency,duplicate rate), Device Sync (online/offline,sync success/failed,buffer age,config pull), Monitoring (sent/delivered/failed,retry queue), Analytics (latency p50/p95,report time,AI tokens).
- **Health:** `GET /health {ok}, /health/ready {BD+MinIO}, /health/live` + `pg_isready`, `/actuator/health/info` — semáforos verde/rojo en mockup.
- **Alertas referencia:** `PG no responde P0, disco>85% P1, migración falla P1, 5xx alta P1, p95>SLO P2` + routing Alertmanager `APIHighErrorRate,DeviceOffline`.
- **Incidentes P0-P3:** roles IC/técnico/comms, flujo detección→triaje→contención→diagnóstico→mitigación→postmortem blameless P0/P1.
- **Backups:** `pg_dump` granular + PITR prod (RTO/RPO por confirmar Q-017), restore drill + `liquibase status`, dumps PII cifrados no git.
- **NFRs a mostrar como SLO chips:** `Alerta local <1s/<2s/frame, arranque <60s, <10k users escalable, ≥99% mensual`.

### 9.3 Seguridad transversal (recordatorio en mockup footer/docs)

- TLS1.2+, HTTPS, CORS solo portal/app `credentials:true`, CSP `default-src 'self'... img minio`, HSTS, `nosniff/DENY/referrer`, secrets Vault/Sealed Secrets + `.env.example` nunca `.env`/pem, OWASP dep-check mensual, logs sin PII/tokens/keys.
- Amenazas T-001..T-012 mitigadas (token corta/rotación, key rotación, TLS+firma, audit+NFR-06, RBAC Owner+Admin, URLs firmadas, rate 429, matriz rol×recurso+tests, provisioning 1 uso+7d+rate5/min+auditoría, claim hash+rate+sin oráculo, reexposición 200 sin key).
- MFA/2FA/TOTP/OAuth: **0 resultados (vacío)** salvo biometría opcional app + captcha opcional login → mockup sección `Mejora futura: MFA TOTP/WebAuthn para Admin`.

---

## 10. Qué puede el Admin (acceso total) vs User (referencia)

| Vista / Acción | Admin (total, 19 feats, == Superadmin) | User (referencia, 6 feats) |
|---|---|---|
| Dashboard global (todos devices/users) + OPS (Grafana, SLOs) | ✅ | ❌ solo propio |
| Usuarios CRUD + suspender/soft-delete/desbloquear/reset + crear admins | ✅ (`user.read/write`) | ❌ solo `/me` (`user.read` propio) |
| Roles CRUD + matriz `role_feature` + `module/feature` estructural | ✅ (`role.read/write`) | ❌ |
| Sesiones/revocar, resets invalidar, verifications reenviar | ✅ | ❌ |
| Login audit + 5 status_audit + histories + export | ✅ (`audit.read`) | ❌ |
| Catálogos simples + event_type (JSONB) | ✅ (`catalog.write`) | 👁️ `catalog.read` propuesto (hoy denegado) |
| `status/status_category/transition` grafo | ✅ | ❌ |
| Devices CRUD + suspender/retirar/rotar key + bulk | ✅ (`device.read/write/config/provision`) | 👁️ propios (`device.read` propio) |
| Assignments asignar/desasignar + forzar | ✅ | ✅ propio claim (`device.claim`) |
| Provisioning tokens generar/revocar + políticas | ✅ (`device.provision`) | ❌ |
| Eventos/evidence/alerts ver + override estado | ✅ (`event.read/alert.read`) | 👁️ propios |
| Notifications ver/reintentar/enviar manual + plantillas | ✅ (`notification.read`, `send` propuesto) | 👁️ propias + `POST /:id/read` |
| Analytics timeline/metrics/reportes/IA + refresh MVs | ✅ (`analytics.read/report`) | 👁️ propios + generar propios |
| Settings/retenciones/rate limits | ✅ | ❌ |

---

## 11. Sitemap / Rutas para mockup (copiar a router)

```
/login, /register, /reset-password, /verify-email
/admin/dashboard
/admin/users, /admin/users/:id
/admin/roles
/admin/permissions
/admin/sessions
/admin/password-resets
/admin/email-verifications
/admin/login-audit
/admin/catalog/event-categories
/admin/catalog/severities
/admin/catalog/media-types
/admin/catalog/sound-patterns
/admin/catalog/event-types, /admin/catalog/event-types/:code
/admin/catalog/statuses
/admin/catalog/transitions
/admin/devices, /admin/devices/:id
/admin/assignments
/admin/device-configs, /admin/device-configs/:deviceId
/admin/provisioning-tokens
/admin/provisioning-audit
/admin/events, /admin/events/:id
/admin/evidence
/admin/alerts
/admin/notifications
/admin/analytics-timeline
/admin/analytics-metrics
/admin/reports
/admin/audit (tabs: logins|users|devices|events|configs|notifications|provisioning|versions)
/admin/observability
/admin/settings (propuesto)
403, 404, 429, 500 pages
```

Cada ruta: `breadcrumb, título, subtítulo, permiso, KPIs, filtros, tabla, drawer, modales` según secciones 2-9.

## 12. Checklist construcción mockup (no olvidar)

- [ ] Shell (sidebar+topbar+guards+403/429) primero.
- [ ] Dashboard con 8 KPIs + serie 30d + timeline 20 + paneles atención.
- [ ] Usuarios (tabla 13 cols + drawer 7 tabs + 4 modales) + Roles + Matriz 2×19 + Sesiones + Resets + Verifications + Login audit.
- [ ] 5 catálogos simples + event_type JSONB + grafo status/transition (todo Admin total).
- [ ] Devices (tabla 13 cols + drawer 5 tabs + alta manual con key 1 vez + rotar) + Assignments 1×1 + Configs JSONB + History diff + Tokens 1 vez + Prov audit.
- [ ] Events (filtros índice + drawer 4 tabs) + Evidence viewer + Alerts.
- [ ] Notifications (timeline sent→read + reintentar) + Plantillas.
- [ ] Analytics timeline/metrics/reportes/IA + Refresh MVs + last_refresh.
- [ ] Auditoría global 8 tabs + Observabilidad (health, Grafana, SLOs, backups).
- [ ] Switcher Admin/User para demo permisos + search ⌘K + Export CSV/PNG/PDF + dark mode (opcional).
- [ ] Badges colores §1.5 + empty/error/skeleton + toasts + ConfirmModal con motivo + `trace_id` footer.
- [ ] Datos mock literales: usar seeds §4-5 (codes, nombres, thresholds, AS-XX, EV-XX) para que el mockup parezca real.

---

## Anexos

### A. Inventario DB (para dev mockup/API)

- Schemas 6: `security, parameterization, device_management, telemetry_service, monitoring, analytics`.
- Tablas 33: `security: "user", role, module, feature, role_feature, user_role, password_reset_request, audit_login, refresh_token, email_verification, user_status_audit (11)` · `parameterization: event_category, severity, media_type, sound_pattern, event_type, status_category, status, status_transition (8)` · `device_management: device, device_assignment, device_config, device_config_history, device_provisioning_token, device_provisioning_audit, device_status_audit, device_config_status_audit (8)` · `telemetry_service: event, evidence, alert_log, event_status_audit (4)` · `monitoring: notification, notification_status_audit (2)` · `analytics: v_event_timeline, v_metrics_daily (2 MVs)`.
- Sin ENUMs, sin vistas normales, sin funciones/triggers/procedures en repo (`00_extensions,02_types,05_views,07_functions,08_procedures,09_triggers` vacíos). `03_dcl/04_tcl` vacíos (sin RLS/GRANTs/Tx). `02_dml/01_updates,02_deletes,03_upserts,04_patches` vacíos.
- PKs `UUID` (audits `BIGSERIAL`, status `code`, transition `(from,to)`), `created_at/by, updated_at/by, deleted_at/by, version, is_active, status/category` transversal. FKs `RESTRICT` salvo `audit_login.user SET NULL, refresh_token/email_verification CASCADE, evidence/alert CASCADE, provisioning_token SET NULL`. Índices = filtros obligatorios UI (ver §8 inferencia original).
- Actor semilla `00000000-0000-0000-0000-000000000000` (SYSTEM), upserts `ON CONFLICT DO UPDATE`.

### B. Seeds literales (copiar a mocks)

Ver §3 (roles 2, módulos 6, features 19, matriz admin 19/user 6), §4 (status_category 5, status 23, transition 25, severity 4, category 4, media 2, sound 9, event_type 18 con thresholds), §5 (device claim `CLM-XXXXXXXXXXXX`, provisioning +7d max_uses 1).

### C. Endpoints admin-only (para conectar mockup a API real)

```
POST /devices, PATCH /devices/{id}/rotate-key, POST /devices/provisioning-tokens, PATCH /devices/{id}/config (admin JWT)
POST/PATCH/DELETE /catalogs/... (catalog.write)
CRUD /roles /features, asignar user_role/role_feature (role.write)
GET /audit-login (audit.read)
POST /users, PATCH/DELETE /users/{id}, PUT/DELETE /roles/{id}, POST/PUT/DELETE /features
Device: POST /telemetry/events + /evidence + /heartbeat + GET /config (X-Device-ID+API-Key), POST /devices/self-register (X-Provision-Token), POST /devices/claim (JWT+device.claim)
Analytics: GET /analytics/timeline|metrics, POST /analytics/summary|reports, GET /reports/:id/download
Notif: GET /notifications, GET /:id, POST /:id/read
Auth: POST /auth/register|login|logout|refresh|verify-email, POST /forgot-password|reset-password
```

### D. Fuentes

- `somnguard-docs`: `README, 01-project-context/*, 02-domain/*, 03-product-definition/product-backlog, 04-requirements/*, 05-architecture/*, 06-data-architecture/*, 07-api-design/*, 09-modules/*, ADRs 001-010, threat-model, cross-cutting, software-design-report`.
- `somnguard-db`: `01_ddl/01_schemas/*, 01_ddl/03_tables/* (33), 01_ddl/04_alter/* (21+), 01_ddl/06_materialized_views/* (2), 01_ddl/10_indexes/* (7), 02_dml/00_inserts/* (12), docker-compose, liquibase.properties, README`.

> Fin spec. Con este archivo + seeds literales se puede maquetar cada pantalla sin releer docs/DB.
