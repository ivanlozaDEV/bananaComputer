import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const SMTP_HOST = 'smtp.zoho.com';
const SMTP_PORT = 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@banana-computer.com';

function getBaseTemplate(content) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4B467B; margin: 0; font-size: 28px;">BANANA</h1>
        <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 10px; margin: 5px 0; color: #999;">High Performance Computing</p>
      </div>
      ${content}
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
        <p>BananaComputer © 2026 · Guayaquil, Ecuador</p>
        <p>Este es un mensaje enviado desde nuestro departamento de ventas.</p>
      </div>
    </div>
  `;
}

export async function POST(req) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error("[Quote Email API] Missing SMTP Credentials:", { SMTP_USER: !!SMTP_USER, SMTP_PASS: !!SMTP_PASS });
    return NextResponse.json({ error: 'Email service not configured. Check your environment variables.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { quote, customerEmail, quoteUrl } = body;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: 587,
      secure: false, // true for 465, false for 587
      requireTLS: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    // Verify connection configuration
    try {
      await transporter.verify();
      console.log("[Quote Email API] SMTP connection verified");
    } catch (verifyError) {
      console.error("[Quote Email API] SMTP Verification Failed:", verifyError);
      return NextResponse.json({ 
        error: 'SMTP Connection Failed', 
        details: verifyError.message 
      }, { status: 500 });
    }

    const isOptions = quote.quote_type === 'options';
    const subject = isOptions 
      ? `Opciones Recomendadas Banana Computer: #${quote.slug}`
      : `Tu Proforma de Banana Computer: #${quote.slug}`;
    
    const htmlContent = getBaseTemplate(`
      <h2 style="font-size: 18px; color: #4B467B;">¡Hola ${quote.customer_data.full_name}!</h2>
      
      ${isOptions 
        ? `<p>Hemos preparado varias opciones de equipos que se ajustan a lo que buscas. Revisa la comparativa a continuación para elegir la que mejor te convenga.</p>`
        : `<p>Adjuntamos los detalles de la proforma que solicitaste en Banana Computer.</p>`
      }
      
      <div style="margin: 30px 0; padding: 25px; background: #fbfbf9; border-radius: 20px; border: 1px solid #eee;">
        <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Resumen de Cotización</p>
        ${isOptions 
          ? `<h3 style="margin: 5px 0 15px 0; font-size: 20px; color: #111;">Varias Opciones Disponibles</h3>`
          : `<h3 style="margin: 5px 0 15px 0; font-size: 24px; color: #111;">Total: $${Number(quote.totals.total).toFixed(2)}</h3>`
        }
        
        <p style="margin: 0; font-size: 13px; color: #666;">
          <strong>ID:</strong> #${quote.slug}<br>
          <strong>Válida hasta:</strong> ${new Date(quote.expires_at).toLocaleDateString()}
        </p>
      </div>

      <p>${isOptions 
        ? 'Puedes comparar las características técnicas, garantías y precios finales haciendo clic en el siguiente botón:' 
        : 'Puedes revisar el detalle completo de los equipos y realizar tu pago en línea haciendo clic en el siguiente botón:'
      }</p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${quoteUrl}" style="background: #4B467B; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">
          ${isOptions ? 'VER Y COMPARAR OPCIONES' : 'VER PROFORMA Y PAGAR'}
        </a>
      </div>

      <p style="font-size: 13px; color: #666;">Si tienes alguna duda técnica o necesitas un ajuste en la proforma, simplemente responde a este correo o contáctanos por WhatsApp.</p>
    `);

    await transporter.sendMail({
      from: `"Ventas BananaComputer" <${SMTP_FROM}>`,
      to: customerEmail,
      subject: subject,
      html: htmlContent
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Quote Email API] Error:", err);
    return NextResponse.json({ error: 'Failed to send email', details: err.message }, { status: 500 });
  }
}
