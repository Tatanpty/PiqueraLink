import prisma from '../../config/database';
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client';

const BASE_FARE = 25; // Tarifa base en USD
const PER_KM_RATE = 5; // Por kilómetro

export class WalletService {
  /**
   * Obtener o crear billetera de un usuario.
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }
    return wallet;
  }

  /**
   * Resumen financiero del conductor.
   */
  async getSummary(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [earningsToday, earningsWeek, earningsMonth] = await Promise.all([
      this.getEarningsSince(userId, startOfDay),
      this.getEarningsSince(userId, startOfWeek),
      this.getEarningsSince(userId, startOfMonth),
    ]);

    const tripsToday = await prisma.transaction.count({
      where: {
        userId,
        type: TransactionType.trip_earning,
        createdAt: { gte: startOfDay },
      },
    });

    return {
      balance: Number(wallet.balance),
      currency: wallet.currency,
      earnings: {
        today: earningsToday,
        week: earningsWeek,
        month: earningsMonth,
      },
      tripsToday,
    };
  }

  /**
   * Historial de transacciones.
   */
  async getTransactions(userId: string, limit: number = 50, offset: number = 0) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.transaction.count({ where: { userId } });

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Solicitar un retiro de fondos.
   */
  async requestWithdrawal(userId: string, amount: number) {
    const wallet = await this.getOrCreateWallet(userId);
    const currentBalance = Number(wallet.balance);

    if (amount <= 0) {
      throw Object.assign(new Error('El monto debe ser mayor a 0'), {
        statusCode: 400,
        isOperational: true,
      });
    }

    if (amount > currentBalance) {
      throw Object.assign(new Error(`Fondos insuficientes. Balance: $${currentBalance.toFixed(2)}`), {
        statusCode: 400,
        isOperational: true,
      });
    }

    // Crear transacción de retiro y descontar del balance
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          type: TransactionType.withdrawal,
          amount: -amount,
          description: `Retiro de $${amount.toFixed(2)}`,
          status: TransactionStatus.pending,
        },
      }),
      prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      }),
    ]);

    return {
      transactionId: transaction.id,
      amount,
      status: 'pending',
      newBalance: currentBalance - amount,
      message: 'Retiro solicitado. Se procesará en 1-3 días hábiles.',
    };
  }

  /**
   * Acreditar ganancias al conductor al completar un viaje.
   * Se ejecuta automáticamente desde el módulo de trips.
   */
  async creditTripEarning(driverId: string, tripId: string, piqueraId: string) {
    // Obtener la tarifa real del viaje
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      select: { fareAmount: true },
    });

    // Obtener regla de comisión (específica de piquera o default)
    let rule = await prisma.commissionRule.findUnique({
      where: { piqueraId },
    });

    if (!rule) {
      // Regla global (piqueraId = null)
      rule = await prisma.commissionRule.findFirst({
        where: { piqueraId: null },
      });
    }

    // Defaults si no hay regla
    const driverPct = rule ? Number(rule.driverPct) : 85;
    const platformPct = rule ? Number(rule.platformPct) : 10;
    const piqueraPct = rule ? Number(rule.piqueraPct) : 5;

    // Usar tarifa real del viaje o fallback a BASE_FARE
    const tripFare = trip?.fareAmount ? Number(trip.fareAmount) : BASE_FARE;

    const driverEarning = (tripFare * driverPct) / 100;
    const platformCommission = (tripFare * platformPct) / 100;
    const piqueraCommission = (tripFare * piqueraPct) / 100;

    // Asegurar que el conductor tenga wallet
    await this.getOrCreateWallet(driverId);

    // Transacción atómica: crear registro + acreditar balance
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: driverId,
          tripId,
          type: TransactionType.trip_earning,
          amount: driverEarning,
          description: `Viaje completado — $${tripFare.toFixed(2)} (${driverPct}% conductor)`,
          status: TransactionStatus.completed,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: driverId,
          tripId,
          type: TransactionType.commission_platform,
          amount: -platformCommission,
          description: `Comisión plataforma (${platformPct}%)`,
          status: TransactionStatus.completed,
        },
      }),
      prisma.wallet.update({
        where: { userId: driverId },
        data: { balance: { increment: driverEarning } },
      }),
    ]);

    return {
      tripFare,
      driverEarning,
      platformCommission,
      piqueraCommission,
    };
  }

  /**
   * Helper: sumar ganancias desde una fecha.
   */
  private async getEarningsSince(userId: string, since: Date): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.trip_earning,
        createdAt: { gte: since },
        status: TransactionStatus.completed,
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount || 0);
  }
}

export const walletService = new WalletService();
