import prisma from '../../config/database';
import { DiscountType } from '@prisma/client';

interface ApplyPromoResult {
  discount: number;
  promoCodeId: string;
  code: string;
  description: string;
}

export class PromosService {
  /**
   * Validar y calcular descuento de un código promocional.
   * Retorna null si el código no es válido.
   */
  async applyPromoCode(
    code: string,
    userId: string,
    fareAmount: number
  ): Promise<ApplyPromoResult | null> {
    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) return null;

    // Validar estado
    if (!promo.isActive) return null;
    if (new Date() > promo.expiresAt) return null;
    if (promo.usageCount >= promo.usageLimit) return null;

    // Validar tarifa mínima
    if (promo.minFare && fareAmount < Number(promo.minFare)) return null;

    // Verificar que el usuario no lo haya usado antes
    const existing = await prisma.promoRedemption.findUnique({
      where: { promoCodeId_userId: { promoCodeId: promo.id, userId } },
    });
    if (existing) return null;

    // Calcular descuento
    let discount: number;
    if (promo.discountType === DiscountType.percentage) {
      discount = (fareAmount * Number(promo.value)) / 100;
    } else {
      discount = Number(promo.value);
    }

    // Aplicar tope máximo de descuento
    if (promo.maxDiscount) {
      discount = Math.min(discount, Number(promo.maxDiscount));
    }

    // No puede ser mayor que la tarifa
    discount = Math.min(discount, fareAmount);
    discount = Math.round(discount * 100) / 100;

    return {
      discount,
      promoCodeId: promo.id,
      code: promo.code,
      description: promo.discountType === 'percentage'
        ? `${Number(promo.value)}% de descuento`
        : `$${Number(promo.value).toFixed(2)} de descuento`,
    };
  }

  /**
   * Registrar la redención de un código (se llama al confirmar el viaje).
   */
  async redeemPromoCode(promoCodeId: string, userId: string, tripId: string, discount: number) {
    await prisma.$transaction([
      prisma.promoRedemption.create({
        data: {
          promoCodeId,
          userId,
          tripId,
          discount,
        },
      }),
      prisma.promoCode.update({
        where: { id: promoCodeId },
        data: { usageCount: { increment: 1 } },
      }),
    ]);
  }

  /**
   * Crear un código promocional (admin/super_admin).
   */
  async createPromoCode(data: {
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    usageLimit?: number;
    minFare?: number;
    maxDiscount?: number;
    expiresAt: Date;
  }) {
    return await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType as DiscountType,
        value: data.value,
        usageLimit: data.usageLimit || 100,
        minFare: data.minFare || null,
        maxDiscount: data.maxDiscount || null,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Listar todos los códigos promocionales.
   */
  async listPromoCodes() {
    return await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    });
  }
}

export const promosService = new PromosService();
