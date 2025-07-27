import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailLink, isSignInWithEmailLink, sendSignInLinkToEmail } from "firebase/auth";

// Check if Firebase credentials are available
const hasFirebaseConfig = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

let app: any = null;
let auth: any = null;

if (hasFirebaseConfig) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };

// Email link authentication
export async function sendMagicLink(email: string): Promise<void> {
  if (!hasFirebaseConfig || !auth) {
    // Fallback: Send request to backend for temporary magic link
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

  const actionCodeSettings = {
    url: `${window.location.origin}/admin`,
    handleCodeInApp: true,
  };
  
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
}

export function isMagicLinkSignIn(): boolean {
  if (!hasFirebaseConfig || !auth) {
    // Check for temporary token in URL
    const urlParams = new URLSearchParams(window.location.search);
    return !!urlParams.get('token');
  }
  
  return isSignInWithEmailLink(auth, window.location.href);
}

export async function completeMagicLinkSignIn(): Promise<string | null> {
  if (!hasFirebaseConfig || !auth) {
    // Handle temporary token
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

  if (!isMagicLinkSignIn()) return null;
  
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    email = window.prompt('Please provide your email for confirmation');
  }
  
  if (email) {
    const result = await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem('emailForSignIn');
    return result.user.email;
  }
  
  return null;
}