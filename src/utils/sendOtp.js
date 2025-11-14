const nodemailer = require('nodemailer');

const buildTransport = () => {
  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const service = String(process.env.SMTP_SERVICE || '').toLowerCase();

  if (!user || !pass) return null;

  // Gmail App Password
  if (service === 'gmail' || /gmail\.com$/i.test(host)) {
    return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  }

  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2' }
  });
};

const verifyTransport = async (tx) => {
  try {
    await tx.verify();
  } catch (e) {
    throw new Error(`SMTP_VERIFY_FAIL: ${e.message}`);
  }
};

async function sendOtpEmail(toEmail, otp) {
  const tx = buildTransport();
  if (!tx) throw new Error('SMTP no configurado (revisa .env)');
  await verifyTransport(tx);

  const fromName = process.env.FROM_NAME || 'SGTG - FCEAC UNAH';
  const fromEmail = process.env.SMTP_USER || process.env.FROM_EMAIL || process.env.SMTP_FROM;
  const from = `"${fromName}" <${fromEmail}>`;

  const subject = 'Tu codigo para SGTG';
  const text = `Tu código de verifiación es: ${otp}. Expira en 5 minutos.`;
  const html = `<p>Tu código de verifiación es: <b>${otp}</b></p><p>Este código expira en 5 minutos.</p>`;

  const info = await tx.sendMail({ from, to: toEmail, subject, text, html });
  if (process.env.NODE_ENV !== 'production') console.log('[MAIL][OTP] Enviado:', info.messageId, '→', toEmail);
  return true;
}

// NUEVO: envío de enlace de restablecimiento
async function sendResetEmail(toEmail, resetUrl) {
  const tx = buildTransport();
  if (!tx) throw new Error('SMTP no configurado (revisa .env)');
  await verifyTransport(tx);

  const fromName = process.env.FROM_NAME || 'SGTG - FCEAC UNAH';
  const fromEmail = process.env.SMTP_USER || process.env.FROM_EMAIL || process.env.SMTP_FROM;
  const from = `"${fromName}" <${fromEmail}>`;

  const subject = 'Restablecer contraseña – SGTG';
  const text = `Solicitaste restablecer tu contraseña. Abre este enlace:\n${resetUrl}\nEl enlace expira en 15 minutos.`;
  const html = `
    <h2>Solicitud de restablecimiento de contraseña</h2>
    <p>Haz clic en el siguiente enlace (válido por 15 minutos):</p>
    <p><a href="${resetUrl}" target="_blank" rel="noreferrer">${resetUrl}</a></p>
    <p>Si no solicitaste este cambio, ignora este mensaje.</p>
  `;

  const info = await tx.sendMail({ from, to: toEmail, subject, text, html });
  if (process.env.NODE_ENV !== 'production') console.log('[MAIL][RESET] Enviado:', info.messageId, '→', toEmail, resetUrl);
  return true;
}

module.exports = { sendOtpEmail, sendResetEmail };
