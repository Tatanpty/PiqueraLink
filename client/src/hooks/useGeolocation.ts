import { useState, useEffect, useCallback } from 'react';

interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por este navegador');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permiso de ubicación denegado');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Ubicación no disponible');
            break;
          case err.TIMEOUT:
            setError('Tiempo de espera agotado');
            break;
          default:
            setError('Error desconocido al obtener ubicación');
        }
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    getPosition();
  }, [getPosition]);

  return { position, error, isLoading, refresh: getPosition };
}
