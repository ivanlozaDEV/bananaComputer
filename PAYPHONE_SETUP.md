# PayPhone Button V2 + Next.js — Guía de Integración Rápida

> Copia-pega esta guía para integrar PayPhone en cualquier proyecto Next.js en menos de 30 minutos.

---

## 1. Variables de entorno

```env
# .env.local
PAYPHONE_TOKEN=tu-token-aqui
NEXT_PUBLIC_PAYPHONE_TOKEN=tu-token-aqui   # mismo valor
```

El token se obtiene en **[pay.payphonetodoesposible.com](https://pay.payphonetodoesposible.com)** → tu cuenta → API Token.

---

## 2. Configuración en el dashboard de PayPhone

Antes de arrancar, en el panel de PayPhone configura:

| Campo | Valor |
|---|---|
| **Response URL** | `https://tu-dominio.com/checkout/resultado` |
| **Dominio autorizado** | `https://tu-dominio.com` |

> ⚠️ PayPhone bloquea el widget en localhost. El widget solo funciona en el dominio configurado. El endpoint `/Confirm` sí funciona desde cualquier IP.

---

## 3. Agregar el script del widget

En `app/layout.js` (o en la página de checkout específica):

```jsx
// app/layout.js
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <script src="https://cdn.payphonetodoesposible.com/api/button/1.0/payphone-button.min.js" />
      </body>
    </html>
  );
}
```

---

## 4. Página de Checkout — inicializar el widget

```jsx
// app/checkout/page.js
'use client';
import { useEffect } from 'react';

export default function CheckoutPage() {
  const total = 1500; // en centavos ($15.00)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.PayPhoneButton) return;

    window.PayPhoneButton.init({
      token:               process.env.NEXT_PUBLIC_PAYPHONE_TOKEN,
      amount:              total,           // EN CENTAVOS
      amountWithTax:       0,
      tax:                 0,
      currency:            'USD',
      clientTransactionId: `TIENDA-${Date.now()}`,  // ID único que tú generas
      reference:           'Compra en Mi Tienda',
      responseUrl:         'https://tu-dominio.com/checkout/resultado',
      // Opcionales — aparecen en el recibo de PayPhone:
      email:               'cliente@email.com',
      phoneNumber:         '+593XXXXXXXXX',
    });
  }, []);

  return (
    <main>
      <h1>Checkout</h1>
      {/* PayPhone inyecta el botón en este div */}
      <div id="pp-button" />
    </main>
  );
}
```

---

## 5. Página de Resultado — recibir el redirect

PayPhone redirige a `responseUrl?id=XXX&clientTransactionId=YYY`.

```jsx
// app/checkout/resultado/page.js
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResultadoContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [data, setData]     = useState(null);

  const id        = searchParams.get('id');
  const clientTxId = searchParams.get('clientTransactionId');

  useEffect(() => {
    if (!id || !clientTxId) { setStatus('error'); return; }

    fetch('/api/checkout/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, clientTxId }),
    })
      .then(r => r.json())
      .then(d => {
        setData(d);
        setStatus(d.transactionStatus === 'Approved' ? 'approved' : 'failed');
      })
      .catch(() => setStatus('error'));
  }, [id, clientTxId]);

  if (status === 'loading')  return <p>Validando pago...</p>;
  if (status === 'approved') return <p>✅ Pago aprobado — Auth: {data.authorizationCode}</p>;
  if (status === 'failed')   return <p>❌ Pago no completado: {data?.transactionStatus}</p>;
  return <p>Error al verificar el pago.</p>;
}

export default function ResultadoPage() {
  return <Suspense fallback={<p>Cargando...</p>}><ResultadoContent /></Suspense>;
}
```

---

## 6. API Route — confirmar con PayPhone

> 🚨 **CRÍTICO:** Usar el módulo `https` de Node.js, **NO `fetch()`**.  
> `fetch` negocia HTTP/2 vía ALPN/TLS y el servidor de PayPhone (ASP.NET) crashea con HTTP/2 → devuelve `500 Runtime Error` HTML.  
> El módulo `https` fuerza HTTP/1.1, igual que curl.

```javascript
// app/api/checkout/confirm/route.js
import { NextResponse } from 'next/server';
import https from 'https';

function payphoneConfirm(token, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    https.request({
      hostname: 'pay.payphonetodoesposible.com',
      path:     '/api/button/V2/Confirm',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let text = '';
      res.on('data', c => { text += c; });
      res.on('end', () => resolve({ status: res.statusCode, text }));
    })
    .on('error', reject)
    .end(bodyStr);  // .write() + .end() en uno
  });
}

export async function POST(request) {
  try {
    const { id, clientTxId } = await request.json();

    const token = (process.env.PAYPHONE_TOKEN || process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || '').trim();
    if (!token || token.length < 50) {
      return NextResponse.json({ error: 'Token no configurado' }, { status: 500 });
    }

    const { status, text } = await payphoneConfirm(token, {
      id:        parseInt(id),   // DEBE ser integer
      clientTxId: String(clientTxId),
      // ⚠️ NO agregar otros campos — PayPhone crashea con campos desconocidos
    });

    if (status < 200 || status >= 300) {
      console.error('[PayPhone]', status, text.substring(0, 300));
      return NextResponse.json({ error: 'PayPhone error', payphoneStatus: status }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    console.error('[PayPhone confirm]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 7. Respuesta de PayPhone — campos útiles

```json
{
  "transactionStatus":  "Approved",
  "statusCode":         3,
  "authorizationCode":  "W84359745",
  "transactionId":      84359745,
  "clientTransactionId":"TIENDA-1776816724690",
  "amount":             100,
  "cardBrand":          "Visa Pichincha",
  "lastDigits":         "2658",
  "email":              "cliente@email.com",
  "date":               "2026-04-21T19:12:29.213"
}
```

| `statusCode` | `transactionStatus` | Significado |
|---|---|---|
| `3` | `Approved` | Pago aprobado ✅ |
| `2` | `Cancelled` | Usuario canceló |
| `1` | `Declined` | Banco rechazó |

---

## 8. Checklist de integración

- [ ] Token copiado del panel de PayPhone a `.env`
- [ ] `responseUrl` configurado en el dashboard de PayPhone
- [ ] Dominio autorizado en el dashboard de PayPhone
- [ ] Script del widget en `layout.js`
- [ ] `window.PayPhoneButton.init()` con `amount` en **centavos**
- [ ] `clientTransactionId` único generado por nosotros (ej: `TIENDA-${Date.now()}`)
- [ ] Página `/checkout/resultado` con `useSearchParams` envuelta en `<Suspense>`
- [ ] API route usando `https` (Node.js), **NO `fetch()`**
- [ ] Body del confirm: solo `id` (integer) y `clientTxId` (string)

---

## 9. Debugging rápido

```bash
# 1. Probar el Confirm directo a PayPhone (debe dar 200):
TOKEN="tu-token"
curl -s -X POST "https://pay.payphonetodoesposible.com/api/button/V2/Confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": 12345678, "clientTxId": "MI-TIENDA-XYZ"}' | python3 -m json.tool

# 2. Probar nuestro route (con npm run dev activo):
curl -s -X POST http://localhost:3000/api/checkout/confirm \
  -H "Content-Type: application/json" \
  -d '{"id": "12345678", "clientTxId": "MI-TIENDA-XYZ"}' | python3 -m json.tool
```

Si el curl #1 da 200 pero el #2 da 500 → **estás usando `fetch()` en el route. Cámbialo a `https`.**
