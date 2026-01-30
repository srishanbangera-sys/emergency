import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
        a.unit_number as ambulance_unit
      FROM emergencies e
      LEFT JOIN emergency_responses er ON e.id = er.emergency_id
      LEFT JOIN doctors d ON er.doctor_id = d.id
      LEFT JOIN ambulances a ON er.ambulance_id = a.id
      WHERE e.id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching emergency:', error);
    return NextResponse.json({ error: 'Failed to fetch emergency' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    const result = await sql`
      UPDATE emergencies 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating emergency:', error);
    return NextResponse.json({ error: 'Failed to update emergency' }, { status: 500 });
  }
}
