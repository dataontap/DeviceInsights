import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailLink, isSignInWithEmailLink, sendSignInLinkToEmail } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Check if Firebase credentials are available
const hasFirebaseConfig = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

let app: any = null;
let auth: any = null;
let messaging: any = null;

if (hasFirebaseConfig) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Initialize messaging only in browser environment
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.log('Firebase messaging not available:', error);
    }
  }
}

export { auth, messaging };

// Email link authentication
export async function sendMagicLink(email: string): Promise<void> {
  // Always use backend magic link via Resend email to avoid Firebase domain whitelist issues
  // The Replit development domain changes frequently and may not be whitelisted in Firebase
  const response = await fetch('/api/admin/send-temp-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send magic link');
  }
  
  return;
}

export function isMagicLinkSignIn(): boolean {
  // Always use backend temporary token approach
  const urlParams = new URLSearchParams(window.location.search);
  return !!urlParams.get('token');
}

export async function completeMagicLinkSignIn(): Promise<string | null> {
  // Always use backend temporary token approach
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    const response = await fetch('/api/admin/verify-temp-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.email;
    }
  }
  
  return null;
}

// Push Notifications and Messaging Functions
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.log('Firebase messaging not available');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // You'll need to generate this in Firebase Console
      });
      console.log('FCM Registration Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

export function setupMessageListener() {
  if (!messaging) {
    console.log('Firebase messaging not available');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Create in-app notification
    if (payload.notification) {
      showInAppNotification(payload.notification);
    }
  });
}

function showInAppNotification(notification: any) {
  // Create a toast-like notification
  const notificationDiv = document.createElement('div');
  notificationDiv.className = `
    fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
    rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out
  `;
  
  notificationDiv.innerHTML = `
    <div class="flex items-center">
      <div class="flex-1">
        <h4 class="font-semibold text-sm text-gray-900 dark:text-white">${notification.title || 'IMEI Device Checker'}</h4>
        <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${notification.body || ''}</p>
      </div>
      <button class="ml-3 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(notificationDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notificationDiv.parentNode) {
      notificationDiv.remove();
    }
  }, 5000);
}

// Web Push Notification Function (for website visitors)
// Note: SMS and email are now internal server-side APIs only
export async function sendPushNotification(token: string, title: string, body: string, data?: any): Promise<boolean> {
  try {
    const response = await fetch('/api/messaging/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, title, body, data }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}