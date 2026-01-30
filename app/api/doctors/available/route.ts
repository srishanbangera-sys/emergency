import { NextRequest, NextResponse } from 'next/server';
import { sql, calculateDistance } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('latitude') || '0');
    const lng = parseFloat(searchParams.get('longitude') || '0');

    const doctors = await sql`
      SELECT * FROM doctors 
      WHERE is_available = true
      ORDER BY rating DESC
    `;

    // Calculate distance for each doctor and sort by distance
    const doctorsWithDistance = doctors.map((doctor) => ({
      ...doctor,
      distance: calculateDistance(lat, lng, Number(doctor.latitude), Number(doctor.longitude)),
    }));

    doctorsWithDistance.sort((a, b) => a.distance - b.distance);

    return NextResponse.json(doctorsWithDistance);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { doctorId, isAvailable } = await request.json();

    await sql`
      UPDATE doctors 
      SET is_available = ${isAvailable}
      WHERE id = ${doctorId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json({ error: 'Failed to update doctor' }, { status: 500 });
  }
}
