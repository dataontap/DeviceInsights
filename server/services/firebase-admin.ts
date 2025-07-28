import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | null = null;

export function initializeFirebaseAdmin() {
  if (adminApp) {
    return adminApp;
  }

  try {
    // Check if Firebase credentials are available
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!projectId) {
      console.log('Firebase project ID not available');
      return null;
    }

    let credential;
    
    if (serviceAccountJson) {
      // Use service account for full Firebase Admin functionality
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        // Check if this is a client config file (google-services.json) vs service account key
        if (serviceAccount.project_info && serviceAccount.project_info.project_id) {
          console.log('Detected Firebase client config file, extracting project ID');
          const configProjectId = serviceAccount.project_info.project_id;
          adminApp = admin.initializeApp({
            projectId: configProjectId,
          });
          console.log('Using Firebase client config project ID:', configProjectId);
        } else if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
          // This is a proper service account key
          credential = admin.credential.cert(serviceAccount);
          adminApp = admin.initializeApp({
            credential: credential,
            projectId: serviceAccount.project_id,
          });
          console.log('Using Firebase service account credentials for project:', serviceAccount.project_id);
        } else {
          console.log('Firebase JSON format not recognized, using environment project ID');
          adminApp = admin.initializeApp({
            projectId: projectId,
          });
        }
      } catch (parseError) {
        console.error('Failed to parse service account JSON:', parseError);
        // Use minimal configuration with just project ID
        adminApp = admin.initializeApp({
          projectId: projectId,
        });
      }
    } else {
      console.log('No service account found, using minimal Firebase configuration');
      adminApp = admin.initializeApp({
        projectId: projectId,
      });
    }

    console.log('Firebase Admin initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return null;
  }
}

// SMS Messaging (via Firebase Extensions or third-party service)
export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.log('Firebase Admin not available for SMS');
      return false;
    }

    // Note: Firebase doesn't have direct SMS support
    // You would typically use Twilio, AWS SNS, or Firebase Extensions
    console.log(`SMS would be sent to ${phoneNumber}: ${message}`);
    
    // Placeholder for actual SMS implementation
    // Example with Twilio integration:
    // const twilio = require('twilio');
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: message,
    //   from: '+1234567890',
    //   to: phoneNumber
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

// Email Messaging (via Firebase Extensions or third-party service)
export async function sendEmail(email: string, subject: string, body: string): Promise<boolean> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.log('Firebase Admin not available for email');
      return false;
    }

    // Note: Firebase doesn't have direct email support
    // You would typically use SendGrid, Mailgun, or Firebase Extensions
    console.log(`Email would be sent to ${email}: ${subject}`);
    
    // Placeholder for actual email implementation
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: email,
    //   from: 'noreply@yourdomain.com',
    //   subject: subject,
    //   html: body,
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Push Notifications
export async function sendPushNotification(
  token: string, 
  title: string, 
  body: string, 
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.log('Firebase Admin not available for push notifications');
      return false;
    }

    const messaging = admin.messaging();
    
    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    };

    const response = await messaging.send(message);
    console.log('Push notification sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// Send notification to multiple devices
export async function sendMulticastNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<admin.messaging.BatchResponse | null> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.log('Firebase Admin not available for multicast notifications');
      return null;
    }

    const messaging = admin.messaging();
    
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens,
    };

    const messages = message.tokens.map(token => ({
      notification: message.notification,
      data: message.data,
      token
    }));
    const response = await messaging.sendEach(messages);
    console.log('Multicast notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    return null;
  }
}

// Topic-based messaging
export async function sendTopicNotification(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.log('Firebase Admin not available for topic notifications');
      return false;
    }

    const messaging = admin.messaging();
    
    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      topic,
    };

    const response = await messaging.send(message);
    console.log('Topic notification sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending topic notification:', error);
    return false;
  }
}

// Subscribe tokens to topic
export async function subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.log('Firebase Admin not available for topic subscription');
      return false;
    }

    const messaging = admin.messaging();
    const response = await messaging.subscribeToTopic(tokens, topic);
    console.log('Successfully subscribed to topic:', response);
    return true;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return false;
  }
}

// Initialize Firebase Admin on startup
initializeFirebaseAdmin();