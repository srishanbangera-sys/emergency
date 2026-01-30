import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');

    const response = await fetch(
      `http://localhost:5000/api/doctors/available?latitude=${latitude}&longitude=${longitude}`,
      { method: 'GET' }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    return NextResponse.json([], { status: 200 });
  }
}
