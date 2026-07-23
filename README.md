# 🚕 PiqueraLink

**Sistema Web de Gestión de Piqueras y Pasajeros**

PiqueraLink moderniza las piqueras de taxis tradicionales, digitalizando la gestión de colas (turnos FIFO), la asignación de conductores y la solicitud de viajes por parte de pasajeros — todo en tiempo real.

---

## 📋 Tabla de Contenidos

- [Problema que resuelve](#-problema-que-resuelve)
- [Características principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Ejecución](#-instalación-y-ejecución)
- [Guía de Pruebas](#-guía-de-pruebas)
- [API Endpoints](#-api-endpoints)
- [Eventos en Tiempo Real](#-eventos-en-tiempo-real)
- [Seguridad](#-seguridad)
- [Equipo](#-equipo)

---

## 🎯 Problema que resuelve

En muchas ciudades, las piqueras de taxis funcionan de forma manual: el checador anota en papel, los pasajeros no saben cuántos taxis hay disponibles, y no existe trazabilidad del servicio. PiqueraLink elimina estos problemas ofreciendo:

- **Para pasajeros:** Una vista móvil rápida para solicitar un taxi y ver en tiempo real quién viene a buscarlos (placa, modelo, foto del conductor).
- **Para conductores:** Un sistema de turnos digital y justo (FIFO) donde reciben asignaciones automáticas sin favoritismos.
- **Para administradores/checadores:** Un panel en vivo para supervisar la fila virtual, gestionar incidencias y controlar la piquera.

---

## ✨ Características principales

| Funcionalidad | Descripción |
|---------------|-------------|
| 🔐 Autenticación JWT | Registro y login seguro con roles (pasajero, conductor, admin) |
| 📋 Cola FIFO | Gestión atómica de turnos con transacciones ACID |
| 🚗 Asignación automática | El primer conductor en la cola es asignado al pasajero |
| ⚡ Tiempo real | Socket.IO para actualizaciones instantáneas de cola y viajes |
| 📍 Geolocalización | Ubicación del pasajero vía Geolocation API del navegador |
| 📱 Mobile-first | Interfaz responsive optimizada para smartphones |
| 🛡️ RBAC | Control de acceso por roles en cada endpoint |
| ✅ Validación | Schemas Zod en backend, validación en frontend |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Pasajero │  │Conductor │  │ Admin/Checador   │  │
│  │  (React) │  │  (React) │  │     (React)      │  │
│  └────┬─────┘  └────┬─────┘  └───────┬──────────┘  │
│       │              │                │              │
│       └──────────────┼────────────────┘              │
│                      │ HTTP + WebSocket               │
└──────────────────────┼───────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────┐
│               SERVIDOR (Node.js/Express)              │
│                      │                                │
│  ┌───────────────────┼──────────────────────────┐    │
│  │           API REST + Socket.IO                │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐   │    │
│  │  │ Auth │ │Queue │ │Trips │ │  Admin   │   │    │
│  │  └──┬───┘ └──┬───┘ └──┬───┘ └────┬─────┘   │    │
│  │     └────────┼────────┼──────────┘           │    │
│  │              │ Prisma ORM                     │    │
│  └──────────────┼────────────────────────────────┘    │
│                 │                                      │
└─────────────────┼──────────────────────────────────────┘
                  │
┌─────────────────┼──────────────────────────────────────┐
│          PostgreSQL 16 (Docker)                         │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Base de Datos | PostgreSQL 16 |
| ORM | Prisma |
| Tiempo Real | Socket.IO |
| Autenticación | JWT + bcrypt |
| Validación | Zod |
| Contenedores | Docker + Docker Compose |

---

## 📁 Estructura del Proyecto

```
piqueralink/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── context/          # AuthContext, SocketContext
│   │   ├── hooks/            # useAuth, useSocket, useGeolocation
│   │   ├── pages/            # Vistas por rol
│   │   ├── services/         # Cliente API HTTP
│   │   ├── App.tsx           # Enrutamiento por rol
│   │   └── main.tsx          # Entry point
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── server/                    # Backend Express
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # Registro, Login, JWT
│   │   │   ├── queue/        # Cola FIFO con Socket.IO
│   │   │   └── trips/        # Solicitudes de viaje
│   │   ├── middleware/       # authenticate, authorize, errorHandler
│   │   ├── config/           # env.ts (Zod), database.ts (Prisma)
│   │   ├── utils/            # geo.ts, token.ts
│   │   └── app.ts            # Entry point
│   └── prisma/
│       ├── schema.prisma     # 6 modelos, 3 enums
│       └── seed.ts           # Datos iniciales
│
├── shared/                    # Tipos TypeScript compartidos
├── .env.example              # Variables de entorno documentadas
├── docker-compose.yml        # PostgreSQL para desarrollo
└── package.json              # Monorepo (npm workspaces)
```

---

## 📦 Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker** y **Docker Compose** (para PostgreSQL)
- Un navegador moderno con soporte de Geolocalización

---

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/piqueralink.git
cd piqueralink
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y ajusta `JWT_SECRET` con una clave segura de al menos 32 caracteres.

### 3. Levantar PostgreSQL con Docker

```bash
docker-compose up -d
```

Esto inicia PostgreSQL 16 en el puerto 5432 con las credenciales del `.env`.

### 4. Instalar dependencias

```bash
npm install
```

### 5. Ejecutar migraciones de base de datos

```bash
npm run db:migrate
```

### 6. Poblar datos iniciales (seed)

```bash
npm run db:seed
```

Esto crea:
- Admin: `admin@piqueralink.com` / `admin123`
- Conductor: `conductor@piqueralink.com` / `driver123`
- Pasajero: `pasajero@piqueralink.com` / `pasajero123`
- Piquera Central (ID: `00000000-0000-0000-0000-000000000001`)

### 7. Iniciar en desarrollo

```bash
npm run dev
```

Esto levanta simultáneamente:
- **Backend** en `http://localhost:3000`
- **Frontend** en `http://localhost:5173`

---

## 🧪 Guía de Pruebas

### Flujo del Conductor

1. Abre `http://localhost:5173`
2. Inicia sesión con `conductor@piqueralink.com` / `driver123`
3. Ingresa el ID de la piquera: `00000000-0000-0000-0000-000000000001`
4. Haz clic en **"Unirse a la cola"**
5. Verás tu posición actualizarse en tiempo real

### Flujo del Pasajero

1. Abre otra pestaña o navegador en `http://localhost:5173`
2. Inicia sesión con `pasajero@piqueralink.com` / `pasajero123`
3. Permite el acceso a tu ubicación cuando el navegador lo solicite
4. Ingresa el ID de la piquera: `00000000-0000-0000-0000-000000000001`
5. Escribe un destino (ej: "Centro Comercial")
6. Haz clic en **"Solicitar Taxi"**
7. Verás la información del conductor asignado (nombre, placa, modelo)

### Flujo del Conductor (continuación)

8. En la pestaña del conductor, aparecerá la alerta **"Nuevo viaje asignado"**
9. Haz clic en **"Aceptar"**
10. Luego en **"Completar Viaje"** cuando termine el servicio

### Flujo del Administrador

1. Inicia sesión con `admin@piqueralink.com` / `admin123`
2. Ingresa el ID de la piquera y haz clic en **"Cargar"**
3. Verás la fila virtual actualizarse en tiempo real cuando conductores se unen o salen

### Verificar API directamente

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"conductor@piqueralink.com","password":"driver123"}'
```

---

## 📡 API Endpoints

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/register` | Registro con rol |
| POST | `/login` | Login, retorna JWT |
| POST | `/refresh` | Renovar token |

### Cola FIFO (`/api/queue`)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/join/:piqueraId` | Conductor | Unirse a la cola |
| DELETE | `/leave/:piqueraId` | Conductor | Abandonar cola |
| GET | `/position/:piqueraId` | Conductor | Mi posición |
| GET | `/status/:piqueraId` | Autenticado | Estado completo |

### Viajes (`/api/trips`)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/request` | Pasajero | Solicitar viaje |
| PATCH | `/:tripId/accept` | Conductor | Aceptar viaje |
| PATCH | `/:tripId/reject` | Conductor | Rechazar viaje |
| PATCH | `/:tripId/complete` | Conductor | Completar viaje |
| GET | `/:tripId/status` | Ambos | Estado del viaje |

---

## ⚡ Eventos en Tiempo Real (Socket.IO)

| Evento | Room | Descripción |
|--------|------|-------------|
| `queue:state_changed` | `piquera:{id}` | Cola actualizada |
| `queue:position_update` | `piquera:{id}` | Cambio de posición |
| `trip:assigned` | `user:{driverId}` | Viaje asignado al conductor |
| `trip:driver_info` | `user:{passengerId}` | Info del conductor para el pasajero |
| `trip:status_changed` | `trip:{tripId}` | Cambio de estado del viaje |

---

## 🔒 Seguridad

- **Cero secretos en el código:** Toda configuración sensible vive en `.env` (nunca se sube al repo).
- **Validación con Zod:** Todas las entradas del usuario se validan antes de procesarse.
- **Contraseñas hasheadas:** bcrypt con salt de 10 rondas.
- **JWT stateless:** Tokens con expiración configurable.
- **RBAC:** Cada endpoint verifica el rol del usuario antes de ejecutar.
- **CORS configurado:** Solo el frontend autorizado puede comunicarse con el backend.
- **Variables validadas al arrancar:** Si falta alguna env var, el servidor no inicia.

---

## 👥 Equipo

Proyecto desarrollado para **Hackathon 2026** con el objetivo de digitalizar y modernizar el sistema tradicional de piqueras de taxis.

---

<p align="center">
  <strong>🚕 PiqueraLink — La piquera del futuro, hoy.</strong>
</p>
