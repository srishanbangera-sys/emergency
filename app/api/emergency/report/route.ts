import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, userPhone, latitude, longitude, description, severity } = body;

    const result = await sql`
      INSERT INTO emergencies (user_id, user_name, user_phone, latitude, longitude, description, severity, status)
      VALUES (${userId || crypto.randomUUID()}, ${userName || 'Anonymous User'}, ${userPhone || 'Unknown'}, ${latitude}, ${longitude}, ${description || 'Medical Emergency'}, ${severity || 'high'}, 'pending')
      RETURNING *
    `;

    return NextResponse.json({ 
      success: true, 
      emergency: result[0],
      message: 'Emergency reported successfully'
    });
  } catch (error) {
    console.error('Error reporting emergency:', error);
    return NextResponse.json({ error: 'Failed to report emergency' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const emergencies = await sql`
      SELECT * FROM emergencies 
      WHERE status IN ('pending', 'accepted', 'in_progress')
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        created_at ASC
    `;

    return NextResponse.json(emergencies);
  } catch (error) {
    console.error('Error fetching emergencies:', error);
    return NextResponse.json([], { status: 200 });
  }
}
