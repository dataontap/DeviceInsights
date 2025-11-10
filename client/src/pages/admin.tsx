import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Smartphone, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import { completeMagicLinkSignIn, isMagicLinkSignIn } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AdminDashboard from "@/components/admin-dashboard";
import AdminLogin from "@/components/admin-login";

export default function Admin() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check for magic link token and auth state
  useEffect(() => {
    let unsubscribe: any;

    const initAuth = async () => {
      try {
        // Check for backend magic link token in URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
          console.log('🔐 Processing magic link token');
          try {
            // Verify the token with backend
            const verifyResponse = await fetch('/api/admin/verify-temp-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });
            
            if (verifyResponse.ok) {
              const { email } = await verifyResponse.json();
              console.log('✅ Token verified for:', email);
              
              // Create admin session
              await createAdminSession(email);
              
              // Clean URL
              window.history.replaceState({}, '', '/admin');
              setIsLoading(false);
              return;
            } else {
              const error = await verifyResponse.json();
              console.error('❌ Token verification failed:', error);
              toast({
                title: "Login failed",
                description: error.message || "Invalid or expired magic link",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('Magic link verification error:', error);
            toast({
              title: "Login failed",
              description: "Failed to verify magic link",
              variant: "destructive",
            });
          }
          // Clean URL even on error
          window.history.replaceState({}, '', '/admin');
        }
        
        // Check if this is a Firebase magic link sign-in
        if (isMagicLinkSignIn()) {
          const email = await completeMagicLinkSignIn();
          if (email) {
            // Verify email is registered and create session
            await createAdminSession(email);
            // Clean URL
            window.history.replaceState({}, '', '/admin');
          }
        }

        // Listen for auth state changes (if Firebase is available)
        if (auth) {
          unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.email) {
              // User is signed in with Firebase
              await createAdminSession(user.email);
            } else {
              // Check for stored session
              const storedToken = localStorage.getItem('adminSessionToken');
              const storedEmail = localStorage.getItem('adminEmail');
              
              if (storedToken && storedEmail) {
                setSessionToken(storedToken);
                setUserEmail(storedEmail);
              }
              setIsLoading(false);
            }
          });
        } else {
          // No Firebase, check for stored session only
          const storedToken = localStorage.getItem('adminSessionToken');
          const storedEmail = localStorage.getItem('adminEmail');
          
          if (storedToken && storedEmail) {
            setSessionToken(storedToken);
            setUserEmail(storedEmail);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const createAdminSession = async (email: string) => {
    try {
      const response = await apiRequest("POST", "/api/admin/create-session", { email });
      const data = await response.json();
      
      setSessionToken(data.sessionToken);
      setUserEmail(email);
      setIsLoading(false);
      
      // Store session in localStorage
      localStorage.setItem('adminSessionToken', data.sessionToken);
      localStorage.setItem('adminEmail', email);
      
      toast({
        title: "Login successful!",
        description: `Welcome back, ${email}`,
      });
    } catch (error: any) {
      console.error("Session creation error:", error);
      setIsLoading(false);
      toast({
        title: "Login failed",
        description: error.message || "Failed to create admin session",
        variant: "destructive",
      });
    }
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Sign out from Firebase (if available)
      if (auth) {
        await signOut(auth);
      }
      
      // Clear backend session
      if (sessionToken) {
        const response = await apiRequest("POST", "/api/admin/logout", { 
          sessionToken 
        });
        return response.json();
      }
      return { success: true };
    },
    onSuccess: () => {
      setSessionToken(null);
      setUserEmail(null);
      localStorage.removeItem('adminSessionToken');
      localStorage.removeItem('adminEmail');
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!sessionToken || !userEmail) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Navigation */}
      <nav className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Smartphone className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-semibold text-blue-900">Network Services Admin</span>
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {userEmail}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Link href="/">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Main Site
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <div className="bg-blue-50 min-h-screen">
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">Admin Dashboard</h1>
              <p className="text-blue-700">Monitor IMEI searches, device trends, and system analytics</p>
            </div>
            
            <AdminDashboard 
              sessionToken={sessionToken} 
              onSessionExpired={() => {
                // Clear expired session
                setSessionToken(null);
                setUserEmail(null);
                localStorage.removeItem('adminSessionToken');
                localStorage.removeItem('adminEmail');
                toast({
                  title: "Session Expired",
                  description: "Your session has expired. Please log in again.",
                  variant: "destructive",
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
