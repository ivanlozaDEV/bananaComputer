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
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Referer': 'https://www.banana-computer.com',
        'Origin': 'https://www.banana-computer.com',
      },
      body: JSON.stringify({
        id: parseInt(id),
        clientTxId: clientTxId.toString(),
        clientTransactionId: clientTxId.toString(),
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[PayPhone Confirm] PayPhone returned:', response.status, responseText.substring(0, 200));
      return NextResponse.json({
        error: 'PayPhone API Error',
        payphoneStatus: response.status,
        detail: responseText.substring(0, 500),
      }, { status: 502 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: 'Invalid response from PayPhone', raw: responseText.substring(0, 200) }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[PayPhone Confirm] Internal error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
