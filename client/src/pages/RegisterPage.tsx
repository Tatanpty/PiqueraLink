import React, { useState, FormEvent } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { authApi } from '../services/api';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { login } = useAuthContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'passenger' | 'driver' | 'admin'>('passenger');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { user, token } = await authApi.register({ name, email, password, role });
      login(user, token);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-50 to-blue-100">
      <div className="card w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🚕 PiqueraLink</h1>
          <p className="text-gray-500 mt-1">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Tu nombre"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Cómo vas a usar PiqueraLink?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['passenger', 'driver', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-lg border text-center text-sm font-medium transition-all ${
                    role === r
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {r === 'passenger' && '🧑 Pasajero'}
                  {r === 'driver' && '🚗 Conductor'}
                  {r === 'admin' && '📋 Admin'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-primary-600 hover:underline font-medium"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}
