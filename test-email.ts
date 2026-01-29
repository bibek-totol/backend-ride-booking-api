// Email Service Test Script
// Run this to verify your email configuration before deploying

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmailConfiguration = async () => {
    console.log('\n🔍 Testing Email Configuration...\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET'}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER || '❌ NOT SET'}`);
    console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Missing SMTP credentials. Please check your .env file.\n');
        process.exit(1);
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        },
    });

    // Test connection
    console.log('🔌 Testing SMTP connection...');
    try {
        await transporter.verify();
        console.log('✅ SMTP connection successful!\n');
    } catch (error: any) {
        console.error('❌ SMTP connection failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}\n`);

        if (error.code === 'EAUTH' || error.responseCode === 535) {
            console.log('💡 Troubleshooting Tips:');
            console.log('   1. Verify 2-Step Verification is enabled in Gmail');
            console.log('   2. Generate a new App Password: https://myaccount.google.com/apppasswords');
            console.log('   3. Update SMTP_PASS in your .env file');
            console.log('   4. Make sure you\'re using the app password, not your Gmail password\n');
        }

        process.exit(1);
    }

    // Send test email
    console.log('📧 Sending test email...');
    const testEmail = process.env.SMTP_USER; // Send to yourself for testing

    try {
        const info = await transporter.sendMail({
            from: `"Ride Booking Test" <${process.env.SMTP_USER}>`,
            to: testEmail,
            subject: '✅ Email Configuration Test - Ride Booking',
            text: 'If you receive this email, your email configuration is working correctly!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Email Test Successful!</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Configuration Verified</h2>
            <p style="color: #666; font-size: 16px;">
              Your email configuration is working correctly. You can now deploy to production with confidence!
            </p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
              <p style="margin: 10px 0 0 0;"><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
              <p style="margin: 10px 0 0 0;"><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 20px;">
              Test performed at: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
        });

        console.log('✅ Test email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Recipient: ${testEmail}`);
        console.log(`   Response: ${info.response}\n`);

        console.log('🎉 All tests passed! Your email configuration is ready for production.\n');
    } catch (error: any) {
        console.error('❌ Failed to send test email:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}\n`);
        process.exit(1);
    }
};

// Run the test
testEmailConfiguration().catch(console.error);
