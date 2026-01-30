import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { emergencyId, doctorId, responseType } = await request.json();

    // Update emergency status
    await sql`
      UPDATE emergencies 
      SET status = 'accepted', updated_at = NOW()
      WHERE id = ${emergencyId}
    `;

    // Create emergency response
    const response = await sql`
      INSERT INTO emergency_responses (emergency_id, doctor_id, response_type, status)
      VALUES (${emergencyId}, ${doctorId}, ${responseType || 'doctor'}, 'dispatched')
      RETURNING *
    `;

    // Mark doctor as unavailable
    await sql`
      UPDATE doctors 
      SET is_available = false
      WHERE id = ${doctorId}
    `;

    return NextResponse.json({ 
      success: true, 
      response: response[0],
      message: 'Emergency accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting emergency:', error);
    return NextResponse.json({ error: 'Failed to accept emergency' }, { status: 500 });
  }
}
