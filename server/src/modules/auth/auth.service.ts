import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.validators';

const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Registrar un nuevo usuario en el sistema.
   */
  async register(data: RegisterInput) {
    // Verificar si el email ya está registrado
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw Object.assign(new Error('El email ya está registrado'), {
        statusCode: 409,
        isOperational: true,
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generar JWT
    const token = this.generateToken(user.id, user.email, user.role);

    return { user, token };
  }

  /**
   * Autenticar usuario con email y contraseña.
   */
  async login(data: LoginInput) {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw Object.assign(new Error('Credenciales inválidas'), {
        statusCode: 401,
        isOperational: true,
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw Object.assign(new Error('Credenciales inválidas'), {
        statusCode: 401,
        isOperational: true,
      });
    }

    // Generar JWT
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Renovar token de sesión.
   */
  async refreshToken(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      throw Object.assign(new Error('Usuario no encontrado'), {
        statusCode: 404,
        isOperational: true,
      });
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return { user, token };
  }

  /**
   * Generar token JWT con payload tipado.
   */
  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { userId, email, role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }
}

export const authService = new AuthService();
