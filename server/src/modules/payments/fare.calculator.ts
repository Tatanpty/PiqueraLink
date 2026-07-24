import prisma from '../../config/database';
import { haversineDistance } from '../../utils/geo';

// ========================
// Configuración de Tarifas
// ========================

const FARE_CONFIG = {
  baseFare: 15.00,          // Tarifa base fija (USD)
  perKmRate: 4.50,          // Costo por kilómetro
  perMinuteRate: 1.20,      // Costo por minuto estimado
  minimumFare: 20.00,       // Tarifa mínima
  bookingFee: 2.50,         // Cargo por reserva/servicio
  avgSpeedKmH: 30,          // Velocidad promedio para estimar duración (km/h)
};

// Multiplicadores por hora pico
const PEAK_HOUR_MULTIPLIERS: Record<number, number> = {
  // Mañana (7-9am)
  7: 1.3,
  8: 1.5,
  9: 1.3,
  // Medio día (12-2pm)
  12: 1.2,
  13: 1.3,
  14: 1.2,
  // Tarde/Noche (5-8pm)
  17: 1.4,
  18: 1.6,
  19: 1.5,
  20: 1.3,
};

// ========================
// Interfaces
// ========================

export interface FareEstimateInput {
  originLat: number;
  originLng: number;
  destinationLat?: number;
  destinationLng?: number;
  piqueraId?: string;
}

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  bookingFee: number;
  subtotal: number;
  surgeMultiplier: number;
  surgeReason: string;
  totalFare: number;
  estimatedDistance: number;   // km
  estimatedDuration: number;  // minutos
  currency: string;
}

// ========================
// Fare Calculator Service
// ========================

export class FareCalculator {
  /**
   * Calcular tarifa anticipada (Upfront Pricing).
   * Retorna un precio cerrado y transparente con desglose completo.
   */
  async calculateUpfrontFare(input: FareEstimateInput): Promise<FareBreakdown> {
    const { originLat, originLng, destinationLat, destinationLng, piqueraId } = input;

    // 1. Calcular distancia estimada
    let estimatedDistance: number;

    if (destinationLat !== undefined && destinationLng !== undefined) {
      // Distancia directa con factor de corrección vial (1.3x)
      const directDistance = haversineDistance(originLat, originLng, destinationLat, destinationLng);
      estimatedDistance = directDistance * 1.3; // Factor de ruta real vs. línea recta
    } else {
      // Si no hay destino explícito, usar distancia promedio de la piquera
      estimatedDistance = 5; // km promedio por defecto
    }

    // Mínimo 1 km
    estimatedDistance = Math.max(estimatedDistance, 1);

    // 2. Calcular duración estimada
    const estimatedDuration = (estimatedDistance / FARE_CONFIG.avgSpeedKmH) * 60; // minutos

    // 3. Calcular componentes base
    const baseFare = FARE_CONFIG.baseFare;
    const distanceCharge = estimatedDistance * FARE_CONFIG.perKmRate;
    const timeCharge = estimatedDuration * FARE_CONFIG.perMinuteRate;
    const bookingFee = FARE_CONFIG.bookingFee;

    const subtotal = baseFare + distanceCharge + timeCharge + bookingFee;

    // 4. Calcular multiplicador de demanda
    const { multiplier, reason } = await this.calculateSurgeMultiplier(
      originLat,
      originLng,
      piqueraId
    );

    // 5. Aplicar multiplicador
    let totalFare = subtotal * multiplier;

    // 6. Aplicar tarifa mínima
    totalFare = Math.max(totalFare, FARE_CONFIG.minimumFare);

    // 7. Redondear a 2 decimales
    totalFare = Math.round(totalFare * 100) / 100;

    return {
      baseFare: round(baseFare),
      distanceCharge: round(distanceCharge),
      timeCharge: round(timeCharge),
      bookingFee: round(bookingFee),
      subtotal: round(subtotal),
      surgeMultiplier: multiplier,
      surgeReason: reason,
      totalFare,
      estimatedDistance: round(estimatedDistance),
      estimatedDuration: Math.round(estimatedDuration),
      currency: 'USD',
    };
  }

  /**
   * Calcular multiplicador dinámico basado en:
   * 1. Nivel de congestión de la zona (TrafficZone)
   * 2. Hora pico del día
   * 3. Demanda vs oferta en la piquera
   */
  private async calculateSurgeMultiplier(
    lat: number,
    lng: number,
    piqueraId?: string
  ): Promise<{ multiplier: number; reason: string }> {
    let multiplier = 1.0;
    const reasons: string[] = [];

    // Factor 1: Hora pico
    const currentHour = new Date().getHours();
    const peakMultiplier = PEAK_HOUR_MULTIPLIERS[currentHour];
    if (peakMultiplier) {
      multiplier = Math.max(multiplier, peakMultiplier);
      reasons.push(`Hora pico (${currentHour}:00)`);
    }

    // Factor 2: Congestión de la zona (TrafficZone)
    const trafficZones = await prisma.trafficZone.findMany();
    for (const zone of trafficZones) {
      const congestion = zone.congestionLevel;
      if (congestion >= 4) {
        // Alta congestión → +30-60%
        const congestionMultiplier = 1.0 + (congestion - 3) * 0.3;
        if (congestionMultiplier > multiplier) {
          multiplier = congestionMultiplier;
          reasons.push(`Zona congestionada: ${zone.name} (nivel ${congestion})`);
        }
      }
    }

    // Factor 3: Demanda vs oferta en la piquera
    if (piqueraId) {
      const activeDrivers = await prisma.turn.count({
        where: { piqueraId, status: 'active' },
      });

      const pendingTrips = await prisma.tripRequest.count({
        where: {
          piqueraId,
          status: { in: ['pending', 'assigned'] },
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // últimos 15 min
        },
      });

      // Si hay más solicitudes recientes que conductores → surge
      if (activeDrivers > 0 && pendingTrips > activeDrivers) {
        const demandRatio = pendingTrips / activeDrivers;
        const demandMultiplier = Math.min(1.0 + (demandRatio - 1) * 0.3, 2.0);
        if (demandMultiplier > multiplier) {
          multiplier = demandMultiplier;
          reasons.push(`Alta demanda (${pendingTrips} solicitudes / ${activeDrivers} conductores)`);
        }
      }

      // Si no hay conductores → máximo surge
      if (activeDrivers === 0) {
        multiplier = Math.max(multiplier, 1.8);
        reasons.push('Sin conductores disponibles');
      }
    }

    // Tope máximo de surge: 2.0x
    multiplier = Math.min(multiplier, 2.0);
    multiplier = round(multiplier);

    const reason = reasons.length > 0 ? reasons.join(' • ') : 'Tarifa estándar';

    return { multiplier, reason };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export const fareCalculator = new FareCalculator();
