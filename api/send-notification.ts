import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

type NotificationPayload =
  | {
      type: 'student-submitted';
      studentName: string;
      studentEmail: string;
      teacherName: string;
      teacherEmail: string;
    }
  | {
      type: 'teacher-reviewed';
      studentName: string;
      studentEmail: string;
      teacherName: string;
    };

function isValidEmail(value: unknown) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildEmail(payload: NotificationPayload) {
  const studentName = escapeHtml(payload.studentName || 'A student');
  const teacherName = escapeHtml(payload.teacherName || 'Teacher');

  if (payload.type === 'student-submitted') {
    return {
      to: payload.teacherEmail,
      subject: `${payload.studentName} submitted a leadership log`,
      html: `
        <p>Dear ${teacherName},</p>
        <p>${studentName} has submitted or updated their Leadership Programme Growth Log.</p>
        <p>Please log in to the teacher console to review the submission.</p>
      `,
      text: `Dear ${payload.teacherName},\n\n${payload.studentName} has submitted or updated their Leadership Programme Growth Log.\n\nPlease log in to the teacher console to review the submission.`,
    };
  }

  return {
    to: payload.studentEmail,
    subject: 'Your leadership log has been reviewed',
    html: `
      <p>Dear ${studentName},</p>
      <p>${teacherName} has reviewed your Leadership Programme Growth Log.</p>
      <p>Please log in to the student console to view the feedback.</p>
    `,
    text: `Dear ${payload.studentName},\n\n${payload.teacherName} has reviewed your Leadership Programme Growth Log.\n\nPlease log in to the student console to view the feedback.`,
  };
}

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedAuthKey: string | null = null;

function getTransporter(user: string, pass: string) {
  const key = `${user}:${pass}`;
  if (cachedTransporter && cachedAuthKey === key) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  cachedAuthKey = key;
  return cachedTransporter;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body as NotificationPayload;
  if (!payload || !['student-submitted', 'teacher-reviewed'].includes(payload.type)) {
    return res.status(400).json({ error: 'Invalid notification type' });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  const fromHeader = process.env.NOTIFICATION_FROM_EMAIL || (gmailUser ? `Leadership Programme <${gmailUser}>` : '');

  if (!gmailUser) {
    return res.status(500).json({ error: 'GMAIL_USER is not configured' });
  }
  if (!gmailAppPassword) {
    return res.status(500).json({ error: 'GMAIL_APP_PASSWORD is not configured' });
  }

  if (payload.type === 'student-submitted' && !isValidEmail(payload.teacherEmail)) {
    return res.status(400).json({ error: 'Teacher email is missing or invalid' });
  }

  if (payload.type === 'teacher-reviewed' && !isValidEmail(payload.studentEmail)) {
    return res.status(400).json({ error: 'Student email is missing or invalid' });
  }

  const email = buildEmail(payload);
  const transporter = getTransporter(gmailUser, gmailAppPassword);

  try {
    const info = await transporter.sendMail({
      from: fromHeader,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return res.status(200).json({ id: info.messageId });
  } catch (err: any) {
    return res.status(502).json({ error: err?.message ?? 'Failed to send email via Gmail SMTP.' });
  }
}
