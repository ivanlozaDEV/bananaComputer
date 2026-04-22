import { NextResponse } from 'next/server';
import https from 'https';

/**
 * Calls PayPhone via Node.js https (HTTP/1.1) — NOT fetch.
 * PayPhone's ASP.NET Confirm endpoint crashes under HTTP/2,
 * which is what Node.js native fetch negotiates via ALPN/TLS.
 */
function payphonePost(token, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: 'pay.payphonetodoesposible.com',
      path: '/api/button/V2/Confirm',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = https.request(options, (res) => {
      let text = '';
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, text }));
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

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

    const requestBody = {
      id: parseInt(id),
      clientTxId: clientTxId?.toString(),
    };

    console.log('[PayPhone] calling Confirm via https (HTTP/1.1):', JSON.stringify(requestBody));

    const { status, text } = await payphonePost(token, requestBody);

    console.log('[PayPhone] status:', status, '| response:', text.substring(0, 200));

    if (status < 200 || status >= 300) {
      return NextResponse.json({
        error: 'PayPhone API Error',
        payphoneStatus: status,
        detail: text.substring(0, 500),
      }, { status: 502 });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid response from PayPhone', raw: text.substring(0, 200) }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[PayPhone Confirm] Internal error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
