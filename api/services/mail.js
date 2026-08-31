import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env, rootDir } from '../config/env.js';
import { AppError } from '../lib/errors.js';

export async function sendRecovery(email, token) {
  const url = `${env.origin}/restablecer?token=${encodeURIComponent(token)}`;
  const message = { from: process.env.MAIL_FROM || 'GYM-OS <no-reply@gym-os.local>', to: email, subject: 'Restablecé tu contraseña de GYM-OS', text: `Recibimos una solicitud para restablecer tu contraseña.\n\n${url}\n\nEste enlace vence en 30 minutos y sólo se puede usar una vez. Si no lo pediste, ignorá este correo.` };
  if (process.env.MAIL_TRANSPORT === 'file' && env.nodeEnv !== 'production') {
    const dir = path.join(rootDir, '.local', 'mail'); await mkdir(dir, { recursive: true, mode: 0o700 });
    await writeFile(path.join(dir, `${Date.now()}-${randomUUID()}.json`), JSON.stringify(message, null, 2), { mode: 0o600 });
    return;
  }
  if (!process.env.SMTP_HOST) throw new AppError(503, 'MAIL_UNAVAILABLE', 'El correo no está configurado. Contactá al administrador.');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10000, socketTimeout: 15000,
  });
  try { await transport.sendMail(message); } catch { throw new AppError(503, 'MAIL_UNAVAILABLE', 'No se pudo enviar el correo. Intentá nuevamente.'); }
}
