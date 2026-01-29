import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Email configuration verification
const verifyEmailConfig = () => {
  const requiredVars = ['SMTP_USER', 'SMTP_PASS', 'SMTP_HOST', 'SMTP_PORT'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error(`[EMAIL_CONFIG] Missing environment variables: ${missing.join(', ')}`);
    return false;
  }

  console.log(`[EMAIL_CONFIG] Configuration verified`);
  console.log(`[EMAIL_CONFIG] SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`[EMAIL_CONFIG] SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`[EMAIL_CONFIG] SMTP User: ${process.env.SMTP_USER}`);
  console.log(`[EMAIL_CONFIG] Environment: ${process.env.NODE_ENV || 'development'}`);

  return true;
};

// Create transporter with production-ready configuration
const createTransporter = (): Transporter => {
  if (!verifyEmailConfig()) {
    throw new Error("Email configuration is incomplete. Check environment variables.");
  }

  const config = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true, // Use SSL for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 20000, // 20 seconds
  };

  console.log(`[EMAIL_CONFIG] Creating transporter with host: ${config.host}:${config.port}`);

  return nodemailer.createTransport(config);
};

// Retry mechanism for email sending
const sendEmailWithRetry = async (
  transporter: Transporter,
  mailOptions: any,
  maxRetries: number = 3
): Promise<void> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[EMAIL_SEND] Attempt ${attempt}/${maxRetries}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL_SEND] Success! Message ID: ${info.messageId}`);
      console.log(`[EMAIL_SEND] Response: ${info.response}`);
      return; // Success, exit function
    } catch (error: any) {
      lastError = error;
      console.error(`[EMAIL_SEND] Attempt ${attempt} failed:`, {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        message: error.message
      });

      // Don't retry on authentication errors
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        console.error(`[EMAIL_SEND] Authentication failed. Check SMTP credentials.`);
        throw new Error(`Email authentication failed. Please verify SMTP_USER and SMTP_PASS are correct.`);
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[EMAIL_SEND] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  console.error(`[EMAIL_SEND] All ${maxRetries} attempts failed`);
  throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError.message}`);
};

export async function sendVerificationEmail(code: string) {
  console.log(`[EMAIL_VERIFICATION] Starting admin verification email`);
  console.log(`[EMAIL_VERIFICATION] Recipient: ${process.env.VERIFICATION_RECEIVER_EMAIL}`);

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Admin Verification" <${process.env.SMTP_USER}>`,
      to: process.env.VERIFICATION_RECEIVER_EMAIL,
      subject: "New Admin Registration Verification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Admin Registration Verification</h2>
          <p>A new admin registration request has been received.</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0;">Verification Code:</h3>
            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 10px 0;">${code}</p>
          </div>
          <p style="color: #666; font-size: 12px;">This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    await sendEmailWithRetry(transporter, mailOptions);
    console.log(`[EMAIL_VERIFICATION] Admin verification email sent successfully`);
  } catch (error: any) {
    console.error("[EMAIL_VERIFICATION] Failed to send admin verification email:", error);
    throw error;
  }
}

export async function sendLoginOtpEmail(email: string, code: string) {
  console.log(`[EMAIL_OTP] Starting OTP email send process`);
  console.log(`[EMAIL_OTP] Recipient: ${email}`);
  console.log(`[EMAIL_OTP] OTP Code: ${code.substring(0, 2)}****`); // Log partial code for debugging

  try {
    const transporter = createTransporter();

    // Verify transporter connection
    console.log(`[EMAIL_OTP] Verifying SMTP connection...`);
    try {
      await transporter.verify();
      console.log(`[EMAIL_OTP] SMTP connection verified successfully`);
    } catch (verifyError: any) {
      console.error(`[EMAIL_OTP] SMTP verification failed:`, {
        code: verifyError.code,
        message: verifyError.message,
        command: verifyError.command
      });
      throw new Error(`SMTP connection failed: ${verifyError.message}`);
    }

    const mailOptions = {
      from: `"Ride Booking" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Login OTP - Ride Booking",
      text: `Your OTP code is: ${code}\n\nThis code will expire in 2 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Ride Booking</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Your Login OTP</h2>
            <p style="color: #666; font-size: 16px;">Use the following code to complete your login:</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px dashed #667eea;">
              <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 5px;">${code}</p>
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 20px;">
              ⏱️ This code will expire in <strong>2 minutes</strong>
            </p>
            <p style="color: #999; font-size: 14px;">
              🔒 If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Ride Booking. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    console.log(`[EMAIL_OTP] Sending email...`);
    await sendEmailWithRetry(transporter, mailOptions);
    console.log(`[EMAIL_OTP] ✅ OTP email sent successfully to ${email}`);
  } catch (error: any) {
    console.error("[EMAIL_OTP] ❌ Failed to send OTP email:", {
      recipient: email,
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}
