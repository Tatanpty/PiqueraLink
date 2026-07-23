// ========================
// Tipos compartidos entre frontend y backend
// ========================

// Roles del sistema
export type UserRole = 'passenger' | 'driver' | 'admin';

// Estados de turno en cola
export type TurnStatus = 'active' | 'in_service' | 'removed';

// Estados de solicitud de viaje
export type TripStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ========================
// Entidades públicas (sin datos sensibles)
// ========================

export interface PublicUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface PublicVehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
  photoUrl: string;
}

export interface PublicPiquera {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  maxCapacity: number;
  isActive: boolean;
}

export interface QueueEntry {
  driverId: string;
  driverName: string;
  vehicle: PublicVehicle;
  position: number;
  joinedAt: string;
}

export interface TripInfo {
  id: string;
  status: TripStatus;
  destination: string;
  driver?: PublicUser & { vehicle: PublicVehicle };
  estimatedArrival?: string;
  createdAt: string;
}

// ========================
// Payloads de Socket.IO
// ========================

export interface QueueStatePayload {
  piqueraId: string;
  queue: QueueEntry[];
}

export interface PositionUpdatePayload {
  driverId: string;
  position: number;
}

export interface TripAssignedPayload {
  tripId: string;
  passenger: { name: string; destination: string };
  originLat: number;
  originLng: number;
}

export interface DriverInfoPayload {
  tripId: string;
  driver: PublicUser;
  vehicle: PublicVehicle;
  estimatedMinutes: number;
}

export interface TripStatusPayload {
  tripId: string;
  status: TripStatus;
  timestamp: string;
}
