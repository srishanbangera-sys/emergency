import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const result = await sql`
      SELECT e.*, 
        er.id as response_id, 
        er.doctor_id, 
        er.ambulance_id, 
        er.response_type, 
        er.status as response_status,
        d.name as doctor_name,
        d.specialty as doctor_specialty,
        d.phone as doctor_phone,
        d.latitude as doctor_latitude,
        d.longitude as doctor_longitude,
        a.unit_number as ambulance_unit,
        a.eta_minutes
      FROM emergencies e
      LEFT JOIN emergency_responses er ON e.id = er.emergency_id
      LEFT JOIN doctors d ON er.doctor_id = d.id
      LEFT JOIN ambulances a ON er.ambulance_id = a.id
      WHERE e.user_id = ${userId}
      AND e.status IN ('pending', 'accepted', 'in_progress')
      ORDER BY e.created_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ hasActiveEmergency: false });
    }

    return NextResponse.json({ 
      hasActiveEmergency: true,
      emergency: result[0]
    });
  } catch (error) {
    console.error('Error fetching user emergency:', error);
    return NextResponse.json({ error: 'Failed to fetch emergency' }, { status: 500 });
  }
}
