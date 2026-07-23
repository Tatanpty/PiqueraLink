# Design Document

## Overview

PiqueraLink es una aplicación web full-stack diseñada para digitalizar la gestión de colas de taxis (piqueras) en puntos de servicio. El sistema implementa una cola FIFO para asignar turnos a conductores de forma justa, permite a pasajeros solicitar taxis desde dispositivos móviles con geolocalización, y provee un panel de administración en tiempo real para chequeadores.

### Stack Tecnológico Recomendado

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | React 18 + TypeScript + Vite | Ecosistema maduro, tipado estático, build rápido. Tailwind CSS para diseño mobile-first responsive |
| **Backend** | Node.js + Express + TypeScript | Permite compartir tipos con el frontend, excelente soporte para WebSockets, ecosistema npm robusto |
| **Base de Datos** | PostgreSQL 16 | Soporte transaccional ACID completo, ideal para operaciones atómicas en la cola FIFO, extensión PostGIS para cálculos geográficos |
| **Tiempo Real** | Socket.IO | Abstrae WebSocket con fallback automático a long-polling, manejo de rooms para suscripciones por piquera |
| **ORM** | Prisma | Type-safe, migraciones declarativas, generación automática de tipos TypeScript |
| **Autenticación** | JWT (jsonwebtoken) + bcrypt | Tokens stateless para API REST, bcrypt para hash de contraseñas con salt |
| **Contenedores** | Docker + Docker Compose | Dockerfile multi-stage para producción, compose para desarrollo local con PostgreSQL |
| **Validación** | Zod | Validación de schemas en runtime, integración nativa con TypeScript |

### Decisiones Arquitectónicas Clave

1. **Monorepo con separación frontend/backend**: Un solo repositorio con carpetas `client/` y `server/` facilita despliegue y compartir tipos.
2. **Socket.IO sobre WebSocket puro**: Provee reconexión automática, rooms (salas) por piquera, y fallback a polling — cumple Requisito 7 sin código adicional.
3. **PostgreSQL sobre NoSQL**: Las operaciones de cola FIFO requieren transacciones ACID y bloqueos a nivel de fila para garantizar consistencia concurrente.
4. **Prisma sobre Knex/TypeORM**: Generación automática de tipos desde el schema, migraciones reproducibles, API intuitiva.

## Architecture

### Diagrama de Arquitectura General

```mermaid
graph TD
    subgraph Cliente["Cliente (Browser)"]
        PA[Vista Pasajero<br/>Mobile-First]
        CO[Vista Conductor]
        AD[Panel Administrador]
        GEO[Geolocation API]
    end

    subgraph Servidor["Servidor Node.js/Express"]
        API[API REST<br/>Express Router]
        AUTH[Middleware Auth<br/>JWT + RBAC]
        WS[Socket.IO Server]
        QUEUE[Módulo Cola FIFO]
        TRIP[Módulo Viajes]
        ADMIN[Módulo Admin]
    end

    subgraph Datos["Capa de Datos"]
        DB[(PostgreSQL)]
        PRISMA[Prisma ORM]
    end

    PA -->|HTTP/WS| API
    CO -->|HTTP/WS| API
    AD -->|HTTP/WS| API
    PA --> GEO

    API --> AUTH
    AUTH --> QUEUE
    AUTH --> TRIP
    AUTH --> ADMIN

    PA <-->|Socket.IO| WS
    CO <-->|Socket.IO| WS
    AD <-->|Socket.IO| WS

    QUEUE --> PRISMA
    TRIP --> PRISMA
    ADMIN --> PRISMA
    PRISMA --> DB
```

### Flujo de Comunicación en Tiempo Real

```mermaid
sequenceDiagram
    participant P as Pasajero
    participant S as Servidor
    participant C as Conductor
    participant A as Administrador

    Note over S: Conductor se enlista en cola
    C->>S: POST /api/queue/join
    S->>S: Insertar en Cola_FIFO (transacción)
    S-->>C: Socket: queue:position_update
    S-->>A: Socket: queue:state_changed
    
    Note over S: Pasajero solicita taxi
    P->>S: POST /api/trips/request
    S->>S: Asignar primer conductor
    S-->>C: Socket: trip:assigned
    S-->>P: Socket: trip:driver_info
    S-->>A: Socket: queue:state_changed
```

### Patrón de Módulos del Servidor

El servidor sigue una arquitectura modular por dominio:

```
Cada módulo expone:
├── routes.ts      → Definición de endpoints REST
├── controller.ts  → Lógica de request/response
├── service.ts     → Lógica de negocio
├── events.ts      → Emisión de eventos Socket.IO
└── validators.ts  → Schemas Zod de validación
```

## Components and Interfaces

### API REST - Endpoints Principales

#### Módulo de Autenticación (`/api/auth`)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/register` | Público | Registro de usuario con rol |
| POST | `/login` | Público | Autenticación, retorna JWT |
| POST | `/refresh` | Autenticado | Renovar token de sesión |

#### Módulo de Cola FIFO (`/api/queue`)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/join/:piqueraId` | Conductor | Enlistarse en cola de una piquera |
| DELETE | `/leave/:piqueraId` | Conductor | Abandonar cola voluntariamente |
| GET | `/position/:piqueraId` | Conductor | Obtener posición actual en cola |
| GET | `/status/:piqueraId` | Autenticado | Ver estado completo de la cola |

#### Módulo de Viajes (`/api/trips`)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/request` | Pasajero | Crear solicitud de viaje |
| PATCH | `/:tripId/accept` | Conductor | Aceptar solicitud asignada |
| PATCH | `/:tripId/reject` | Conductor | Rechazar solicitud asignada |
| PATCH | `/:tripId/complete` | Conductor | Marcar viaje como completado |
| GET | `/:tripId/status` | Pasajero/Conductor | Estado actual del viaje |

#### Módulo de Administración (`/api/admin`)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/piqueras` | Administrador | Crear nueva piquera |
| PATCH | `/piqueras/:id` | Administrador | Actualizar/desactivar piquera |
| DELETE | `/queue/:piqueraId/remove/:driverId` | Administrador | Remover conductor con motivo |
| POST | `/incidents` | Administrador | Registrar incidencia |
| GET | `/drivers/:id/history` | Administrador | Historial de servicios del día |

#### Módulo de Piqueras (`/api/piqueras`)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/nearby?lat=X&lng=Y` | Pasajero | Piqueras cercanas por distancia |
| GET | `/` | Autenticado | Lista de todas las piqueras activas |

### Eventos Socket.IO

| Canal (Room) | Evento | Payload | Descripción |
|-------------|--------|---------|-------------|
| `piquera:{id}` | `queue:state_changed` | `{queue: TurnEntry[]}` | Estado completo de la cola actualizado |
| `piquera:{id}` | `queue:position_update` | `{driverId, position}` | Cambio de posición individual |
| `driver:{id}` | `trip:assigned` | `{tripId, passenger, destination}` | Nueva solicitud asignada |
| `passenger:{id}` | `trip:driver_info` | `{driver, vehicle, eta}` | Datos del conductor asignado |
| `trip:{id}` | `trip:status_changed` | `{status, timestamp}` | Cambio de estado del viaje |

### Interfaces TypeScript Principales

```typescript
// Roles del sistema
type UserRole = 'passenger' | 'driver' | 'admin';

// Estado de un turno en cola
type TurnStatus = 'active' | 'in_service' | 'removed';

// Estado de una solicitud de viaje
type TripStatus = 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

interface Vehicle {
  id: string;
  driverId: string;
  plate: string;
  model: string;
  color: string;
  photoUrl: string;
}

interface Piquera {
  id: string;
  name: string;
  address: string;
  latitude: number;   // -90 a 90
  longitude: number;  // -180 a 180
  maxCapacity: number;
  isActive: boolean;
}

interface Turn {
  id: string;
  driverId: string;
  piqueraId: string;
  position: number;
  status: TurnStatus;
  joinedAt: Date;
}

interface TripRequest {
  id: string;
  passengerId: string;
  driverId: string | null;
  piqueraId: string;
  originLat: number;
  originLng: number;
  destination: string;
  status: TripStatus;
  createdAt: Date;
  assignedAt: Date | null;
  completedAt: Date | null;
}
```

### Middleware de Autorización (RBAC)

```typescript
// Middleware para verificar roles
function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Extraído del JWT por middleware previo
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
}
```

## Data Models

### Diagrama Entidad-Relación

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum role "passenger|driver|admin"
        timestamp created_at
        timestamp updated_at
    }

    VEHICLES {
        uuid id PK
        uuid driver_id FK UK
        varchar plate UK
        varchar model
        varchar color
        varchar photo_url
        timestamp created_at
    }

    PIQUERAS {
        uuid id PK
        varchar name
        varchar address
        decimal latitude
        decimal longitude
        int max_capacity
        boolean is_active
        timestamp created_at
    }

    TURNS {
        uuid id PK
        uuid driver_id FK
        uuid piquera_id FK
        int position
        enum status "active|in_service|removed"
        timestamp joined_at
        timestamp removed_at
    }

    TRIP_REQUESTS {
        uuid id PK
        uuid passenger_id FK
        uuid driver_id FK
        uuid piquera_id FK
        decimal origin_lat
        decimal origin_lng
        varchar destination
        enum status "pending|assigned|accepted|in_progress|completed|cancelled"
        timestamp created_at
        timestamp assigned_at
        timestamp completed_at
    }

    INCIDENTS {
        uuid id PK
        uuid admin_id FK
        uuid driver_id FK
        uuid vehicle_id FK
        text description
        timestamp created_at
    }

    USERS ||--o| VEHICLES : "conductor posee"
    USERS ||--o{ TURNS : "conductor tiene turnos"
    USERS ||--o{ TRIP_REQUESTS : "pasajero solicita"
    USERS ||--o{ TRIP_REQUESTS : "conductor asignado"
    USERS ||--o{ INCIDENTS : "admin registra"
    PIQUERAS ||--o{ TURNS : "contiene turnos"
    PIQUERAS ||--o{ TRIP_REQUESTS : "origen de solicitud"
    VEHICLES ||--o{ INCIDENTS : "asociado a incidencia"
    USERS ||--o{ INCIDENTS : "conductor involucrado"
```

### Schema Prisma

```prisma
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         Role
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  vehicle       Vehicle?
  turns         Turn[]
  tripAsPassenger TripRequest[] @relation("PassengerTrips")
  tripAsDriver    TripRequest[] @relation("DriverTrips")
  incidents       Incident[]    @relation("AdminIncidents")
  driverIncidents Incident[]    @relation("DriverIncidents")

  @@map("users")
}

model Vehicle {
  id        String   @id @default(uuid())
  driverId  String   @unique @map("driver_id")
  plate     String   @unique
  model     String
  color     String
  photoUrl  String   @map("photo_url")
  createdAt DateTime @default(now()) @map("created_at")

  driver    User       @relation(fields: [driverId], references: [id])
  incidents Incident[]

  @@map("vehicles")
}

model Piquera {
  id          String   @id @default(uuid())
  name        String
  address     String
  latitude    Decimal
  longitude   Decimal
  maxCapacity Int      @map("max_capacity")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  turns        Turn[]
  tripRequests TripRequest[]

  @@map("piqueras")
}

model Turn {
  id        String     @id @default(uuid())
  driverId  String     @map("driver_id")
  piqueraId String     @map("piquera_id")
  position  Int
  status    TurnStatus @default(active)
  joinedAt  DateTime   @default(now()) @map("joined_at")
  removedAt DateTime?  @map("removed_at")

  driver  User    @relation(fields: [driverId], references: [id])
  piquera Piquera @relation(fields: [piqueraId], references: [id])

  @@unique([driverId, piqueraId, status])
  @@map("turns")
}

model TripRequest {
  id          String     @id @default(uuid())
  passengerId String     @map("passenger_id")
  driverId    String?    @map("driver_id")
  piqueraId   String     @map("piquera_id")
  originLat   Decimal    @map("origin_lat")
  originLng   Decimal    @map("origin_lng")
  destination String
  status      TripStatus @default(pending)
  createdAt   DateTime   @default(now()) @map("created_at")
  assignedAt  DateTime?  @map("assigned_at")
  completedAt DateTime?  @map("completed_at")

  passenger User    @relation("PassengerTrips", fields: [passengerId], references: [id])
  driver    User?   @relation("DriverTrips", fields: [driverId], references: [id])
  piquera   Piquera @relation(fields: [piqueraId], references: [id])

  @@map("trip_requests")
}

model Incident {
  id          String   @id @default(uuid())
  adminId     String   @map("admin_id")
  driverId    String?  @map("driver_id")
  vehicleId   String?  @map("vehicle_id")
  description String
  createdAt   DateTime @default(now()) @map("created_at")

  admin   User     @relation("AdminIncidents", fields: [adminId], references: [id])
  driver  User?    @relation("DriverIncidents", fields: [driverId], references: [id])
  vehicle Vehicle? @relation(fields: [vehicleId], references: [id])

  @@map("incidents")
}

enum Role {
  passenger
  driver
  admin
}

enum TurnStatus {
  active
  in_service
  removed
}

enum TripStatus {
  pending
  assigned
  accepted
  in_progress
  completed
  cancelled
}
```

### Estructura de Carpetas del Proyecto

```
piqueralink/
├── client/                          # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Botones, inputs, cards reutilizables
│   │   │   ├── passenger/           # Vista pasajero mobile-first
│   │   │   ├── driver/              # Vista conductor
│   │   │   └── admin/               # Panel administrador
│   │   ├── hooks/
│   │   │   ├── useSocket.ts         # Hook para conexión Socket.IO
│   │   │   ├── useGeolocation.ts    # Hook para Geolocation API
│   │   │   └── useAuth.ts           # Hook de autenticación
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── PassengerHome.tsx
│   │   │   ├── DriverDashboard.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── services/
│   │   │   └── api.ts               # Cliente HTTP (fetch/axios)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── types/
│   │   │   └── index.ts             # Tipos compartidos
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # Backend Node.js/Express
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.validators.ts
│   │   │   ├── queue/
│   │   │   │   ├── queue.routes.ts
│   │   │   │   ├── queue.controller.ts
│   │   │   │   ├── queue.service.ts
│   │   │   │   ├── queue.events.ts
│   │   │   │   └── queue.validators.ts
│   │   │   ├── trips/
│   │   │   │   ├── trips.routes.ts
│   │   │   │   ├── trips.controller.ts
│   │   │   │   ├── trips.service.ts
│   │   │   │   ├── trips.events.ts
│   │   │   │   └── trips.validators.ts
│   │   │   ├── admin/
│   │   │   │   ├── admin.routes.ts
│   │   │   │   ├── admin.controller.ts
│   │   │   │   ├── admin.service.ts
│   │   │   │   └── admin.validators.ts
│   │   │   └── piqueras/
│   │   │       ├── piqueras.routes.ts
│   │   │       ├── piqueras.controller.ts
│   │   │       ├── piqueras.service.ts
│   │   │       └── piqueras.validators.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts      # Verificar JWT
│   │   │   ├── authorize.ts         # RBAC por rol
│   │   │   └── errorHandler.ts      # Manejo global de errores
│   │   ├── socket/
│   │   │   ├── index.ts             # Configuración Socket.IO
│   │   │   └── handlers.ts          # Handlers de eventos
│   │   ├── config/
│   │   │   ├── env.ts               # Validación de env vars con Zod
│   │   │   └── database.ts          # Configuración Prisma
│   │   ├── utils/
│   │   │   ├── geo.ts               # Cálculos de distancia (Haversine)
│   │   │   └── token.ts             # Utilidades JWT
│   │   └── app.ts                   # Entry point Express + Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                          # Tipos compartidos frontend/backend
│   └── types/
│       ├── user.ts
│       ├── queue.ts
│       ├── trip.ts
│       └── piquera.ts
│
├── .env.example                     # Variables de entorno documentadas
├── .gitignore                       # Incluye .env
├── docker-compose.yml               # PostgreSQL + App para desarrollo
├── Dockerfile                       # Multi-stage build
├── package.json                     # Workspace root (npm workspaces)
└── README.md
```

### Archivo `.env.example`

```env
# Base de Datos
DATABASE_URL=postgresql://user:password@localhost:5432/piqueralink

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Servidor
PORT=3000
NODE_ENV=development

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:5173

# Opcional: Servicio de almacenamiento de fotos
STORAGE_BUCKET_URL=
```

