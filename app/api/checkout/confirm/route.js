import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, clientTxId } = body;

    const t1 = process.env.PAYPHONE_TOKEN?.trim() || "";
    const t2 = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN?.trim() || "";
    const token = t1.length > t2.length ? t1 : t2;

    if (!token || token.length < 50) {
      return NextResponse.json({ error: 'Configuration error: Invalid Token' }, { status: 500 });
    }

    const response = await fetch('https://pay.payphonetodoesposible.com/api/button/V2/Confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: parseInt(id),
        clientTxId: clientTxId.toString(),
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[PayPhone Confirm] Error:', response.status);
      return NextResponse.json({
        error: 'PayPhone API Error',
        status: response.status,
      }, { status: 500 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: 'Invalid response from PayPhone' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[PayPhone Confirm] Internal error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
