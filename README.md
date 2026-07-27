# 🚕 PiqueraLink

**Plataforma Inteligente de Movilidad para Piqueras de Taxis**

PiqueraLink moderniza las piqueras de taxis tradicionales con un sistema digital completo: gestión de colas FIFO, asignación inteligente de conductores, tarificación dinámica, pagos digitales, seguridad SOS en tiempo real y analítica predictiva.

---

## 📋 Tabla de Contenidos

- [Problema que resuelve](#-problema-que-resuelve)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Ejecución](#-instalación-y-ejecución)
- [Módulos del Sistema](#-módulos-del-sistema)
- [API Endpoints](#-api-endpoints)
- [Eventos en Tiempo Real](#-eventos-en-tiempo-real)
- [Guía de Pruebas](#-guía-de-pruebas)
- [Seguridad](#-seguridad)
- [Roadmap](#-roadmap)

---

## 🎯 Problema que resuelve

Las piqueras de taxis funcionan de forma manual: el checador anota en papel, los pasajeros desconocen la disponibilidad, y no hay trazabilidad. PiqueraLink elimina esto ofreciendo:

- **Pasajeros:** Vista móvil para pedir taxi, ver conductor asignado en tiempo real, compartir viaje con familiares, calificar servicio.
- **Conductores:** Sistema de turnos digital FIFO, alertas de viajes, billetera con ganancias, analíticas de rendimiento.
- **Administradores:** Panel en vivo de la cola, control de flota, reportes, gestión de sanciones.
- **Super Admin:** Dashboard global con métricas de toda la red, salud operativa, alertas SOS centralizadas.

---

## ✨ Características

### Core
| Funcionalidad | Descripción |
|---------------|-------------|
| 🔐 Auth JWT + RBAC | 4 roles: pasajero, conductor, admin, super_admin |
| 📋 Cola FIFO | Turnos atómicos con transacciones ACID |
| 🚗 Asignación automática | Primer conductor en cola asignado al pasajero |
| ⚡ Tiempo real | Socket.IO con rooms segmentadas por piquera/usuario/viaje |
| 📍 Geolocalización | Ubicación del pasajero + tracking GPS del conductor |
| 📱 Mobile-first | UI responsive optimizada para smartphones |

### Avanzado
| Funcionalidad | Descripción |
|---------------|-------------|
| 💰 Tarificación dinámica | Upfront pricing con surge por hora pico, tráfico y demanda |
| 💳 Billetera digital | Split automático de pagos (85% conductor, 10% plataforma, 5% piquera) |
| 🛡️ SOS en tiempo real | Botón de pánico con streaming de ubicación a admins |
| ⭐ Calificaciones mutuas | Rating 1-5 entre pasajero y conductor |
| 🔗 Compartir viaje | Safety link tokenizado para familiares (sin login) |
| 🎫 Códigos promo | Descuentos por porcentaje o monto fijo con validación |
| 📊 Analítica global | KPIs, métricas por piquera, predicción de demanda |
| 📦 Objetos perdidos | Reportes con notificación al conductor |
| 🔔 Notificaciones | Push vía Socket.IO con persistencia en DB |
| 🚫 Sanciones | Suspensión/bloqueo de cuentas con invalidación inmediata |
| 📄 Reportes CSV | Exportación de datos filtrados por fecha y piquera |

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────┐
│              CLIENTE (React + Tailwind)                │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────┐ │
│  │ Pasajero │  │Conductor │  │  Admin  │  │Global│ │
│  └────┬─────┘  └────┬─────┘  └────┬────┘  └──┬───┘ │
│       └──────────────┼─────────────┼──────────┘     │
│                      │ HTTP + WebSocket               │
└──────────────────────┼───────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────┐
│          SERVIDOR (Node.js + Express + TypeScript)     │
│  ┌─────────────────────────────────────────────────┐ │
│  │  16 módulos REST + 6 módulos Socket.IO           │ │
│  │  Auth │ Queue │ Trips │ Piqueras │ SOS │ Wallet │ │
│  │  Ratings │ Promos │ Notifications │ Location    │ │
│  │  Favorites │ LostItems │ Analytics │ Reports    │ │
│  └──────────────────────┬──────────────────────────┘ │
│                         │ Prisma ORM                   │
└─────────────────────────┼─────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────┐
│             PostgreSQL 16 (Docker)                      │
│  18 tablas │ 10 enums │ Transacciones ACID             │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Base de Datos | PostgreSQL 16 |
| ORM | Prisma (18 modelos, migraciones declarativas) |
| Tiempo Real | Socket.IO (6 módulos, 5 rooms) |
| Autenticación | JWT + bcrypt + RBAC |
| Validación | Zod (schemas en todos los endpoints) |
| Contenedores | Docker + Docker Compose |

---

## 📁 Estructura del Proyecto

```
piqueralink/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── components/common/       # Sidebar, MetricCard, StatusBadge, AppLayout
│   │   ├── context/                 # AuthContext, SocketContext
│   │   ├── hooks/                   # useAuth, useSocket, useGeolocation
│   │   ├── pages/                   # PassengerHome, DriverDashboard, AdminPanel, GlobalAdminPanel
│   │   ├── services/api.ts          # Cliente HTTP tipado
│   │   └── App.tsx                  # Routing por rol
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── server/                          # Backend Express
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                # Registro, Login, JWT, Refresh
│   │   │   ├── queue/               # Cola FIFO + Socket.IO events
│   │   │   ├── trips/               # Solicitudes + asignación + fare calc
│   │   │   ├── piqueras/            # CRUD + geolocalización + métricas
│   │   │   ├── global-admin/        # Dashboard global super_admin
│   │   │   ├── metrics/             # Métricas globales y por piquera
│   │   │   ├── geospatial/          # Tracking GPS de conductores
│   │   │   ├── sos/                 # Alertas de emergencia en tiempo real
│   │   │   ├── ratings/             # Calificaciones mutuas
│   │   │   ├── favorites/           # Destinos favoritos del pasajero
│   │   │   ├── trip-share/          # Safety link tokenizado
│   │   │   ├── lost-items/          # Objetos perdidos
│   │   │   ├── wallet/              # Billetera + transacciones + retiros
│   │   │   ├── payments/            # Fare calculator dinámico
│   │   │   ├── promos/              # Códigos promocionales
│   │   │   ├── notifications/       # Push notifications vía Socket.IO
│   │   │   ├── driver-analytics/    # Estadísticas del conductor
│   │   │   └── admin-tools/         # Reportes + sanciones
│   │   ├── middleware/              # authenticate, authorize, errorHandler
│   │   ├── config/                  # env.ts (Zod), database.ts (Prisma)
│   │   ├── utils/                   # geo.ts (Haversine), token.ts
│   │   └── app.ts                   # Entry point (16 routers + 6 Socket.IO inits)
│   └── prisma/
│       ├── schema.prisma            # 18 modelos, 10 enums
│       └── seed.ts                  # Datos de prueba
│
├── shared/                          # Tipos TypeScript compartidos
├── .env.example                     # Variables de entorno (NUNCA secretos reales)
├── .gitignore
├── docker-compose.yml               # PostgreSQL 16
└── package.json                     # Monorepo (npm workspaces)
```

---

## 🚀 Instalación y Ejecución

### Requisitos
- Node.js >= 18
- Docker & Docker Compose (para PostgreSQL)

### Pasos

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/piqueralink.git
cd piqueralink

# 2. Variables de entorno
cp .env.example .env
# Editar .env: cambiar JWT_SECRET por una clave de 32+ caracteres

# 3. PostgreSQL
docker-compose up -d

# 4. Instalar dependencias
npm install

# 5. Generar Prisma Client
cd server && npx prisma generate && cd ..

# 6. Migraciones
npm run db:migrate

# 7. Seed (datos de prueba)
npm run db:seed

# 8. Iniciar (server + client)
npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health check: http://localhost:3000/api/health

### Usuarios de prueba (seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Super Admin | superadmin@piqueralink.com | super123 |
| Admin | admin@piqueralink.com | admin123 |
| Conductor | conductor@piqueralink.com | driver123 |
| Pasajero | pasajero@piqueralink.com | pasajero123 |

**Piquera de prueba:** ID `00000000-0000-0000-0000-000000000001` (Piquera Central)

---

## 📦 Módulos del Sistema

### Modelos de Base de Datos (Prisma)

| Modelo | Descripción |
|--------|-------------|
| User | Usuarios con 4 roles + accountStatus + rating |
| Vehicle | Vehículos con múltiples fotos |
| Piquera | Puntos de servicio con geolocalización |
| Turn | Turnos FIFO con estados |
| TripRequest | Viajes con tarifa, desglose y promo |
| Incident | Incidencias registradas |
| DriverLocation | GPS en tiempo real del conductor |
| TrafficZone | Zonas de congestión con GeoJSON |
| SOSAlert | Alertas de emergencia con resolución |
| EmergencyContact | Contactos de emergencia |
| Review | Calificaciones mutuas 1-5 |
| FavoriteLocation | Destinos guardados del pasajero |
| TripShareToken | Links temporales de seguimiento |
| LostItem | Reportes de objetos perdidos |
| Wallet | Billetera digital por usuario |
| Transaction | Historial de movimientos financieros |
| CommissionRule | Reglas de split de pagos |
| PromoCode | Códigos de descuento |
| PromoRedemption | Registro de uso de promos |
| Notification | Notificaciones persistentes |

---

## 📡 API Endpoints

### Auth (`/api/auth`)
| POST | `/register` | `/login` | `/refresh` |

### Queue (`/api/queue`)
| POST `/join/:piqueraId` | DELETE `/leave/:piqueraId` | GET `/position/:piqueraId` | GET `/status/:piqueraId` |

### Trips (`/api/trips`)
| POST `/request` | PATCH `/:id/accept` | PATCH `/:id/reject` | PATCH `/:id/complete` | GET `/:id/status` |
| POST `/:id/share` | GET `/share/:token` (público) |

### Fare (`/api/fare`)
| POST `/estimate` |

### Piqueras (`/api/piqueras`)
| GET `/` | GET `/nearby` | GET `/nearest` | GET `/:id/metrics` |

### Wallet (`/api/wallet`)
| GET `/summary` | GET `/transactions` | POST `/withdraw` |

### SOS (`/api/sos`)
| POST `/trigger` | GET `/active` | PATCH `/:id/acknowledge` | PATCH `/:id/resolve` | GET `/history` |

### Ratings (`/api/ratings`)
| POST `/` | GET `/me` | GET `/me/summary` | GET `/user/:id` | GET `/user/:id/summary` |

### Favorites (`/api/favorites`)
| GET `/` | POST `/` | PATCH `/:id` | DELETE `/:id` |

### Lost Items (`/api/lost-items`)
| POST `/` | GET `/me` | GET `/piquera/:id` | PATCH `/:id/status` |

### Promos (`/api/promos`)
| POST `/validate` | POST `/` | GET `/` |

### Notifications (`/api/notifications`)
| GET `/` | PATCH `/:id/read` | PATCH `/read-all` |

### Locations (`/api/locations`)
| GET `/piquera/:id` | GET `/me` |

### Driver Analytics (`/api/drivers`)
| GET `/analytics` |

### Global Admin (`/api/global-admin`)
| GET `/overview` | GET `/piqueras` | GET `/piqueras/:id` |

### Admin Tools (`/api/admin`)
| GET `/reports/export` | GET `/users` | PATCH `/users/:id/status` |

### Metrics (`/api/admin/metrics`)
| GET `/global` |

---

## ⚡ Eventos en Tiempo Real (Socket.IO)

| Evento | Room | Descripción |
|--------|------|-------------|
| `queue:state_changed` | `piquera:{id}` | Cola actualizada |
| `queue:position_update` | `piquera:{id}` | Cambio de posición |
| `trip:assigned` | `user:{driverId}` | Viaje asignado |
| `trip:driver_info` | `user:{passengerId}` | Info del conductor |
| `trip:status_changed` | `trip:{id}` | Cambio de estado |
| `location:update` | (entrada) | Conductor envía GPS |
| `location:driver_moved` | `piquera:{id}` | Posición del conductor |
| `sos:triggered` | `admins` | Alerta de emergencia |
| `sos:location_update` | `admins` | Streaming ubicación SOS |
| `sos:resolved` | `admins` | Alerta cerrada |
| `lost_item:reported` | `user:{driverId}` | Objeto perdido reportado |
| `notification:new` | `user:{id}` | Nueva notificación |

**Rooms disponibles:** `piquera:{id}`, `user:{id}`, `trip:{id}`, `admins`

---

## 🧪 Guía de Pruebas

### Flujo completo del viaje

1. **Login conductor** → `conductor@piqueralink.com`
2. **Unirse a cola** → ID: `00000000-0000-0000-0000-000000000001`
3. **Login pasajero** (otra pestaña) → `pasajero@piqueralink.com`
4. **Solicitar taxi** → Se calcula tarifa dinámica → Se asigna conductor
5. **Conductor acepta** → Pasajero ve nombre, placa, ETA
6. **Conductor completa** → Wallet acreditada automáticamente con split

### Probar SOS
1. Login como pasajero → `POST /api/sos/trigger` con coordenadas
2. Login como admin → Ve alerta en tiempo real vía Socket.IO

### Probar tarifa dinámica
```bash
curl -X POST http://localhost:3000/api/fare/estimate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"originLat": 19.43, "originLng": -99.13, "destinationLat": 19.45, "destinationLng": -99.15, "piqueraId": "00000000-0000-0000-0000-000000000001"}'
```

---

## 🔒 Seguridad

- **Cero secretos en código** — Todo en `.env` (validado con Zod al arrancar)
- **Contraseñas** — bcrypt con 10 rounds de salt
- **JWT** — Tokens stateless con expiración configurable
- **RBAC** — Cada endpoint verifica rol antes de ejecutar
- **Account blocking** — Usuarios suspendidos/baneados son rechazados en cada request
- **CORS** — Solo el frontend autorizado puede comunicarse
- **Validación** — Zod en todas las entradas del usuario
- **Safety links** — Tokens criptográficos con expiración de 4h

---

## 🗺️ Roadmap

- [x] Cola FIFO con transacciones ACID
- [x] Asignación automática de conductores
- [x] Socket.IO para tiempo real
- [x] Geolocalización de pasajeros y conductores
- [x] Tarificación dinámica (upfront pricing)
- [x] Billetera digital con split de pagos
- [x] Sistema SOS en tiempo real
- [x] Calificaciones mutuas
- [x] Compartir viaje (Safety Link)
- [x] Códigos promocionales
- [x] Notificaciones push
- [x] Objetos perdidos
- [x] Analítica del conductor
- [x] Panel global super admin
- [x] Reportes CSV + gestión de sanciones
- [ ] Integración con pasarela de pagos real (Stripe/MercadoPago)
- [ ] App móvil nativa (React Native)
- [ ] Machine Learning para predicción de demanda
- [ ] Motor de asignación geoespacial avanzado

---

## 👥 Equipo

Proyecto desarrollado para **Hackathon 2026** — Modernizando la movilidad urbana con tecnología accesible.

---

<p align="center">
  <strong>🚕 PiqueraLink — La piquera del futuro, hoy.</strong>
</p>
