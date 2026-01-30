import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radiusKm = searchParams.get('radiusKm') || '10';

    const response = await fetch(
      `http://localhost:5000/api/ambulances/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`,
      { method: 'GET' }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching nearby ambulances:', error);
    return NextResponse.json([], { status: 200 });
  }
}
