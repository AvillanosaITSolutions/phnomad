export default () => ({
  port: Number(process.env.PORT ?? 3000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET ?? 'replace-me',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ??
    'http://localhost:3000/auth/google/callback',
  adminEmails: String(process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  philSmsApiUrl:
    process.env.PHILSMS_API_URL ?? 'https://app.philsms.com/api/v3/sms/send',
  philSmsApiToken: process.env.PHILSMS_API_TOKEN ?? '',
  philSmsSenderId: process.env.PHILSMS_SENDER_ID ?? 'PhilSMS',
  gmailUser: process.env.GMAIL_USER ?? '',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? '',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure:
    String(process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  smtpFrom: process.env.SMTP_FROM ?? 'noreply@visareminder.app',
  payMongoSecretKey: process.env.PAYMONGO_SECRET_KEY ?? '',
  payMongoWebhookAuth: process.env.PAYMONGO_WEBHOOK_AUTH ?? '',
});
