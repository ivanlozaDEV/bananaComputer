# PayPhone Button V2 — Guía de Integración para Banana Computer

> **Última actualización:** Abril 2026  
> Documenta todo el flujo, los campos exactos de cada request/response, los errores encontrados y su solución.

---

## 1. Qué es PayPhone Button V2

PayPhone es la pasarela de pagos usada en Banana Computer. El "Button V2" es el widget embebido que presenta el formulario de tarjeta al comprador. El flujo es:

```
Usuario llena carrito
       ↓
/checkout (page.js) — genera el widget con el token
       ↓
Usuario paga en el widget PayPhone (iframe/modal)
       ↓
PayPhone redirige al responseUrl con ?id=XXX&clientTransactionId=YYY
       ↓
/checkout/resultado (page.js) — llama a /api/checkout/confirm
       ↓
/api/checkout/confirm/route.js — llama a PayPhone Confirm endpoint
       ↓
Respuesta final: Approved / Cancelled / Declined
```

---

## 2. Configuración necesaria

### Variables de entorno

```env
PAYPHONE_TOKEN=6-_2cfHev-mIWtb...           # token del panel de PayPhone
NEXT_PUBLIC_PAYPHONE_TOKEN=6-_2cfHev-mIWtb... # mismo valor (para legacy/fallback)
```

El token se obtiene en el [dashboard de PayPhone](https://pay.payphonetodoesposible.com). Es un API token de **326 caracteres** alfanumérico con `-` y `_`. NO es un JWT (no tiene puntos).

> ⚠️ **Importante:** PayPhone tiene configurado como dominio autorizado `banana-computer.com`. Cualquier prueba con localhost en el widget falla porque PayPhone bloquea el origen. Sin embargo, el **endpoint de Confirm sí funciona desde cualquier IP** (incluyendo localhost y Render), siempre que el token sea válido.

### responseUrl configurado en PayPhone

```
https://www.banana-computer.com/checkout/resultado
```

---

## 3. Flujo detallado

### 3.1 Iniciar pago — Widget Button V2

El widget se inicializa en el cliente con:

```javascript
window.PayPhoneButton.init({
  token:           process.env.NEXT_PUBLIC_PAYPHONE_TOKEN,
  amount:          totalEnCentavos,        // ej: $1.00 → amount: 100
  amountWithTax:   0,
  tax:             0,
  currency:        'USD',
  clientTransactionId: `BANANA-${Date.now()}`,   // ID único que tú generas
  reference:       'Compra Banana Computer - N items',
  responseUrl:     'https://www.banana-computer.com/checkout/resultado',
  // opcionales pero útiles para el recibo:
  phoneNumber:     '+593XXXXXXXXX',
  email:           'cliente@email.com',
  optionalParameter4: 'NOMBRE CLIENTE',
});
```

### 3.2 Redirect de PayPhone al resultado

Cuando el usuario paga, PayPhone redirige a:

```
https://www.banana-computer.com/checkout/resultado?id=84359745&clientTransactionId=BANANA-1776816724690
```

Parámetros en la URL:
| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | integer (string en URL) | ID de la transacción en PayPhone |
| `clientTransactionId` | string | El `clientTransactionId` que enviaste al iniciar el pago |

### 3.3 Página resultado → llama a nuestra API

`app/checkout/resultado/page.js` extrae los params y llama:

```javascript
// Lee los params:
const payphoneId = searchParams.get('id');
const clientTxId = searchParams.get('clientTransactionId') || searchParams.get('clientTxId');

// Llama a nuestro route:
const res = await fetch('/api/checkout/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: payphoneId, clientTxId }),
});
```

### 3.4 Nuestro API Route → llama a PayPhone Confirm

`app/api/checkout/confirm/route.js`

**Request que enviamos a PayPhone:**

```
POST https://pay.payphonetodoesposible.com/api/button/V2/Confirm
Content-Type: application/json
Authorization: Bearer <TOKEN>
Content-Length: <n>

{
  "id": 84359745,
  "clientTxId": "BANANA-1776816724690"
}
```

Campos:
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | **integer** | El `id` de la URL — debe enviarse como número, no string |
| `clientTxId` | string | El `clientTransactionId` de la URL |

> ⚠️ **Solo estos dos campos.** No agregar ningún campo extra.

**Response de PayPhone (200 OK, transacción aprobada):**

```json
{
  "email": "caro.mejiari@gmail.com",
  "cardType": "Credit",
  "bin": "445447",
  "lastDigits": "2658",
  "deferred": false,
  "cardBrand": "Visa Pichincha",
  "amount": 100,
  "clientTransactionId": "BANANA-1776816724690",
  "phoneNumber": "593984979916",
  "statusCode": 3,
  "transactionStatus": "Approved",
  "authorizationCode": "W84359745",
  "message": null,
  "messageCode": 0,
  "transactionId": 84359745,
  "storeName": "Banana Computer",
  "date": "2026-04-21T19:12:29.213",
  "regionIso": "EC",
  "transactionType": "Classic",
  "reference": "Compra Banana Computer - 1 items",
  "taxes": [],
  "currency": "USD"
}
```

Campos clave de la respuesta:
| Campo | Valores posibles | Descripción |
|---|---|---|
| `transactionStatus` | `"Approved"`, `"Cancelled"`, `"Declined"` | Estado final |
| `statusCode` | `3` = Approved, `2` = Cancelled | Código numérico del estado |
| `authorizationCode` | `"W84359745"` | Código del banco, guardar en DB |
| `amount` | `100` | Monto en **centavos** (100 = $1.00) |
| `transactionId` | integer | ID interno de PayPhone |

---

## 4. ⚠️ El Bug — HTTP/2 vs HTTP/1.1

### Síntoma

```
POST /api/checkout/confirm → 502 Bad Gateway
PayPhone devuelve 500 con HTML: "Runtime Error"
```

Desde curl directo → 200 ✅  
Desde Next.js server → 500 ❌  
Token válido, URL correcta, body correcto. Sin diferencia aparente.

### Diagnóstico

Se agregó logging completo al route y se compararon solicitudes:

| | Método HTTP | Resultado |
|---|---|---|
| `curl` desde terminal | HTTP/1.1 | ✅ 200 Approved |
| `fetch()` de Node.js | **HTTP/2** (vía ALPN/TLS) | ❌ 500 Runtime Error |

**La causa:** Node.js `fetch` nativo (basado en `undici`) negocia **HTTP/2** automáticamente durante el handshake TLS (ALPN). El servidor de PayPhone es ASP.NET antiguo que **crashea con Runtime Error cuando recibe requests HTTP/2**.

El `curl` por defecto usa HTTP/1.1, por eso siempre funciona.

### Cosas que NO eran el problema

Durante el debugging se descartaron estas hipótesis en orden:

1. ❌ Token inválido o mal enviado → token era correcto (326 chars)
2. ❌ El header `Referer: banana-computer.com` → no era el problema
3. ❌ El header `Origin: banana-computer.com` → no era el problema
4. ❌ El campo extra `clientTransactionId` en el body → crasheaba PayPhone pero por otra razón (en realidad era HTTP/2 the culprit)
5. ❌ Variables de entorno en producción → estaban bien
6. ✅ **HTTP/2 vs HTTP/1.1** → este era el problema real

### La solución

**Reemplazar `fetch()` con el módulo `https` de Node.js**, que sempre usa HTTP/1.1:

```javascript
// ❌ ESTO FALLA — fetch usa HTTP/2 con PayPhone
const response = await fetch('https://pay.payphonetodoesposible.com/api/button/V2/Confirm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ id: parseInt(id), clientTxId }),
});

// ✅ ESTO FUNCIONA — https module fuerza HTTP/1.1
import https from 'https';

function payphonePost(token, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = https.request({
      hostname: 'pay.payphonetodoesposible.com',
      path: '/api/button/V2/Confirm',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let text = '';
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, text }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}
```

> 🚨 **REGLA:** Nunca usar `fetch()` para llamar a PayPhone desde el servidor. Siempre usar `https` de Node.js. Aplica también a cualquier otro endpoint de la API de PayPhone que se implemente en el futuro (reembolsos, consultas de estado, etc.).

---

## 5. Cómo debuggear PayPhone en el futuro

### Verificar el token

```bash
# Ver longitud y preview del token que está activo
curl -s http://localhost:3000/api/checkout/debug-confirm
```

### Llamar Confirm directamente con curl (referencia)

```bash
TOKEN="tu-token-aqui"

curl -s -X POST "https://pay.payphonetodoesposible.com/api/button/V2/Confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": 84359745, "clientTxId": "BANANA-1776816724690"}' | python3 -m json.tool
```

### Ver los logs del route en tiempo real

```bash
# En una terminal:
npm run dev

# En otra terminal:
curl -s -X POST http://localhost:3000/api/checkout/confirm \
  -H "Content-Type: application/json" \
  -d '{"id": "TRANSACTION_ID", "clientTxId": "BANANA-XXXXXXX"}' | python3 -m json.tool
```

Los logs del route aparecen en el terminal de `npm run dev`.

---

## 6. Archivos relevantes

| Archivo | Rol |
|---|---|
| `app/checkout/page.js` | Inicializa el widget PayPhone Button V2 |
| `app/checkout/resultado/page.js` | Recibe redirect de PayPhone, llama a /api/checkout/confirm |
| `app/api/checkout/confirm/route.js` | Route que llama a PayPhone Confirm (usa `https`, no `fetch`) |

---

## 7. Errores conocidos y sus significados

| Error | Causa | Solución |
|---|---|---|
| `500 Runtime Error` (HTML de ASP.NET) | HTTP/2 usado por Node.js fetch | Usar módulo `https` de Node.js |
| `401 Unauthorized` | Token inválido o expirado | Renovar token en dashboard PayPhone |
| `400 Bad Request` | Campo `id` enviado como string, o campo extra en el body | `parseInt(id)`, solo enviar `id` y `clientTxId` |
| Transacción no encontrada | `id` o `clientTxId` incorrectos, o ya expiró (>10 min) | Verificar params en la URL de redirectBuscar en logs de PayPhone |
| `502` desde nuestro route | PayPhone respondió non-2xx | Revisar `payphoneStatus` y `detail` en el body del 502 |
