import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { id, clientTxId } = await request.json();

    const token = process.env.PAYPHONE_TOKEN; // Note: Use server-side env (no NEXT_PUBLIC)

    if (!token) {
      console.error('PAYPHONE_TOKEN is missing in environment variables');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const response = await fetch('https://pay.payphonetodoesposible.com/api/button/V2/Confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: parseInt(id), clientTxId })
    });

    const data = await response.json();

    // Log for debugging (remove in real production or keep for audit)
    console.log('PayPhone Confirmation Result:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Checkout Confirmation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
