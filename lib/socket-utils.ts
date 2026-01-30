import io, { Socket } from 'socket.io-client';

export interface SocketConfig {
  url: string;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  reconnectionAttempts?: number;
}

export const createSocket = (config: SocketConfig): Socket => {
  return io(config.url, {
    reconnection: config.reconnection !== false,
    reconnectionDelay: config.reconnectionDelay || 1000,
    reconnectionDelayMax: config.reconnectionDelayMax || 5000,
    reconnectionAttempts: config.reconnectionAttempts || 5,
  });
};

export const disconnectSocket = (socket: Socket | null) => {
  if (socket) {
    socket.disconnect();
  }
};

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to NYC
          resolve({ latitude: 40.7128, longitude: -74.006 });
        }
      );
    } else {
      reject(new Error('Geolocation not supported'));
    }
  });
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
