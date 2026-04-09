# Plantilla: Confirmación de Registro (Confirm Signup)

**Asunto:** 👋 Bienvenido a BananaComputer - Confirma tu cuenta

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fbfbf9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { background: #4B467B; padding: 40px; text-align: center; }
        .logo { font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
        .logo span { color: #FBDD33; }
        .content { padding: 40px; text-align: center; color: #333333; line-height: 1.6; }
        .title { font-size: 24px; font-weight: 800; margin-bottom: 20px; color: #4B467B; }
        .btn { display: inline-block; padding: 16px 32px; background: #FBDD33; color: #1a1a1a !important; text-decoration: none; border-radius: 12px; font-weight: 700; margin-top: 30px; transition: transform 0.2s; }
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
