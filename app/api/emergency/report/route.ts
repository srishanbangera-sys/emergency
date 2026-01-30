import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, latitude, longitude, description } = body;

    // This route proxies to the Node.js backend server
    // Make sure server.js is running on port 5000
    const response = await fetch('http://localhost:5000/api/emergency/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, latitude, longitude, description }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reporting emergency:', error);
    return NextResponse.json({ error: 'Failed to report emergency' }, { status: 500 });
  }
}
