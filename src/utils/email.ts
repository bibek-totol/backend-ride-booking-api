import nodemailer from "nodemailer";

export async function sendVerificationEmail(code: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
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
