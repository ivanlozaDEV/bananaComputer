# Plantillas de Email (Supabase) - BananaComputer

Estas plantillas mantienen la estética premium de la marca. Cópialas y pégalas en **Supabase Dashboard -> Authentication -> Email Templates**.

## 1. Confirmación de Registro (Confirm Signup)
**Asunto:** 👋 Bienvenido a BananaComputer - Confirma tu cuenta

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { background: #1a1a1a; padding: 40px; text-align: center; }
        .logo { font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
        .logo span { color: #facc15; }
        .content { padding: 40px; text-align: center; color: #333333; line-height: 1.6; }
        .title { font-size: 24px; font-weight: 800; margin-bottom: 20px; color: #111111; }
        .btn { display: inline-block; padding: 16px 32px; background: #111111; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; margin-top: 30px; transition: transform 0.2s; }
        .footer { padding: 30px; background: #f4f4f4; text-align: center; font-size: 12px; color: #888; }
        .rainbow { height: 4px; background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff); }
    </style>
</head>
<body>
    <div class="container">
        <div class="rainbow"></div>
        <div class="header">
            <div class="logo"><span>Banana</span> Computer</div>
        </div>
        <div class="content">
            <h1 class="title">¡Hola! Qué bueno verte por aquí.</h1>
            <p>Gracias por unirte a BananaComputer, la plataforma premium de hardware en Ecuador.</p>
            <p>Para activar tu cuenta y empezar a explorar los mejores sistemas, solo haz clic en el botón de abajo:</p>
            <a href="{{ .ConfirmationURL }}" class="btn">Confirmar mi cuenta</a>
            <p style="margin-top: 40px; font-size: 14px; color: #666;">Si no creaste esta cuenta, simplemente ignora este mensaje.</p>
        </div>
        <div class="footer">
            © 2026 BananaComputer Ecuador. <br>
            Garantía local y soporte oficial.
        </div>
    </div>
</body>
</html>
```

## 2. Restablecer Contraseña (Reset Password)
**Asunto:** 🔑 Restablece tu contraseña - BananaComputer

*(Misma estructura que la anterior, reemplazando el bloque central)*
```html
<h1 class="title">¿Olvidaste tu contraseña?</h1>
<p>No te preocupes, nos pasa a los mejores. Haz clic abajo para crear una nueva:</p>
<a href="{{ .ConfirmationURL }}" class="btn">Restablecer Contraseña</a>
```
