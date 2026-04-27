import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const SMTP_HOST = 'smtp.zoho.com';
const SMTP_PORT = 587; // TLS (fallback if 465 is blocked)
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@banana-computer.com';
const SALES_EMAIL = 'ventas@banana-computer.com';

const STATUS_LABELS = {
  pending: 'Pendiente de Pago',
  verificando_pago: 'Verificando Pago',
  paid: 'Pago Confirmado',
  shipped: 'Pedido Enviado',
  cancelled: 'Pedido Cancelado'
};

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
        <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    </div>
  `;
}

export async function POST(req) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error("Missing SMTP credentials (SMTP_USER/SMTP_PASS)");
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    console.log("[Email API] Request received:", body.type, body.customerEmail);
    const { type, order, customerEmail, newStatus } = body;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false, // true for 465, false for 587
      requireTLS: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      // Increase timeout for slow connections
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    // Verify connection configuration
    try {
      await transporter.verify();
      console.log("[Email API] SMTP connection verified");
    } catch (verifyError) {
      console.error("[Email API] SMTP Verification Failed:", verifyError);
      return NextResponse.json({ 
        error: 'SMTP Connection Failed', 
        details: verifyError.message 
      }, { status: 500 });
    }

    let subject = '';
    let htmlContent = '';
    let toEmail = customerEmail || SALES_EMAIL;

    if (type === 'new_order_admin') {
      subject = `[NUEVO PEDIDO] ${order?.order_number || order?.id?.slice(0,8) || 'Sin Número'}`;
      htmlContent = getBaseTemplate(`
        <h2 style="font-size: 18px;">Nuevo pedido registrado</h2>
        <p>Se ha generado el pedido <strong>${order?.order_number || 'N/A'}</strong>.</p>
        <p><strong>Cliente:</strong> ${order?.billing_address?.full_name || 'Desconocido'}</p>
        <p><strong>Método de Pago:</strong> ${order?.payment_method === 'transfer' ? 'Transferencia' : 'PayPhone (Tarjeta)'}</p>
        <p><strong>Total:</strong> $${Number(order?.total || 0).toFixed(2)}</p>
        <div style="margin-top: 20px;">
          <a href="https://banana-computer.com/admin/orders/${order?.id}" style="background: #4B467B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver en Dashboard</a>
        </div>
      `);
      toEmail = SALES_EMAIL;
    } 
    else if (type === 'status_update') {
      const statusLabel = STATUS_LABELS[newStatus] || newStatus;
      subject = `Tu pedido ${order?.order_number || ''} ha cambiado a: ${statusLabel}`;
      
      let statusMessage = '';
      if (newStatus === 'paid') {
        statusMessage = '<p>¡Grandes noticias! Hemos confirmado tu pago. Tu equipo está entrando en preparación para despacho.</p>';
      } else if (newStatus === 'shipped') {
        statusMessage = '<p>¡Tu pedido va en camino! Nuestro equipo de logística ha despachado tu compra. Te contactaremos pronto para la entrega.</p>';
      } else if (newStatus === 'verificando_pago') {
        statusMessage = '<p>Estamos verificando tu comprobante de transferencia. Te notificaremos en cuanto el pago sea validado.</p>';
      } else if (newStatus === 'cancelled') {
        statusMessage = '<p>Tu pedido ha sido cancelado. Si crees que esto es un error, por favor contáctanos vía WhatsApp.</p>';
      }

      htmlContent = getBaseTemplate(`
        <h2 style="font-size: 18px;">Actualización de tu Pedido</h2>
        <p>Hola <strong>${order?.billing_address?.full_name || 'Cliente'}</strong>,</p>
        <p>El estado de tu pedido <strong>${order?.order_number || 'N/A'}</strong> ha sido actualizado a: <span style="background: #eee; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${statusLabel}</span></p>
        ${statusMessage}
        <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 12px;">
          <p style="margin: 0; font-size: 14px;"><strong>Resumen:</strong></p>
          <p style="margin: 5px 0; font-size: 14px;">${order?.order_items?.length || 0} productos · Total: $${Number(order?.total || 0).toFixed(2)}</p>
        </div>
        <div style="margin-top: 20px;">
          <a href="https://banana-computer.com/perfil" style="color: #4B467B; font-weight: bold; text-decoration: underline;">Ver mis pedidos</a>
        </div>
      `);
    }

    console.log("[Email API] Sending email to:", toEmail);
    const info = await transporter.sendMail({
      from: `"BananaComputer" <${SMTP_FROM}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    });
    console.log("[Email API] Email sent successfully:", info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("[Email API] Unexpected Error:", err);
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
