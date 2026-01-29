import nodemailer from "nodemailer";

export async function sendVerificationEmail(code: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2"
    },
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 20000,
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
  console.log(`Attempting to send OTP to ${email} using ${process.env.SMTP_USER}`);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2"
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
  });

  try {
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
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Nodemailer Send Error:", error);
    throw error;
  }
}
