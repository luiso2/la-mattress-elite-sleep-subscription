const nodemailer = require('nodemailer');

// Gmail configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'lamattress.brand@gmail.com',
    pass: 'wkoprekbimslzesx'
  }
});

// Test email
async function sendTestEmail() {
  try {
    console.log('📧 Sending test email to lbencomo94@gmail.com...');

    const info = await transporter.sendMail({
      from: '"LA Mattress Elite Sleep+" <lamattress.brand@gmail.com>',
      to: 'lbencomo94@gmail.com',
      subject: '✅ Test Email - LA Mattress Elite Sleep+ System',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e40af 0%, #00bcd4 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
              .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
              .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .info-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">LA MATTRESS</div>
                <h1 style="margin: 10px 0; font-size: 28px;">Email System Test</h1>
              </div>
              <div class="content">
                <div class="success-box">
                  <h2 style="margin-top: 0;">✅ Email Configuration Successful!</h2>
                  <p>This test confirms that the email system is working correctly.</p>
                </div>

                <div class="info-section">
                  <h3 style="color: #1e40af; margin-top: 0;">Configuration Details:</h3>
                  <ul>
                    <li><strong>SMTP Server:</strong> smtp.gmail.com</li>
                    <li><strong>Port:</strong> 465 (SSL)</li>
                    <li><strong>From:</strong> lamattress.brand@gmail.com</li>
                    <li><strong>Status:</strong> ✅ Active</li>
                  </ul>
                </div>

                <div class="info-section">
                  <h3 style="color: #1e40af; margin-top: 0;">Automatic Emails Configured:</h3>
                  <ul>
                    <li>Welcome email for new Elite Sleep+ members</li>
                    <li>Monthly renewal confirmations</li>
                    <li>Payment failure notifications</li>
                    <li>Subscription cancellation confirmations</li>
                    <li>Protector replacement confirmations</li>
                    <li>Credit usage notifications</li>
                    <li>Cashback updates</li>
                  </ul>
                </div>

                <p style="margin-top: 25px; font-size: 14px; color: #666;">
                  <strong>Test Date:</strong> ${new Date().toLocaleString()}<br>
                  <strong>System:</strong> LA Mattress Elite Sleep+ Subscription Portal
                </p>
              </div>
              <div class="footer">
                <p style="margin: 5px 0;"><strong>LA MATTRESS</strong></p>
                <p style="margin: 5px 0;">Elite Sleep+ Premium Membership Program</p>
                <p style="margin: 10px 0; font-size: 11px;">This is a test email to verify email configuration.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        LA MATTRESS - Email System Test

        ✅ Email Configuration Successful!

        This test confirms that the email system is working correctly.

        Configuration Details:
        - SMTP Server: smtp.gmail.com
        - Port: 465 (SSL)
        - From: lamattress.brand@gmail.com
        - Status: Active

        Test Date: ${new Date().toLocaleString()}
        System: LA Mattress Elite Sleep+ Subscription Portal
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);

  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

// Run the test
sendTestEmail();