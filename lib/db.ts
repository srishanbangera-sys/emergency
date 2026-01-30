import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  rating: number;
  phone: string;
  created_at: string;
}

export interface Ambulance {
  id: string;
  unit_number: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  eta_minutes: number;
  created_at: string;
}

export interface Emergency {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  latitude: number;
  longitude: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface EmergencyResponse {
  id: string;
  emergency_id: string;
  doctor_id: string | null;
  ambulance_id: string | null;
  response_type: 'doctor' | 'ambulance';
  status: 'dispatched' | 'en_route' | 'arrived' | 'completed';
  created_at: string;
}

// Calculate distance between two coordinates in km
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
