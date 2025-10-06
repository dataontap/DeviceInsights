import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface MagicLinkEmailData {
  email: string;
  magicLink: string;
  appName?: string;
}

export async function sendMagicLinkEmail(data: MagicLinkEmailData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('🔐 Development mode - Magic link for', data.email, ':', data.magicLink);
      return true; // Return success in development mode
    }

    const { data: result, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'rbm@dotmobile.app',
      to: [data.email],
      subject: `Admin Login - ${data.appName || 'Device Insights'}`,
      html: createMagicLinkEmailTemplate(data),
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log('Magic link email sent successfully:', result?.id);
    return true;
  } catch (error) {
    console.error('Error sending magic link email:', error);
    return false;
  }
}

function createMagicLinkEmailTemplate(data: MagicLinkEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login - ${data.appName || 'Device Insights'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            color: #374151;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #6b7280;
          }
          .alternative-link {
            word-break: break-all;
            background-color: #f3f4f6;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📱 ${data.appName || 'Device Insights'}</div>
            <h1 class="title">Admin Login Request</h1>
          </div>
          
          <p>Hello,</p>
          
          <p>You've requested admin access to ${data.appName || 'Device Insights'}. Click the button below to securely log in:</p>
          
          <div style="text-align: center;">
            <a href="${data.magicLink}" class="button">🔐 Admin Login</a>
          </div>
          
          <div class="security-note">
            <strong>Security Notice:</strong>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li>This link expires in 15 minutes</li>
              <li>It can only be used once</li>
              <li>If you didn't request this, you can safely ignore this email</li>
            </ul>
          </div>
          
          <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
          <div class="alternative-link">${data.magicLink}</div>
          
          <div class="footer">
            <p>This is an automated message from ${data.appName || 'Device Insights'} Admin System.</p>
            <p>© 2025 DOTM - Device Insights Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendAdminNotificationEmail(
  email: string, 
  subject: string, 
  content: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 Development mode - Email to', email, ':', subject);
      console.log('Content:', content);
      return true;
    }

    const { data: result, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'rbm@dotmobile.app',
      to: [email],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            ${content}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This is an automated notification from Device Insights Admin System.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend notification email error:', error);
      return false;
    }

    console.log('Admin notification email sent successfully:', result?.id);
    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
}