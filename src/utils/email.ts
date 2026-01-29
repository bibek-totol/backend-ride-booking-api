import nodemailer from "nodemailer";

export async function sendVerificationEmail(code: string) {
  const isGmail = process.env.SMTP_HOST?.includes("gmail");

  const transporter = nodemailer.createTransport({
    service: isGmail ? "gmail" : undefined,
    host: isGmail ? undefined : process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // MUST be false for port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    logger: true,
    debug: true,
  });

  await transporter.sendMail({
    from: `"Admin Verification" <${process.env.SMTP_USER}>`,
    to: process.env.VERIFICATION_RECEIVER_EMAIL,
    subject: "New Admin Registration Verification",
    html: `
      <h3>Admin Verification Code</h3>
      <p>A new admin registration request has been made.</p>
      <p>Your verification code is: <strong>${code}</strong></p>
    `,
  });
}

export async function sendLoginOtpEmail(email: string, code: string) {
  const isGmail = process.env.SMTP_HOST?.includes("gmail");

  const transporter = nodemailer.createTransport({
    service: isGmail ? "gmail" : undefined,
    host: isGmail ? undefined : process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // MUST be false for port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    logger: true,
    debug: true,
  });

  await transporter.sendMail({
    from: `"Ride Booking App" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Login Verification Code",
    html: `
      <h3>Login Verification Code</h3>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 2 minutes.</p>
    `,
  });
}
