import { NextRequest, NextResponse } from 'next/server';
import { sql, calculateDistance } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('latitude') || '0');
    const lng = parseFloat(searchParams.get('longitude') || '0');

    const ambulances = await sql`
      SELECT * FROM ambulances 
      WHERE is_available = true
      ORDER BY eta_minutes ASC
    `;

    // Calculate distance for each ambulance
    const ambulancesWithDistance = ambulances.map((ambulance) => ({
      ...ambulance,
      distance: calculateDistance(lat, lng, Number(ambulance.latitude), Number(ambulance.longitude)),
    }));

    ambulancesWithDistance.sort((a, b) => a.distance - b.distance);

    return NextResponse.json(ambulancesWithDistance);
  } catch (error) {
    console.error('Error fetching ambulances:', error);
    return NextResponse.json([], { status: 200 });
  }
}
